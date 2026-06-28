import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  card,
  ctaBar as ctaBarS,
  font,
  lrow as lrowS,
  plan as planS,
  scroll as scrollS,
  sectT as sectTS,
  shadowMd,
} from "../styles/app-styles";
import { SubHead } from "../components/ui/SubHead";
import { useTheme } from "../theme/ThemeProvider";

// ─── .plan-now 현재 플랜 카드 ─────────────────────────────────────────────────
// .plan-now { padding:20; border-radius:22; gradient(acc→acc-press); shadow:0 12 26 acc/.30; }
// .plan-now .k { font-size:11.5; font-weight:700; letter-spacing:.08em; uppercase; opacity:.85; }
// .plan-now .nm { font-size:24; font-weight:800; letter-spacing:-.025em; margin-top:8; }
// .plan-now .pr { font-size:14; opacity:.92; margin-top:4; tabular-nums; }
// .plan-now .nx { margin-top:16; padding-top:14; border-top:1px rgba(255,255,255,.22); flex-row; font-size:13; }
function PlanNow() {
  const { t } = useTheme();
  return (
    <View style={[planS.now, styles.planNowShadow, { backgroundColor: t.acc, shadowColor: t.acc }]}>
      <Text style={[planS.nowK, { color: t.onAcc }]}>현재 플랜</Text>
      <Text style={[planS.nowNm, { color: t.onAcc }]}>주 2회 플랜</Text>
      <Text style={[planS.nowPr as any, { color: t.onAcc }]}>740,000원 / 월 · 수학·영어</Text>
      <View style={[planS.nowNx]}>
        <Text style={[styles.nxLabel, { color: t.onAcc }]}>다음 결제일</Text>
        <Text style={[styles.nxValue, { color: t.onAcc }]}>2026. 10. 1.</Text>
      </View>
    </View>
  );
}

const FEATURES = [
  "과목별 주 2회 수업 (240분)",
  "학습 진도·과제 관리",
  "월간 학습 리포트",
  "AI 질답 토큰 + 강사 첨삭",
];

const PAYMENTS = [
  { label: "9월 수업료", date: "2026. 9. 1. · 신한카드 ****1234", amount: "740,000원" },
  { label: "8월 수업료", date: "2026. 8. 1. · 신한카드 ****1234", amount: "740,000원" },
];

export default function BillingScreen() {
  const { t } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.flex}>
        <ScrollView contentContainerStyle={[scrollS, styles.content]} showsVerticalScrollIndicator={false}>
          <SubHead title="구독·결제" />

          <PlanNow />

          {/* .sect-t 플랜에 포함 */}
          <Text style={[sectTS, styles.sectT, { color: t.fg }]}>플랜에 포함</Text>

          <View style={[card, styles.featCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
            {FEATURES.map((feat, i) => (
              <View key={feat} style={[styles.featRow, i > 0 && { marginTop: 11 }]}>
                <Text style={[styles.featCheck, { color: t.accText }]}>✓</Text>
                <Text style={[styles.featText, { color: t.fg }]}>{feat}</Text>
              </View>
            ))}
          </View>

          {/* .sect-t 결제 내역 */}
          <Text style={[sectTS, styles.sectT, { color: t.fg }]}>결제 내역</Text>

          <View style={[card, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
            {PAYMENTS.map((p, i) => (
              <View key={p.label} style={[lrowS.wrap, i > 0 && { borderTopWidth: 1, borderTopColor: t.line }]}>
                <View style={lrowS.g}>
                  <Text style={[lrowS.gb, { color: t.fg }]}>{p.label}</Text>
                  <Text style={[lrowS.gp, { color: t.mut }]}>{p.date}</Text>
                </View>
                <Text style={[styles.amount, { color: t.fg }]}>{p.amount}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 6 }} />
        </ScrollView>

        {/* .cta-bar — "플랜 변경 · 결제수단 관리" (panel bg, line-2 border) */}
        <View style={[ctaBarS.wrap, { borderTopColor: t.line, backgroundColor: t.bg }]}>
          <Pressable style={[ctaBarS.btn, { backgroundColor: t.panel, borderColor: t.line2, borderWidth: 1 }]}>
            <Text style={[styles.ctaBtnText, { color: t.fg }]}>플랜 변경 · 결제수단 관리</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingBottom: 6 },

  // .plan-now shadow:0 12 26 acc/.30
  planNowShadow: {
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 26,
    shadowOpacity: 0.30,
    elevation: 10,
  },

  // .plan-now .nx
  nxLabel: { fontSize: 13, opacity: 0.85, flex: 1 },
  nxValue: { fontSize: 13, fontFamily: font.bold, opacity: 0.92 },

  sectT: { fontSize: 14 },

  // features card padding:14 16 flex-col gap:11
  featCard: { paddingVertical: 14, paddingHorizontal: 16 },
  featRow: { flexDirection: "row", gap: 10, alignItems: "baseline" },
  featCheck: { fontFamily: font.extrabold, fontSize: 13.5 },
  featText: { fontSize: 13.5, flex: 1 },

  // payment amount
  amount: { fontFamily: font.bold, fontSize: 13.5, fontVariant: ["tabular-nums"] as any },

  ctaBtnText: { fontFamily: font.bold, fontSize: 16, textAlign: "center" },
});
