import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { IEmailService, SendEmailOptions } from "../../domain/services/IEmailService";
import { env } from "../../../../shared/config/env";

export class SesEmailService implements IEmailService {
  private sesClient: SESClient;
  private fromAddress: string;

  constructor() {
    this.sesClient = new SESClient({
      region: env.AWS_REGION,
      credentials:
        env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
          ? {
            accessKeyId: env.AWS_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
          }
          : undefined,
    });

    const fromEmail = env.SES_FROM_EMAIL;
    const fromName = env.SOCIETY_NAME;
    this.fromAddress = `"${fromName}" <${fromEmail}>`;
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const links = (options.html ?? "").match(/href="([^"]+)"/g) ?? [];
    console.log("\n========== [SES EMAIL SENT] ==========");
    console.log("To:     ", options.to);
    console.log("Subject:", options.subject);
    if (links.length) {
      console.log("Links:");
      links.forEach((l) => console.log("  " + l.replace(/href="|"/g, "")));
    }
    console.log("--------------------------------------\n");

    const command = new SendEmailCommand({
      Source: this.fromAddress,
      Destination: {
        ToAddresses: [options.to],
      },
      Message: {
        Subject: {
          Data: options.subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: options.html,
            Charset: "UTF-8",
          },
        },
      },
    });

    try {
      await this.sesClient.send(command);
    } catch (err) {
      console.error("[SesEmailService] Failed to deliver email via AWS SES:", err);
    }
  }
}
