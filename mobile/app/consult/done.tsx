import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ctaBar as ctaBarS, font, status as statusS } from "../../styles/app-styles";
import { getAccessToken } from "../../lib/auth";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

// ─── .stepv 세로 타임라인 항목 ────────────────────────────────────────────────
// .stepv { flex-row; gap:13; }
// .stepv .rail { flex-col; align-items:center; flex:0; }
// .stepv .nub { width:26; height:26; border-radius:50%; font-size:12; font-weight:800; }
// .stepv .nub.done { bg:acc; color:on-acc; }
// .stepv .nub.now  { bg:acc/15 tint; color:acc-text; box-shadow:inset 0 0 0 2px acc; }
// .stepv .nub.wait { bg:panel-2; color:mut-2; }
// .stepv .line { width:2; flex:1; bg:line-2; min-height:18; }
// .stepv.on .line  { bg:acc; }
// .stepv .tx { padding-bottom:18; }
function StepV({
  type,
  lineActive,
  showLine,
  label,
  sub,
  muted,
  content,
}: {
  type: "done" | "now" | "wait";
  lineActive?: boolean;
  showLine?: boolean;
  label: string;
  sub?: string;
  muted?: boolean;
  content?: string | number;
}) {
  const { t } = useTheme();

  const nubBg =
    type === "done" ? t.acc
    : type === "now" ? accTint(t, 0.15)
    : t.panel2;
  const nubColor =
    type === "done" ? t.onAcc
    : type === "now" ? t.accText
    : t.mut2;
  const nubBorder =
    type === "now" ? { borderWidth: 2, borderColor: t.acc } : {};

  return (
    <View style={styles.stepv}>
      {/* .rail */}
      <View style={styles.rail}>
        <View style={[statusS.stepvNub, nubBorder, { backgroundColor: nubBg }]}>
          {type === "done" ? (
            <Text style={{ color: nubColor, fontSize: 14, fontFamily: font.bold }}>✓</Text>
          ) : (
            <Text style={[styles.nubText, { color: nubColor }]}>{content}</Text>
          )}
        </View>
        {showLine && (
          <View style={[statusS.stepvLine, { backgroundColor: lineActive ? t.acc : t.line2 }]} />
        )}
      </View>
      {/* .tx */}
      <View style={[statusS.stepvTx, muted && styles.txMuted]}>
        <Text style={[statusS.stepvTxB, { color: muted ? t.mut2 : t.fg }]}>{label}</Text>
        {sub && <Text style={[statusS.stepvTxP, { color: t.mut }]}>{sub}</Text>}
      </View>
    </View>
  );
}

export default function ConsultDone() {
  const { t } = useTheme();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    getAccessToken().then((token) => setLoggedIn(!!token));
  }, []);

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
            상담 신청이{"\n"}접수되었어요
          </Text>

          {/* p font-size:14 line-height:1.6 */}
          <Text style={[statusS.p, { color: t.mut }]}>
            담당 매니저가 신청 내용을 검토하고{"\n"}평균 1일 내 연락드립니다.
          </Text>

          {/* .steps-v 세로 타임라인 */}
          <View style={styles.stepsV}>
            <StepV
              type="done"
              showLine
              lineActive
              label="상담 신청 접수"
              sub="완료"
            />
            <StepV
              type="now"
              content={2}
              showLine
              lineActive={false}
              label="매니저 배정·전화 상담"
              sub="평균 1일 내 연락"
            />
            <StepV
              type="wait"
              content={3}
              label="선생님 추천·매칭"
              sub="상담 후 진행"
              muted
            />
          </View>
        </View>

        {/* .cta-bar — 비로그인이면 계정 연결을 1순위로 유도 */}
        <View style={[ctaBarS.wrap, { borderTopColor: t.line, backgroundColor: t.bg }]}>
          {loggedIn === false ? (
            <>
              <Text style={[ctaBarS.sub, { color: t.mut }]}>
                계정을 만들면 매칭 진행 상태를 알림으로 받아볼 수 있어요
              </Text>
              <Pressable
                style={[ctaBarS.btn, styles.ctaBtnShadow, { backgroundColor: t.acc, shadowColor: t.acc }]}
                onPress={() => router.replace("/(auth)/signup")}
              >
                <Text style={[styles.ctaBtnText, { color: t.onAcc }]}>계정 만들고 상태 받기</Text>
              </Pressable>
              <Pressable style={styles.altBtn} onPress={() => router.replace("/(auth)/login")}>
                <Text style={[styles.altText, { color: t.mut }]}>
                  이미 계정이 있나요? <Text style={{ color: t.fg, fontFamily: font.bold }}>로그인</Text>
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={[ctaBarS.btn, styles.ctaBtnShadow, { backgroundColor: t.acc, shadowColor: t.acc }]}
              onPress={() => router.replace("/(tabs)/")}
            >
              <Text style={[styles.ctaBtnText, { color: t.onAcc }]}>홈으로</Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },

  // .emblem.solid shadow:0 16 34 acc/.34
  emblemSolid: {
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 34,
    shadowOpacity: 0.34,
    elevation: 12,
  },

  // .steps-v width:100% flex-col gap:0 margin-top:4
  stepsV: { width: "100%", flexDirection: "column", marginTop: 4 },

  // .stepv flex-row gap:13
  stepv: { flexDirection: "row", gap: 13 },

  // .stepv .rail flex-col align:center
  rail: { flexDirection: "column", alignItems: "center" },

  nubText: { fontSize: 12, fontFamily: font.extrabold },

  txMuted: { opacity: 0.7 },

  ctaBtnShadow: {
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    shadowOpacity: 0.28,
    elevation: 8,
  },
  ctaBtnText: { fontFamily: font.extrabold, fontSize: 16, textAlign: "center" },

  altBtn: { paddingVertical: 12, alignItems: "center", marginTop: 4 },
  altText: { fontSize: 13, fontFamily: font.semibold },
});
