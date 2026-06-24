"use client";

import { useCallback, useEffect, useState } from "react";

export type ColorTheme = "green" | "blue";
export type ModeTheme = "light" | "dark";

const COLOR_KEY = "concord-color";
const MODE_KEY = "concord-mode";
const CHANGE_EVENT = "concord-design-theme-change";

function readColor(): ColorTheme {
  try {
    const v = localStorage.getItem(COLOR_KEY);
    return v === "blue" ? "blue" : "green";
  } catch {
    return "green";
  }
}

function readMode(): ModeTheme {
  try {
    return localStorage.getItem(MODE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function applyToDOM(color: ColorTheme, mode: ModeTheme) {
  const el = document.documentElement;
  el.setAttribute("data-color", color);
  if (mode === "dark") {
    el.setAttribute("data-theme", "dark");
  } else {
    el.removeAttribute("data-theme");
  }
}

export function useDesignTheme() {
  const [color, setColorState] = useState<ColorTheme>("green");
  const [mode, setModeState] = useState<ModeTheme>("light");

  useEffect(() => {
    const c = readColor();
    const m = readMode();
    setColorState(c);
    setModeState(m);
    applyToDOM(c, m);

    const handleChange = () => {
      const nc = readColor();
      const nm = readMode();
      setColorState(nc);
      setModeState(nm);
    };
    window.addEventListener(CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(CHANGE_EVENT, handleChange);
  }, []);

  const setColor = useCallback((c: ColorTheme) => {
    try { localStorage.setItem(COLOR_KEY, c); } catch {}
    applyToDOM(c, readMode());
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
    setColorState(c);
  }, []);

  const setMode = useCallback((m: ModeTheme) => {
    try { localStorage.setItem(MODE_KEY, m); } catch {}
    applyToDOM(readColor(), m);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
    setModeState(m);
  }, []);

  const toggleMode = useCallback(() => {
    const next = readMode() === "dark" ? "light" : "dark";
    try { localStorage.setItem(MODE_KEY, next); } catch {}
    applyToDOM(readColor(), next);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
    setModeState(next);
  }, []);

  return { color, mode, setColor, setMode, toggleMode };
}
