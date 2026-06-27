import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../theme/ThemeProvider";

interface SectionTitleProps {
  label: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionTitle({ label, actionLabel, onAction }: SectionTitleProps) {
  const { t } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: t.fg }]}>{label}</Text>
      {actionLabel && (
        <Pressable onPress={onAction}>
          <Text style={[styles.action, { color: t.accText }]}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 11,
    marginHorizontal: 2,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  action: {
    fontSize: 12.5,
    fontWeight: "600",
  },
});
