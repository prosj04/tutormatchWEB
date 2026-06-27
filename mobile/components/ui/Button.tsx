import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from "react-native";

import { useTheme } from "../../theme/ThemeProvider";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "ghost" | "secondary";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = "primary", loading, disabled, style }: ButtonProps) {
  const { t } = useTheme();

  const bg =
    variant === "primary" ? t.acc
    : variant === "secondary" ? t.panel
    : "transparent";

  const color =
    variant === "primary" ? t.onAcc
    : variant === "secondary" ? t.fg
    : t.mut;

  const border =
    variant === "secondary" ? { borderWidth: 1, borderColor: t.line2 }
    : {};

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: pressed ? (variant === "primary" ? t.accPress : bg) : bg },
        border,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        <Text style={[styles.label, { color }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  disabled: {
    opacity: 0.5,
  },
});
