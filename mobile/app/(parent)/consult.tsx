import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
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

import {
  appbar as appbarS,
  ctaBar as ctaBarS,
  field as fieldS,
  font,
  opt as optS,
  scroll as scrollS,
  sectT as sectTS,
} from "../../styles/app-styles";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { InfoIcon } from "../../components/parent/ParentIcons";
import { apiFetch } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";
import type { Child, ChildrenResponse } from "./_shared";
import { useSelectedChildId } from "./_selectedChild";

interface ConsultResult {
  ok: boolean;
  status: string;
  alreadyOpen: boolean;
}

export default function ConsultTab() {
  const { t } = useTheme();
  const router = useRouter();
  const [children, setChildren] = useState<Child[] | null>(null);
  const { selectedId, setSelectedId } = useSelectedChildId(
    (children ?? []).map((c) => c.id),
  );
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ConsultResult | null>(null);
  const [submitError, setSubmitError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const d = await apiFetch<ChildrenResponse>("/api/mobile/parent/children");
      setChildren(d.children ?? []);
    } catch {
      setChildren(null);
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

  async function handleSubmit() {
    if (!selectedId || !note.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    setResult(null);
    try {
      const r = await apiFetch<ConsultResult>(
        `/api/mobile/parent/children/${selectedId}/consultation`,
        { method: "POST", body: JSON.stringify({ note: note.trim() }) },
      );
      setResult(r);
      if (r.ok && !r.alreadyOpen) setNote("");
    } catch {
      setSubmitError("상담 신청에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = !!selectedId && note.trim().length > 0 && !submitting;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={scrollS} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={appbarS.wrap}>
            <Text style={[styles.title, { color: t.fg }]}>상담</Text>
          </View>

          {loading && !children ? (
            <View style={styles.center}>
              <ActivityIndicator color={t.acc} />
            </View>
          ) : error ? (
            <ErrorState title="상담 정보를 불러오지 못했어요" onRetry={() => void load()} />
          ) : (children?.length ?? 0) === 0 ? (
            <EmptyState
              title="연결된 자녀가 없어요"
              description="자녀를 연결하면 방문 상담을 신청할 수 있어요."
              ctaLabel="자녀 연결하기"
              onCta={() => router.push("/(parent)/link" as never)}
            />
          ) : (
            <>
              {/* 신청 결과 배너 */}
              {result?.ok ? (
                <View style={[styles.banner, { backgroundColor: accTint(t, 0.08), borderColor: accTint(t, 0.2) }]}>
                  <InfoIcon color={t.accText} size={17} />
                  <Text style={[styles.bannerText, { color: t.accText }]}>
                    {result.alreadyOpen
                      ? "이미 접수된 상담이 있어요. 담당 매니저가 곧 일정을 조율해 드립니다."
                      : "상담 신청이 접수됐어요. 담당 매니저가 방문 일정을 조율해 연락드립니다."}
                  </Text>
                </View>
              ) : null}

              <Text style={[sectTS, { color: t.fg }]}>새 상담 신청</Text>

              {/* 자녀 선택 (.field .opts) */}
              <View style={fieldS.wrap}>
                <Text style={[fieldS.label, { color: t.fg }]}>어느 자녀에 대한 상담인가요?</Text>
                <View style={styles.opts}>
                  {(children ?? []).map((c) => {
                    const on = c.id === selectedId;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => setSelectedId(c.id)}
                        style={[
                          optS.base,
                          { borderColor: on ? "transparent" : t.line2, backgroundColor: on ? t.acc : t.panel },
                        ]}
                      >
                        <Text style={{ color: on ? t.onAcc : t.mut, fontSize: 13.5, fontFamily: font.semibold }}>
                          {[c.name, c.grade].filter(Boolean).join(" · ")}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* 상담 내용 (.field .inp.area) */}
              <View style={fieldS.wrap}>
                <Text style={[fieldS.label, { color: t.fg }]}>상담하고 싶은 내용</Text>
                <TextInput
                  style={[fieldS.inp, styles.area, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg }]}
                  placeholder="예: 수학 진도 방향과 방학 계획을 상의하고 싶어요."
                  placeholderTextColor={t.mut2}
                  value={note}
                  onChangeText={setNote}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {submitError !== "" ? (
                <Text style={[styles.error, { color: t.danger }]}>{submitError}</Text>
              ) : null}

              <View style={{ height: 6 }} />
            </>
          )}
        </ScrollView>

        {/* CTA */}
        {!loading && !error && (children?.length ?? 0) > 0 ? (
          <View style={[ctaBarS.wrap, { borderTopColor: t.line, backgroundColor: t.panel }]}>
            <Pressable
              style={[ctaBarS.btn, styles.ctaShadow, { backgroundColor: t.acc, shadowColor: t.acc }, !canSubmit && styles.disabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              {submitting ? (
                <ActivityIndicator color={t.onAcc} size="small" />
              ) : (
                <Text style={[styles.ctaText, { color: t.onAcc }]}>상담 신청하기</Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  center: { paddingVertical: 40, alignItems: "center" },
  title: { fontSize: 22, fontFamily: font.extrabold, letterSpacing: -0.66 },

  opts: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  area: { minHeight: 78, paddingTop: 13 },

  error: { fontSize: 13, marginBottom: 8, fontFamily: font.semibold },

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

  ctaShadow: {
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    shadowOpacity: 0.3,
    elevation: 10,
  },
  ctaText: { fontFamily: font.extrabold, fontSize: 16, textAlign: "center" },
  disabled: { opacity: 0.5 },
});
