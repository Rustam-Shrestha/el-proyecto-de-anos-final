/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "hsl(var(--theme-primary))",
        red: "var(--red)",
        danger: {
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
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
        serif: ["Inter", "serif"]
      }
    }
  },
  plugins: []
};
