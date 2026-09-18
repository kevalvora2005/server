import i18n from "../../../../shared/config/i18n";
import { Invoice } from "../../domain/entities/Invoice";
import { Resident } from "../../../residents/domain/entities/Resident";
import { env } from "../../../../shared/config/env";
import { consolidateLateFeesForDisplay } from "../../domain/services/PenaltyCalculator";

export interface BuildInvoicePdfTemplateOptions {
  invoice: Invoice;
  resident: Resident | null;
}

export function buildInvoicePdfTemplate(options: BuildInvoicePdfTemplateOptions): string {
  const { invoice, resident } = options;
  const residentUser = resident?.user as { name?: string; email?: string; preferredLanguage?: string; locale?: string } | undefined;
  const residentApartment = resident?.apartment as { block?: string; floorNumber?: number; unitNumber?: string } | undefined;

  const lng = residentUser?.preferredLanguage || "en";
  const loc = residentUser?.locale || (lng === "hi" ? "hi-IN" : lng === "gu" ? "gu-IN" : "en-IN");

  const monthName = new Date(invoice.year, invoice.month - 1).toLocaleString(loc, { month: "long" });
  const paidDate = invoice.paidAt
    ? new Date(invoice.paidAt).toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric" })
    : "-";

  const aptBlock = residentApartment?.block ?? "";
  const aptFloor = residentApartment?.floorNumber ?? "";
  const aptUnit = residentApartment?.unitNumber ?? "";
  const aptLabel = aptBlock && aptUnit ? `${aptBlock}-${aptFloor}${aptUnit}` : aptBlock || aptUnit || "—";

  const isOnline = invoice.paymentRef?.startsWith("pi_");
  const isCheque = invoice.paymentRef?.startsWith("Cheque");
  const isUpi = invoice.paymentRef?.toUpperCase().startsWith("UPI");

  const paymentMethod = isOnline
    ? i18n.t("invoice.payment_methods.online", { lng })
    : isCheque
      ? i18n.t("invoice.payment_methods.cheque", { lng })
      : isUpi
        ? i18n.t("invoice.payment_methods.upi", { lng })
        : i18n.t("invoice.payment_methods.cash", { lng });

  const paymentReference = isOnline
    ? invoice.paymentRef
    : isCheque
      ? `Cheque No: ${invoice.paymentRef?.replace("Cheque - #", "").replace("Cheque - ", "")}`
      : isUpi
        ? `UPI Ref / UTR: ${invoice.paymentRef?.replace(/^UPI\s*[-:]?\s*/i, "")}`
        : invoice.paymentRef || "—";

  const displayCharges = consolidateLateFeesForDisplay(invoice.extraCharges);
  const extraChargesRows = displayCharges
    .map(
      (c) => `
        <tr>
          <td>${c.label}</td>
          <td class="amt">₹${c.amount.toFixed(2)}</td>
        </tr>`
    )
    .join("");

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

        /* ── Payment box ── */
        .payment-box { margin-top: 20px; padding: 14px 18px; background: #f1f5f9; border-radius: 6px; border-left: 4px solid #2d5a87; }
        .payment-box .row { display: flex; justify-content: space-between; font-size: 11px; padding: 2px 0; }
        .payment-box .label { color: #64748b; }
        .payment-box .value { color: #1e293b; font-weight: 600; }

        /* ── Terms box ── */
        .terms-box { margin-top: 18px; padding: 12px 16px; background: #fafafa; border: 1px dashed #e2e8f0; border-radius: 6px; }
        .terms-box .title { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
        .terms-box .desc { font-size: 10px; color: #94a3b8; line-height: 1.4; }

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
              <p>${i18n.t("invoice.title", { lng })}</p>
            </div>
            <div class="right">
              <div class="badge-paid">${i18n.t("invoice.status_paid", { lng })}</div>
            </div>
          </div>

          <div class="society-addr">${societyAddress}</div>

          <!-- ─── BODY ─── -->
          <div class="body-content">

            <!-- Meta -->
            <div class="meta-grid">
              <div class="meta-col">
                <div class="meta-label">${i18n.t("invoice.invoice_number", { lng })}</div>
                <div class="meta-value">#${String(invoice.id).padStart(4, "0")}</div>
              </div>
              <div class="meta-col">
                <div class="meta-label">${i18n.t("invoice.date", { lng })}</div>
                <div class="meta-value">${paidDate}</div>
              </div>
              <div class="meta-col">
                <div class="meta-label">${i18n.t("invoice.due_date", { lng })}</div>
                <div class="meta-value">${monthName} ${invoice.year}</div>
              </div>
            </div>

            <div class="meta-divider"></div>

            <!-- Billed to -->
            <div class="section-title">${i18n.t("invoice.bill_to", { lng })}</div>
            <div class="meta-grid" style="margin-bottom: 18px;">
              <div class="meta-col">
                <div class="meta-value">${residentUser?.name ?? "Resident"}</div>
                <div class="meta-sub">${residentUser?.email ?? ""}</div>
              </div>
              <div class="meta-col">
                <div class="meta-value">${i18n.t("invoice.apartment", { lng })} ${aptLabel}</div>
                <div class="meta-sub">${residentApartment?.floorNumber ? `Floor ${residentApartment.floorNumber}` : ""}</div>
              </div>
            </div>

            <!-- Charges -->
            <div class="section-title">${i18n.t("invoice.description", { lng })}</div>
            <table class="invoice-table">
              <thead>
                <tr>
                  <th style="width:75%">${i18n.t("invoice.description", { lng })}</th>
                  <th style="width:25%" class="amt">${i18n.t("invoice.amount", { lng })}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${i18n.t("invoice.title", { lng })} — ${monthName} ${invoice.year}</td>
                  <td class="amt">₹${invoice.baseAmount.toFixed(2)}</td>
                </tr>
                ${extraChargesRows}
                <tr class="total-row">
                  <td>${i18n.t("invoice.total", { lng })}</td>
                  <td class="amt">₹${invoice.totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <!-- Payment -->
            <div class="payment-box">
              <div class="row">
                <span class="label">${i18n.t("invoice.payment_reference", { lng })}</span>
                <span class="value">${paymentReference ?? "—"}</span>
              </div>
              <div class="row" style="margin-top:4px;">
                <span class="label">${i18n.t("invoice.payment_method", { lng })}</span>
                <span class="value">${paymentMethod}</span>
              </div>
            </div>

            <!-- Terms -->
            <div class="terms-box">
              <div class="title">${i18n.t("invoice.terms", { lng })}</div>
              <div class="desc">${i18n.t("invoice.terms_text", { lng })}</div>
            </div>

          </div>

          <!-- ─── FOOTER ─── -->
          <div class="footer">
            <strong>${societyName}</strong> &mdash; ${i18n.t("invoice.footer_notice", { lng })}
          </div>

        </div>
      </div>
    </body>
    </html>
  `;
}
