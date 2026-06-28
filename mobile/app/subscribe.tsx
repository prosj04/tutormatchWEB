import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  ctaBar as ctaBarS,
  font,
  plan as planS,
  scroll as scrollS,
  shadowMd,
  shadowSm,
} from "../styles/app-styles";
import { SubHead } from "../components/ui/SubHead";
import { useTheme } from "../theme/ThemeProvider";
import { accTint } from "../theme/tokens";

const PLANS = [
  {
    id: "weekly1",
    label: "주 1회",
    price: "380,000",
    unit: "주 1회 · 과목당 120분",
    features: ["주 1회 수업 (120분)", "학습 진도·과제 관리", "AI 질답 토큰 + 강사 첨삭"],
    recommended: false,
  },
  {
    id: "weekly2",
    label: "주 2회",
    price: "740,000",
    unit: "주 2회 · 과목당 240분 · 과목 2개+",
    features: ["과목별 주 2회 수업 (240분)", "과목 2개 이상 · 과목별 선생님", "월간 리포트 + AI 질답 + 첨삭"],
    recommended: true,
  },
] as const;

// ─── 플랜 카드 (.plan-pick / .plan-pick.sel) ──────────────────────────────────
// .plan-pick { border:1.5px solid line-2; border-radius:20; bg:panel; padding:18; margin-bottom:12; shadow-sm; }
// .plan-pick.sel { border-color:acc; shadow:0 0 0 3px acc/.14 + shadow-md; }
// .plan-pick .badge { top:-11; left:18; bg:acc; color:on-acc; font-size:11; font-weight:800; padding:4 11; border-radius:999; }
// .plan-pick .row1 { flex-row; align:center; gap:10; }
// .plan-pick .nm { font-size:17; font-weight:800; letter-spacing:-.02em; }
// .plan-pick .radio { margin-left:auto; width:22; height:22; border-radius:11; border:2px; }
// .plan-pick.sel .radio { border-color:acc; } inner dot: width:11; height:11; border-radius:5.5; bg:acc
// .plan-pick .pr { font-size:24; font-weight:800; letter-spacing:-.03em; margin-top:10; tabular-nums; }
// .plan-pick .pr small { font-size:13; font-weight:600; color:mut; }
// .plan-pick .unit { font-size:12.5; color:mut; margin-top:2; }
// .plan-pick .fl { margin-top:13; padding-top:13; border-top:1px; flex-col; gap:8; }
// .plan-pick .fl div { flex-row; gap:9; align:baseline; font-size:12.5; } ::before "✓" acc-text
function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: (typeof PLANS)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTheme();

  return (
    <Pressable
      style={[
        planS.pick,
        selected
          ? [styles.pickSel, { borderColor: t.acc, shadowColor: t.acc }]
          : { borderColor: t.line2, shadowColor: t.fg, backgroundColor: t.panel },
        !selected && { backgroundColor: t.panel },
      ]}
      onPress={onSelect}
    >
      {/* .badge position:absolute top:-11 left:18 */}
      {plan.recommended && (
        <View style={[styles.badge, { backgroundColor: t.acc }]}>
          <Text style={[styles.badgeText, { color: t.onAcc }]}>추천</Text>
        </View>
      )}

      {/* .row1 flex-row align:center gap:10 */}
      <View style={styles.row1}>
        {/* .nm font-size:17 font-weight:800 letter-spacing:-.02em */}
        <Text style={[planS.pickNm, { color: t.fg }]}>{plan.label}</Text>
        {/* .radio width:22 height:22 border-radius:11 border:2px */}
        <View style={[
          planS.pickRadio,
          styles.radio,
          { borderColor: selected ? t.acc : t.line2 },
        ]}>
          {selected && <View style={[styles.radioDot, { backgroundColor: t.acc }]} />}
        </View>
      </View>

      {/* .pr font-size:24 font-weight:800 letter-spacing:-.03em margin-top:10 tabular-nums */}
      <Text style={[planS.pickPr as any, { color: t.fg }]}>
        {plan.price}
        <Text style={[styles.prSmall, { color: t.mut }]}>원 / 월</Text>
      </Text>

      {/* .unit font-size:12.5 color:mut margin-top:2 */}
      <Text style={[planS.pickUnit, { color: t.mut }]}>{plan.unit}</Text>

      {/* .fl margin-top:13 padding-top:13 border-top:1px flex-col gap:8 */}
      <View style={[planS.pickFl, { borderTopColor: t.line }]}>
        {plan.features.map((feat) => (
          <View key={feat} style={[planS.pickFlItem]}>
            {/* ::before "✓" color:acc-text font-weight:800 */}
            <Text style={[styles.featCheck, { color: t.accText }]}>✓</Text>
            <Text style={[styles.featText, { color: t.fg }]}>{feat}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

export default function Subscribe() {
  const { t } = useTheme();
  const router = useRouter();
  const [selected, setSelected] = useState<string>("weekly2");

  const selectedPlan = PLANS.find((p) => p.id === selected);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.flex}>
        <ScrollView
          contentContainerStyle={[scrollS, styles.scrollContent]}
          showsVerticalScrollIndicator={false}
        >
          <SubHead title="플랜 선택" />

          {/* 설명 font-size:13 color:mut margin:0 2 18 line-height:1.6 */}
          <Text style={[styles.desc, { color: t.mut }]}>
            언제든 변경·해지할 수 있어요. 모든 플랜에 학습 관리·리포트·AI 질답이 포함됩니다.
          </Text>

          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={selected === plan.id}
              onSelect={() => setSelected(plan.id)}
            />
          ))}

          <View style={{ height: 6 }} />
        </ScrollView>

        {/* .cta-bar */}
        <View style={[ctaBarS.wrap, { borderTopColor: t.line, backgroundColor: t.bg }]}>
          {/* sub: "선택: 주 2회 · 740,000원/월" */}
          <Text style={[ctaBarS.sub, { color: t.mut }]}>
            선택:{" "}
            <Text style={[styles.ctaAccent, { color: t.accText }]}>
              {selectedPlan?.label} · {selectedPlan?.price}원/월
            </Text>
          </Text>
          <Pressable
            style={[ctaBarS.btn, styles.ctaBtnShadow, { backgroundColor: t.acc, shadowColor: t.acc }]}
            onPress={() => router.push("/checkout")}
          >
            <Text style={[styles.ctaBtnText, { color: t.onAcc }]}>이 플랜으로 결제</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 6 },

  // 설명 font-size:13 margin:0 2 18 line-height:1.6×13=20.8
  desc: { fontSize: 13, lineHeight: 21, marginHorizontal: 2, marginBottom: 18 },

  // .plan-pick.sel shadow: 0 0 0 3px acc/.14 + shadow-md
  pickSel: {
    backgroundColor: undefined,
    ...shadowMd,
    shadowOpacity: 0.16,
  },

  // .plan-pick .badge position:absolute top:-11 left:18
  badge: {
    position: "absolute",
    top: -11,
    left: 18,
    paddingVertical: 4,
    paddingHorizontal: 11,
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontFamily: font.extrabold },

  // .row1 flex-row align:center gap:10
  row1: { flexDirection: "row", alignItems: "center", gap: 10 },

  // .radio margin-left:auto
  radio: { marginLeft: "auto", alignItems: "center", justifyContent: "center" },
  // selected inner dot width:11 height:11
  radioDot: { width: 11, height: 11, borderRadius: 5.5 },

  // .pr small font-size:13 font-weight:600
  prSmall: { fontSize: 13, fontFamily: font.semibold },

  // feature list check mark
  featCheck: { fontFamily: font.extrabold, fontSize: 12.5 },
  featText: { fontSize: 12.5, flex: 1 },

  ctaAccent: { fontFamily: font.bold },
  ctaBtnShadow: {
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    shadowOpacity: 0.28,
    elevation: 8,
  },
  ctaBtnText: { fontFamily: font.extrabold, fontSize: 16, textAlign: "center" },
});
