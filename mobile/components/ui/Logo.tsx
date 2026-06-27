import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../theme/ThemeProvider";

interface LogoProps {
  size?: number;
  onAcc?: boolean;
}

export function Logo({ size = 30, onAcc = false }: LogoProps) {
  const { t } = useTheme();
  const color = onAcc ? t.onAcc : t.fg;
  const dotColor = onAcc ? t.onAcc : t.accText;

  return (
    <View style={styles.row}>
      <Text style={[styles.text, { fontSize: size, color }]}>Concord</Text>
      <View
        style={[
          styles.dot,
          {
            width: size * 0.16,
            height: size * 0.16,
            borderRadius: (size * 0.16) / 2,
            backgroundColor: dotColor,
            marginLeft: size * 0.04,
            marginBottom: size * 0.04,
          },
        ]}
      />
    </View>
  );
}

export function AppIcon({ size = 84 }: { size?: number }) {
  const { t } = useTheme();
  return (
    <View
      style={[
        styles.icon,
        {
          width: size,
          height: size,
          borderRadius: size * 0.285,
          backgroundColor: t.acc,
          shadowColor: t.acc,
          shadowOffset: { width: 0, height: size * 0.19 },
          shadowOpacity: 0.36,
          shadowRadius: size * 0.2,
        },
      ]}
    >
      <Text style={[styles.iconText, { fontSize: size * 0.52, color: t.onAcc }]}>C</Text>
      <View
        style={{
          width: size * 0.17 * 0.16,
          height: size * 0.17 * 0.16,
          borderRadius: 999,
          backgroundColor: t.onAcc,
          marginLeft: size * 0.04 * 0.5,
          marginBottom: size * 0.1,
          opacity: 1,
          minWidth: 5,
          minHeight: 5,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  text: {
    fontWeight: "800",
    letterSpacing: -1.5,
  },
  dot: {},
  icon: {
    alignItems: "center",
    justifyContent: "flex-end",
    flexDirection: "row",
    paddingBottom: 8,
    paddingRight: 12,
  },
  iconText: {
    fontWeight: "800",
    letterSpacing: -2,
  },
});
