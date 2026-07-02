import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  card,
  checkout as coS,
  ctaBar as ctaBarS,
  font,
  scroll as scrollS,
  sectT as sectTS,
  shadowSm,
} from "../styles/app-styles";
import { SubHead } from "../components/ui/SubHead";
import { apiFetch } from "../lib/api";
import { useTheme } from "../theme/ThemeProvider";

// ─── 주문 내역 라인 (.co-line / .co-line.total) ────────────────────────────────
// .co-line { flex-row; align:center; padding:9 0; font-size:13.5; }
// .co-line + .co-line { border-top:1px line; }
// .co-line span { color:mut; } .co-line b { margin-left:auto; font-weight:700; tabular-nums; }
// .co-line.total { padding-top:13; margin-top:4; border-top:1.5px line-2; font-size:15; }
// .co-line.total span { color:fg; font-weight:700; } .co-line.total b { font-size:18; font-weight:800; color:acc-text; }
function CoLine({
  label,
  value,
  total,
  divider,
}: {
  label: string;
  value: string;
  total?: boolean;
  divider?: boolean;
}) {
  const { t } = useTheme();
  return (
    <View
      style={[
        coS.line,
        total ? [coS.lineTotal, styles.totalBorder, { borderTopColor: t.line2 }]
               : divider ? [styles.lineDivider, { borderTopColor: t.line }]
               : null,
      ]}
    >
      <Text style={[
        styles.lineLabel,
        { color: total ? t.fg : t.mut },
        total && { fontFamily: font.bold },
      ]}>
        {label}
      </Text>
      <Text style={[
        styles.lineValue,
        { color: total ? t.accText : t.fg },
        total ? coS.lineTotalB : styles.lineValueNormal,
      ]}>
        {value}
      </Text>
    </View>
  );
}

export default function Checkout() {
  const { t } = useTheme();
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function completePayment() {
    if (paying) return;
    setPaying(true);
    setError(null);
    try {
      await apiFetch<{ ok: boolean }>("/api/mobile/payments/complete", {
        method: "POST",
        body: JSON.stringify({
          orderId: `mobile-${Date.now()}`,
          amount: 740000,
          plan: "8-1",
        }),
      });
      router.replace("/checkout/success");
    } catch {
      setError("결제 완료 처리에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.flex}>
        <ScrollView
          contentContainerStyle={[scrollS, styles.scrollContent]}
          showsVerticalScrollIndicator={false}
        >
          <SubHead title="결제" />

          {/* .sect-t 주문 내역 */}
          <Text style={[sectTS, styles.sectT, { color: t.fg }]}>주문 내역</Text>

          {/* .card .co-sum padding:16 */}
          <View style={[card, coS.sum, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
            <CoLine label="주 2회 플랜 · 수학·영어" value="740,000원" />
            <CoLine label="첫 달 등록비" value="면제" divider />
            <CoLine label="월 결제 금액" value="740,000원" total />
          </View>

          {/* .sect-t 결제 수단 */}
          <Text style={[sectTS, styles.sectT, { color: t.fg }]}>결제 수단</Text>

          {/* .card .pay-method flex-row align:center gap:12 padding:14 16 */}
          <View style={[card, coS.payMethod, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
            {/* .pay-method .ic width:38 height:26 border-radius:6 */}
            <View style={[coS.payIc, { backgroundColor: t.panel2 }]}>
              <Text style={{ color: t.mut, fontSize: 12 }}>💳</Text>
            </View>
            <View style={styles.payInfo}>
              <Text style={[coS.payB, { color: t.fg }]}>신한카드 ****1234</Text>
              <Text style={[coS.payP, { color: t.mut }]}>매월 1일 자동 결제</Text>
            </View>
            <Text style={[styles.chev, { color: t.mut2 }]}>›</Text>
          </View>

          {/* 보안 안내 card padding:13 15 */}
          <View style={[card, styles.secureCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
            <Text style={{ color: t.mut2, fontSize: 13 }}>🔒</Text>
            <Text style={[styles.secureText, { color: t.mut }]}>
              결제 정보는 안전하게 암호화됩니다. 언제든 해지할 수 있고, 해지 시 다음 결제일부터 청구되지 않습니다.
            </Text>
          </View>

          <View style={{ height: 6 }} />
        </ScrollView>

        {/* .cta-bar */}
        <View style={[ctaBarS.wrap, { borderTopColor: t.line, backgroundColor: t.bg }]}>
          {error ? (
            <Text style={[styles.errorText, { color: t.accText }]}>{error}</Text>
          ) : null}
          <Pressable
            disabled={paying}
            style={[
              ctaBarS.btn,
              styles.ctaBtnShadow,
              { backgroundColor: t.acc, shadowColor: t.acc },
              paying && styles.disabledBtn,
            ]}
            onPress={() => void completePayment()}
          >
            <Text style={[styles.ctaBtnText, { color: t.onAcc }]}>
              {paying ? "결제 처리 중…" : "740,000원 결제하기"}
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

  // .sect-t font-size:14 font-weight:700 letter-spacing:-.02em margin:20 2 11
  sectT: { fontSize: 14 },

  // .co-line border separator
  lineDivider: { borderTopWidth: 1 },
  // .co-line.total border:1.5px
  totalBorder: { borderTopWidth: 1.5, marginTop: 4 },

  // .co-line span / .co-line b
  lineLabel: { fontSize: 13.5 },
  lineValue: { marginLeft: "auto", fontVariant: ["tabular-nums"] },
  lineValueNormal: { fontFamily: font.bold, fontSize: 13.5 },

  // .pay-method info
  payInfo: { flex: 1 },
  chev: { fontSize: 20, fontFamily: font.bold },

  // secure note card: padding:13 15 gap:9 align:flex-start
  secureCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    paddingVertical: 13,
    paddingHorizontal: 15,
    marginTop: 11,
  },
  // font-size:11.5 line-height:1.6×11.5=18.4
  secureText: { fontSize: 11.5, lineHeight: 18, flex: 1 },

  ctaBtnShadow: {
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    shadowOpacity: 0.28,
    elevation: 8,
  },
  ctaBtnText: { fontFamily: font.extrabold, fontSize: 16, textAlign: "center" },
  errorText: { marginBottom: 8, fontSize: 12, fontFamily: font.bold, textAlign: "center" },
  disabledBtn: { opacity: 0.65 },
});
