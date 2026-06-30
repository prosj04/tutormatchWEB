import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  card,
  ctaBar as ctaBarS,
  font,
  plan as planS,
  scroll as scrollS,
  sectT as sectTS,
} from "../styles/app-styles";
import { EmptyState } from "../components/ui/EmptyState";
import { SubHead } from "../components/ui/SubHead";
import { apiFetch } from "../lib/api";
import { useTheme } from "../theme/ThemeProvider";
import { accTint } from "../theme/tokens";

type SubData = {
  plan: string;
  planLabel: string;
  status: string;
  periodEnd: string | null;
  nextBilling: string | null;
};

type MeData = {
  student: { name: string };
  subscription: SubData | null;
  enrollmentStatus: string;
};

const PLAN_FEATURES: Record<string, string[]> = {
  "4-1": ["주 1회 수업 (50분)", "학습 진도 관리", "과제 관리", "AI 질답 이용 가능", "수시 강사 첨삭·질답"],
  "8-1": ["주 2회 수업 (50분)", "학습 진도 관리", "과제 관리", "AI 질답 횟수 2배 제공", "수시 강사 첨삭·질답", "복수 과목 선택 가능"],
  "4-2": ["과목별 주 1회 수업 (50분)", "선생님 2명 배정", "학습 진도·과제 관리", "AI 질답 이용 가능"],
  "8-2": ["과목별 주 2회 수업 (50분)", "선생님 2명 배정", "학습 진도·과제 관리", "AI 질답 횟수 2배 제공", "수시 강사 첨삭·질답"],
};

const PLAN_PRICE: Record<string, number> = {
  "4-1": 400_000,
  "8-1": 720_000,
  "4-2": 800_000,
  "8-2": 1_440_000,
};

function formatPrice(n: number): string {
  return n.toLocaleString("ko-KR") + "원";
}

export default function BillingScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mountAt = Date.now();
    apiFetch<MeData>("/api/mobile/me")
      .then((d) => {
        setData(d);
        console.log(`[perf] 구독결제화면 mount→render: ${Date.now() - mountAt}ms`);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sub = data?.subscription ?? null;
  const features = sub ? (PLAN_FEATURES[sub.plan] ?? ["1:1 맞춤 과외", "학습 진도·과제 관리", "AI 질답", "수시 강사 첨삭·질답"]) : [];
  const price = sub ? PLAN_PRICE[sub.plan] : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.flex}>
        <ScrollView contentContainerStyle={[scrollS, styles.content]} showsVerticalScrollIndicator={false}>
          <SubHead title="구독·결제" />

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={t.acc} />
            </View>
          ) : !sub ? (
            <EmptyState
              title="현재 구독 중인 플랜이 없어요"
              description="무료 상담 신청 후 매니저가 맞춤 플랜을 안내드려요."
            />
          ) : (
            <>
              {/* 현재 플랜 카드 */}
              <View style={[planS.now, styles.planNowShadow, { backgroundColor: t.acc, shadowColor: t.acc }]}>
                <Text style={[planS.nowK, { color: t.onAcc }]}>현재 플랜</Text>
                <Text style={[planS.nowNm, { color: t.onAcc }]}>{sub.planLabel}</Text>
                {price != null ? (
                  <Text style={[planS.nowPr as any, { color: t.onAcc }]}>
                    {formatPrice(price)} / 월
                  </Text>
                ) : null}
                {sub.nextBilling ? (
                  <View style={planS.nowNx}>
                    <Text style={[styles.nxLabel, { color: t.onAcc }]}>다음 결제일</Text>
                    <Text style={[styles.nxValue, { color: t.onAcc }]}>
                      {formatPeriodEnd(sub.periodEnd)}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* 포함 혜택 */}
              <Text style={[sectTS, styles.sectT, { color: t.fg }]}>플랜에 포함</Text>
              <View style={[card, styles.featCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
                {features.map((feat, i) => (
                  <View key={feat} style={[styles.featRow, i > 0 && { marginTop: 11 }]}>
                    <Text style={[styles.featCheck, { color: t.accText }]}>✓</Text>
                    <Text style={[styles.featText, { color: t.fg }]}>{feat}</Text>
                  </View>
                ))}
              </View>

              {/* 구독 정보 */}
              <Text style={[sectTS, styles.sectT, { color: t.fg }]}>구독 정보</Text>
              <View style={[card, styles.infoCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
                <InfoRow label="플랜" value={sub.planLabel} t={t} />
                <InfoRow label="상태" value={data?.enrollmentStatus ?? sub.status} t={t} divider />
                {sub.periodEnd ? (
                  <InfoRow label="만료일" value={formatPeriodEnd(sub.periodEnd)} t={t} divider />
                ) : null}
                <View style={[styles.infoNote, { borderTopWidth: 1, borderTopColor: t.line }]}>
                  <Text style={[styles.infoNoteText, { color: t.mut }]}>
                    결제 영수증 및 세부 내역은 담당 매니저에게 문의해 주세요.
                  </Text>
                </View>
              </View>
            </>
          )}

          <View style={{ height: 6 }} />
        </ScrollView>

        <View style={[ctaBarS.wrap, { borderTopColor: t.line, backgroundColor: t.bg }]}>
          <Pressable
            style={[ctaBarS.btn, { backgroundColor: t.panel, borderColor: t.line2, borderWidth: 1 }]}
            onPress={() => router.push("/consult/status" as Parameters<typeof router.push>[0])}
          >
            <Text style={[styles.ctaBtnText, { color: t.fg }]}>플랜 변경 · 상담 신청</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, t, divider }: { label: string; value: string; t: any; divider?: boolean }) {
  return (
    <View style={[styles.infoRow, divider && { borderTopWidth: 1, borderTopColor: t.line }]}>
      <Text style={[styles.infoLabel, { color: t.mut }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: t.fg }]}>{value}</Text>
    </View>
  );
}

function formatPeriodEnd(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingBottom: 6 },
  center: { paddingVertical: 48, alignItems: "center" },

  planNowShadow: {
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 26,
    shadowOpacity: 0.30,
    elevation: 10,
  },
  nxLabel: { fontSize: 13, opacity: 0.85, flex: 1 },
  nxValue: { fontSize: 13, fontFamily: font.bold, opacity: 0.92 },

  sectT: { fontSize: 14 },

  featCard: { paddingVertical: 14, paddingHorizontal: 16 },
  featRow: { flexDirection: "row", gap: 10, alignItems: "baseline" },
  featCheck: { fontFamily: font.extrabold, fontSize: 13.5 },
  featText: { fontSize: 13.5, flex: 1 },

  infoCard: { overflow: "hidden" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 13, paddingHorizontal: 16 },
  infoLabel: { fontSize: 13, fontFamily: font.medium },
  infoValue: { fontSize: 13, fontFamily: font.semibold },
  infoNote: { paddingVertical: 12, paddingHorizontal: 16 },
  infoNoteText: { fontSize: 12, lineHeight: 18 },

  ctaBtnText: { fontFamily: font.bold, fontSize: 16, textAlign: "center" },
});
