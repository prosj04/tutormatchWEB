import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  card as cardS,
  field as fieldS,
  font,
  scroll as scrollS,
  sectT as sectTS,
} from "../../../styles/app-styles";
import { SubHead } from "../../../components/ui/SubHead";
import { FileBlankIcon } from "../../../components/teacher/TeacherIcons";
import { apiFetch } from "../../../lib/api";
import { useTheme } from "../../../theme/ThemeProvider";

type SubTab = "homework" | "week" | "comment";

interface Task {
  id: string;
  title: string;
  done: boolean;
  order: number;
}
interface StudyPlan {
  id: string;
  date: string;
  comment: string | null;
  tasks: Task[];
}
interface Template {
  id: string;
  title: string;
  subject: string | null;
  defaultDays: number;
  tasks: string; // 줄바꿈 텍스트
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 웹과 동일 로직: 앞쪽 요일 우선·단조 감소, 하루 최소 1개. 미리보기용 개수 계산. */
function distributeCounts(total: number, days: number): number[] {
  if (total <= 0) return Array.from({ length: days }, () => 0);
  const base = Math.floor(total / days);
  let remainder = total - base * days;
  const counts = Array.from({ length: days }, () => base);
  for (let i = 0; i < days && remainder > 0; i++) {
    counts[i] += 1;
    remainder -= 1;
  }
  return counts.map((c) => Math.max(c, total >= days ? 1 : c));
}

export default function PlanScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { t } = useTheme();

  const [tab, setTab] = useState<SubTab>("homework");
  const [text, setText] = useState("");
  const [days, setDays] = useState<4 | 7>(7);
  const [repeatWeeks, setRepeatWeeks] = useState<1 | 2 | 4>(1);
  const [submitting, setSubmitting] = useState(false);

  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);

  const taskCount = useMemo(
    () => text.split("\n").map((l) => l.trim()).filter(Boolean).length,
    [text],
  );
  const counts = useMemo(() => distributeCounts(taskCount, days), [taskCount, days]);
  const maxCount = Math.max(1, ...counts);

  const loadPlans = useCallback(async () => {
    if (!id) return;
    setPlansLoading(true);
    try {
      const d = await apiFetch<{ plans: StudyPlan[] }>(`/api/mobile/teacher/students/${id}/plans`);
      setPlans(d.plans);
    } catch {
      /* noop — 빈 목록 유지 */
    } finally {
      setPlansLoading(false);
    }
  }, [id]);

  const loadTemplates = useCallback(async () => {
    try {
      const d = await apiFetch<{ templates: Template[] }>("/api/mobile/teacher/homework-templates");
      setTemplates(d.templates);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (tab === "week" || tab === "comment") void loadPlans();
  }, [tab, loadPlans]);

  const distribute = async () => {
    if (!id || taskCount === 0) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/mobile/teacher/students/${id}/homework-distribution`, {
        method: "POST",
        body: JSON.stringify({ startDate: todayStr(), days, tasks: text, repeatWeeks }),
      });
      Alert.alert("완료", "숙제가 자동 분배되었습니다.");
      setText("");
    } catch (e) {
      Alert.alert("분배 실패", e instanceof Error ? e.message.replace(/^API \d+: /, "") : "다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const applyTemplate = (tpl: Template) => {
    setText(tpl.tasks);
    if (tpl.defaultDays === 4 || tpl.defaultDays === 7) setDays(tpl.defaultDays);
  };

  const saveComment = async (planId: string, comment: string) => {
    try {
      await apiFetch(`/api/mobile/teacher/plans/${planId}/comment`, {
        method: "PATCH",
        body: JSON.stringify({ comment }),
      });
      await loadPlans();
    } catch (e) {
      Alert.alert("저장 실패", e instanceof Error ? e.message.replace(/^API \d+: /, "") : "다시 시도해 주세요.");
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={scrollS} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <SubHead title={`${name ?? "학생"} · 진도·숙제`} />

        {/* subtabs */}
        <View style={[styles.subtabs, { backgroundColor: t.panel2, borderColor: t.line }]}>
          {([
            ["homework", "숙제 입력"],
            ["week", "이번 주 플랜"],
            ["comment", "코멘트"],
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

        {tab === "homework" && (
          <>
            <View style={fieldS.wrap}>
              <Text style={[fieldS.label, { color: t.fg }]}>
                숙제 총량 <Text style={{ color: t.mut2, fontFamily: font.medium }}>· 한 번에 입력하면 자동 분배돼요</Text>
              </Text>
              <TextInput
                value={text}
                onChangeText={setText}
                multiline
                placeholder={"예) 미적분 5단원 문제 1-40\n오답노트 8문항\n(한 줄에 하나씩)"}
                placeholderTextColor={t.mut2}
                style={[
                  fieldS.inp,
                  { backgroundColor: t.panel, borderColor: t.line2, color: t.fg, minHeight: 96, textAlignVertical: "top", fontFamily: font.regular },
                ]}
              />
            </View>

            <View style={fieldS.wrap}>
              <Text style={[fieldS.label, { color: t.fg }]}>분배 기간</Text>
              <View style={styles.opts}>
                {([[7, "1주 (월–금 외)"], [4, "4일"]] as [4 | 7, string][]).map(([val, label]) => {
                  const on = days === val;
                  return (
                    <Pressable
                      key={val}
                      style={[styles.opt, { backgroundColor: on ? t.acc : t.panel, borderColor: on ? "transparent" : t.line2 }]}
                      onPress={() => setDays(val)}
                    >
                      <Text style={[styles.optText, { color: on ? t.onAcc : t.mut }]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={fieldS.wrap}>
              <Text style={[fieldS.label, { color: t.fg }]}>반복</Text>
              <View style={styles.opts}>
                {([[1, "반복 없음"], [2, "2주"], [4, "4주"]] as [1 | 2 | 4, string][]).map(([val, label]) => {
                  const on = repeatWeeks === val;
                  return (
                    <Pressable
                      key={val}
                      style={[styles.opt, { backgroundColor: on ? t.acc : t.panel, borderColor: on ? "transparent" : t.line2 }]}
                      onPress={() => setRepeatWeeks(val)}
                    >
                      <Text style={[styles.optText, { color: on ? t.onAcc : t.mut }]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 자동 분배 미리보기 */}
            <Text style={[sectTS, { color: t.fg }]}>자동 분배 미리보기</Text>
            <View style={[cardS, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
              <View style={styles.bars}>
                {counts.map((c, i) => (
                  <View key={i} style={styles.bar}>
                    <View style={styles.barTrack}>
                      <View
                        style={[styles.barFill, { backgroundColor: t.acc, height: `${(c / maxCount) * 100}%` }]}
                      />
                    </View>
                    <Text style={[styles.barLabel, { color: t.mut }]}>
                      {days === 7 ? `${i + 1}일` : `${i + 1}일`} {c}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={[styles.previewNote, { borderTopColor: t.line }]}>
                <Text style={{ fontSize: 12.5, color: t.mut }}>
                  총 {taskCount}개 → 앞쪽 요일 우선·단조 감소로 분배 (하루 최소 1개)
                </Text>
              </View>
            </View>

            {/* 템플릿에서 불러오기 */}
            {templates.length > 0 && (
              <Pressable
                style={[styles.tplBtn, { backgroundColor: t.panel, borderColor: t.line2 }]}
                onPress={() =>
                  Alert.alert(
                    "템플릿 불러오기",
                    "재사용할 주간 루틴을 선택하세요.",
                    [
                      ...templates.slice(0, 3).map((tpl) => ({
                        text: tpl.title,
                        onPress: () => applyTemplate(tpl),
                      })),
                      { text: "닫기", style: "cancel" as const },
                    ],
                  )
                }
              >
                <FileBlankIcon color={t.fg} size={16} />
                <Text style={[styles.tplBtnText, { color: t.fg }]}>
                  템플릿에서 불러오기 · “{templates[0].title}”
                </Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.ctaBtn, { backgroundColor: t.acc, opacity: taskCount > 0 && !submitting ? 1 : 0.5 }]}
              disabled={taskCount === 0 || submitting}
              onPress={() => void distribute()}
            >
              {submitting ? (
                <ActivityIndicator color={t.onAcc} size="small" />
              ) : (
                <Text style={[styles.ctaText, { color: t.onAcc }]}>숙제 분배 확정</Text>
              )}
            </Pressable>
          </>
        )}

        {tab === "week" && (
          <PlansList plans={plans} loading={plansLoading} />
        )}

        {tab === "comment" && (
          <CommentList plans={plans} loading={plansLoading} onSave={saveComment} />
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PlansList({ plans, loading }: { plans: StudyPlan[]; loading: boolean }) {
  const { t } = useTheme();
  if (loading) return <ActivityIndicator color={t.acc} style={{ marginTop: 24 }} />;
  if (plans.length === 0)
    return <Text style={[styles.empty, { color: t.mut }]}>아직 등록된 플랜이 없어요.</Text>;
  return (
    <View style={{ gap: 10 }}>
      {plans.slice(0, 14).map((p) => {
        const d = new Date(`${p.date}T12:00:00`);
        return (
          <View key={p.id} style={[cardS, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg, padding: 14 }]}>
            <Text style={[styles.planDate, { color: t.fg }]}>
              {p.date} ({WEEKDAYS[d.getDay()]})
            </Text>
            {p.tasks.length === 0 ? (
              <Text style={{ fontSize: 12.5, color: t.mut, marginTop: 4 }}>숙제 없음</Text>
            ) : (
              p.tasks.map((task) => (
                <Text key={task.id} style={{ fontSize: 13, color: task.done ? t.mut2 : t.fg, marginTop: 4 }}>
                  {task.done ? "✓ " : "· "}
                  {task.title}
                </Text>
              ))
            )}
          </View>
        );
      })}
    </View>
  );
}

function CommentList({
  plans,
  loading,
  onSave,
}: {
  plans: StudyPlan[];
  loading: boolean;
  onSave: (planId: string, comment: string) => void;
}) {
  const { t } = useTheme();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  if (loading) return <ActivityIndicator color={t.acc} style={{ marginTop: 24 }} />;
  if (plans.length === 0)
    return <Text style={[styles.empty, { color: t.mut }]}>코멘트를 남길 플랜이 없어요.</Text>;
  return (
    <View style={{ gap: 12 }}>
      {plans.slice(0, 10).map((p) => {
        const value = drafts[p.id] ?? p.comment ?? "";
        return (
          <View key={p.id} style={fieldS.wrap}>
            <Text style={[fieldS.label, { color: t.fg }]}>{p.date} 코멘트</Text>
            <TextInput
              value={value}
              onChangeText={(v) => setDrafts((prev) => ({ ...prev, [p.id]: v }))}
              multiline
              placeholder="이번 학습에 대한 코멘트를 남겨주세요"
              placeholderTextColor={t.mut2}
              style={[fieldS.inp, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg, minHeight: 60, textAlignVertical: "top", fontFamily: font.regular }]}
            />
            <Pressable
              style={[styles.saveComment, { backgroundColor: t.panel, borderColor: t.line2 }]}
              onPress={() => onSave(p.id, value)}
            >
              <Text style={[styles.saveCommentText, { color: t.fg }]}>코멘트 저장</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  empty: { fontSize: 13, textAlign: "center", marginTop: 30 },
  // .subtabs { padding:4; gap:4; border-radius:13; margin-bottom:14; }
  subtabs: { flexDirection: "row", padding: 4, gap: 4, borderWidth: 1, borderRadius: 13, marginBottom: 14 },
  subtab: { flex: 1, paddingVertical: 9, paddingHorizontal: 6, borderRadius: 10, alignItems: "center", shadowOffset: { width: 0, height: 3 }, shadowRadius: 10, shadowOpacity: 0.06, elevation: 0 },
  subtabText: { fontSize: 13, fontFamily: font.bold },
  // .opts { gap:8; flex-wrap; }
  opts: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  // .opt { padding:10 15; border-radius:12; border:1px; font-size:13.5; font-weight:600; }
  opt: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12, borderWidth: 1 },
  optText: { fontSize: 13.5, fontFamily: font.semibold },
  // .bars { height 76 in preview }
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 9, height: 90, paddingTop: 14, paddingHorizontal: 16 },
  bar: { flex: 1, alignItems: "center", gap: 7, height: "100%", justifyContent: "flex-end" },
  barTrack: { width: "100%", flex: 1, justifyContent: "flex-end" },
  barFill: { width: "100%", borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, minHeight: 4 },
  barLabel: { fontSize: 10.5 },
  previewNote: { paddingVertical: 12, paddingHorizontal: 16, borderTopWidth: 1 },
  tplBtn: {
    width: "100%",
    marginTop: 12,
    paddingVertical: 13,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  tplBtnText: { fontFamily: font.bold, fontSize: 13.5 },
  ctaBtn: { width: "100%", marginTop: 12, padding: 16, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  ctaText: { fontFamily: font.extrabold, fontSize: 16 },
  planDate: { fontSize: 13.5, fontFamily: font.bold },
  saveComment: { marginTop: 8, paddingVertical: 11, borderRadius: 11, borderWidth: 1, alignItems: "center" },
  saveCommentText: { fontFamily: font.bold, fontSize: 13 },
});
