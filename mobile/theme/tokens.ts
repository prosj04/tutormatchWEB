export type ColorScheme = "green" | "blue";
export type ThemeMode = "light" | "dark";
export type ThemeKey = `${ColorScheme}-${ThemeMode}`;

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
}

export const themes: Record<ThemeKey, ThemeTokens> = {
  "green-light": {
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
  },
  "blue-light": {
    bg: "#F5F8FE",
    panel: "#FFFFFF",
    panel2: "#EAF0FB",
    line: "rgba(20,38,74,0.085)",
    line2: "rgba(20,38,74,0.15)",
    fg: "#0F1A2E",
    mut: "#54627A",
    mut2: "#93A1B8",
    acc: "#2563EB",
    accPress: "#1D54CF",
    accRgb: [37, 99, 235],
    onAcc: "#FFFFFF",
    accText: "#1D4ED8",
  },
  "green-dark": {
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
  },
  "blue-dark": {
    bg: "#0A1120",
    panel: "#101D32",
    panel2: "#16273F",
    line: "rgba(140,175,230,0.13)",
    line2: "rgba(140,175,230,0.22)",
    fg: "#EAF1FB",
    mut: "#9DABC4",
    mut2: "#6A7894",
    acc: "#3B82F6",
    accPress: "#5B9CFF",
    accRgb: [59, 130, 246],
    onAcc: "#06122A",
    accText: "#85B5FF",
  },
};

export function getTheme(color: ColorScheme, mode: ThemeMode): ThemeTokens {
  return themes[`${color}-${mode}`];
}

export function accTint(t: ThemeTokens, opacity: number): string {
  const [r, g, b] = t.accRgb;
  return `rgba(${r},${g},${b},${opacity})`;
}
