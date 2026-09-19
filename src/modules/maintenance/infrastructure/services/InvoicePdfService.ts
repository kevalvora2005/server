import { v2 as cloudinary } from "cloudinary";
import { Invoice } from "../../domain/entities/Invoice";
import { Resident } from "../../../residents/domain/entities/Resident";
import { buildInvoicePdfTemplate } from "../../application/templates/invoicePdfTemplate";

export class InvoicePdfService {
  async generateAndUpload(invoice: Invoice, resident: Resident | null, language?: string, locale?: string): Promise<string> {
    const html = buildInvoicePdfTemplate({ invoice, resident, language, locale });

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

      return await this.uploadToCloudinary(pdfBuffer, invoice.id!);
    } catch (error) {
      console.error("InvoicePdfService.generateAndUpload failed:", error);
      throw error;
    } finally {
      if (browser) await browser.close();
    }
  }

  private uploadToCloudinary(buffer: Buffer, invoiceId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "invoices",
          public_id: `invoice-${invoiceId}`,
          resource_type: "raw",
          type: "upload",
          overwrite: true,
          invalidate: true,
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