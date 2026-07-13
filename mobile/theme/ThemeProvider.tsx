import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

import { type ThemeMode, type ThemeTokens, getTheme } from "./tokens";

const MODE_KEY = "concord-mode";

interface ThemeContextValue {
  mode: ThemeMode;
  t: ThemeTokens;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    (async () => {
      const storedMode = await AsyncStorage.getItem(MODE_KEY);
      if (storedMode === "dark" || storedMode === "light") {
        setModeState(storedMode);
      } else {
        setModeState(systemScheme === "dark" ? "dark" : "light");
      }
    })();
  }, [systemScheme]);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      AsyncStorage.setItem(MODE_KEY, next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, t: getTheme(mode), toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
