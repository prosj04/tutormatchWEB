import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { subHead as subHeadS } from "../../styles/app-styles";
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
  // .sub-head { flex-row; align-items:center; gap:12; padding:6px 2px 16px; }
  row: { ...subHeadS.wrap },
  // .pf-back { width:40; height:40; border-radius:12; border:1px; }
  back: { ...subHeadS.back },
  // .sub-head b { font-size:17; font-weight:800; letter-spacing:-.025em; }
  title: { flex: 1, ...subHeadS.title },
  // .sub-head .act { margin-left:auto; font-size:13; font-weight:600; }
  action: { ...subHeadS.act },
});
