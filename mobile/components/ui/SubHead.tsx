import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../theme/ThemeProvider";
import { ChevronLeftIcon } from "./Icons";

interface SubHeadProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  onBack?: () => void;
}

export function SubHead({ title, actionLabel, onAction, onBack }: SubHeadProps) {
  const { t } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.back, { backgroundColor: t.panel, borderColor: t.line }]}
        onPress={onBack ?? (() => router.back())}
      >
        <ChevronLeftIcon color={t.fg} size={19} />
      </Pressable>
      <Text style={[styles.title, { color: t.fg }]}>{title}</Text>
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
    gap: 12,
    paddingTop: 6,
    paddingBottom: 16,
    paddingHorizontal: 2,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  action: {
    fontSize: 13,
    fontWeight: "600",
  },
});
