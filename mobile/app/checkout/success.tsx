import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import {
  ctaBar as ctaBarS,
  font,
  status as statusS,
} from "../../styles/app-styles";
import { apiFetch } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";

interface MeData {
  student: { name: string };
  subscription: {
    planLabel: string;
    periodEnd: string | null;
  } | null;
  display: { parentName: string };
}

interface MatchesData {
  teachers: Array<{ name: string }>;
}

function MetaLine({ label, value, divider }: { label: string; value: string; divider?: boolean }) {
  const { t } = useTheme();
  return (
    <View style={[statusS.metaLn, divider && { borderTopWidth: 1, borderTopColor: t.line }]}>
      <Text style={[styles.metaLabel, { color: t.mut }]}>{label}</Text>
      <Text style={[styles.metaValue, { color: t.fg }]}>{value}</Text>
    </View>
  );
}

export default function CheckoutSuccess() {
  const { t } = useTheme();
  const router = useRouter();
  const [me, setMe] = useState<MeData | null>(null);
  const [matches, setMatches] = useState<MatchesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<MeData>("/api/mobile/me"),
      apiFetch<MatchesData>("/api/mobile/matches"),
    ])
      .then(([m, mt]) => {
        setMe(m);
        setMatches(mt);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const teacherLine =
    matches && matches.teachers.length > 0
      ? matches.teachers.length === 1
        ? matches.teachers[0].name
        : `${matches.teachers[0].name} 외 ${matches.teachers.length - 1}명`
      : "배정 예정";

  const nextBilling = me?.subscription?.periodEnd
    ? new Date(me.subscription.periodEnd).toLocaleDateString("ko-KR")
    : "안내 예정";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.flex}>
        <View style={statusS.wrap}>
          <View style={[statusS.emblem, styles.emblemSolid, { backgroundColor: t.acc, shadowColor: t.acc }]}>
            <Text style={{ color: t.onAcc, fontSize: 36, fontFamily: font.bold }}>✓</Text>
          </View>

          <Text style={[statusS.h2, { color: t.fg }]}>
            수업 준비가{"\n"}모두 끝났어요
          </Text>

          <Text style={[statusS.p, { color: t.mut }]}>
            이제 {me?.student.name ?? "학생"}의 학습 여정이 시작됩니다.{"\n"}
            첫 수업 일정은 선생님이 곧 안내드려요.
          </Text>

          {loading ? (
            <ActivityIndicator color={t.acc} style={{ marginTop: 16 }} />
          ) : (
            <View style={[statusS.metaCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
              <MetaLine label="플랜" value={me?.subscription?.planLabel ?? "플랜 확인 중"} />
              <MetaLine label="담당 선생님" value={teacherLine} divider />
              <MetaLine label="다음 결제일" value={nextBilling} divider />
            </View>
          )}
        </View>

        <View style={[ctaBarS.wrap, { borderTopColor: t.line, backgroundColor: t.bg }]}>
          <Pressable
            style={[ctaBarS.btn, styles.ctaBtnShadow, { backgroundColor: t.acc, shadowColor: t.acc }]}
            onPress={() => router.replace("/(tabs)/" as Parameters<typeof router.replace>[0])}
          >
            <Text style={[styles.ctaBtnText, { color: t.onAcc }]}>수업 시작하기</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  emblemSolid: {
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 34,
    shadowOpacity: 0.34,
    elevation: 12,
  },
  metaLabel: { fontSize: 13, flex: 1 },
  metaValue: { fontSize: 13, fontFamily: font.bold },
  ctaBtnShadow: {
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    shadowOpacity: 0.28,
    elevation: 8,
  },
  ctaBtnText: { fontFamily: font.extrabold, fontSize: 16, textAlign: "center" },
});
