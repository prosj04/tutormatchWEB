"use client";

import { THEME_LABELS, THEMES, useTheme } from "@/hooks/useTheme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useTheme();

  return (
    <div
      className={`flex items-center gap-0.5 rounded-full border border-neutral-20 bg-neutral-10 p-0.5 ${className}`}
      role="group"
      aria-label="테마 선택"
    >
      {THEMES.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTheme(t)}
          aria-pressed={theme === t}
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-all ${
            theme === t
              ? "bg-white text-neutral-100 shadow-sm"
              : "text-neutral-80 hover:text-neutral-100"
          }`}
        >
          {THEME_LABELS[t]}
        </button>
      ))}
    </div>
  );
}
