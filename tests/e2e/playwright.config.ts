import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./specs",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
    trace: "on-first-retry"
  }
});
