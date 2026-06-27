import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

interface AvatarProps {
  label: string;
  size?: number;
  radius?: number;
  accent?: boolean;
}

export function Avatar({ label, size = 42, radius = 12, accent = false }: AvatarProps) {
  const { t } = useTheme();
  const bg = accent ? accTint(t, 0.14) : t.panel2;
  const color = accent ? t.accText : t.accText;

  return (
    <View
      style={[
        styles.av,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: bg,
        },
      ]}
    >
      <Text style={[styles.label, { color, fontSize: size * 0.33 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  av: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontWeight: "700",
  },
});
