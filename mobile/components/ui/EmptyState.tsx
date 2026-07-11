import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { font } from "../../styles/app-styles";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

interface EmptyStateProps {
  /** 이모지 문자열 또는 아이콘 세트 노드(예: <ChatIcon />) */
  icon?: string | React.ReactNode;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

/**
 * 빈 값(초기 상태) 공통 표시.
 * 원칙: "아직 없음 + 이유 + 다음 행동(CTA)"을 한 카드로 보여준다.
 */
export function EmptyState({ icon, title, description, ctaLabel, onCta }: EmptyStateProps) {
  const { t } = useTheme();
  return (
    <View style={styles.wrap}>
      {icon != null && (
        <View style={[styles.icon, { backgroundColor: accTint(t, 0.1) }]}>
          {typeof icon === "string" ? (
            <Text style={styles.iconText}>{icon}</Text>
          ) : (
            icon
          )}
        </View>
      )}
      <Text style={[styles.title, { color: t.fg }]}>{title}</Text>
      {description && (
        <Text style={[styles.desc, { color: t.mut }]}>{description}</Text>
      )}
      {ctaLabel && onCta && (
        <Pressable
          style={[styles.cta, { backgroundColor: accTint(t, 0.12) }]}
          onPress={onCta}
        >
          <Text style={[styles.ctaText, { color: t.accText }]}>{ctaLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
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
  iconText: { fontSize: 24 },
  // 시안: b { font-size:15; font-weight:800 }
  title: { fontSize: 15, fontFamily: font.extrabold, textAlign: "center" },
  desc: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 7,
    maxWidth: 280,
  },
  cta: {
    marginTop: 16,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  ctaText: { fontSize: 13.5, fontFamily: font.bold },
});
