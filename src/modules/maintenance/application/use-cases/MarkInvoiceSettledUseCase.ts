import { Invoice } from "../../domain/entities/Invoice";
import { IInvoiceRepository } from "../../domain/repositories/IInvoiceRepository";
import { RequestingUser } from "../../../../shared/types/RequestingUser";
import {
  InvoiceNotFoundError,
  InvoiceAlreadyPaidError,
  InvalidUpiRefError,
  OnlyUpiPaymentAllowedError,
  UnauthorizedInvoiceAccessError,
} from "../../domain/errors/MaintenanceErrors";
import { GenerateInvoicePdfUseCase } from "./GenerateInvoicePdfUseCase";
import { IMaintenanceNotifier } from "../../domain/services/IMaintenanceNotifier";

export class MarkInvoiceSettledUseCase {
  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly generateInvoicePdfUseCase: GenerateInvoicePdfUseCase,
    private readonly maintenanceNotifier: IMaintenanceNotifier,
  ) {}

  async execute(invoiceId: number, paymentRef?: string, requestingUser?: RequestingUser, preferredLanguage?: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(invoiceId);

    if (!invoice) {
      throw new InvoiceNotFoundError(invoiceId);
    }

    // Strictly enforce that only the assigned resident can pay/settle this invoice
    if (!requestingUser?.residentId || invoice.residentId !== requestingUser.residentId) {
      throw new UnauthorizedInvoiceAccessError();
    }

    if (invoice.isPaid()) {
      throw new InvoiceAlreadyPaidError();
    }

    if (!paymentRef || !paymentRef.toUpperCase().startsWith("UPI")) {
      throw new OnlyUpiPaymentAllowedError();
    }

    const utrPart = paymentRef.replace(/^UPI\s*[-:]?\s*/i, "").trim();
    if (utrPart && !/^\d{12}$/.test(utrPart)) {
      throw new InvalidUpiRefError();
    }

    invoice.markPaid(paymentRef, new Date());

    const updatedInvoice = await this.invoiceRepository.update(invoice);

    try {
      const pdfUrl = await this.generateInvoicePdfUseCase.execute(invoice.id!, preferredLanguage);
      updatedInvoice.setPdfUrl(pdfUrl);
    } catch (error) {
      console.error("Failed to generate invoice PDF during settlement:", error);
    }

    try {
      await this.maintenanceNotifier.notifyPaymentSucceeded(updatedInvoice);
    } catch (error) {
      console.error("Failed to send payment notification:", error);
    }

    return updatedInvoice;
  }
}