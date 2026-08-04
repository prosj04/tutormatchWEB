import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";

import { font } from "../../styles/app-styles";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";
import type { BadgeTone } from "./shared";

/** 시안 .bst — tone별 색. warn은 라이트/다크 분기(CSS와 동일). */
export function Bst({ tone, label }: { tone: BadgeTone; label: string }) {
  const { t, mode } = useTheme();
  let color: string;
  let bg: string;
  if (tone === "acc") {
    color = t.accText;
    bg = accTint(t, 0.12);
  } else if (tone === "warn") {
    // .bst.warn{ color:#92610a; background:rgba(217,119,6,.12); }
    // [data-theme="dark"] .bst.warn{ color:#e8c56b; background:rgba(251,191,36,.1); }
    color = mode === "dark" ? "#e8c56b" : "#92610a";
    bg = mode === "dark" ? "rgba(251,191,36,0.1)" : "rgba(217,119,6,0.12)";
  } else {
    color = t.mut;
    bg = t.panel2;
  }
  return (
    <View style={[styles.bst, { backgroundColor: bg }]}>
      <Text style={[styles.bstText, { color }]}>{label}</Text>
    </View>
  );
}

/** 시안 .card 컨테이너 (padding은 style로 주입). */
export function MCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { t } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // .bst{ font-size:10.5px; font-weight:700; padding:4px 9px; border-radius:999px; }
  bst: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  bstText: { fontSize: 10.5, fontFamily: font.bold },
  // .card{ border:1px solid line; border-radius:20; box-shadow:shadow-sm; }
  card: {
    borderWidth: 1,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    shadowOpacity: 0.06,
    elevation: 3,
  },
});
