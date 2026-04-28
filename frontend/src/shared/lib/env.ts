const requiredEnv = ["VITE_API_BASE_URL"] as const;

type RequiredEnv = (typeof requiredEnv)[number];

type EnvMap = Record<RequiredEnv, string>;

export const env: EnvMap = requiredEnv.reduce((acc, key) => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  acc[key] = value;
  return acc;
}, {} as EnvMap);
