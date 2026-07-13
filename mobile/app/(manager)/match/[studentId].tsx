import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { InfoIcon } from "../../../components/ui/Icons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { SubHead } from "../../../components/ui/SubHead";
import { apiFetch } from "../../../lib/api";
import {
  ctaBar as ctaBarS,
  field as fieldS,
  font,
  scroll as scrollS,
  sectT as sectTS,
} from "../../../styles/app-styles";
import { useTheme } from "../../../theme/ThemeProvider";
import { accTint } from "../../../theme/tokens";
import type {
  ManagerMatchingStudent,
  ManagerMatchingTeacher,
  MatchingResponse,
} from "../_shared";
import { studentLabel } from "../_shared";
import { Bst, MCard } from "../_ui";

export default function MatchDetailScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const { studentId } = useLocalSearchParams<{ studentId: string }>();

  const [student, setStudent] = useState<ManagerMatchingStudent | null>(null);
  const [teachers, setTeachers] = useState<ManagerMatchingTeacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const d = await apiFetch<MatchingResponse>("/api/mobile/manager/matches");
      const s = d.students.find((x) => x.id === studentId) ?? null;
      setStudent(s);
      setTeachers(d.teachers ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const isReassign = !!student?.currentTeacherName;

  async function propose() {
    if (!student || !selectedTeacherId || submitting) return;
    setSubmitting(true);
    try {
      await apiFetch("/api/mobile/manager/matches", {
        method: "POST",
        body: JSON.stringify({
          teacherId: selectedTeacherId,
          studentId: student.id,
          subjects: student.subjects,
          matchReason: reason.trim() || undefined,
          reassign: isReassign,
        }),
      });
      Alert.alert("매칭 제안 완료", "선생님에게 배정되었어요.", [
        { text: "확인", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("매칭 실패", extractError((e as Error).message, "매칭 제안에 실패했어요."));
    } finally {
      setSubmitting(false);
    }
  }

  const selectedTeacher = teachers.find((x) => x.id === selectedTeacherId);
  const canSubmit = !!selectedTeacherId && !submitting;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={scrollS}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <SubHead title={student ? `${student.name} 매칭` : "매칭"} />

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={t.acc} />
            </View>
          ) : error || !student ? (
            <ErrorState title="매칭 정보를 불러오지 못했어요" onRetry={() => void load()} />
          ) : (
            <>
              {/* 학생 요약 */}
              <MCard style={{ padding: 14, paddingHorizontal: 15 }}>
                <View style={styles.head}>
                  <Text style={[styles.headName, { color: t.fg }]}>
                    {studentLabel(student.name, student.grade)} · {student.subjects}
                  </Text>
                  {isReassign ? <Bst tone="acc" label="재매칭" /> : <Bst tone="mut" label="미매칭" />}
                </View>
                <Text style={[styles.headBody, { color: t.mut }]}>
                  {student.consultationNote?.trim() || "상담 메모 없음"}
                  {student.currentTeacherName ? ` · 현재 ${student.currentTeacherName}` : ""}
                </Text>
              </MCard>

              <Text style={[sectTS, { color: t.fg }]}>추천 선생님</Text>
              {teachers.map((tc, i) => {
                const on = tc.id === selectedTeacherId;
                return (
                  <Pressable key={tc.id} onPress={() => setSelectedTeacherId(tc.id)}>
                    <MCard
                      style={{
                        padding: 14,
                        paddingHorizontal: 15,
                        marginTop: i === 0 ? 0 : 9,
                        borderColor: on ? t.acc : t.line,
                      }}
                    >
                      <View style={styles.head}>
                        <Text style={[styles.tName, { color: t.fg }]}>{tc.name}</Text>
                        {on ? <Bst tone="acc" label="선택됨" /> : null}
                        <Text style={[styles.tCount, { color: t.mut2 }]}>담당 {tc.activeStudentCount}명</Text>
                      </View>
                      <Text style={[styles.tSub, { color: t.mut }]}>{tc.subjects}</Text>
                    </MCard>
                  </Pressable>
                );
              })}

              {/* 매칭 사유 */}
              <View style={[fieldS.wrap, { marginTop: 16 }]}>
                <Text style={[fieldS.label, { color: t.fg }]}>
                  매칭 사유 <Text style={{ color: t.mut2, fontFamily: font.medium }}>· 학생·학부모에게 전달돼요</Text>
                </Text>
                <TextInput
                  style={[fieldS.inp, styles.area, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg }]}
                  placeholder="예: 기초 개념부터 습관을 잡아야 하는 학생으로, 유사 케이스 지도 경험이 많은 선생님을 추천합니다."
                  placeholderTextColor={t.mut2}
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* 재매칭 안내 배너 */}
              {isReassign ? (
                <View style={[styles.banner, { backgroundColor: accTint(t, 0.08), borderColor: accTint(t, 0.2) }]}>
                  <InfoIcon color={t.accText} size={17} />
                  <Text style={[styles.bannerText, { color: t.accText }]}>
                    재매칭 시 기존 매칭이 종료되고 이력이 남아요.
                  </Text>
                </View>
              ) : null}

              <View style={{ height: 6 }} />
            </>
          )}
        </ScrollView>

        {!loading && student ? (
          <View style={[ctaBarS.wrap, { borderTopColor: t.line, backgroundColor: t.panel }]}>
            <Pressable
              style={[ctaBarS.btn, styles.ctaShadow, { backgroundColor: t.acc, shadowColor: t.acc }, !canSubmit && styles.disabled]}
              onPress={propose}
              disabled={!canSubmit}
            >
              {submitting ? (
                <ActivityIndicator color={t.onAcc} size="small" />
              ) : (
                <Text style={[styles.ctaText, { color: t.onAcc }]}>
                  {selectedTeacher ? `${selectedTeacher.name} 선생님으로 매칭 제안` : "선생님을 선택하세요"}
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </KeyboardAvoidingView>
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
  flex: { flex: 1 },
  center: { paddingVertical: 40, alignItems: "center" },

  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  headName: { fontSize: 14, fontFamily: font.extrabold, flexShrink: 1 },
  headBody: { fontSize: 12.5, marginTop: 7, lineHeight: 19 },

  tName: { fontSize: 14, fontFamily: font.extrabold },
  tCount: { marginLeft: "auto", fontSize: 11.5 },
  tSub: { fontSize: 12.5, marginTop: 7, lineHeight: 19 },

  area: { minHeight: 78, paddingTop: 13 },

  banner: {
    flexDirection: "row",
    gap: 11,
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  bannerText: { flex: 1, fontSize: 12.5, lineHeight: 19, fontFamily: font.semibold },

  ctaShadow: { shadowOffset: { width: 0, height: 10 }, shadowRadius: 24, shadowOpacity: 0.3, elevation: 10 },
  ctaText: { fontFamily: font.extrabold, fontSize: 16, textAlign: "center" },
  disabled: { opacity: 0.5 },
});
