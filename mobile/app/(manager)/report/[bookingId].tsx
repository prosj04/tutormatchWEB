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

import { ErrorState } from "../../../components/ui/ErrorState";
import { SubHead } from "../../../components/ui/SubHead";
import { apiFetch } from "../../../lib/api";
import {
  ctaBar as ctaBarS,
  field as fieldS,
  font,
  scroll as scrollS,
} from "../../../styles/app-styles";
import { useTheme } from "../../../theme/ThemeProvider";

interface ReportData {
  goals: { quantitative: string[]; qualitative: string[] };
  subjectLevels: Record<string, string> | null;
  recommendedPlan: string | null;
  note: string | null;
}

interface ReportResponse {
  report: ReportData | null;
}

/** 여러 줄 텍스트 ↔ 문자열 배열 (한 줄 = 한 항목). */
function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export default function ReportScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [quantitative, setQuantitative] = useState("");
  const [qualitative, setQualitative] = useState("");
  const [recommendedPlan, setRecommendedPlan] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const d = await apiFetch<ReportResponse>(`/api/mobile/manager/consultations/${bookingId}/report`);
      const r = d.report;
      if (r) {
        setQuantitative(r.goals.quantitative.join("\n"));
        setQualitative(r.goals.qualitative.join("\n"));
        setRecommendedPlan(r.recommendedPlan ?? "");
        setNote(r.note ?? "");
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      await apiFetch(`/api/mobile/manager/consultations/${bookingId}/report`, {
        method: "PUT",
        body: JSON.stringify({
          goals: {
            quantitative: linesToArray(quantitative),
            qualitative: linesToArray(qualitative),
          },
          recommendedPlan: recommendedPlan.trim() || null,
          note: note.trim() || null,
        }),
      });
      Alert.alert("저장 완료", "상담 리포트가 저장되었어요.", [
        { text: "확인", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("저장 실패", extractError((e as Error).message, "리포트 저장에 실패했어요."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={scrollS}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <SubHead title="상담 리포트" />

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={t.acc} />
            </View>
          ) : error ? (
            <ErrorState title="리포트를 불러오지 못했어요" onRetry={() => void load()} />
          ) : (
            <>
              <View style={fieldS.wrap}>
                <Text style={[fieldS.label, { color: t.fg }]}>
                  정량 목표 <Text style={{ color: t.mut2, fontFamily: font.medium }}>· 한 줄에 하나씩</Text>
                </Text>
                <TextInput
                  style={[fieldS.inp, styles.area, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg }]}
                  placeholder={"예: 다음 모의고사 수학 2등급\n주간 학습 시간 15시간 유지"}
                  placeholderTextColor={t.mut2}
                  value={quantitative}
                  onChangeText={setQuantitative}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View style={fieldS.wrap}>
                <Text style={[fieldS.label, { color: t.fg }]}>
                  정성 목표 <Text style={{ color: t.mut2, fontFamily: font.medium }}>· 한 줄에 하나씩</Text>
                </Text>
                <TextInput
                  style={[fieldS.inp, styles.area, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg }]}
                  placeholder={"예: 혼자 공부하는 습관 형성\n오답 정리 루틴 정착"}
                  placeholderTextColor={t.mut2}
                  value={qualitative}
                  onChangeText={setQualitative}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View style={fieldS.wrap}>
                <Text style={[fieldS.label, { color: t.fg }]}>추천 플랜</Text>
                <TextInput
                  style={[fieldS.inp, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg }]}
                  placeholder="예: 주 2회 방문 · 심화반"
                  placeholderTextColor={t.mut2}
                  value={recommendedPlan}
                  onChangeText={setRecommendedPlan}
                />
              </View>

              <View style={fieldS.wrap}>
                <Text style={[fieldS.label, { color: t.fg }]}>상담 메모</Text>
                <TextInput
                  style={[fieldS.inp, styles.area, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg }]}
                  placeholder="상담 내용을 요약해 주세요."
                  placeholderTextColor={t.mut2}
                  value={note}
                  onChangeText={setNote}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View style={{ height: 6 }} />
            </>
          )}
        </ScrollView>

        {!loading && !error ? (
          <View style={[ctaBarS.wrap, { borderTopColor: t.line, backgroundColor: t.panel }]}>
            <Pressable
              style={[ctaBarS.btn, styles.ctaShadow, { backgroundColor: t.acc, shadowColor: t.acc }, saving && styles.disabled]}
              onPress={save}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={t.onAcc} size="small" />
              ) : (
                <Text style={[styles.ctaText, { color: t.onAcc }]}>리포트 저장</Text>
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
  area: { minHeight: 78, paddingTop: 13 },
  ctaShadow: { shadowOffset: { width: 0, height: 10 }, shadowRadius: 24, shadowOpacity: 0.3, elevation: 10 },
  ctaText: { fontFamily: font.extrabold, fontSize: 16, textAlign: "center" },
  disabled: { opacity: 0.5 },
});
