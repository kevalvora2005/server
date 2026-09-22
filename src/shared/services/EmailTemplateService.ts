import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";
import { env } from "../config/env";

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache
const S3_PREFIX = "email-templates";

export class EmailTemplateService {
  private s3Client: S3Client;
  private cache: Map<string, { html: string; cachedAt: number }> = new Map();
  private localTemplatesDir: string;

  constructor() {
    this.s3Client = new S3Client({
      region: env.AWS_REGION,
      credentials:
        env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: env.AWS_ACCESS_KEY_ID,
              secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
    this.localTemplatesDir = path.resolve(__dirname, "../../templates/email");
  }

  async getTemplateHtml(templateName: string): Promise<string> {
    const cached = this.cache.get(templateName);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.html;
    }

    let html: string | null = null;

    if (env.S3_BUCKET_NAME) {
      try {
        const s3Key = `${S3_PREFIX}/${templateName}.html`;
        const response = await this.s3Client.send(
          new GetObjectCommand({
            Bucket: env.S3_BUCKET_NAME,
            Key: s3Key,
          })
        );
        if (response.Body) {
          html = await response.Body.transformToString("utf-8");
          console.log(`[EmailTemplateService] Loaded template "${templateName}" from S3 (${s3Key})`);
        }
      } catch (err: any) {
        console.warn(
          `[EmailTemplateService] Could not load "${templateName}" from S3: ${err.message}. Falling back to local file.`
        );
      }
    }

    if (!html) {
      const localFilePath = path.join(this.localTemplatesDir, `${templateName}.html`);
      try {
        html = await fs.readFile(localFilePath, "utf-8");
        console.log(`[EmailTemplateService] Loaded template "${templateName}" from local fallback`);
      } catch (localErr: any) {
        throw new Error(
          `[EmailTemplateService] Template "${templateName}" not found in S3 or local directory (${localFilePath})`
        );
      }
    }

    this.cache.set(templateName, { html, cachedAt: Date.now() });
    return html;
  }

  async render(templateName: string, data: Record<string, any>): Promise<string> {
    const templateHtml = await this.getTemplateHtml(templateName);

    return templateHtml.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
      return data[key] !== undefined && data[key] !== null ? String(data[key]) : "";
    });
  }


  async uploadTemplateToS3(templateName: string): Promise<void> {
    if (!env.S3_BUCKET_NAME) {
      throw new Error("[EmailTemplateService] S3_BUCKET_NAME is not configured");
    }

    const localFilePath = path.join(this.localTemplatesDir, `${templateName}.html`);
    const fileContent = await fs.readFile(localFilePath, "utf-8");
    const s3Key = `${S3_PREFIX}/${templateName}.html`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: s3Key,
        Body: fileContent,
        ContentType: "text/html",
      })
    );

    this.cache.delete(templateName);
    console.log(`[EmailTemplateService] Uploaded "${templateName}.html" to s3://${env.S3_BUCKET_NAME}/${s3Key}`);
  }
}

export const emailTemplateService = new EmailTemplateService();
