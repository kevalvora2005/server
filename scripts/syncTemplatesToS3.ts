import dotenv from "dotenv";
dotenv.config();

import { emailTemplateService } from "../src/shared/services/email/EmailTemplateService";

async function main() {
  console.log("Starting S3 Email Templates sync...");
  const templates = ["welcome", "tenancy-revoked"];

  for (const template of templates) {
    try {
      await emailTemplateService.uploadTemplateToS3(template);
      console.log(`✓ Successfully uploaded ${template}.html to S3`);
    } catch (err: any) {
      console.error(`✗ Failed to upload ${template}.html:`, err.message);
    }
  }

  console.log("Done!");
}

main();
