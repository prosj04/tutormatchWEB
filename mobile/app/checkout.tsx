import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  card,
  ctaBar as ctaBarS,
  font,
  scroll as scrollS,
  sectT as sectTS,
  shadowSm,
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

export default function Checkout() {
  const { t } = useTheme();
  const { plan: planParam } = useLocalSearchParams<{ plan?: string }>();
  const [plans, setPlans] = useState<PlanV2[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/mobile/pricing-plans`)
      .then((r) => r.json())
      .then((data: { plans: PlanV2[] }) => setPlans(data.plans))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // If a plan param is provided, show that plan; otherwise show all plans
  const selectedPlan = planParam ? plans.find((p) => p.id === planParam) ?? null : null;
  const displayPlans = selectedPlan ? [selectedPlan] : plans;

  function openWebCheckout(planId: string) {
    void Linking.openURL(`${API_BASE}/checkout?plan=${planId}`);
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
            결제는 안전한 웹 페이지에서 진행됩니다. 아래에서 요금제를 확인하고 웹 결제 페이지로 이동하세요.
          </Text>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={t.acc} />
            </View>
          ) : (
            <>
              {displayPlans.map((plan) => {
                const priceStr = plan.priceKrw.toLocaleString("ko-KR");
                const listStr = plan.listPriceKrw.toLocaleString("ko-KR");
                return (
                  <View
                    key={plan.id}
                    style={[card, styles.planCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}
                  >
                    {plan.discountRate !== null && (
                      <View style={[styles.badge, { backgroundColor: t.acc }]}>
                        <Text style={[styles.badgeText, { color: t.onAcc }]}>{plan.discountRate}% 할인</Text>
                      </View>
                    )}
                    <Text style={[styles.planTitle, { color: t.fg }]}>{plan.title}</Text>
                    <Text style={[styles.planPrice, { color: t.fg }]}>
                      {priceStr}
                      <Text style={[styles.prSmall, { color: t.mut }]}>원 / 월</Text>
                    </Text>
                    {plan.discountRate !== null && (
                      <Text style={[styles.listPrice, { color: t.mut2 }]}>정가 {listStr}원</Text>
                    )}
                    <Text style={[styles.planUnit, { color: t.mut }]}>
                      월 {plan.monthlyHours}시간 · {plan.subtitle}
                    </Text>
                    <Pressable
                      style={[styles.planCta, { backgroundColor: t.acc, shadowColor: t.acc }]}
                      onPress={() => openWebCheckout(plan.id)}
                    >
                      <Text style={[styles.planCtaText, { color: t.onAcc }]}>
                        웹에서 안전하게 결제하기
                      </Text>
                    </Pressable>
                  </View>
                );
              })}

              <View style={[styles.secureCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
                <Text style={{ color: t.mut2, fontSize: 13 }}>🔒</Text>
                <Text style={[styles.secureText, { color: t.mut }]}>
                  결제 정보는 안전하게 암호화됩니다. 언제든 해지할 수 있고, 해지 시 다음 결제일부터 청구되지 않습니다.
                </Text>
              </View>
            </>
          )}

          <View style={{ height: 6 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 6 },

  desc: { fontSize: 13, lineHeight: 21, marginHorizontal: 2, marginBottom: 18 },

  center: { paddingVertical: 48, alignItems: "center" },

  planCard: {
    padding: 18,
    marginBottom: 12,
    position: "relative",
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
  planTitle: { fontSize: 17, fontFamily: font.extrabold, letterSpacing: -0.34 },
  planPrice: {
    fontSize: 24,
    fontFamily: font.extrabold,
    letterSpacing: -0.72,
    marginTop: 10,
  },
  prSmall: { fontSize: 13, fontFamily: font.semibold },
  listPrice: { fontSize: 11.5, marginTop: 2, textDecorationLine: "line-through" },
  planUnit: { fontSize: 12.5, marginTop: 4, marginBottom: 16 },

  planCta: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    shadowOpacity: 0.22,
    elevation: 6,
  },
  planCtaText: { fontFamily: font.extrabold, fontSize: 15 },

  secureCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    paddingVertical: 13,
    paddingHorizontal: 15,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 20,
    ...shadowSm,
  },
  secureText: { fontSize: 11.5, lineHeight: 18, flex: 1 },
});
