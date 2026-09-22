import i18n from "../../../../shared/config/i18n";
import { emailTemplateService } from "../../../../shared/services/EmailTemplateService";

export interface WelcomeEmailTemplateOptions {
  name: string;
  email: string;
  unitName: string;
  temporaryPassword: string;
  societyName?: string;
  clientUrl?: string;
  preferredLanguage?: string;
  locale?: string;
}

export async function buildWelcomeEmailTemplate(options: WelcomeEmailTemplateOptions): Promise<{
  subject: string;
  html: string;
}> {
  const societyName = options.societyName || process.env.SOCIETY_NAME || "Civic Horizon";
  const clientUrl = options.clientUrl || process.env.CLIENT_URL || "http://localhost:5173";
  const lng = options.preferredLanguage || "en";
  const t = (key: string, opts: Record<string, any> = {}) => i18n.t(key, { lng, ...opts });

  const subject = t("email.welcome_subject", { societyName });

  const html = await emailTemplateService.render("welcome", {
    name: options.name,
    email: options.email,
    unitName: options.unitName,
    temporaryPassword: options.temporaryPassword,
    societyName,
    clientUrl,
    header: t("email.welcome_header", { societyName }),
    greeting: t("email.welcome_greeting", { name: options.name }),
    body: t("email.welcome_body", { unitName: options.unitName, societyName }),
    credentialsTitle: t("email.welcome_credentials_title"),
    emailLabel: t("email.welcome_email_label"),
    tempPassLabel: t("email.welcome_temp_pass"),
    firstLoginNote: t("email.welcome_first_login_note"),
    loginCta: t("email.welcome_login_cta"),
    footer: t("email.welcome_footer"),
    year: new Date().getFullYear(),
  });

  return { subject, html };
}
