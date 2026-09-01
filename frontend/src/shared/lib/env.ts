const envKeys = ["VITE_API_BASE_URL", "VITE_API_URL"] as const;

type EnvKey = (typeof envKeys)[number];

type EnvMap = Record<EnvKey, string>;

const readEnv = (key: EnvKey) => import.meta.env[key] ?? "";

export const env: EnvMap = {
  VITE_API_BASE_URL: readEnv("VITE_API_BASE_URL") || readEnv("VITE_API_URL") || "http://localhost:3000/api/v1",
  VITE_API_URL: readEnv("VITE_API_URL") || readEnv("VITE_API_BASE_URL") || "http://localhost:3000/api/v1",
};
