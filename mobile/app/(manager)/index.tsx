import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BellIcon } from "../../components/ui/Icons";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { apiFetch } from "../../lib/api";
import {
  appbar as appbarS,
  font,
  iconbtn as iconbtnS,
  scroll as scrollS,
} from "../../styles/app-styles";
import { useTheme } from "../../theme/ThemeProvider";
import type { BookingsResponse, ManagerConsultationBooking } from "./_shared";
import { studentLabel } from "./_shared";
import { Bst, MCard } from "./_ui";

type Tab = "waiting" | "mine";

export default function ConsultScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("waiting");
  const [waiting, setWaiting] = useState<ManagerConsultationBooking[] | null>(null);
  const [mine, setMine] = useState<ManagerConsultationBooking[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [w, m] = await Promise.all([
        apiFetch<BookingsResponse>("/api/mobile/manager/consultations/waiting"),
        apiFetch<BookingsResponse>("/api/mobile/manager/consultations/mine"),
      ]);
      setWaiting(w.bookings ?? []);
      setMine(m.bookings ?? []);
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

  async function act(
    path: string,
    method: "PATCH",
    body: Record<string, unknown> | undefined,
    id: string,
    failMsg: string,
  ) {
    if (busyId) return;
    setBusyId(id);
    try {
      await apiFetch(path, { method, body: body ? JSON.stringify(body) : undefined });
      await load();
    } catch (e) {
      Alert.alert("처리 실패", (e as Error).message.includes("409") || (e as Error).message.includes("403") || (e as Error).message.includes("400")
        ? extractError((e as Error).message, failMsg)
        : failMsg);
    } finally {
      setBusyId(null);
    }
  }

  function handleAssign(b: ManagerConsultationBooking) {
    void act(
      `/api/mobile/manager/consultations/${b.id}/assign`,
      "PATCH",
      undefined,
      b.id,
      "배정에 실패했어요.",
    );
  }

  function handleCancel(b: ManagerConsultationBooking) {
    Alert.alert("상담 취소", "담당 배정을 취소하고 대기 상태로 돌립니다.", [
      { text: "닫기", style: "cancel" },
      {
        text: "취소하기",
        style: "destructive",
        onPress: () =>
          void act(
            `/api/mobile/manager/consultations/${b.id}/cancel`,
            "PATCH",
            undefined,
            b.id,
            "취소에 실패했어요.",
          ),
      },
    ]);
  }

  function handleComplete(b: ManagerConsultationBooking) {
    if (!b.match) return; // 버튼이 disabled 상태 — 방어적 가드
    // Alert.prompt는 iOS 전용 — Android는 미지원 안내 (전용 입력 화면은 디자인 시안 대기)
    if (typeof Alert.prompt !== "function") {
      Alert.alert("안내", "이 기기에서는 메모 입력이 지원되지 않아요.");
      return;
    }
    Alert.prompt(
      "상담 완료 처리",
      "상담 메모를 입력하세요.",
      [
        { text: "닫기", style: "cancel" },
        {
          text: "다음",
          onPress: (note?: string) => {
            const managerNote = (note ?? "").trim();
            if (!managerNote) {
              Alert.alert("메모 필요", "상담 메모를 입력해주세요.");
              return;
            }
            promptNextStep(b, managerNote);
          },
        },
      ],
      "plain-text",
    );
  }

  // E-NEXT-1: 상담 완료 시 다음 단계(MATCHING/HOLD/CLOSED) 선택.
  // 라벨은 웹 완료 모달과 동일 문구(매칭 진행 / 보류 / 종결).
  function promptNextStep(b: ManagerConsultationBooking, managerNote: string) {
    const submit = (nextStep: "MATCHING" | "HOLD" | "CLOSED") =>
      void act(
        `/api/mobile/manager/consultations/${b.id}/complete`,
        "PATCH",
        { managerNote, nextStep },
        b.id,
        "완료 처리에 실패했어요.",
      );
    Alert.alert(
      "다음 단계 선택",
      "상담 이후 진행 방향을 선택하세요.",
      [
        { text: "매칭 진행", onPress: () => submit("MATCHING") },
        { text: "보류", onPress: () => submit("HOLD") },
        { text: "종결", style: "destructive", onPress: () => submit("CLOSED") },
        { text: "닫기", style: "cancel" },
      ],
      { cancelable: true },
    );
  }

  const list = tab === "waiting" ? waiting : mine;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={scrollS} showsVerticalScrollIndicator={false}>
        <View style={appbarS.wrap}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: t.fg }]}>상담</Text>
          </View>
          <Pressable
            style={[iconbtnS, { backgroundColor: t.panel, borderColor: t.line }]}
            onPress={() => router.push("/notifications" as never)}
            accessibilityRole="button"
            accessibilityLabel="알림"
          >
            <BellIcon color={t.fg} size={19} />
          </Pressable>
        </View>

        {/* 대기 / 내 담당 서브탭 */}
        <View style={[styles.subtabs, { backgroundColor: t.panel2, borderColor: t.line }]}>
          {(["waiting", "mine"] as const).map((key) => {
            const on = tab === key;
            const count = key === "waiting" ? waiting?.length : mine?.length;
            return (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                style={[styles.subtabBtn, on && { backgroundColor: t.panel }]}
              >
                <Text style={[styles.subtabText, { color: on ? t.fg : t.mut }]}>
                  {key === "waiting" ? "대기" : "내 담당"} {count ?? 0}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading && !list ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.acc} />
          </View>
        ) : error ? (
          <ErrorState title="상담 목록을 불러오지 못했어요" onRetry={() => void load()} />
        ) : (list?.length ?? 0) === 0 ? (
          <EmptyState
            title={tab === "waiting" ? "대기 중인 상담이 없어요" : "담당 중인 상담이 없어요"}
            description={
              tab === "waiting"
                ? "새 상담이 접수되면 여기에 표시돼요."
                : "대기 탭에서 상담을 배정받으면 여기에 표시돼요."
            }
          />
        ) : (
          (list ?? []).map((b, i) => (
            <MCard key={b.id} style={{ padding: 15, paddingHorizontal: 16, marginTop: i === 0 ? 0 : 11 }}>
              <View style={styles.cardHead}>
                <Text style={[styles.cardName, { color: t.fg }]}>{studentLabel(b.student.name, b.student.grade)}</Text>
                {tab === "waiting" ? (
                  <Bst tone="warn" label="신규" />
                ) : b.visitConfirmedAt ? (
                  <Bst tone="acc" label="방문 확정" />
                ) : b.status === "COMPLETED" ? (
                  <Bst tone="acc" label="완료" />
                ) : (
                  <Bst tone="mut" label="담당" />
                )}
                <Text style={[styles.timeAgo, { color: t.mut2 }]}>
                  {tab === "waiting" ? b.timeAgo ?? "" : b.assignedAgo ?? "내 담당"}
                </Text>
              </View>
              <Text style={[styles.cardBody, { color: t.mut }]}>
                {b.student.subjects}
                {b.note ? ` · "${b.note}"` : ""}
                {b.student.guardianPhone ? ` · 학부모 ${b.student.guardianPhone}` : ""}
              </Text>

              <View style={styles.actsSm}>
                {tab === "waiting" ? (
                  <Pressable
                    style={[styles.actPri, { backgroundColor: t.acc }]}
                    onPress={() => handleAssign(b)}
                    disabled={busyId === b.id}
                  >
                    {busyId === b.id ? (
                      <ActivityIndicator color={t.onAcc} size="small" />
                    ) : (
                      <Text style={[styles.actPriText, { color: t.onAcc }]}>내가 배정받기</Text>
                    )}
                  </Pressable>
                ) : (
                  <>
                    <Pressable
                      style={[
                        styles.actPri,
                        { backgroundColor: t.acc },
                        (b.status !== "COMPLETED" && !b.match) && { opacity: 0.4 },
                      ]}
                      onPress={() => handleComplete(b)}
                      disabled={busyId === b.id || b.status === "COMPLETED" || !b.match}
                    >
                      <Text style={[styles.actPriText, { color: t.onAcc }]}>
                        {b.status === "COMPLETED" ? "완료됨" : "상담 완료"}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.actSec, { backgroundColor: t.panel, borderColor: t.line2 }]}
                      onPress={() => router.push(`/report/${b.id}` as never)}
                    >
                      <Text style={[styles.actSecText, { color: t.fg }]}>리포트</Text>
                    </Pressable>
                    {b.status !== "COMPLETED" ? (
                      <Pressable
                        style={[styles.actWarn, { borderColor: t.line }]}
                        onPress={() => handleCancel(b)}
                        disabled={busyId === b.id}
                      >
                        <Text style={[styles.actWarnText, { color: t.mut }]}>취소</Text>
                      </Pressable>
                    ) : null}
                  </>
                )}
              </View>
              {tab === "mine" && b.status !== "COMPLETED" && !b.match ? (
                <Text style={[styles.helpText, { color: t.mut2 }]}>
                  선생님 배정 후 완료할 수 있어요
                </Text>
              ) : null}
            </MCard>
          ))
        )}
        <View style={{ height: 6 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/** API 오류 메시지 본문(JSON error)만 추출. 실패 시 fallback. */
function extractError(message: string, fallback: string): string {
  const idx = message.indexOf("{");
  if (idx >= 0) {
    try {
      const parsed = JSON.parse(message.slice(idx)) as { error?: string };
      if (parsed.error) return parsed.error;
    } catch {
      /* noop */
    }
  }
  return fallback;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { paddingVertical: 40, alignItems: "center" },
  title: { fontSize: 22, fontFamily: font.extrabold, letterSpacing: -0.66 },

  // .subtabs
  subtabs: {
    flexDirection: "row",
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderRadius: 13,
    marginBottom: 14,
  },
  subtabBtn: { flex: 1, paddingVertical: 9, paddingHorizontal: 6, borderRadius: 10, alignItems: "center" },
  subtabText: { fontSize: 13, fontFamily: font.bold },

  cardHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardName: { fontSize: 14.5, fontFamily: font.extrabold },
  timeAgo: { marginLeft: "auto", fontSize: 11.5 },
  cardBody: { fontSize: 12.5, marginTop: 8, lineHeight: 19 },
  helpText: { fontSize: 11.5, marginTop: 8 },

  // .acts-sm
  actsSm: { flexDirection: "row", gap: 7, marginTop: 12 },
  actPri: { flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  actPriText: { fontSize: 12, fontFamily: font.bold },
  actSec: { flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  actSecText: { fontSize: 12, fontFamily: font.bold },
  actWarn: { flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  actWarnText: { fontSize: 12, fontFamily: font.bold },
});
