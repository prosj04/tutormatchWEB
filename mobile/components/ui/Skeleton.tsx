import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  type DimensionValue,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";

import { card } from "../../styles/app-styles";
import { useTheme } from "../../theme/ThemeProvider";

/**
 * 로딩 자리표시(스켈레톤) — 시안 .skel 규격.
 * background: panel-2 기반, border-radius:10, shimmer 애니메이션.
 */
export function Skeleton({
  width = "100%",
  height = 13,
  radius = 10,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const { t } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1300,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.55, 1, 0.55],
  });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: t.panel2, opacity },
        style,
      ]}
    />
  );
}

/**
 * 리스트 로딩용 스켈레톤 카드(아바타 + 2줄 텍스트 × N).
 * 시안 공통 상태 화면의 스켈레톤 카드와 동일 구조.
 */
export function SkeletonListCard({ rows = 2 }: { rows?: number }) {
  const { t } = useTheme();
  return (
    <View style={[card, styles.card, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={[styles.row, i > 0 && styles.rowGap]}>
          <Skeleton width={44} height={44} radius={14} />
          <View style={styles.lines}>
            <Skeleton width="70%" height={13} />
            <Skeleton width="45%" height={11} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // .card { padding:16 }
  card: { padding: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowGap: { marginTop: 16 },
  lines: { flex: 1, flexDirection: "column", gap: 8 },
});
