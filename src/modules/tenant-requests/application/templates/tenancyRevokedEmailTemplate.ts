import i18n from "../../../../shared/config/i18n";
import { emailTemplateService } from "../../../../shared/services/EmailTemplateService";

export interface TenancyRevokedEmailTemplateOptions {
  name: string;
  unitName: string;
  societyName?: string;
  preferredLanguage?: string;
  locale?: string;
}

export async function buildTenancyRevokedEmailTemplate(options: TenancyRevokedEmailTemplateOptions): Promise<{
  subject: string;
  html: string;
}> {
  const societyName = options.societyName || process.env.SOCIETY_NAME || "Civic Horizon";
  const lng = options.preferredLanguage || "en";
  const t = (key: string, opts: Record<string, unknown> = {}) => i18n.t(key, { lng, ...opts });

  const subject = t("email.tenancy_revoked_subject", { societyName });

  const html = await emailTemplateService.render("tenancy-revoked", {
    name: options.name,
    unitName: options.unitName,
    societyName,
    header: t("email.tenancy_revoked_header"),
    greeting: t("email.welcome_greeting", { name: options.name }),
    body: t("email.tenancy_revoked_body", { unitName: options.unitName, societyName }),
    note: t("email.tenancy_revoked_deactivated", { societyName }),
    footer: t("email.welcome_footer"),
    year: new Date().getFullYear(),
  });

  return { subject, html };
}
