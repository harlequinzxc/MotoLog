import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-base": "#0D0D0E",
        "bg-card": "#1E1E20",
        "bg-elevated": "#2A2A2C",
        "bg-input": "#25252B",
        success: "#84CC16",
        danger: "#EF4444",
        reserve: "#EAB308",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        "text-primary": "#F5F5F5",
        "text-secondary": "#A0A0A8",
        "text-muted": "#6B6B74",
        "border-default": "#2A2A30",
      },
      boxShadow: {
        "accent-glow": "0 12px 32px rgb(var(--color-accent) / 0.24)",
      },
    },
  },
  plugins: [],
};

export default config;
