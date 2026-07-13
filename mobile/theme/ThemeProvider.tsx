import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

import { type ColorScheme, type ThemeMode, type ThemeTokens, getTheme } from "./tokens";

const COLOR_KEY = "concord-color";
const MODE_KEY = "concord-mode";

interface ThemeContextValue {
  color: ColorScheme;
  mode: ThemeMode;
  t: ThemeTokens;
  setColor: (c: ColorScheme) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [color, setColorState] = useState<ColorScheme>("green");
  const [mode, setModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    (async () => {
      const [storedColor, storedMode] = await Promise.all([
        AsyncStorage.getItem(COLOR_KEY),
        AsyncStorage.getItem(MODE_KEY),
      ]);
      if (storedColor === "blue") setColorState("blue");
      if (storedMode === "dark" || storedMode === "light") {
        setModeState(storedMode);
      } else {
        setModeState(systemScheme === "dark" ? "dark" : "light");
      }
    })();
  }, [systemScheme]);

  const setColor = useCallback((c: ColorScheme) => {
    setColorState(c);
    AsyncStorage.setItem(COLOR_KEY, c);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      AsyncStorage.setItem(MODE_KEY, next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ color, mode, t: getTheme(color, mode), setColor, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
