import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { CheckIcon } from "../components/ui/Icons";
import { SubHead } from "../components/ui/SubHead";
import { apiFetch } from "../lib/api";
import { useTheme } from "../theme/ThemeProvider";
import { accTint } from "../theme/tokens";

interface MeData {
  student: { name: string };
  subscription: {
    plan: string;
    status: string;
    periodEnd: string;
  } | null;
}

const PLAN_FEATURES: Record<string, string[]> = {
  "주1회": ["주 1회 1:1 맞춤 과외", "AI 질문 토큰 30개", "매니저 1:1 관리", "월간 학습 리포트"],
  "주2회": ["주 2회 1:1 맞춤 과외", "AI 질문 토큰 60개", "매니저 1:1 관리", "월간 학습 리포트", "우선 매칭"],
};

const DEFAULT_FEATURES = [
  "1:1 맞춤 과외",
  "AI 질문 토큰",
  "매니저 1:1 관리",
  "월간 학습 리포트",
];

export default function SubscriptionScreen() {
  const { t } = useTheme();
  const [data, setData] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<MeData>("/api/mobile/me")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const features =
    data?.subscription?.plan
      ? PLAN_FEATURES[data.subscription.plan] ?? DEFAULT_FEATURES
      : [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.headWrap}>
        <SubHead title="구독 관리" />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={t.acc} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {data?.subscription ? (
            <>
              <View style={[styles.activeCard, { backgroundColor: t.acc }]}>
                <Text style={styles.activeLabel}>현재 플랜</Text>
                <Text style={styles.activePlan}>{data.subscription.plan}</Text>
                <Text style={styles.activeStatus}>
                  {data.subscription.status === "ACTIVE" ? "구독 중" : data.subscription.status}
                  {" · "}
                  {new Date(data.subscription.periodEnd).toLocaleDateString("ko-KR")} 만료
                </Text>
              </View>

              {features.length > 0 && (
                <View style={[styles.featuresCard, { backgroundColor: t.panel, borderColor: t.line }]}>
                  <Text style={[styles.featuresTitle, { color: t.mut }]}>포함 혜택</Text>
                  {features.map((f) => (
                    <View key={f} style={styles.featureRow}>
                      <View style={[styles.checkCircle, { backgroundColor: accTint(t, 0.12) }]}>
                        <CheckIcon color={t.accText} size={14} />
                      </View>
                      <Text style={[styles.featureText, { color: t.fg }]}>{f}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <>
              <View style={[styles.noSubCard, { backgroundColor: t.panel, borderColor: t.line }]}>
                <Text style={[styles.noSubTitle, { color: t.fg }]}>구독 없음</Text>
                <Text style={[styles.noSubDesc, { color: t.mut }]}>
                  무료 상담 신청 후 매니저가 맞춤 플랜을 안내드려요.
                </Text>
              </View>

              <View style={[styles.planCard, { borderColor: t.line }]}>
                <View style={[styles.planHeader, { backgroundColor: t.acc }]}>
                  <Text style={styles.planName}>주 1회</Text>
                  <Text style={styles.planPrice}>380,000원/월</Text>
                </View>
                <View style={[styles.planBody, { backgroundColor: t.panel }]}>
                  {PLAN_FEATURES["주1회"].map((f) => (
                    <View key={f} style={styles.featureRow}>
                      <View style={[styles.checkCircle, { backgroundColor: accTint(t, 0.12) }]}>
                        <CheckIcon color={t.accText} size={14} />
                      </View>
                      <Text style={[styles.featureText, { color: t.fg }]}>{f}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={[styles.planCard, { borderColor: t.acc }]}>
                <View style={[styles.planHeader, { backgroundColor: t.acc }]}>
                  <Text style={styles.planName}>주 2회</Text>
                  <Text style={styles.planPrice}>740,000원/월</Text>
                </View>
                <View style={[styles.planBody, { backgroundColor: t.panel }]}>
                  {PLAN_FEATURES["주2회"].map((f) => (
                    <View key={f} style={styles.featureRow}>
                      <View style={[styles.checkCircle, { backgroundColor: accTint(t, 0.12) }]}>
                        <CheckIcon color={t.accText} size={14} />
                      </View>
                      <Text style={[styles.featureText, { color: t.fg }]}>{f}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={[styles.ctaNote, { backgroundColor: accTint(t, 0.08), borderColor: accTint(t, 0.15) }]}>
                <Text style={[styles.ctaNoteText, { color: t.accText }]}>
                  결제는 매니저 상담 후 진행됩니다.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headWrap: { paddingHorizontal: 20, paddingTop: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 12, paddingTop: 4 },
  activeCard: { borderRadius: 16, padding: 20 },
  activeLabel: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)", marginBottom: 4 },
  activePlan: { fontSize: 26, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  activeStatus: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 6 },
  featuresCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  featuresTitle: { fontSize: 12, fontWeight: "700", marginBottom: 12 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: { fontSize: 14.5, fontWeight: "500" },
  noSubCard: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center" },
  noSubTitle: { fontSize: 18, fontWeight: "800", marginBottom: 6 },
  noSubDesc: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  planCard: { borderRadius: 16, borderWidth: 1.5, overflow: "hidden" },
  planHeader: { padding: 16 },
  planName: { fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.85)" },
  planPrice: { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 2 },
  planBody: { padding: 16 },
  ctaNote: { borderRadius: 12, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 16 },
  ctaNoteText: { fontSize: 13.5, fontWeight: "600", textAlign: "center" },
});
