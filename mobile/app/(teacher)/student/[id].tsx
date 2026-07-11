import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  card as cardS,
  field as fieldS,
  font,
  lrow as lrowS,
  scroll as scrollS,
  sectT as sectTS,
} from "../../../styles/app-styles";
import { ErrorState } from "../../../components/ui/ErrorState";
import { SubHead } from "../../../components/ui/SubHead";
import { AlertCircleIcon, InfoCircleIcon } from "../../../components/teacher/TeacherIcons";
import { apiFetch } from "../../../lib/api";
import { useTheme } from "../../../theme/ThemeProvider";

interface TeacherStudent {
  id: string;
  name: string;
  grade: string;
  subjects: string;
  firstLessonAt: string | null;
}

interface Lesson {
  id: string;
  startAt: string;
  subject: string;
  durationMin: number;
  status: string;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const DEFAULT_TIME = "19:00";

/** 첫 수업일 후보: 오늘 이후 평일(월~금) 6개. */
function buildSlots(): { date: string; label: string }[] {
  const slots: { date: string; label: string }[] = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() + 1);
  while (slots.length < 6) {
    const dow = cursor.getDay();
    if (dow >= 1 && dow <= 5) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, "0");
      const d = String(cursor.getDate()).padStart(2, "0");
      slots.push({
        date: `${y}-${m}-${d}`,
        label: `${WEEKDAYS[dow]} ${cursor.getMonth() + 1}/${cursor.getDate()} ${DEFAULT_TIME}`,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return slots;
}

function formatLessonDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]}) ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTheme();
  const router = useRouter();

  const [student, setStudent] = useState<TeacherStudent | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const slots = buildSlots();

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const [studentsRes, lessonsRes] = await Promise.all([
        apiFetch<{ students: TeacherStudent[] }>("/api/mobile/teacher/students"),
        apiFetch<{ lessons: Lesson[] }>(`/api/mobile/teacher/lessons?studentId=${id}`),
      ]);
      setStudent(studentsRes.students.find((s) => s.id === id) ?? null);
      setLessons(lessonsRes.lessons);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const confirmFirstLesson = async () => {
    if (!id || !selectedSlot) return;
    setSaving(true);
    try {
      await apiFetch(`/api/mobile/teacher/students/${id}/first-lesson`, {
        method: "POST",
        body: JSON.stringify({ date: selectedSlot, time: DEFAULT_TIME }),
      });
      setSelectedSlot(null);
      await load();
    } catch (e) {
      Alert.alert("설정 실패", e instanceof Error ? e.message.replace(/^API \d+: /, "") : "다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  const cancelLesson = (lesson: Lesson) => {
    Alert.alert("수업 취소", `${formatLessonDate(lesson.startAt)} 수업을 취소할까요?`, [
      { text: "닫기", style: "cancel" },
      {
        text: "취소하기",
        style: "destructive",
        onPress: async () => {
          try {
            await apiFetch(`/api/mobile/teacher/lessons/${lesson.id}/cancel`, { method: "PATCH" });
            await load();
          } catch (e) {
            Alert.alert("취소 실패", e instanceof Error ? e.message.replace(/^API \d+: /, "") : "다시 시도해 주세요.");
          }
        },
      },
    ]);
  };

  const hasFirstLesson = !!student?.firstLessonAt;
  const scheduled = lessons.filter((l) => l.status === "SCHEDULED");

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={scrollS} showsVerticalScrollIndicator={false}>
        <SubHead
          title={student ? `${student.name} · ${student.grade}` : "학생 상세"}
          actionLabel="플랜"
          onAction={() =>
            router.push({ pathname: "/(teacher)/student/plan" as never, params: { id, name: student?.name ?? "" } })
          }
        />

        {loading && !student ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.acc} />
          </View>
        ) : error ? (
          <ErrorState title="학생 정보를 불러오지 못했어요" onRetry={() => void load()} />
        ) : (
          <>
            {!hasFirstLesson && (
              <View style={[styles.banner, { backgroundColor: "rgba(217,119,6,0.1)", borderColor: "rgba(217,119,6,0.25)" }]}>
                <AlertCircleIcon color="#92610a" size={17} />
                <Text style={[styles.bannerText, { color: "#92610a" }]}>
                  <Text style={styles.bannerBold}>첫 수업일이 아직 없어요. </Text>
                  학생·학부모와 조율한 날짜를 지정해 주세요.
                </Text>
              </View>
            )}

            {/* 첫 수업일 설정 (.field .slot-grid) */}
            <View style={fieldS.wrap}>
              <Text style={[fieldS.label, { color: t.fg }]}>첫 수업일 설정</Text>
              <View style={styles.slotGrid}>
                {slots.map((s) => {
                  const on = selectedSlot === s.date;
                  return (
                    <Pressable
                      key={s.date}
                      style={[
                        styles.slot,
                        { backgroundColor: on ? t.acc : t.panel, borderColor: on ? "transparent" : t.line2 },
                      ]}
                      onPress={() => setSelectedSlot(s.date)}
                    >
                      <Text style={[styles.slotText, { color: on ? t.onAcc : t.fg }]}>{s.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <Pressable
              style={[styles.confirmBtn, { backgroundColor: t.acc, opacity: selectedSlot && !saving ? 1 : 0.5 }]}
              disabled={!selectedSlot || saving}
              onPress={() => void confirmFirstLesson()}
            >
              {saving ? (
                <ActivityIndicator color={t.onAcc} size="small" />
              ) : (
                <Text style={[styles.confirmText, { color: t.onAcc }]}>
                  {selectedSlot
                    ? `${slots.find((s) => s.date === selectedSlot)?.label} 확정`
                    : "날짜를 선택하세요"}
                </Text>
              )}
            </Pressable>

            {/* 수업 관리 */}
            <Text style={[sectTS, { color: t.fg }]}>수업 관리</Text>
            {scheduled.length === 0 ? (
              <View style={[cardS, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
                <View style={lrowS.wrap}>
                  <Text style={[lrowS.gp, { color: t.mut }]}>예정된 수업이 없습니다.</Text>
                </View>
              </View>
            ) : (
              <View style={[cardS, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
                {scheduled.map((l, i) => {
                  const d = new Date(l.startAt);
                  return (
                    <View
                      key={l.id}
                      style={[lrowS.wrap, i > 0 && { borderTopWidth: 1, borderTopColor: t.line }]}
                    >
                      <View style={[lrowS.av, { backgroundColor: t.panel2, borderRadius: 10 }]}>
                        <Text style={{ color: t.accText, fontFamily: font.bold, fontSize: 14 }}>
                          {WEEKDAYS[d.getDay()]}
                        </Text>
                      </View>
                      <View style={lrowS.g}>
                        <Text style={[lrowS.gb, { color: t.fg }]}>{l.subject}</Text>
                        <Text style={[lrowS.gp, { color: t.mut }]}>
                          {formatLessonDate(l.startAt)} · {l.durationMin}분
                        </Text>
                      </View>
                      <Pressable onPress={() => cancelLesson(l)}>
                        <Text style={[styles.cancelText, { color: t.mut2 }]}>취소</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={[styles.banner, { backgroundColor: "rgba(0,0,0,0)", borderColor: t.line2, marginTop: 14 }]}>
              <InfoCircleIcon color={t.accText} size={17} />
              <Text style={[styles.bannerText, { color: t.mut }]}>
                취소는 수업 24시간 전까지. 이후엔 매니저에게 요청돼요.
              </Text>
            </View>
          </>
        )}
        <View style={{ height: 6 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { paddingVertical: 60, alignItems: "center" },
  // .slot-grid { grid 3cols; gap:8; }
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  // .slot { padding:11 4; border-radius:12; border:1px; font-size:13; font-weight:600; } → 3열
  slot: {
    width: "31.5%",
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  slotText: { fontSize: 12, fontFamily: font.semibold, textAlign: "center" },
  confirmBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: { fontFamily: font.extrabold, fontSize: 14.5 },
  cancelText: { fontSize: 12, fontFamily: font.bold },
  banner: {
    flexDirection: "row",
    gap: 11,
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  bannerText: { flex: 1, fontSize: 12.5, lineHeight: 19 },
  bannerBold: { fontFamily: font.extrabold },
});
