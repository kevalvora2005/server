export const env = {
  PORT: Number(process.env.PORT) || 5000,

  CLIENT_URL: process.env.CLIENT_URL,

  NODE_ENV: process.env.NODE_ENV || "development",

  DATABASE_HOST:
    process.env.DATABASE_HOST || "localhost",

  DATABASE_PORT:
    Number(process.env.DATABASE_PORT) || 5432,

  DATABASE_USER:
    process.env.DATABASE_USER || "postgres",

  DATABASE_PASSWORD:
    process.env.DATABASE_PASSWORD || "",

  DATABASE_NAME:
    process.env.DATABASE_NAME || "postgres",

  DATABASE_URL:
    process.env.DATABASE_URL,

  CLOUDINARY_CLOUD_NAME:
    process.env.CLOUDINARY_CLOUD_NAME,

  CLOUDINARY_API_KEY:
    process.env.CLOUDINARY_API_KEY,

  CLOUDINARY_API_SECRET:
    process.env.CLOUDINARY_API_SECRET,

  SOCIETY_NAME:
    process.env.SOCIETY_NAME || "My Society",

  SOCIETY_ADDRESS:
    process.env.SOCIETY_ADDRESS || "123 Main St, City, Country",

  AWS_REGION:
    process.env.AWS_REGION || "ap-south-1",

  COGNITO_USER_POOL_ID:
    process.env.COGNITO_USER_POOL_ID || "",

  COGNITO_CLIENT_ID:
    process.env.COGNITO_CLIENT_ID || "",

  AWS_ACCESS_KEY_ID:
    process.env.AWS_ACCESS_KEY_ID || "",

  AWS_SECRET_ACCESS_KEY:
    process.env.AWS_SECRET_ACCESS_KEY || "",

  S3_BUCKET_NAME:
    process.env.S3_BUCKET_NAME || "",

  SES_FROM_EMAIL:
    process.env.SES_FROM_EMAIL || "no-reply@civichorizon.com",
};