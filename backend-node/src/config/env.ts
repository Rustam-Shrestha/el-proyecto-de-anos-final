import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_ACCESS_TTL: z.string().default('2h'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.string().default('info'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  UPLOAD_DIR: z.string().default('uploads/kyc'),
  FASTAPI_URL: z.string().default('http://localhost:8000'),
  ML_SERVICE_URL: z.string().default('http://localhost:8000'),
  OCR_ENABLED: z.string().default('true').transform((v) => v === 'true'),
  FACE_MATCH_ENABLED: z.string().default('true').transform((v) => v === 'true'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
});

export const env = envSchema.parse(process.env);

// Warn-only checks for optional integrations: boot must never fail on these,
// but operators should know when email delivery is running on the dev fallback.
if (!env.SMTP_HOST || !env.SMTP_USER) {
  process.stdout.write('[env] SMTP_HOST/SMTP_USER not set — emails use the dev fallback transport and are not delivered.\n');
}
