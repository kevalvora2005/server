import i18n from "../../../../shared/config/i18n";

export interface TenancyRevokedEmailTemplateOptions {
  name: string;
  unitName: string;
  societyName?: string;
  preferredLanguage?: string;
  locale?: string;
}

export function buildTenancyRevokedEmailTemplate(options: TenancyRevokedEmailTemplateOptions): {
  subject: string;
  html: string;
} {
  const societyName = options.societyName || process.env.SOCIETY_NAME || "Civic Horizon";
  const lng = options.preferredLanguage || "en";
  const t = (key: string, opts: Record<string, any> = {}) => i18n.t(key, { lng, ...opts });

  const subject = t("email.tenancy_revoked_subject", { societyName });
  const header = t("email.tenancy_revoked_header");
  const greeting = t("email.welcome_greeting", { name: options.name });
  const body = t("email.tenancy_revoked_body", { unitName: options.unitName, societyName });
  const note = t("email.tenancy_revoked_deactivated", { societyName });
  const footer = t("email.welcome_footer");

  return {
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 30px; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
          <div style="background-color: #1a1f36; padding: 24px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 22px;">${header}</h2>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; margin-top: 0;">${greeting}</p>
            <p style="font-size: 15px; color: #555; line-height: 1.5;">
              ${body}
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 15px; line-height: 1.5;">
              ${note}
            </p>
          </div>
          <div style="background-color: #f1f3f5; padding: 16px; text-align: center; font-size: 12px; color: #888;">
            <p style="margin: 0;">© ${new Date().getFullYear()} ${societyName}. ${footer}</p>
          </div>
        </div>
      </div>
    `,
  };
}
