import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { UserIcon } from "../../components/ui/Icons";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { SubHead } from "../../components/ui/SubHead";
import { apiFetch } from "../../lib/api";
import { font, scroll as scrollS } from "../../styles/app-styles";
import { useTheme } from "../../theme/ThemeProvider";
import type { PendingTeacher, TeacherApprovalResponse } from "./_shared";
import { Bst, MCard } from "./_ui";

export default function ApprovalScreen() {
  const { t } = useTheme();
  const [teachers, setTeachers] = useState<PendingTeacher[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const d = await apiFetch<TeacherApprovalResponse>("/api/mobile/manager/teacher-approval");
      setTeachers(d.pendingTeachers ?? []);
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

  async function decide(teacher: PendingTeacher, approve: boolean) {
    if (busyId) return;
    setBusyId(teacher.id);
    try {
      await apiFetch("/api/mobile/manager/teacher-approval", {
        method: "POST",
        body: JSON.stringify({ teacherId: teacher.id, approve }),
      });
      await load();
    } catch (e) {
      Alert.alert(approve ? "승인 실패" : "반려 실패", extractError((e as Error).message, "처리에 실패했어요."));
    } finally {
      setBusyId(null);
    }
  }

  function confirmReject(teacher: PendingTeacher) {
    Alert.alert("지원자 반려", `${teacher.name} 지원서를 반려합니다. 계정이 비활성화돼요.`, [
      { text: "닫기", style: "cancel" },
      { text: "반려", style: "destructive", onPress: () => void decide(teacher, false) },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={scrollS} showsVerticalScrollIndicator={false}>
        <SubHead title="선생님 승인" />

        {loading && !teachers ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.acc} />
          </View>
        ) : error ? (
          <ErrorState title="승인 대기 목록을 불러오지 못했어요" onRetry={() => void load()} />
        ) : (teachers?.length ?? 0) === 0 ? (
          <EmptyState title="승인 대기 중인 지원자가 없어요" description="새 지원서가 접수되면 여기에 표시돼요." />
        ) : (
          (teachers ?? []).map((tc, i) => (
            <MCard key={tc.id} style={{ padding: 16, marginTop: i === 0 ? 0 : 12 }}>
              <View style={styles.row}>
                <View style={[styles.av, { backgroundColor: t.panel2 }]}>
                  <UserIcon color={t.accText} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: t.fg }]}>
                    {[tc.name, tc.subjects].filter(Boolean).join(" · ")}
                  </Text>
                  <Text style={[styles.sub, { color: t.mut }]}>
                    {tc.email ?? tc.phone ?? "연락처 없음"} · 검토 대기
                  </Text>
                </View>
                <Bst tone="warn" label="대기" />
              </View>
              <View style={styles.acts}>
                <Pressable
                  style={[styles.actPri, { backgroundColor: t.acc }]}
                  onPress={() => decide(tc, true)}
                  disabled={busyId === tc.id}
                >
                  {busyId === tc.id ? (
                    <ActivityIndicator color={t.onAcc} size="small" />
                  ) : (
                    <Text style={[styles.actPriText, { color: t.onAcc }]}>승인</Text>
                  )}
                </Pressable>
                <Pressable
                  style={[styles.actWarn, { borderColor: t.line }]}
                  onPress={() => confirmReject(tc)}
                  disabled={busyId === tc.id}
                >
                  <Text style={[styles.actWarnText, { color: t.mut }]}>반려</Text>
                </Pressable>
              </View>
            </MCard>
          ))
        )}
        <View style={{ height: 6 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  av: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 15, fontFamily: font.extrabold },
  sub: { fontSize: 12, marginTop: 2 },
  acts: { flexDirection: "row", gap: 8, marginTop: 14 },
  actPri: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  actPriText: { fontSize: 12, fontFamily: font.bold },
  actWarn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  actWarnText: { fontSize: 12, fontFamily: font.bold },
});
