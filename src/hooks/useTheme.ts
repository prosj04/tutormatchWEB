"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "legacy" | "light-lime" | "dark-blue";

export const THEMES: readonly Theme[] = ["legacy", "light-lime", "dark-blue"];

export const THEME_LABELS: Record<Theme, string> = {
  legacy: "기존",
  "light-lime": "라이트",
  "dark-blue": "블랙",
};

const STORAGE_KEY = "concord-theme";
const CHANGE_EVENT = "concord-theme-change";

function readTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(v as Theme) ? (v as Theme) : "legacy";
  } catch {
    return "legacy";
  }
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>("legacy");

  useEffect(() => {
    setThemeState(readTheme());

    const handleChange = () => setThemeState(readTheme());
    window.addEventListener(CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(CHANGE_EVENT, handleChange);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {}
    if (t === "legacy") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", t);
    }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
    setThemeState(t);
  }, []);

  return [theme, setTheme];
}
