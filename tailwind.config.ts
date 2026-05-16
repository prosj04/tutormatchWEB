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
        text: {
          primary: "#111111",
          secondary: "#6B7280",
          muted: "#9CA3AF",
        },
        border: "#E5E7EB",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Inter", "sans-serif"],
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
