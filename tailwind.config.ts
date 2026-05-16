import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F5F5F5",
        surface: "#FFFFFF",
        primary: "#2563EB",
        accent: "#E91E8C",
        "brand-blue": "#2563EB",
        "neutral-100": "#111111",
        "neutral-90": "#1a1a1a",
        "neutral-80": "#2a2a2a",
        "neutral-0": "#ffffff",
        "neutral-10": "#f5f5f5",
        "neutral-20": "#e5e5e5",
        "neutral-30": "#aaaaaa",
        "neutral-40": "#888888",
        "neutral-50": "#666666",
        text: {
          primary: "#111111",
          secondary: "#6B7280",
          muted: "#9CA3AF",
        },
        border: "#E5E7EB",
      },
      fontFamily: {
        sans: ["var(--font-pretendard)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["var(--font-pretendard)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      maxWidth: {
        content: "72rem",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        30: "7.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
