import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// ========================
// Validate required env vars
// ========================
const requiredEnvVars = [
  'DATABASE_URL',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`❌ Biến môi trường bắt buộc chưa được thiết lập: ${envVar}`);
  }
}

export const env = {
  // Server
  PORT: parseInt(process.env.PORT ?? '5000', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',

  // Database
  DATABASE_URL: process.env.DATABASE_URL as string,

  // JWT
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET as string,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN ?? '15m',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d',

  // Bcrypt
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10),

  // API
  API_PREFIX: process.env.API_PREFIX ?? '/api/v1',

  // SMTP
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM ?? 'UIT Cinema <no-reply@uitcinema.com>',

  // PayOS
  PAYOS_CLIENT_ID: process.env.PAYOS_CLIENT_ID ?? '',
  PAYOS_API_KEY: process.env.PAYOS_API_KEY ?? '',
  PAYOS_CHECKSUM_KEY: process.env.PAYOS_CHECKSUM_KEY ?? '',
  PAYOS_RETURN_URL: process.env.PAYOS_RETURN_URL ?? '',
  PAYOS_CANCEL_URL: process.env.PAYOS_CANCEL_URL ?? '',

  // Helpers
  isProduction: () => process.env.NODE_ENV === 'production',
  isDevelopment: () => process.env.NODE_ENV === 'development',
} as const;

