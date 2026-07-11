import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  card,
  ctaBar as ctaBarS,
  font,
  lrow,
  scroll as scrollS,
  status as statusS,
} from "../../styles/app-styles";
import { CheckIcon, MyIcon } from "../../components/ui/Icons";
import { SubHead } from "../../components/ui/SubHead";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { ANALYTICS_EVENTS, trackEvent } from "../../lib/analytics";
import { apiFetch } from "../../lib/api";
import { skipJourneyRedirect } from "../../lib/journey-redirect";
import {
  type JourneySnapshot,
  type StudentJourneyStage,
} from "../../lib/student-journey";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

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
  const nubBorder = type === "now" ? { borderWidth: 2, borderColor: t.acc } : {};

  return (
    <View style={styles.stepv}>
      <View style={styles.rail}>
        <View style={[statusS.stepvNub, nubBorder, { backgroundColor: nubBg }]}>
          {type === "done" ? (
            <CheckIcon color={nubColor} size={13} />
          ) : (
            <Text style={[styles.nubText, { color: nubColor }]}>{content}</Text>
          )}
        </View>
        {showLine && (
          <View style={[statusS.stepvLine, { backgroundColor: lineActive ? t.acc : t.line2 }]} />
        )}
      </View>
      <View style={[statusS.stepvTx, muted && styles.txMuted]}>
        <Text style={[statusS.stepvTxB, { color: muted ? t.mut2 : t.fg }]}>{label}</Text>
        {sub && <Text style={[statusS.stepvTxP, { color: t.mut }]}>{sub}</Text>}
      </View>
    </View>
  );
}

function stepForStage(stage: StudentJourneyStage, step: 1 | 2 | 3 | 4): "done" | "now" | "wait" {
  if (stage === "ACTIVE" || stage === "FIRST_LESSON_PENDING") return "done";
  if (stage === "ONBOARDED") return step === 1 ? "now" : "wait";
  if (stage === "WAITING") {
    if (step === 1) return "done";
    if (step === 2) return "now";
    return "wait";
  }
  if (stage === "ASSIGNED") {
    if (step <= 2) return "done";
    if (step === 3) return "now";
    return "wait";
  }
  if (stage === "MATCHING" || stage === "MATCH_PENDING_ACCEPT") {
    if (step <= 2) return "done";
    if (step === 3) return "now";
    return "wait";
  }
  return "wait";
}

export default function ConsultStatus() {
  const { t } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [journey, setJourney] = useState<JourneySnapshot | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const res = await apiFetch<JourneySnapshot>("/api/mobile/me/journey");
      setJourney(res);
    } catch {
      setJourney(null);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.journeyStatusViewed);
    trackEvent(ANALYTICS_EVENTS.consultationStatusViewClicked);
    void load();
  }, [load]);

  if (loading && !journey && !error) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
        <View style={styles.center}>
          <ActivityIndicator color={t.acc} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !journey) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
        <SubHead title="상담 진행 상태" />
        <ErrorState
          title="상태를 불러오지 못했어요"
          onRetry={() => void load()}
        />
      </SafeAreaView>
    );
  }

  const managerName = journey.consultation?.managerName;

  async function goHome() {
    if (journey) {
      await skipJourneyRedirect(journey.stage);
    }
    router.replace("/(tabs)/" as Parameters<typeof router.replace>[0]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.flex}>
        <ScrollView
          contentContainerStyle={[scrollS, styles.scrollContent]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={t.mut2} colors={[t.acc]} />
          }
        >
          <SubHead title="상담 진행 상태" />

          <View style={[card, styles.timelineCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
            <View style={styles.stepsV}>
              <StepV
                type={stepForStage(journey.stage, 1)}
                showLine
                lineActive={journey.stage !== "ONBOARDED"}
                label="상담 신청 접수"
                sub={journey.consultation ? "완료" : "신청 전"}
              />
              <StepV
                type={stepForStage(journey.stage, 2)}
                content={2}
                showLine
                lineActive={
                  journey.stage === "ASSIGNED" ||
                  journey.stage === "MATCHING" ||
                  journey.stage === "FIRST_LESSON_PENDING" ||
                  journey.stage === "ACTIVE"
                }
                label="매니저 배정·전화 상담"
                sub={managerName ? `${managerName} 담당` : "평균 1일 내 연락"}
              />
              <StepV
                type={stepForStage(journey.stage, 3)}
                content={3}
                showLine
                lineActive={
                  journey.stage === "ACTIVE" || journey.stage === "FIRST_LESSON_PENDING"
                }
                label="선생님 추천·매칭"
                sub={
                  journey.stage === "ACTIVE" || journey.stage === "FIRST_LESSON_PENDING"
                    ? "매칭 완료"
                    : "상담 후 진행"
                }
                muted={
                  journey.stage !== "ACTIVE" &&
                  journey.stage !== "MATCHING" &&
                  journey.stage !== "FIRST_LESSON_PENDING"
                }
              />
              <StepV
                type={stepForStage(journey.stage, 4)}
                content={4}
                label="방문 확정"
                sub={
                  journey.stage === "ACTIVE" || journey.stage === "FIRST_LESSON_PENDING"
                    ? "확정 완료"
                    : "확정 시 알림으로 안내"
                }
                muted={
                  journey.stage !== "ACTIVE" &&
                  journey.stage !== "FIRST_LESSON_PENDING"
                }
              />
            </View>
          </View>

          {managerName && (
            <View style={[card, styles.managerCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
              <View style={[lrow.wrap, styles.managerRow]}>
                <View style={[styles.managerAv, { backgroundColor: t.panel2 }]}>
                  <MyIcon color={t.accText} size={20} />
                </View>
                <View style={lrow.g}>
                  <Text style={[lrow.gb, { color: t.fg }]}>{managerName} 매니저</Text>
                  <Text style={[lrow.gp, { color: t.mut }]}>담당 매니저 · 평일 10–19시</Text>
                </View>
              </View>
            </View>
          )}

          {journey.stage === "ONBOARDED" && (
            <EmptyState
              title="아직 상담 신청이 없어요"
              description="무료 상담을 신청하면 매니저가 연락드려요."
              ctaLabel="상담 신청하기"
              onCta={() => router.push("/consult")}
            />
          )}
        </ScrollView>

        <View style={[ctaBarS.wrap, { borderTopColor: t.line, backgroundColor: t.bg }]}>
          {journey.stage === "ACTIVE" ? (
            <Pressable
              style={[ctaBarS.btn, styles.ctaBtnShadow, { backgroundColor: t.acc, shadowColor: t.acc }]}
              onPress={goHome}
            >
              <Text style={[styles.ctaBtnText, { color: t.onAcc }]}>학습 홈으로</Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                style={[ctaBarS.btn, styles.ctaBtnShadow, { backgroundColor: t.acc, shadowColor: t.acc }]}
                onPress={goHome}
              >
                <Text style={[styles.ctaBtnText, { color: t.onAcc }]}>홈으로</Text>
              </Pressable>
              {journey.stage === "MATCHING" && (
                <Pressable style={styles.altBtn} onPress={() => router.push("/consult/match")}>
                  <Text style={[styles.altText, { color: t.accText }]}>추천 선생님 보기</Text>
                </Pressable>
              )}
              {journey.stage === "ONBOARDED" && (
                <Pressable style={styles.altBtn} onPress={() => router.push("/consult")}>
                  <Text style={[styles.altText, { color: t.accText }]}>상담 신청하기</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: { paddingBottom: 8 },

  // .card { padding:16 16 4; margin-bottom:14 }
  timelineCard: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 4,
    marginBottom: 14,
  },
  // .card { padding:0 } with .up row inside
  managerCard: { marginBottom: 14, overflow: "hidden" },
  managerRow: { paddingVertical: 14 },
  // .up .fi { width:38; height:38; border-radius:11 }
  managerAv: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  stepsV: { width: "100%", flexDirection: "column", marginTop: 4 },
  stepv: { flexDirection: "row", gap: 13 },
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
  altBtn: { paddingVertical: 12, alignItems: "center" },
  altText: { fontSize: 13, fontFamily: font.bold },
});
