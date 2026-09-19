import { IBookingRepository } from "../../domain/repositories/IBookingRepository";
import { IAmenityRepository } from "../../domain/repositories/IAmenityRepository";
import { BookingPdfService } from "../../infrastructure/services/BookingPdfService";
import { BookingNotFoundError } from "../../domain/errors/BookingErrors";
import { RequestingUser } from "../../../../shared/types/RequestingUser";
import { UserRole } from "../../../auth/domain/entities/User";
import { UnauthorizedBookingAccessError } from "../../domain/errors/BookingErrors";

export class GenerateBookingReceiptUseCase {
  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly amenityRepository: IAmenityRepository,
    private readonly bookingPdfService: BookingPdfService
  ) {}

  async execute(
    bookingId: number,
    requestingUser?: RequestingUser,
    preferredLanguage?: string
  ): Promise<string> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new BookingNotFoundError();
    }

    if (requestingUser) {
      const isOwner =
        requestingUser.residentId !== undefined &&
        booking.residentId === requestingUser.residentId;
      const isAdmin = requestingUser.role === UserRole.ADMIN;
      if (!isOwner && !isAdmin) {
        throw new UnauthorizedBookingAccessError();
      }
    }

    const targetLang =
      preferredLanguage ||
      booking.resident?.preferredLanguage ||
      "en";

    const amenity = await this.amenityRepository.findById(booking.amenityId);
    const pdfUrl = await this.bookingPdfService.generateAndUpload(
      booking,
      amenity,
      targetLang
    );

    booking.setReceiptUrl(pdfUrl);
    await this.bookingRepository.update(booking);

    return pdfUrl;
  }
}
