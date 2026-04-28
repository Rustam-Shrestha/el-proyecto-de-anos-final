/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "hsl(var(--theme-primary))",
        red: "var(--red)"
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
        serif: ["Inter", "serif"]
      }
    }
  },
  plugins: []
};
