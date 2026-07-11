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
  card as cardS,
  field as fieldS,
  font,
  scroll as scrollS,
  sectT as sectTS,
} from "../../styles/app-styles";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { SubHead } from "../../components/ui/SubHead";
import { FileTextIcon } from "../../components/teacher/TeacherIcons";
import { apiFetch } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";

interface Template {
  id: string;
  title: string;
  subject: string | null;
  defaultDays: number;
  tasks: string; // 줄바꿈 텍스트로 정규화되어 옴
}

export default function TemplatesScreen() {
  const { t } = useTheme();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [days, setDays] = useState<4 | 7>(7);
  const [tasks, setTasks] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const d = await apiFetch<{ templates: Template[] }>("/api/mobile/teacher/homework-templates");
      setTemplates(d.templates);
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

  const taskCount = tasks.split("\n").map((l) => l.trim()).filter(Boolean).length;
  const canSave = title.trim().length > 0 && taskCount > 0 && !saving;

  const create = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await apiFetch("/api/mobile/teacher/homework-templates", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          subject: subject.trim() || undefined,
          defaultDays: days,
          tasks,
        }),
      });
      setTitle("");
      setSubject("");
      setTasks("");
      setDays(7);
      await load();
    } catch (e) {
      Alert.alert(
        "저장 실패",
        e instanceof Error ? e.message.replace(/^API \d+: /, "") : "다시 시도해 주세요.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = (tpl: Template) => {
    Alert.alert("템플릿 삭제", `"${tpl.title}" 템플릿을 삭제할까요?`, [
      { text: "닫기", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await apiFetch(`/api/mobile/teacher/homework-templates/${tpl.id}`, { method: "DELETE" });
            await load();
          } catch (e) {
            Alert.alert(
              "삭제 실패",
              e instanceof Error ? e.message.replace(/^API \d+: /, "") : "다시 시도해 주세요.",
            );
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={scrollS}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SubHead title="숙제 템플릿" />

        {/* 새 템플릿 만들기 */}
        <View style={fieldS.wrap}>
          <Text style={[fieldS.label, { color: t.fg }]}>템플릿 이름</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="예) 주간 수학 루틴"
            placeholderTextColor={t.mut2}
            maxLength={80}
            style={[fieldS.inp, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg, fontFamily: font.regular }]}
          />
        </View>

        <View style={fieldS.wrap}>
          <Text style={[fieldS.label, { color: t.fg }]}>
            과목 <Text style={{ color: t.mut2, fontFamily: font.medium }}>· 선택</Text>
          </Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="예) 수학"
            placeholderTextColor={t.mut2}
            maxLength={80}
            style={[fieldS.inp, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg, fontFamily: font.regular }]}
          />
        </View>

        <View style={fieldS.wrap}>
          <Text style={[fieldS.label, { color: t.fg }]}>기본 분배 기간</Text>
          <View style={styles.opts}>
            {([[7, "1주 (7일)"], [4, "4일"]] as [4 | 7, string][]).map(([val, label]) => {
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
          <Text style={[fieldS.label, { color: t.fg }]}>
            숙제 목록 <Text style={{ color: t.mut2, fontFamily: font.medium }}>· 한 줄에 하나씩</Text>
          </Text>
          <TextInput
            value={tasks}
            onChangeText={setTasks}
            multiline
            placeholder={"예) 미적분 문제 1-40\n오답노트 8문항"}
            placeholderTextColor={t.mut2}
            style={[
              fieldS.inp,
              { backgroundColor: t.panel, borderColor: t.line2, color: t.fg, minHeight: 96, textAlignVertical: "top", fontFamily: font.regular },
            ]}
          />
        </View>

        <Pressable
          style={[styles.ctaBtn, { backgroundColor: t.acc, opacity: canSave ? 1 : 0.5 }]}
          disabled={!canSave}
          onPress={() => void create()}
        >
          {saving ? (
            <ActivityIndicator color={t.onAcc} size="small" />
          ) : (
            <Text style={[styles.ctaText, { color: t.onAcc }]}>템플릿 저장</Text>
          )}
        </Pressable>

        {/* 저장된 템플릿 */}
        <Text style={[sectTS, { color: t.fg }]}>저장된 템플릿</Text>
        {loading && templates.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.acc} />
          </View>
        ) : error ? (
          <ErrorState title="템플릿을 불러오지 못했어요" onRetry={() => void load()} />
        ) : templates.length === 0 ? (
          <EmptyState
            title="저장된 템플릿이 없어요"
            description="자주 쓰는 주간 루틴을 저장하면 플랜 입력에서 바로 불러올 수 있어요."
          />
        ) : (
          <View style={{ gap: 10 }}>
            {templates.map((tpl) => {
              const count = tpl.tasks.split("\n").map((l) => l.trim()).filter(Boolean).length;
              return (
                <View
                  key={tpl.id}
                  style={[cardS, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg, padding: 14 }]}
                >
                  <View style={styles.tplHead}>
                    <View style={[styles.tplIc, { backgroundColor: t.panel2 }]}>
                      <FileTextIcon color={t.accText} size={17} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tplTitle, { color: t.fg }]}>{tpl.title}</Text>
                      <Text style={[styles.tplSub, { color: t.mut }]}>
                        {[tpl.subject, `${tpl.defaultDays}일`, `${count}개 항목`].filter(Boolean).join(" · ")}
                      </Text>
                    </View>
                    <Pressable onPress={() => remove(tpl)}>
                      <Text style={[styles.tplDel, { color: t.mut2 }]}>삭제</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { paddingVertical: 40, alignItems: "center" },
  opts: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  opt: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12, borderWidth: 1 },
  optText: { fontSize: 13.5, fontFamily: font.semibold },
  ctaBtn: { width: "100%", marginTop: 4, padding: 16, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  ctaText: { fontFamily: font.extrabold, fontSize: 16 },
  tplHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  tplIc: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  tplTitle: { fontSize: 14.5, fontFamily: font.bold },
  tplSub: { fontSize: 12, marginTop: 2 },
  tplDel: { fontSize: 12, fontFamily: font.bold },
});
