import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { font } from "../../styles/app-styles";
import { useTheme } from "../../theme/ThemeProvider";
import { AlertCircleIcon } from "./Icons";

// 시안 .m-err 오류 색: light #A93636 / dark #E58A8A (핸드오프 CSS 값)
const ERR_LIGHT = "#A93636";
const ERR_DARK = "#E58A8A";

interface ErrorStateProps {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

/**
 * API/네트워크 오류 공통 표시.
 * EmptyState(데이터 없음)와 구분되는 UI.
 */
export function ErrorState({
  title = "불러오지 못했어요",
  description = "네트워크 연결을 확인한 뒤 다시 시도해 주세요.",
  retryLabel = "다시 시도",
  onRetry,
}: ErrorStateProps) {
  const { t, mode } = useTheme();
  const errColor = mode === "dark" ? ERR_DARK : ERR_LIGHT;
  return (
    <View style={styles.wrap}>
      <View style={[styles.icon, { backgroundColor: mode === "dark" ? "rgba(229,138,138,0.1)" : "rgba(194,65,65,0.09)" }]}>
        <AlertCircleIcon color={errColor} size={24} />
      </View>
      <Text style={[styles.title, { color: t.fg }]}>{title}</Text>
      <Text style={[styles.desc, { color: t.mut }]}>{description}</Text>
      {onRetry ? (
        <Pressable
          style={[styles.cta, { backgroundColor: t.acc }]}
          onPress={onRetry}
        >
          <Text style={[styles.ctaText, { color: t.onAcc }]}>{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: { fontSize: 15, fontFamily: font.bold, textAlign: "center" },
  desc: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 7,
    maxWidth: 280,
  },
  cta: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  ctaText: { fontSize: 13.5, fontFamily: font.bold },
});
