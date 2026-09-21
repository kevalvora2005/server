import i18n from "../../../../shared/config/i18n";
import { Booking } from "../../domain/entities/Booking";
import { Amenity } from "../../domain/entities/Amenity";
import { env } from "../../../../shared/config/env";

export interface BuildBookingPdfTemplateOptions {
  booking: Booking;
  amenity: Amenity | null;
  language?: string;
  locale?: string;
}

export function buildBookingPdfTemplate(options: BuildBookingPdfTemplateOptions): string {
  const { booking, amenity } = options;

  const lng = options.language!;
  const loc = booking.resident?.locale || "en-IN"; // safety net only if resident is null

  const t = (key: string, opts: Record<string, any> = {}) =>
    i18n.t(key, { lng, ...opts });

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

  const rawAmenityName = amenity?.name || `Amenity #${booking.amenityId}`;
  const amenityName = t(`amenity_names.${rawAmenityName}`, {
    defaultValue: rawAmenityName,
  });
  const amenityPrice = amenity?.price ?? 0;
  const formattedPrice = new Intl.NumberFormat(loc, {
    style: "currency",
    currency: "INR",
  }).format(Number(amenityPrice));

  const isUpi = booking.paymentRef?.toUpperCase().startsWith("UPI");
  const paymentMethod = isUpi
    ? t("invoice.payment_methods.upi")
    : t("invoice.payment_methods.cash");

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
    ? ` &bull; ${t("booking.attendees")}: ${booking.memberCount || 1} ${t("booking.persons")}`
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

  const societyName = t("society.name", {
    defaultValue: t("booking.society_name", {
      defaultValue:
        env.SOCIETY_NAME && env.SOCIETY_NAME !== "My Society"
          ? env.SOCIETY_NAME
          : "Civic Horizon Society",
    }),
  });
  const societyAddress = t("society.address", {
    defaultValue: t("booking.society_address", {
      defaultValue:
        env.SOCIETY_ADDRESS && env.SOCIETY_ADDRESS !== "123 Main St, City, Country"
          ? env.SOCIETY_ADDRESS
          : "Civic Horizon Society, Near SOBO Center, South Bopal, Ahmedabad, Gujarat - 380058.",
    }),
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Nirmala UI', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; font-size: 12px; line-height: 1.5; }

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
              <p>${t("booking.receipt_title")}</p>
            </div>
            <div class="right">
              <div class="badge-paid">${t("booking.status_paid")}</div>
            </div>
          </div>

          <div class="society-addr">${societyAddress}</div>

          <!-- ─── BODY ─── -->
          <div class="body-content">

            <!-- Meta -->
            <div class="meta-grid">
              <div class="meta-col">
                <div class="meta-label">${t("booking.receipt_no")}</div>
                <div class="meta-value">#BKG-${String(booking.id).padStart(4, "0")}</div>
              </div>
              <div class="meta-col">
                <div class="meta-label">${t("booking.date_paid")}</div>
                <div class="meta-value">${paidDate}</div>
              </div>
              <div class="meta-col">
                <div class="meta-label">${t("booking.reserved_slot")}</div>
                <div class="meta-value">${formattedBookingDate}</div>
                <div class="meta-sub">${booking.startTime} – ${booking.endTime}</div>
              </div>
            </div>

            <div class="meta-divider"></div>

            <!-- Reserved by -->
            <div class="section-title">${t("booking.reserved_by")}</div>
            <div class="meta-grid" style="margin-bottom: 18px;">
              <div class="meta-col">
                <div class="meta-value">${residentName}</div>
                <div class="meta-sub">${residentEmail || residentPhone}</div>
              </div>
              <div class="meta-col">
                <div class="meta-value">${t("booking.apartment")} ${aptLabel}</div>
                <div class="meta-sub">${t("booking.purpose")}: ${booking.purpose || t("booking.general_reservation")}</div>
              </div>
            </div>

            <!-- Charges -->
            <div class="section-title">${t("booking.charge_details")}</div>
            <table class="invoice-table">
              <thead>
                <tr>
                  <th style="width:75%">${t("booking.facility")}</th>
                  <th style="width:25%" class="amt">${t("booking.fee_amount")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>${amenityName}</strong>
                    <div style="font-size:11px; color:#64748b; margin-top:2px;">
                      ${t("booking.time_slot")}: ${booking.startTime} – ${booking.endTime} (${formattedBookingDate})${attendeesText}
                    </div>
                  </td>
                  <td class="amt">${formattedPrice}</td>
                </tr>
                <tr class="total-row">
                  <td>${t("booking.total_paid")}</td>
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
                    <span class="label">${t("booking.payment_reference")}</span>
                    <span class="value">${paymentReference}</span>
                  </div>
                  <div class="row" style="margin-top:4px;">
                    <span class="label">${t("booking.payment_method")}</span>
                    <span class="value">${paymentMethod}</span>
                  </div>
                </div>

                <!-- Rules -->
                <div class="rules-box">
                  <div class="rules-title">${t("booking.rules")}</div>
                  <div class="rules-text">${t("booking.rules_text")}</div>
                </div>
              </div>

              <!-- Verification QR -->
              <div class="details-col-right">
                <img class="qr-image" src="${qrCodeUrl}" alt="Verification QR" />
                <div class="qr-label">${t("booking.qr_notice")}</div>
              </div>
            </div>

          </div>

          <!-- ─── FOOTER ─── -->
          <div class="footer">
            <strong>${societyName}</strong> &mdash; ${t("booking.footer_notice")}
          </div>

        </div>
      </div>
    </body>
    </html>
  `;
}
