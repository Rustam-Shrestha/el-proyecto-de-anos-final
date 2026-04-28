import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Alias paths reduce brittle relative imports and make module reuse easier.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "src/app"),
      "@features": path.resolve(__dirname, "src/features"),
      "@shared": path.resolve(__dirname, "src/shared"),
      "@components": path.resolve(__dirname, "src/components"),
      "@assets": path.resolve(__dirname, "src/assets"),
      "@services": path.resolve(__dirname, "src/services"),
      "@store": path.resolve(__dirname, "src/store"),
      "@helper": path.resolve(__dirname, "src/helper"),
      "@context": path.resolve(__dirname, "src/context"),
      "@auth": path.resolve(__dirname, "src/auth"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@providers": path.resolve(__dirname, "src/providers"),
      "@hooks": path.resolve(__dirname, "src/hooks"),
      "@types": path.resolve(__dirname, "src/types")
    }
  },
  server: {
    port: 5173,
    host: true
  }
});
