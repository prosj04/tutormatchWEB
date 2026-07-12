import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { font } from "../../styles/app-styles";
import { useTheme } from "../../theme/ThemeProvider";
import type { Child } from "./_shared";

/**
 * 자녀 전환 칩 (.kid-switch / .kid) — 시안 인라인 <style> 값 1:1.
 * .kid { padding:8px 14px 8px 9px; border-radius:999; border:1px; font-size:13; font-weight:700; }
 * .kid .kv { width:24; height:24; border-radius:12; font-size:11; font-weight:800; }
 */
export function KidSwitch({
  items: kids,
  selectedId,
  onSelect,
  labelMode = "gradeName",
}: {
  items: Child[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  labelMode?: "gradeName" | "nameOnly";
}) {
  const { t } = useTheme();
  if (kids.length <= 1) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {kids.map((k) => {
        const on = k.id === selectedId;
        const label =
          labelMode === "nameOnly"
            ? k.name
            : [k.name, k.grade].filter(Boolean).join(" · ");
        return (
          <Pressable
            key={k.id}
            onPress={() => onSelect(k.id)}
            style={[
              styles.kid,
              { borderColor: on ? "transparent" : t.line2, backgroundColor: on ? t.acc : t.panel },
            ]}
          >
            <View
              style={[
                styles.kv,
                { backgroundColor: on ? "rgba(255,255,255,0.25)" : t.panel2 },
              ]}
            >
              <Text style={[styles.kvText, { color: on ? t.onAcc : t.accText }]}>
                {k.name?.[0] ?? "?"}
              </Text>
            </View>
            <Text style={[styles.kidText, { color: on ? t.onAcc : t.mut }]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // .kid-switch { display:flex; gap:8; margin:2px 0 14px; }
  scroll: { marginTop: 2, marginBottom: 14 },
  row: { gap: 8, paddingRight: 4 },
  // .kid { padding:8px 14px 8px 9px; border-radius:999; border:1px; }
  kid: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 9,
    paddingRight: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  kidText: { fontSize: 13, fontFamily: font.bold },
  // .kid .kv { width:24; height:24; border-radius:12; }
  kv: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  kvText: { fontSize: 11, fontFamily: font.extrabold },
});
