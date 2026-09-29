import type { Config } from "tailwindcss";

/** 디자인 시스템 v3 — 색·반경·그림자는 ds.css 토큰을 따른다. */
const gray = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((n) => [n, `rgb(var(--g-${n}) / <alpha-value>)`]),
);

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gray,
        neutral: gray,
        stone: gray,
        slate: gray,
        background: "var(--bg)",
        surface: "var(--panel)",
        "surface-2": "var(--panel-2)",
        primary: "var(--acc)",
        accent: "var(--acc)",
        "brand-blue": "var(--acc)",
        ink: "var(--ink)",
        line: "var(--line)",
        "line-2": "var(--line-2)",
        danger: "var(--danger)",
        warn: "var(--warn)",
        "neutral-100": "var(--fg)",
        "neutral-90": "var(--fg)",
        "neutral-80": "var(--mut)",
        "neutral-0": "var(--panel)",
        "neutral-10": "var(--panel-2)",
        "neutral-20": "var(--line-2)",
        "neutral-30": "var(--mut-2)",
        "neutral-40": "var(--mut-2)",
        "neutral-50": "var(--mut)",
        text: {
          primary: "var(--fg)",
          secondary: "var(--mut)",
          muted: "var(--mut-2)",
        },
        border: "var(--line-2)",
      },
      fontFamily: {
        sans: ["var(--font-pretendard)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["var(--font-serif)", "Noto Serif KR", "serif"],
        serif: ["var(--font-serif)", "Noto Serif KR", "serif"],
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "4px",
        md: "4px",
        lg: "6px",
        xl: "6px",
        "2xl": "8px",
        "3xl": "10px",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-md)",
        xl: "var(--shadow-md)",
        "2xl": "var(--shadow-md)",
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
