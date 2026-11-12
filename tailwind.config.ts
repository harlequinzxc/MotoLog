import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        crimson: "0 8px 24px rgba(239, 68, 68, 0.28)",
        card: "0 10px 28px rgba(0, 0, 0, 0.2)"
      }
    }
  },
  plugins: []
};

export default config;
