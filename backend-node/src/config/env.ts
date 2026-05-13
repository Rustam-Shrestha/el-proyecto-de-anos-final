import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().url().optional()
);

const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().min(1).optional()
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: optionalUrl,
  DB_URL: optionalUrl,
  DB_USER: optionalString,
  DB_PASSWORD: optionalString,
  DB_HOST: optionalString,
  DB_PORT: z.coerce.number().int().positive().optional(),
  DB_NAME: optionalString,
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),
  CORS_ORIGIN: z.string().min(1),
  FASTAPI_URL: z.string().url(),
  OAUTH_CLIENT_ID: z.string().optional(),
  OAUTH_CLIENT_SECRET: z.string().optional(),
  OAUTH_AUTH_URL: optionalUrl,
  OAUTH_TOKEN_URL: optionalUrl,
  OAUTH_CALLBACK_URL: optionalUrl
});

const buildDatabaseUrl = (env: z.infer<typeof envSchema>) => {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }

  if (env.DB_URL) {
    return env.DB_URL;
  }

  const user = env.DB_USER ?? "postgres";
  const password = env.DB_PASSWORD ?? "postgres";
  const host = env.DB_HOST ?? "localhost";
  const port = env.DB_PORT ?? 5432;
  const database = env.DB_NAME ?? "finguard";

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
};

const normalizeDatabaseUrl = (databaseUrl: string) => {
  const url = new URL(databaseUrl);

  if (url.protocol === "postgresql+asyncpg:") {
    url.protocol = "postgresql:";
  }

  if (url.hostname === "postgres") {
    url.hostname = "localhost";
  }

  return url.toString();
};

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  DATABASE_URL: normalizeDatabaseUrl(buildDatabaseUrl(parsedEnv))
};
