import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#172026",
        graphite: "#2f3b42",
        steel: "#66737d",
        mist: "#f4f7f8",
        cut: "#d92323",
        fold: "#1d65d8",
        bleed: "#14915b",
      },
      boxShadow: {
        panel: "0 16px 48px rgba(23, 32, 38, 0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
