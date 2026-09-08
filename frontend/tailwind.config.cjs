/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#15803D",
          hover: "#166534",
          active: "#14532D",
          soft: "#DCFCE7",
        },
        slate: {
          900: "#0F172A",
          700: "#334155",
          500: "#64748B",
          400: "#94A3B8",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#F1F5F9",
          bg: "#F8FAFC",
        },
        border: {
          DEFAULT: "#E2E8F0",
          strong: "#CBD5E1",
        },
        success: { DEFAULT: "#16A34A", soft: "#DCFCE7" },
        warning: { DEFAULT: "#D97706", soft: "#FEF3C7" },
        danger: {
          DEFAULT: "#DC2626",
          soft: "#FEE2E2",
          50: "#fef2f4",
          100: "#fde7eb",
          200: "#fbcad4",
          300: "#f69daf",
          400: "#f06881",
          500: "#ea3b5f",
          600: "#dc143c",
          700: "#b80d30",
          800: "#8e0a25",
          900: "#63071a",
          950: "#36030e",
        },
        info: { DEFAULT: "#0284C7", soft: "#E0F2FE" },
        red: "var(--danger)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: { sm: "4px", DEFAULT: "6px", md: "8px", lg: "12px" },
      boxShadow: {
        subtle: "0 1px 2px rgba(15,23,42,0.05)",
        card: "0 4px 12px rgba(15,23,42,0.08)",
        modal: "0 12px 32px rgba(15,23,42,0.12)",
      },
      maxWidth: { content: "1440px" },
    },
  },
  plugins: [],
};
