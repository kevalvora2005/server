import { IInvoiceRepository } from "../../domain/repositories/IInvoiceRepository";
import { InvoicePdfService } from "../../infrastructure/services/InvoicePdfService";
import { InvoiceNotFoundError } from "../../domain/errors/MaintenanceErrors";
import { IResidentRepository } from "../../../residents/domain/repositories/IResidentRepository";

export class GenerateInvoicePdfUseCase {
  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly invoicePdfService: InvoicePdfService,
    private readonly residentRepository: IResidentRepository,
  ) { }

  async execute(invoiceId: number, preferredLanguage?: string): Promise<string> {
    const invoice = await this.invoiceRepository.findById(invoiceId);

    if (!invoice) {
      throw new InvoiceNotFoundError(invoiceId);
    }

    let resident = invoice.residentId
      ? await this.residentRepository.findById(invoice.residentId)
      : null;

    if (!resident && invoice.apartmentId) {
      const aptResident =
        (await this.residentRepository.findActiveTenantByApartmentId(invoice.apartmentId)) ||
        (await this.residentRepository.findOccupantByApartmentId(invoice.apartmentId)) ||
        (await this.residentRepository.findOwnerByApartmentId(invoice.apartmentId));

      if (aptResident?.id) {
        resident = await this.residentRepository.findById(aptResident.id);
      }
    }

    const pdfUrl = await this.invoicePdfService.generateAndUpload(invoice, resident, preferredLanguage);

    invoice.setPdfUrl(pdfUrl);
    await this.invoiceRepository.update(invoice);

    return pdfUrl;
  }
}