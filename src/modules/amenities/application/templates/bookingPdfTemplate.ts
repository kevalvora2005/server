import i18n from "../../../../shared/config/i18n";
import { Booking } from "../../domain/entities/Booking";
import { Amenity } from "../../domain/entities/Amenity";
import { env } from "../../../../shared/config/env";

export interface BuildBookingPdfTemplateOptions {
  booking: Booking;
  amenity: Amenity | null;
}

export function buildBookingPdfTemplate(options: BuildBookingPdfTemplateOptions): string {
  const { booking, amenity } = options;

  const lng = booking.resident?.preferredLanguage || "en";
  const loc = booking.resident?.locale || (lng === "hi" ? "hi-IN" : lng === "gu" ? "gu-IN" : "en-IN");

  const paidDate = booking.paidAt
    ? new Date(booking.paidAt).toLocaleDateString(loc, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  const residentName = booking.resident?.name || `Resident #${booking.residentId}`;
  const residentEmail = booking.resident?.email || "";
  const residentPhone = booking.resident?.phone || "";

  const aptLabel =
    booking.apartment?.unitFormatted ||
    (booking.apartment
      ? `${booking.apartment.block}-${booking.apartment.floorNumber}${booking.apartment.unitNumber}`
      : `Apt #${booking.apartmentId}`);

  const amenityName = amenity?.name || `Amenity #${booking.amenityId}`;
  const amenityPrice = amenity?.price ?? 0;
  const formattedPrice = new Intl.NumberFormat(loc, {
    style: "currency",
    currency: "INR",
  }).format(Number(amenityPrice));

  const isUpi = booking.paymentRef?.toUpperCase().startsWith("UPI");
  const paymentMethod = isUpi
    ? i18n.t("invoice.payment_methods.upi", { lng })
    : i18n.t("invoice.payment_methods.cash", { lng });

  const paymentReference = booking.paymentRef
    ? booking.paymentRef.replace(/^UPI\s*[-:]?\s*/i, "UTR: ")
    : "—";

  const formattedBookingDate = (() => {
    try {
      const [y, m, d] = booking.bookingDate.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString(loc, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return booking.bookingDate;
    }
  })();

  const isShared = amenity?.bookingType === "SHARED_CAPACITY" || amenity?.isSharedCapacity;
  const attendeesText = isShared
    ? ` &bull; ${i18n.t("booking.attendees", { lng })}: ${booking.memberCount || 1} ${i18n.t("booking.persons", { lng })}`
    : "";

  const verificationPayload = JSON.stringify({
    bookingId: booking.id,
    residentId: booking.residentId,
    amenityId: booking.amenityId,
    date: booking.bookingDate,
    slot: `${booking.startTime}-${booking.endTime}`,
    ref: booking.paymentRef || "",
  });
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(verificationPayload)}`;

  const societyName = env.SOCIETY_NAME || "Civic Horizon";
  const societyAddress = env.SOCIETY_ADDRESS || "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; font-size: 12px; line-height: 1.5; }

        .page { width: 100%; min-height: 100vh; background: #f8fafc; padding: 30px 40px; }
        .card { background: #fff; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,.08); overflow: hidden; }

        /* ── Header ── */
        .top-bar { background: linear-gradient(135deg, #1e3a5f, #2d5a87); padding: 28px 36px; display: flex; justify-content: space-between; align-items: center; }
        .top-bar .left h1 { font-size: 20px; font-weight: 700; color: #fff; letter-spacing: .3px; }
        .top-bar .left p { font-size: 11px; color: #b0cbe8; margin-top: 2px; }
        .top-bar .right { text-align: right; }
        .badge-paid { display: inline-block; background: #059669; color: #fff; font-size: 13px; font-weight: 700; padding: 6px 22px; border-radius: 20px; letter-spacing: 1px; text-transform: uppercase; }
        .society-addr { padding: 10px 36px; background: #f1f5f9; font-size: 11px; color: #475569; border-bottom: 1px solid #e2e8f0; }

        /* ── Body ── */
        .body-content { padding: 24px 36px 20px; }

        .meta-grid { display: flex; justify-content: space-between; margin-bottom: 22px; gap: 20px; }
        .meta-col { flex: 1; }
        .meta-label { font-size: 9px; text-transform: uppercase; letter-spacing: .6px; color: #94a3b8; margin-bottom: 4px; }
        .meta-value { font-size: 13px; font-weight: 600; color: #1e293b; }
        .meta-sub { font-size: 11px; color: #64748b; margin-top: 1px; }
        .meta-divider { width: 100%; height: 1px; background: #e2e8f0; margin: 0 0 18px; }

        .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: .6px; color: #94a3b8; margin-bottom: 8px; }

        /* ── Table ── */
        table.invoice-table { width: 100%; border-collapse: collapse; }
        table.invoice-table th { padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .5px; color: #94a3b8; border-bottom: 2px solid #e2e8f0; }
        table.invoice-table td { padding: 10px 12px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
        table.invoice-table .amt { text-align: right; font-variant-numeric: tabular-nums; }
        .total-row td { border-top: 2px solid #1e3a5f; border-bottom: none; font-weight: 700; font-size: 13px; color: #1e3a5f; padding-top: 10px; background: #f8fafc; }

        /* ── Bottom Details Grid ── */
        .details-grid { display: flex; gap: 20px; margin-top: 20px; }
        .details-col-left { flex: 3; }
        .details-col-right { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px; text-align: center; }

        /* ── Payment box ── */
        .payment-box { padding: 14px 18px; background: #f1f5f9; border-radius: 6px; border-left: 4px solid #2d5a87; }
        .payment-box .row { display: flex; justify-content: space-between; font-size: 11px; padding: 2px 0; }
        .payment-box .label { color: #64748b; }
        .payment-box .value { color: #1e293b; font-weight: 600; }

        /* ── Rules box ── */
        .rules-box { margin-top: 12px; padding: 10px 14px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; }
        .rules-title { font-size: 10px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 3px; }
        .rules-text { font-size: 10px; color: #b45309; line-height: 1.4; }

        /* ── QR box ── */
        .qr-image { width: 95px; height: 95px; border-radius: 4px; }
        .qr-label { font-size: 9px; color: #64748b; margin-top: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }

        /* ── Footer ── */
        .footer { text-align: center; padding: 16px 36px 22px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; margin-top: 6px; }
        .footer strong { color: #64748b; }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="card">

          <!-- ─── TOP BAR ─── -->
          <div class="top-bar">
            <div class="left">
              <h1>${societyName}</h1>
              <p>${i18n.t("booking.receipt_title", { lng })}</p>
            </div>
            <div class="right">
              <div class="badge-paid">${i18n.t("booking.status_paid", { lng })}</div>
            </div>
          </div>

          <div class="society-addr">${societyAddress}</div>

          <!-- ─── BODY ─── -->
          <div class="body-content">

            <!-- Meta -->
            <div class="meta-grid">
              <div class="meta-col">
                <div class="meta-label">${i18n.t("booking.receipt_no", { lng })}</div>
                <div class="meta-value">#BKG-${String(booking.id).padStart(4, "0")}</div>
              </div>
              <div class="meta-col">
                <div class="meta-label">${i18n.t("booking.date_paid", { lng })}</div>
                <div class="meta-value">${paidDate}</div>
              </div>
              <div class="meta-col">
                <div class="meta-label">${i18n.t("booking.reserved_slot", { lng })}</div>
                <div class="meta-value">${formattedBookingDate}</div>
                <div class="meta-sub">${booking.startTime} – ${booking.endTime}</div>
              </div>
            </div>

            <div class="meta-divider"></div>

            <!-- Reserved by -->
            <div class="section-title">${i18n.t("booking.reserved_by", { lng })}</div>
            <div class="meta-grid" style="margin-bottom: 18px;">
              <div class="meta-col">
                <div class="meta-value">${residentName}</div>
                <div class="meta-sub">${residentEmail || residentPhone}</div>
              </div>
              <div class="meta-col">
                <div class="meta-value">${i18n.t("booking.apartment", { lng })} ${aptLabel}</div>
                <div class="meta-sub">${i18n.t("booking.purpose", { lng })}: ${booking.purpose || i18n.t("booking.general_reservation", { lng })}</div>
              </div>
            </div>

            <!-- Charges -->
            <div class="section-title">${i18n.t("booking.charge_details", { lng })}</div>
            <table class="invoice-table">
              <thead>
                <tr>
                  <th style="width:75%">${i18n.t("booking.facility", { lng })}</th>
                  <th style="width:25%" class="amt">${i18n.t("booking.fee_amount", { lng })}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>${amenityName}</strong>
                    <div style="font-size:11px; color:#64748b; margin-top:2px;">
                      ${i18n.t("booking.time_slot", { lng })}: ${booking.startTime} – ${booking.endTime} (${formattedBookingDate})${attendeesText}
                    </div>
                  </td>
                  <td class="amt">${formattedPrice}</td>
                </tr>
                <tr class="total-row">
                  <td>${i18n.t("booking.total_paid", { lng })}</td>
                  <td class="amt">${formattedPrice}</td>
                </tr>
              </tbody>
            </table>

            <!-- Details & QR Grid -->
            <div class="details-grid">
              <div class="details-col-left">
                <!-- Payment -->
                <div class="payment-box">
                  <div class="row">
                    <span class="label">${i18n.t("booking.payment_reference", { lng })}</span>
                    <span class="value">${paymentReference}</span>
                  </div>
                  <div class="row" style="margin-top:4px;">
                    <span class="label">${i18n.t("booking.payment_method", { lng })}</span>
                    <span class="value">${paymentMethod}</span>
                  </div>
                </div>

                <!-- Rules -->
                <div class="rules-box">
                  <div class="rules-title">${i18n.t("booking.rules", { lng })}</div>
                  <div class="rules-text">${i18n.t("booking.rules_text", { lng })}</div>
                </div>
              </div>

              <!-- Verification QR -->
              <div class="details-col-right">
                <img class="qr-image" src="${qrCodeUrl}" alt="Verification QR" />
                <div class="qr-label">${i18n.t("booking.qr_notice", { lng })}</div>
              </div>
            </div>

          </div>

          <!-- ─── FOOTER ─── -->
          <div class="footer">
            <strong>${societyName}</strong> &mdash; ${i18n.t("booking.footer_notice", { lng })}
          </div>

        </div>
      </div>
    </body>
    </html>
  `;
}
