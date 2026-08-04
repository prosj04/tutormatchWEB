import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { apiFetch } from "../../lib/api";
import { appbar as appbarS, font, scroll as scrollS, sectT as sectTS } from "../../styles/app-styles";
import { useTheme } from "../../theme/ThemeProvider";
import type { MonitoringResponse, MonitoringStudentRow } from "../../components/manager/shared";
import { badgeToneFromClassName, studentLabel } from "../../components/manager/shared";
import { Bst, MCard } from "../../components/manager/ManagerUi";

export default function MonitoringScreen() {
  const { t } = useTheme();
  const [data, setData] = useState<MonitoringResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const d = await apiFetch<MonitoringResponse>("/api/mobile/manager/monitoring");
      setData(d);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  function writeCareLog(s: MonitoringStudentRow) {
    // Alert.prompt는 iOS 전용 — Android는 미지원 안내 (전용 입력 화면은 디자인 시안 대기)
    if (typeof Alert.prompt !== "function") {
      Alert.alert("안내", "이 기기에서는 케어로그 입력이 지원되지 않아요.");
      return;
    }
    Alert.prompt(
      "케어로그 작성",
      `${s.name} 학생에 대한 케어 메모를 입력하세요.`,
      [
        { text: "닫기", style: "cancel" },
        {
          text: "저장",
          onPress: (note?: string) => {
            const trimmed = (note ?? "").trim();
            if (!trimmed) {
              Alert.alert("메모 필요", "케어 메모를 입력해주세요.");
              return;
            }
            void saveCareLog(s.id, trimmed);
          },
        },
      ],
      "plain-text",
    );
  }

  async function saveCareLog(studentId: string, note: string) {
    if (busyId) return;
    setBusyId(studentId);
    try {
      await apiFetch("/api/mobile/manager/care-logs", {
        method: "POST",
        body: JSON.stringify({ studentId, type: "CONSULT", note, visibleToStudent: false }),
      });
      Alert.alert("저장 완료", "케어로그가 기록되었어요.");
    } catch {
      Alert.alert("저장 실패", "케어로그 저장에 실패했어요.");
    } finally {
      setBusyId(null);
    }
  }

  // 구독 일시정지: 7/14/21/28/35일 프리셋 선택 → 재개 예정일 ISO 계산
  function pauseSubscription(s: MonitoringStudentRow) {
    const sub = s.subscription;
    if (!sub) return;
    const presets = [7, 14, 21, 28, 35];
    Alert.alert(
      "구독 일시정지",
      `${s.name} 학생의 구독을 며칠간 일시정지할까요?`,
      [
        { text: "취소", style: "cancel" },
        ...presets.map((days) => ({
          text: `${days}일`,
          onPress: () => {
            const until = new Date();
            until.setDate(until.getDate() + days);
            void submitSubscription(sub.id, s.id, {
              action: "PAUSE",
              until: until.toISOString(),
            });
          },
        })),
      ],
    );
  }

  function resumeSubscription(s: MonitoringStudentRow) {
    const sub = s.subscription;
    if (!sub) return;
    Alert.alert(
      "구독 재개",
      `${s.name} 학생의 구독을 재개할까요? 다음 결제일이 정지 기간만큼 연장됩니다.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "재개",
          onPress: () =>
            void submitSubscription(sub.id, s.id, { action: "RESUME" }),
        },
      ],
    );
  }

  async function submitSubscription(
    subscriptionId: string,
    studentId: string,
    payload: { action: "PAUSE"; until: string } | { action: "RESUME" },
  ) {
    if (busyId) return;
    setBusyId(studentId);
    try {
      await apiFetch(
        `/api/mobile/manager/subscriptions/${encodeURIComponent(subscriptionId)}/pause`,
        { method: "POST", body: JSON.stringify(payload) },
      );
      Alert.alert(
        "완료",
        payload.action === "PAUSE" ? "구독을 일시정지했어요." : "구독을 재개했어요.",
      );
      await load();
    } catch {
      Alert.alert("실패", "구독 처리에 실패했어요.");
    } finally {
      setBusyId(null);
    }
  }

  const overview = data?.overview;
  const atRisk = (data?.students ?? []).filter((s) => s.completionRate < 70 || s.unansweredStale > 0);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={scrollS} showsVerticalScrollIndicator={false}>
        <View style={appbarS.wrap}>
          <Text style={[styles.title, { color: t.fg }]}>모니터링</Text>
        </View>

        {loading && !data ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.acc} />
          </View>
        ) : error ? (
          <ErrorState title="모니터링 정보를 불러오지 못했어요" onRetry={() => void load()} />
        ) : (
          <>
            {/* KPI 타일 */}
            <View style={styles.tiles}>
              <Tile n={String(overview?.studentCount ?? 0)} label="담당 학생" />
              <Tile n={String(overview?.avgCompletionRate ?? 0)} unit="%" label="이번 주 평균 진행률" />
              <Tile n={String(overview?.atRiskCount ?? 0)} label="진행률 저조 (70% 미만)" alert />
              <Tile n={String(overview?.staleQuestions ?? 0)} label="미답변 질문 (1일+)" alert={((overview?.staleQuestions ?? 0) > 0)} />
            </View>

            <Text style={[sectTS, { color: t.fg }]}>주의 필요</Text>
            {atRisk.length === 0 ? (
              <EmptyState title="주의가 필요한 학생이 없어요" description="담당 학생들의 진행 상황이 양호해요." />
            ) : (
              atRisk.map((s, i) => (
                <MCard key={s.id} style={{ padding: 15, paddingHorizontal: 16, marginTop: i === 0 ? 0 : 11 }}>
                  <View style={styles.cardHead}>
                    <Text style={[styles.cardName, { color: t.fg }]}>{studentLabel(s.name, s.grade)}</Text>
                    <Bst tone={badgeToneFromClassName(s.statusClassName)} label={s.statusLabel} />
                    {s.subscription?.status === "PAUSED" ? <Bst tone="mut" label="일시정지" /> : null}
                  </View>
                  <Text style={[styles.cardBody, { color: t.mut }]}>
                    담당 {s.teacherName} · 이번 주 진행률 {s.completionRate}%
                    {s.unansweredStale > 0 ? ` · 미답변 질문 ${s.unansweredStale}건` : ""}
                  </Text>
                  <View style={styles.actsSm}>
                    <Pressable
                      style={[styles.actPri, { backgroundColor: t.acc }]}
                      onPress={() => writeCareLog(s)}
                      disabled={busyId === s.id}
                    >
                      {busyId === s.id ? (
                        <ActivityIndicator color={t.onAcc} size="small" />
                      ) : (
                        <Text style={[styles.actPriText, { color: t.onAcc }]}>케어로그 작성</Text>
                      )}
                    </Pressable>
                    {s.subscription ? (
                      <Pressable
                        style={[styles.actSec, { borderColor: t.line }]}
                        onPress={() =>
                          s.subscription?.status === "PAUSED"
                            ? resumeSubscription(s)
                            : pauseSubscription(s)
                        }
                        disabled={busyId === s.id}
                      >
                        <Text style={[styles.actSecText, { color: t.fg }]}>
                          {s.subscription.status === "PAUSED" ? "재개" : "일시정지"}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </MCard>
              ))
            )}

            <Text style={[sectTS, { color: t.fg }]}>전체 담당 학생</Text>
            {(data?.students ?? []).length === 0 ? (
              <EmptyState title="담당 학생이 없어요" description="매칭이 완료되면 담당 학생이 여기에 표시돼요." />
            ) : (
              <MCard>
                {(data?.students ?? []).map((s, i) => (
                  <View
                    key={s.id}
                    style={[styles.lrow, i > 0 && { borderTopWidth: 1, borderTopColor: t.line }]}
                  >
                    <View style={styles.lrowG}>
                      <Text style={[styles.lrowName, { color: t.fg }]}>{studentLabel(s.name, s.grade)}</Text>
                      <Text style={[styles.lrowSub, { color: t.mut }]}>
                        담당 {s.teacherName} · 진행률 {s.completionRate}%
                      </Text>
                    </View>
                    {s.subscription?.status === "PAUSED" ? <Bst tone="mut" label="일시정지" /> : null}
                    <Bst tone={badgeToneFromClassName(s.statusClassName)} label={s.statusLabel} />
                    {s.subscription ? (
                      <Pressable
                        style={[styles.lrowAct, { borderColor: t.line }]}
                        onPress={() =>
                          s.subscription?.status === "PAUSED"
                            ? resumeSubscription(s)
                            : pauseSubscription(s)
                        }
                        disabled={busyId === s.id}
                      >
                        <Text style={[styles.lrowActText, { color: t.fg }]}>
                          {s.subscription.status === "PAUSED" ? "재개" : "정지"}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </MCard>
            )}
          </>
        )}
        <View style={{ height: 6 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Tile({ n, unit, label, alert }: { n: string; unit?: string; label: string; alert?: boolean }) {
  const { t, mode } = useTheme();
  // .tile-s.alert b{ color:#c2483b } / dark #ff8a7d
  const numColor = alert ? (mode === "dark" ? "#ff8a7d" : "#c2483b") : t.fg;
  return (
    <View style={[styles.tile, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
      <Text style={[styles.tileN, { color: numColor }]}>
        {n}
        {unit ? <Text style={[styles.tileUnit, { color: t.accText }]}>{unit}</Text> : null}
      </Text>
      <Text style={[styles.tileLabel, { color: t.mut }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { paddingVertical: 40, alignItems: "center" },
  title: { fontSize: 22, fontFamily: font.extrabold, letterSpacing: -0.66 },

  // .tiles grid 2col gap:9
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  // .tile-s padding:14 15
  tile: {
    width: "48%",
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    shadowOpacity: 0.06,
    elevation: 3,
  },
  tileN: { fontSize: 22, fontFamily: font.extrabold, letterSpacing: -0.44, fontVariant: ["tabular-nums"] },
  tileUnit: { fontSize: 12, fontFamily: font.regular },
  tileLabel: { fontSize: 11.5, marginTop: 3 },

  cardHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardName: { fontSize: 14, fontFamily: font.extrabold },
  cardBody: { fontSize: 12.5, marginTop: 7, lineHeight: 19 },

  actsSm: { flexDirection: "row", gap: 7, marginTop: 12 },
  actPri: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  actPriText: { fontSize: 12, fontFamily: font.bold },
  actSec: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actSecText: { fontSize: 12, fontFamily: font.bold },
  lrowAct: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1 },
  lrowActText: { fontSize: 11.5, fontFamily: font.bold },

  // .lrow
  lrow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, paddingHorizontal: 16 },
  lrowG: { flex: 1, minWidth: 0 },
  lrowName: { fontSize: 14, fontFamily: font.bold, letterSpacing: -0.14 },
  lrowSub: { fontSize: 12.5, marginTop: 2 },
});
