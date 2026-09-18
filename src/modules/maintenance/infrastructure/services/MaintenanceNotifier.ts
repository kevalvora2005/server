import { IMaintenanceNotifier } from "../../domain/services/IMaintenanceNotifier";
import { Invoice } from "../../domain/entities/Invoice";
import { notificationService } from "../../../notifications/container";
import { IResidentRepository } from "../../../residents/domain/repositories/IResidentRepository";

export class MaintenanceNotifier implements IMaintenanceNotifier {
  constructor(private readonly residentRepository: IResidentRepository) {}

  async notifyDueSoon(invoice: Invoice): Promise<void> {
    const userId = await this.resolveUserId(invoice);
    if (!userId) return;

    await notificationService.notify(
      userId,
      "maintenance_due_soon",
      "Maintenance due in 3 days",
      `Your maintenance of ₹${invoice.totalAmount.toFixed(2)} is due on ${this.formatDate(invoice.dueDate)}.`,
      {
        invoiceId: invoice.id,
        key: "notification.maintenance_due_soon",
        params: {
          amount: `₹${invoice.totalAmount.toFixed(2)}`,
          dueDate: this.formatDate(invoice.dueDate),
        },
      }
    );
  }

  async notifyDueToday(invoice: Invoice): Promise<void> {
    const userId = await this.resolveUserId(invoice);
    if (!userId) return;

    await notificationService.notify(
      userId,
      "maintenance_due_today",
      "Maintenance due today",
      `Your maintenance of ₹${invoice.totalAmount.toFixed(2)} is due today.`,
      {
        invoiceId: invoice.id,
        key: "notification.maintenance_due_today",
        params: {
          amount: `₹${invoice.totalAmount.toFixed(2)}`,
        },
      }
    );
  }

  async notifyOverdue(invoice: Invoice): Promise<void> {
    const userId = await this.resolveUserId(invoice);
    if (!userId) return;

    const monthName = new Date(invoice.year, invoice.month - 1).toLocaleString("en-IN", { month: "long" });

    await notificationService.notify(
      userId,
      "maintenance_overdue",
      "Maintenance overdue",
      `Your maintenance payment is overdue. A 5% late fee now applies. Total due: ₹${invoice.totalAmount.toFixed(2)}.`,
      {
        invoiceId: invoice.id,
        key: "notification.maintenance_overdue",
        params: {
          amount: `₹${invoice.totalAmount.toFixed(2)}`,
          month: monthName,
        },
      }
    );
  }

  async notifyOverdueReminder(invoice: Invoice): Promise<void> {
    const userId = await this.resolveUserId(invoice);
    if (!userId) return;

    const monthName = new Date(invoice.year, invoice.month - 1).toLocaleString("en-IN", { month: "long" });

    await notificationService.notify(
      userId,
      "maintenance_overdue_reminder",
      "Maintenance still overdue",
      `Your maintenance payment is still overdue. Current amount due: ₹${invoice.totalAmount.toFixed(2)}.`,
      {
        invoiceId: invoice.id,
        key: "notification.maintenance_overdue",
        params: {
          amount: `₹${invoice.totalAmount.toFixed(2)}`,
          month: monthName,
        },
      }
    );
  }

  async notifyPaymentSucceeded(invoice: Invoice): Promise<void> {
    const userId = await this.resolveUserId(invoice);
    if (!userId) return;

    await notificationService.notify(
      userId,
      "maintenance_payment_succeeded",
      "Payment Successful",
      `Your maintenance payment of ₹${invoice.totalAmount.toFixed(2)} has been completed successfully. Receipt available for download.`,
      {
        invoiceId: invoice.id,
        key: "notification.payment_receipt",
        params: {
          amount: `₹${invoice.totalAmount.toFixed(2)}`,
          invoiceNumber: `#${String(invoice.id).padStart(4, "0")}`,
        },
      }
    );
  }

  private async resolveUserId(invoice: Invoice): Promise<number | null> {
    if (invoice.residentId) {
      const resident = await this.residentRepository.findById(invoice.residentId);
      if (resident) return resident.userId;
    }
    return null;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }
}