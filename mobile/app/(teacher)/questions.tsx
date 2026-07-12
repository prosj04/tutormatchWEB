import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  appbar as appbarS,
  card as cardS,
  field as fieldS,
  font,
  scroll as scrollS,
} from "../../styles/app-styles";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { ImageIcon } from "../../components/teacher/TeacherIcons";
import { apiFetch } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

interface TeacherStudent {
  id: string;
  name: string;
  grade: string;
}

interface LegacyQuestion {
  id: string;
  studentId: string;
  date: string;
  content: string;
  imageUrl: string | null;
  aiAnswer: string | null;
  teacherAnswer: string | null;
  teacherAnswerAt: string | null;
  answeredBy: string | null;
  isResolved: boolean;
  createdAt: string;
}

/** 학생명을 붙인 질문 행. 강사 전용 질문 목록 API가 없어 학생별로 취합한다. */
interface QuestionRow extends LegacyQuestion {
  studentName: string;
  studentGrade: string;
}

type SubTab = "pending" | "done";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function TeacherQuestionsScreen() {
  const { t } = useTheme();
  const [tab, setTab] = useState<SubTab>("pending");
  const [rows, setRows] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [approvalPending, setApprovalPending] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { students } = await apiFetch<{ students: TeacherStudent[] }>(
        "/api/mobile/teacher/students",
      );
      const perStudent = await Promise.all(
        students.map(async (s) => {
          try {
            const { questions } = await apiFetch<{ questions: LegacyQuestion[] }>(
              `/api/mobile/teacher/students/${s.id}/questions`,
            );
            return questions.map((q) => ({
              ...q,
              studentName: s.name,
              studentGrade: s.grade,
            }));
          } catch {
            return [] as QuestionRow[];
          }
        }),
      );
      const all = perStudent.flat();
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRows(all);
    } catch (e) {
      // 승인 대기 강사의 403은 오류가 아니라 잠금 안내로 표시
      if (e instanceof Error && e.message.includes("403") && e.message.includes("승인")) {
        setApprovalPending(true);
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

  const submitAnswer = async (row: QuestionRow) => {
    const value = (drafts[row.id] ?? "").trim();
    if (!value) return;
    setSavingId(row.id);
    try {
      await apiFetch(`/api/mobile/teacher/questions/${row.id}/answer`, {
        method: "PATCH",
        body: JSON.stringify({ teacherAnswer: value }),
      });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      await load();
    } catch (e) {
      Alert.alert(
        "답변 실패",
        e instanceof Error ? e.message.replace(/^API \d+: /, "") : "다시 시도해 주세요.",
      );
    } finally {
      setSavingId(null);
    }
  };

  const pending = rows.filter((q) => !q.teacherAnswer);
  const done = rows.filter((q) => q.teacherAnswer);
  const list = tab === "pending" ? pending : done;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={scrollS}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={appbarS.wrap}>
          <Text style={[styles.title, { color: t.fg }]}>질문</Text>
        </View>

        {/* subtabs */}
        <View style={[styles.subtabs, { backgroundColor: t.panel2, borderColor: t.line }]}>
          {([
            ["pending", `답변 대기${pending.length ? ` ${pending.length}` : ""}`],
            ["done", "답변 완료"],
          ] as [SubTab, string][]).map(([key, label]) => {
            const on = tab === key;
            return (
              <Pressable
                key={key}
                style={[styles.subtab, on && { backgroundColor: t.panel, shadowColor: t.fg }]}
                onPress={() => setTab(key)}
              >
                <Text style={[styles.subtabText, { color: on ? t.fg : t.mut }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading && rows.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.acc} />
          </View>
        ) : approvalPending ? (
          <EmptyState
            title="승인 후 이용할 수 있어요"
            description="관리자 승인이 완료되면 학생·질문 기능이 열립니다."
          />
        ) : error ? (
          <ErrorState title="질문을 불러오지 못했어요" onRetry={() => void load()} />
        ) : list.length === 0 ? (
          <EmptyState
            title={tab === "pending" ? "대기 중인 질문이 없어요" : "답변한 질문이 없어요"}
            description={
              tab === "pending"
                ? "학생이 질문을 올리면 여기에 표시돼요."
                : "답변을 등록하면 이곳에 모여요."
            }
          />
        ) : (
          <View style={{ gap: 12 }}>
            {list.map((q) => {
              const draft = drafts[q.id] ?? q.teacherAnswer ?? "";
              const saving = savingId === q.id;
              return (
                <View
                  key={q.id}
                  style={[cardS, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg, padding: 15 }]}
                >
                  <View style={styles.qhead}>
                    <Text style={[styles.qwho, { color: t.fg }]}>
                      {q.studentName} · {q.studentGrade}
                    </Text>
                    <Text style={[styles.qtime, { color: t.mut2 }]}>{formatDate(q.createdAt)}</Text>
                  </View>

                  <Text style={[styles.qcontent, { color: t.fg }]}>{q.content}</Text>

                  {q.imageUrl ? (
                    <View style={[styles.imgTag, { backgroundColor: t.panel2 }]}>
                      <ImageIcon color={t.mut} size={14} />
                      <Text style={[styles.imgTagText, { color: t.mut }]}>사진 첨부됨</Text>
                    </View>
                  ) : null}

                  {q.aiAnswer ? (
                    <View style={[styles.aiBox, { backgroundColor: accTint(t, 0.08), borderColor: accTint(t, 0.2) }]}>
                      <Text style={[styles.aiLabel, { color: t.accText }]}>AI 초안</Text>
                      <Text style={[styles.aiText, { color: t.fg }]}>{q.aiAnswer}</Text>
                    </View>
                  ) : null}

                  <View style={[fieldS.wrap, { marginTop: 12, marginBottom: 0 }]}>
                    <Text style={[fieldS.label, { color: t.fg }]}>
                      {q.teacherAnswer ? "내 답변 (수정 가능)" : "답변 작성"}
                    </Text>
                    <TextInput
                      value={draft}
                      onChangeText={(v) => setDrafts((prev) => ({ ...prev, [q.id]: v }))}
                      multiline
                      placeholder="학생에게 전할 답변을 작성하세요"
                      placeholderTextColor={t.mut2}
                      style={[
                        fieldS.inp,
                        {
                          backgroundColor: t.panel,
                          borderColor: t.line2,
                          color: t.fg,
                          minHeight: 72,
                          textAlignVertical: "top",
                          fontFamily: font.regular,
                        },
                      ]}
                    />
                  </View>

                  <Pressable
                    style={[
                      styles.answerBtn,
                      { backgroundColor: t.acc, opacity: draft.trim() && !saving ? 1 : 0.5 },
                    ]}
                    disabled={!draft.trim() || saving}
                    onPress={() => void submitAnswer(q)}
                  >
                    {saving ? (
                      <ActivityIndicator color={t.onAcc} size="small" />
                    ) : (
                      <Text style={[styles.answerBtnText, { color: t.onAcc }]}>
                        {q.teacherAnswer ? "답변 수정" : "답변 등록"}
                      </Text>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 6 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { paddingVertical: 60, alignItems: "center" },
  title: { fontSize: 22, fontFamily: font.extrabold, letterSpacing: -0.66 },
  subtabs: {
    flexDirection: "row",
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderRadius: 13,
    marginBottom: 14,
  },
  subtab: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: "center",
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    shadowOpacity: 0.06,
    elevation: 0,
  },
  subtabText: { fontSize: 13, fontFamily: font.bold },
  qhead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  qwho: { fontSize: 13.5, fontFamily: font.bold },
  qtime: { fontSize: 11.5, fontFamily: font.medium },
  qcontent: { fontSize: 14, lineHeight: 21, marginTop: 8, fontFamily: font.regular },
  imgTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    marginTop: 9,
  },
  imgTagText: { fontSize: 11.5, fontFamily: font.semibold },
  aiBox: { marginTop: 11, padding: 12, borderRadius: 12, borderWidth: 1 },
  aiLabel: { fontSize: 11, fontFamily: font.extrabold, letterSpacing: 0.5, textTransform: "uppercase" },
  aiText: { fontSize: 13, lineHeight: 20, marginTop: 5, fontFamily: font.regular },
  answerBtn: {
    width: "100%",
    marginTop: 10,
    paddingVertical: 13,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  answerBtnText: { fontFamily: font.extrabold, fontSize: 14.5 },
});
