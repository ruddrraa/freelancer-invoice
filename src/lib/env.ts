import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_NAME: z.string().default("RelancePay"),
  MONGODB_DB_NAME: z.string().default("freelancer_invoice"),
  MONGODB_URI: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default("7d"),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  GOOGLE_SITE_VERIFICATION: z.string().optional(),
  BING_SITE_VERIFICATION: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  PAYPAL_WEBHOOK_ID: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),
  OPEN_EXCHANGE_API_KEY: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);

export function requireEnv(name: keyof typeof env) {
  const value = env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}
