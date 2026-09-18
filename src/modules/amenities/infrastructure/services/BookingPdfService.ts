import { v2 as cloudinary } from "cloudinary";
import { Booking } from "../../domain/entities/Booking";
import { Amenity } from "../../domain/entities/Amenity";
import { buildBookingPdfTemplate } from "../../application/templates/bookingPdfTemplate";

export class BookingPdfService {
  async generateAndUpload(booking: Booking, amenity: Amenity | null): Promise<string> {
    const html = buildBookingPdfTemplate({ booking, amenity });

    let browser;
    try {
      const puppeteer = await import("puppeteer");

      browser = await puppeteer.launch({
        headless: "shell",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load" });

      const pdfBytes = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
      });

      const pdfBuffer = Buffer.from(pdfBytes);

      return await this.uploadToCloudinary(pdfBuffer, booking.id!);
    } catch (error) {
      console.error("BookingPdfService.generateAndUpload failed:", error);
      throw error;
    } finally {
      if (browser) await browser.close();
    }
  }

  private uploadToCloudinary(buffer: Buffer, bookingId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "booking-receipts",
          public_id: `booking-receipt-${bookingId}`,
          resource_type: "raw",
          type: "upload",
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result.secure_url);
        }
      );
      uploadStream.end(buffer);
    });
  }
}
