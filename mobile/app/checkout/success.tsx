import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  ctaBar as ctaBarS,
  font,
  status as statusS,
} from "../../styles/app-styles";
import { useTheme } from "../../theme/ThemeProvider";

// ─── .status .meta-card .ln ───────────────────────────────────────────────────
// .status .meta-card { width:100%; border:1px; border-radius:16; padding:16; shadow-sm; }
// .status .meta-card .ln { flex-row; align:center; font-size:13; padding:6 0; }
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.flex}>
        {/* .status flex-col align:center justify:center padding:0 32 gap:20 */}
        <View style={statusS.wrap}>
          {/* .emblem.solid bg:acc color:on-acc shadow:0 16 34 acc/.34 */}
          <View style={[statusS.emblem, styles.emblemSolid, { backgroundColor: t.acc, shadowColor: t.acc }]}>
            <Text style={{ color: t.onAcc, fontSize: 36, fontFamily: font.bold }}>✓</Text>
          </View>

          {/* h2 font-size:23 font-weight:800 letter-spacing:-.03em line-height:1.3 */}
          <Text style={[statusS.h2, { color: t.fg }]}>
            수업 준비가{"\n"}모두 끝났어요
          </Text>

          {/* p font-size:14 line-height:1.6 */}
          <Text style={[statusS.p, { color: t.mut }]}>
            이제 지우의 학습 여정이 시작됩니다.{"\n"}첫 수업 일정은 선생님이 곧 안내드려요.
          </Text>

          {/* .meta-card width:100% border:1px border-radius:16 padding:16 */}
          <View style={[statusS.metaCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
            <MetaLine label="플랜" value="주 2회 · 수학·영어" />
            <MetaLine label="담당 선생님" value="Teacher Noah 외 1명" divider />
            <MetaLine label="다음 결제일" value="2026. 7. 1." divider />
          </View>
        </View>

        {/* .cta-bar */}
        <View style={[ctaBarS.wrap, { borderTopColor: t.line, backgroundColor: t.bg }]}>
          <Pressable
            style={[ctaBarS.btn, styles.ctaBtnShadow, { backgroundColor: t.acc, shadowColor: t.acc }]}
            onPress={() => router.replace("/(tabs)/")}
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

  // .meta-card .ln label/value
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
