import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { createPresignedPost, PresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";

export interface PresignedPostOptions {
  key: string;
  contentType: string;
  maxSizeBytes?: number;
  expiresInSeconds?: number;
}

export interface PresignedPostResult {
  url: string;
  fields: Record<string, string>;
}

const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; 
const DEFAULT_EXPIRY = 300; 

export class S3PresignedPostService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor() {
    this.bucketName = env.S3_BUCKET_NAME;

    if (!this.bucketName) {
      console.warn("[S3PresignedPostService] S3_BUCKET_NAME is not configured in environment.");
    }

    this.s3Client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async generatePresignedPost(options: PresignedPostOptions): Promise<PresignedPostResult> {
    const {
      key,
      contentType,
      maxSizeBytes = DEFAULT_MAX_SIZE,
      expiresInSeconds = DEFAULT_EXPIRY,
    } = options;

    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      throw new Error(
        `Content type "${contentType}" is not allowed. Allowed types: ${ALLOWED_CONTENT_TYPES.join(", ")}`
      );
    }

    const presignedPost: PresignedPost = await createPresignedPost(this.s3Client, {
      Bucket: this.bucketName,
      Key: key,
      Conditions: [
        ["eq", "$Content-Type", contentType],
        ["content-length-range", 1, maxSizeBytes],
      ],
      Fields: {
        "Content-Type": contentType,
      },
      Expires: expiresInSeconds,
    });

    return {
      url: presignedPost.url,
      fields: presignedPost.fields,
    };
  }

  getObjectUrl(key: string): string {
    return `https://${this.bucketName}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  }

  async generatePresignedGetUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
  }

  extractKeyFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      return parsed.pathname.slice(1);
    } catch {
      return null;
    }
  }
}
