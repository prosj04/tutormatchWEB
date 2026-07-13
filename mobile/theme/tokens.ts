export type ThemeMode = "light" | "dark";

export interface ThemeTokens {
  bg: string;
  panel: string;
  panel2: string;
  line: string;
  line2: string;
  fg: string;
  mut: string;
  mut2: string;
  acc: string;
  accPress: string;
  accRgb: [number, number, number];
  onAcc: string;
  accText: string;
  danger: string;
}

export const themes: Record<ThemeMode, ThemeTokens> = {
  light: {
    bg: "#FAF9F4",
    panel: "#FFFFFF",
    panel2: "#F0EFE7",
    line: "rgba(34,38,30,0.085)",
    line2: "rgba(34,38,30,0.15)",
    fg: "#161A16",
    mut: "#585C53",
    mut2: "#9AA095",
    acc: "#10B981",
    accPress: "#0CA372",
    accRgb: [16, 185, 129],
    onAcc: "#FFFFFF",
    accText: "#07875A",
    danger: "#A93636",
  },
  dark: {
    bg: "#181A1B",
    panel: "#202325",
    panel2: "#282B2D",
    line: "rgba(200,206,202,0.11)",
    line2: "rgba(200,206,202,0.18)",
    fg: "#ECEEEC",
    mut: "#AEB4B0",
    mut2: "#7C817E",
    acc: "#2EA46E",
    accPress: "#38B97E",
    accRgb: [46, 164, 110],
    onAcc: "#06150D",
    accText: "#64C699",
    danger: "#E58A8A",
  },
};

export function getTheme(mode: ThemeMode): ThemeTokens {
  return themes[mode];
}

export function accTint(t: ThemeTokens, opacity: number): string {
  const [r, g, b] = t.accRgb;
  return `rgba(${r},${g},${b},${opacity})`;
}
