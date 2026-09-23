import { IBookingNotifier } from "../../domain/services/IBookingNotifier";
import { Booking } from "../../domain/entities/Booking";
import { Amenity } from "../../domain/entities/Amenity";
import { NotificationType } from "../../../notifications/domain/entities/Notification";
import { notificationService } from "../../../notifications/container";
import { IResidentRepository } from "../../../residents/domain/repositories/IResidentRepository";
import { UserModel } from "../../../auth/infrastructure/models/UserModel";
import { UserRole } from "../../../auth/domain/entities/User";

export class BookingNotifier implements IBookingNotifier {
  constructor(private readonly residentRepository: IResidentRepository) {}

  private async notifyResident(
    booking: Booking,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    try {
      const resident = await this.residentRepository.findById(booking.residentId);
      if (!resident?.userId) return;
      await notificationService.notify(resident.userId, type, title, body, {
        bookingId: booking.id,
        amenityId: booking.amenityId,
        ...data,
      });
    } catch (error) {
      console.error("Failed to send resident booking notification:", error);
    }
  }

  private async notifyAdmins(
    booking: Booking,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    try {
      const admins = await UserModel.findAll({ where: { role: UserRole.ADMIN } });
      await Promise.all(
        admins.map((admin) =>
          notificationService.notify(admin.id, type, title, body, {
            bookingId: booking.id,
            amenityId: booking.amenityId,
            ...data,
          })
        )
      );
    } catch (error) {
      console.error("Failed to send admin booking notification:", error);
    }
  }

  async notifyRequested(booking: Booking, amenity: Amenity): Promise<void> {
    await this.notifyAdmins(
      booking,
      "booking_requested",
      "New Booking Request",
      `${amenity.name} was requested by a resident for ${booking.bookingDate} (${booking.startTime}-${booking.endTime}). Please review.`,
      {
        key: "notification.booking_requested",
        params: { amenityName: amenity.name, date: booking.bookingDate },
      }
    );
  }

  async notifyConfirmed(booking: Booking, amenity: Amenity): Promise<void> {
    await this.notifyResident(
      booking,
      "booking_confirmed",
      "Booking Confirmed",
      `Your booking for ${amenity.name} on ${booking.bookingDate} is confirmed.`,
      {
        key: "notification.booking_confirmed",
        params: { amenityName: amenity.name, date: booking.bookingDate },
      }
    );
  }

  async notifyRejected(booking: Booking, amenity: Amenity): Promise<void> {
    await this.notifyResident(
      booking,
      "booking_rejected",
      "Booking Rejected",
      `Your booking for ${amenity.name} was rejected.${booking.rejectionReason ? ` Reason: ${booking.rejectionReason}` : ""}`,
      {
        key: "notification.booking_rejected",
        params: { amenityName: amenity.name },
      }
    );
  }

  async notifyCancelled(booking: Booking, amenity: Amenity): Promise<void> {
    await this.notifyAdmins(
      booking,
      "booking_cancelled",
      "Booking Cancelled",
      `A booking for ${amenity.name} on ${booking.bookingDate} was cancelled.${booking.cancellationReason ? ` Reason: ${booking.cancellationReason}` : ""}`,
      {
        key: "notification.booking_cancelled",
        params: { amenityName: amenity.name, date: booking.bookingDate },
      }
    );
  }

  async notifyReminder(booking: Booking, amenity: Amenity): Promise<void> {
    await this.notifyResident(
      booking,
      "booking_reminder",
      "Booking Reminder",
      `Reminder: your booking for ${amenity.name} is on ${booking.bookingDate} at ${booking.startTime}.`,
      {
        key: "notification.booking_reminder",
        params: { amenityName: amenity.name, date: booking.bookingDate, time: booking.startTime },
      }
    );
  }

  async notifyPaymentSucceeded(booking: Booking, amenity: Amenity): Promise<void> {
    await this.notifyResident(
      booking,
      "booking_payment_succeeded",
      "Payment Successful",
      `Payment for your ${amenity.name} booking on ${booking.bookingDate} is complete.`,
      {
        key: "notification.booking_payment_succeeded",
        params: { amenityName: amenity.name, date: booking.bookingDate },
      }
    );
    await this.notifyAdmins(
      booking,
      "booking_payment_succeeded",
      "Booking Paid",
      `A resident paid for the ${amenity.name} booking on ${booking.bookingDate}.`,
      {
        key: "notification.booking_paid_admin",
        params: { amenityName: amenity.name, date: booking.bookingDate },
      }
    );
  }
}
