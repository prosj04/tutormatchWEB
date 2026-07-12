import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  appbar as appbarS,
  card as cardS,
  font,
  lrow as lrowS,
  scroll as scrollS,
} from "../../styles/app-styles";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { InfoCircleIcon } from "../../components/teacher/TeacherIcons";
import { apiFetch } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

interface TeacherStudent {
  id: string;
  name: string;
  grade: string;
  phone: string | null;
  subjects: string;
  startDate: string | null;
  firstLessonAt: string | null;
}

function formatNext(iso: string | null): string {
  if (!iso) return "첫 수업일 미정";
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (sameDay) return `다음 수업 오늘 ${time}`;
  return `다음 수업 ${d.getMonth() + 1}/${d.getDate()} ${time}`;
}

export default function TeacherStudentsScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const d = await apiFetch<{ students: TeacherStudent[] }>("/api/mobile/teacher/students");
      setStudents(d.students);
    } catch (e) {
      // 승인 대기 강사의 403은 오류가 아니라 잠금 안내로 표시
      if (e instanceof Error && e.message.includes("403") && e.message.includes("승인")) {
        setPending(true);
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={scrollS} showsVerticalScrollIndicator={false}>
        <View style={appbarS.wrap}>
          <Text style={[styles.title, { color: t.fg }]}>담당 학생</Text>
        </View>

        {loading && students.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.acc} />
          </View>
        ) : pending ? (
          <EmptyState
            title="승인 후 이용할 수 있어요"
            description="관리자 승인이 완료되면 학생·질문 기능이 열립니다."
          />
        ) : error ? (
          <ErrorState title="학생 목록을 불러오지 못했어요" onRetry={() => void load()} />
        ) : students.length === 0 ? (
          <EmptyState
            title="아직 담당 학생이 없어요"
            description="새 매칭은 매니저가 배정합니다. 배정되면 여기에 표시돼요."
          />
        ) : (
          <>
            <View style={[cardS, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
              {students.map((s, i) => {
                const pending = !s.firstLessonAt;
                return (
                  <Pressable
                    key={s.id}
                    style={[lrowS.wrap, i > 0 && { borderTopWidth: 1, borderTopColor: t.line }]}
                    onPress={() =>
                      router.push({ pathname: "/(teacher)/student/[id]" as never, params: { id: s.id } })
                    }
                  >
                    <View style={[lrowS.av, { backgroundColor: t.panel2 }]}>
                      <Text style={{ color: t.accText, fontFamily: font.bold, fontSize: 14 }}>
                        {s.name.charAt(0)}
                      </Text>
                    </View>
                    <View style={lrowS.g}>
                      <Text style={[lrowS.gb, { color: t.fg }]}>
                        {s.name} · {s.grade}
                      </Text>
                      <Text style={[lrowS.gp, { color: t.mut }]}>
                        {s.subjects} · {formatNext(s.firstLessonAt)}
                      </Text>
                    </View>
                    {pending ? (
                      <View style={[styles.bst, { backgroundColor: "rgba(217,119,6,0.12)" }]}>
                        <Text style={[styles.bstText, { color: "#92610a" }]}>첫 수업일</Text>
                      </View>
                    ) : (
                      <View style={[styles.bst, { backgroundColor: accTint(t, 0.12) }]}>
                        <Text style={[styles.bstText, { color: t.accText }]}>수업 중</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* 안내 배너 (.banner.info) */}
            <View style={[styles.banner, { backgroundColor: accTint(t, 0.08), borderColor: accTint(t, 0.2) }]}>
              <InfoCircleIcon color={t.accText} size={17} />
              <Text style={[styles.bannerText, { color: t.accText }]}>
                매칭된 학생만 표시됩니다. 새 매칭은 매니저가 배정해요.
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
  // .appbar .nm { font-size:22 (override) }
  title: { fontSize: 22, fontFamily: font.extrabold, letterSpacing: -0.66 },
  // .bst { font-size:10.5; font-weight:700; padding:4 9; border-radius:999; }
  bst: { paddingVertical: 4, paddingHorizontal: 9, borderRadius: 999 },
  bstText: { fontSize: 10.5, fontFamily: font.bold },
  banner: {
    flexDirection: "row",
    gap: 11,
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 14,
  },
  bannerText: { flex: 1, fontSize: 12.5, lineHeight: 19 },
});
