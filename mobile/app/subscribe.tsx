import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  ctaBar as ctaBarS,
  font,
  plan as planS,
  scroll as scrollS,
  shadowMd,
} from "../styles/app-styles";
import { SubHead } from "../components/ui/SubHead";
import { useTheme } from "../theme/ThemeProvider";
import { accTint } from "../theme/tokens";
import { API_BASE } from "../lib/api";

type PlanV2 = {
  id: string;
  tier: "middle" | "high";
  title: string;
  subtitle: string;
  monthlyHours: number;
  priceKrw: number;
  listPriceKrw: number;
  discountRate: number | null;
};

// ─── 플랜 카드 ──────────────────────────────────────────────────────────────────
function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: PlanV2;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTheme();
  const priceStr = plan.priceKrw.toLocaleString("ko-KR");
  const listStr = plan.listPriceKrw.toLocaleString("ko-KR");

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
      {plan.discountRate !== null && (
        <View style={[styles.badge, { backgroundColor: t.acc }]}>
          <Text style={[styles.badgeText, { color: t.onAcc }]}>{plan.discountRate}% 할인</Text>
        </View>
      )}

      <View style={styles.row1}>
        <Text style={[planS.pickNm, { color: t.fg }]}>{plan.title}</Text>
        <View style={[planS.pickRadio, styles.radio, { borderColor: selected ? t.acc : t.line2 }]}>
          {selected && <View style={[styles.radioDot, { backgroundColor: t.acc }]} />}
        </View>
      </View>

      <Text style={[planS.pickPr as object, { color: t.fg }]}>
        {priceStr}
        <Text style={[styles.prSmall, { color: t.mut }]}>원 / 월</Text>
      </Text>

      {plan.discountRate !== null && (
        <Text style={[styles.listPrice, { color: t.mut2 }]}>
          정가 {listStr}원
        </Text>
      )}

      <Text style={[planS.pickUnit, { color: t.mut }]}>월 {plan.monthlyHours}시간 · {plan.subtitle}</Text>

      <View style={[planS.pickFl, { borderTopColor: t.line }]}>
        <View style={planS.pickFlItem}>
          <Text style={[styles.featCheck, { color: t.accText }]}>✓</Text>
          <Text style={[styles.featText, { color: t.fg }]}>1:1 맞춤 과외 · 전담 매니저 배정</Text>
        </View>
        <View style={planS.pickFlItem}>
          <Text style={[styles.featCheck, { color: t.accText }]}>✓</Text>
          <Text style={[styles.featText, { color: t.fg }]}>월간 학습 리포트 + AI 질답</Text>
        </View>
        <View style={planS.pickFlItem}>
          <Text style={[styles.featCheck, { color: t.accText }]}>✓</Text>
          <Text style={[styles.featText, { color: t.fg }]}>숙제 관리 · 수시 강사 첨삭</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function Subscribe() {
  const { t } = useTheme();
  const params = useLocalSearchParams<{ studentId?: string; childName?: string }>();
  const studentId = typeof params.studentId === "string" ? params.studentId : undefined;
  const childName = typeof params.childName === "string" ? params.childName : undefined;
  const [plans, setPlans] = useState<PlanV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<"middle" | "high">("high");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/mobile/pricing-plans`)
      .then((r) => r.json())
      .then((data: { plans: PlanV2[] }) => {
        setPlans(data.plans);
        // 기본 선택: 고등 주 2회 2시간
        const def = data.plans.find((p) => p.tier === "high" && p.id.includes("w2h2"));
        if (def) setSelectedId(def.id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const visiblePlans = plans.filter((p) => p.tier === tier);
  const selectedPlan = plans.find((p) => p.id === selectedId);

  function openWebCheckout() {
    if (!selectedId) return;
    let url = `${API_BASE}/checkout?plan=${selectedId}`;
    if (studentId) url += `&studentId=${encodeURIComponent(studentId)}`;
    const who = childName ? `${childName}(자녀 학생)` : "자녀(학생)";
    Alert.alert(
      "웹에서 결제 진행",
      `결제 페이지가 브라우저에서 열려요.\n브라우저에서 ${who} 계정으로 로그인한 뒤 결제해 주세요.`,
      [
        { text: "취소", style: "cancel" },
        { text: "계속", onPress: () => void Linking.openURL(url) },
      ],
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.flex}>
        <ScrollView
          contentContainerStyle={[scrollS, styles.scrollContent]}
          showsVerticalScrollIndicator={false}
        >
          <SubHead title="요금제 안내" />

          <Text style={[styles.desc, { color: t.mut }]}>
            결제는 안전한 웹 페이지에서 진행됩니다. 언제든 변경·해지할 수 있어요.
          </Text>

          {/* 중등 / 고등 토글 */}
          <View style={[styles.tierToggle, { backgroundColor: t.panel2, borderColor: t.line }]}>
            {(["middle", "high"] as const).map((v) => (
              <Pressable
                key={v}
                style={[
                  styles.tierBtn,
                  tier === v && [styles.tierBtnActive, { backgroundColor: t.acc }],
                ]}
                onPress={() => {
                  setTier(v);
                  // 같은 weekly/hours 패턴 유지하며 tier 전환
                  const cur = plans.find((p) => p.id === selectedId);
                  if (cur) {
                    const curSuffix = cur.id.replace(/^(mid|high)-/, "");
                    const match = plans.find((p) => p.tier === v && p.id.endsWith(curSuffix));
                    if (match) setSelectedId(match.id);
                  }
                }}
              >
                <Text style={[
                  styles.tierBtnText,
                  { color: tier === v ? t.onAcc : t.mut },
                ]}>
                  {v === "middle" ? "중학생" : "고등학생"}
                </Text>
              </Pressable>
            ))}
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={t.acc} />
            </View>
          ) : (
            visiblePlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={selectedId === plan.id}
                onSelect={() => setSelectedId(plan.id)}
              />
            ))
          )}

          <View style={[styles.webNote, { backgroundColor: accTint(t, 0.08), borderColor: accTint(t, 0.18) }]}>
            <Text style={[styles.webNoteText, { color: t.accText }]}>
              🔒 결제는 웹 페이지에서 안전하게 진행됩니다
            </Text>
          </View>

          <View style={{ height: 6 }} />
        </ScrollView>

        <View style={[ctaBarS.wrap, { borderTopColor: t.line, backgroundColor: t.bg }]}>
          {selectedPlan && (
            <Text style={[ctaBarS.sub, { color: t.mut }]}>
              선택:{" "}
              <Text style={[styles.ctaAccent, { color: t.accText }]}>
                {selectedPlan.title} · {selectedPlan.priceKrw.toLocaleString("ko-KR")}원/월
              </Text>
            </Text>
          )}
          <Pressable
            style={[
              ctaBarS.btn,
              styles.ctaBtnShadow,
              { backgroundColor: selectedId ? t.acc : t.line2, shadowColor: t.acc },
            ]}
            onPress={openWebCheckout}
            disabled={!selectedId}
          >
            <Text style={[styles.ctaBtnText, { color: selectedId ? t.onAcc : t.mut }]}>
              웹에서 안전하게 결제하기
            </Text>
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

  desc: { fontSize: 13, lineHeight: 21, marginHorizontal: 2, marginBottom: 18 },

  tierToggle: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginBottom: 16,
    gap: 3,
  },
  tierBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: "center",
  },
  tierBtnActive: {},
  tierBtnText: { fontSize: 13.5, fontFamily: font.bold },

  center: { paddingVertical: 48, alignItems: "center" },

  pickSel: {
    ...shadowMd,
    shadowOpacity: 0.16,
  },

  badge: {
    position: "absolute",
    top: -11,
    left: 18,
    paddingVertical: 4,
    paddingHorizontal: 11,
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontFamily: font.extrabold },

  row1: { flexDirection: "row", alignItems: "center", gap: 10 },
  radio: { marginLeft: "auto", alignItems: "center", justifyContent: "center" },
  radioDot: { width: 11, height: 11, borderRadius: 5.5 },

  prSmall: { fontSize: 13, fontFamily: font.semibold },
  listPrice: { fontSize: 11.5, marginTop: 2, textDecorationLine: "line-through" },

  featCheck: { fontFamily: font.extrabold, fontSize: 12.5 },
  featText: { fontSize: 12.5, flex: 1 },

  webNote: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 4,
    alignItems: "center",
  },
  webNoteText: { fontSize: 12.5, fontFamily: font.semibold },

  ctaAccent: { fontFamily: font.bold },
  ctaBtnShadow: {
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    shadowOpacity: 0.28,
    elevation: 8,
  },
  ctaBtnText: { fontFamily: font.extrabold, fontSize: 16, textAlign: "center" },
});
