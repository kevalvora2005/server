import i18n from "../../../../shared/config/i18n";
import { emailTemplateService } from "../../../../shared/services/EmailTemplateService";

export interface PasswordResetEmailOptions {
  name: string;
  code: string;
  societyName?: string;
  preferredLanguage?: string;
}

export async function buildPasswordResetEmailTemplate(options: PasswordResetEmailOptions): Promise<{
  subject: string;
  html: string;
}> {
  const societyName = options.societyName || process.env.SOCIETY_NAME || "Civic Horizon";
  const lng = options.preferredLanguage || "en";
  const t = (key: string, opts: Record<string, unknown> = {}) => i18n.t(key, { lng, ...opts });

  const subject = t("email.password_reset_subject", { societyName });

  const html = await emailTemplateService.render("password-reset", {
    name: options.name,
    code: options.code,
    societyName,
    header: t("email.password_reset_header"),
    greeting: t("email.password_reset_greeting", { name: options.name }),
    body: t("email.password_reset_body", { societyName }),
    codeLabel: t("email.password_reset_code_label"),
    expiryNote: t("email.password_reset_expiry", { minutes: 10 }),
    ignoreNote: t("email.password_reset_ignore"),
    footer: t("email.welcome_footer"),
    year: new Date().getFullYear(),
  });

  return { subject, html };
}
