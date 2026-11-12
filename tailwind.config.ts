import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        "2xl": "1rem"
      },
      boxShadow: {
        card: "0 10px 28px rgba(0, 0, 0, 0.16)",
        crimson: "0 8px 24px rgba(239, 68, 68, 0.28)"
      }
    }
  },
  plugins: []
};

export default config;
