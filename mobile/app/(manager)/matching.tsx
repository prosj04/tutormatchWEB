import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChevronRightIcon } from "../../components/manager/ManagerIcons";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { apiFetch } from "../../lib/api";
import { appbar as appbarS, font, scroll as scrollS } from "../../styles/app-styles";
import { useTheme } from "../../theme/ThemeProvider";
import type { MatchingResponse, ManagerMatchingStudent } from "./_shared";
import { studentLabel } from "./_shared";
import { Bst, MCard } from "./_ui";

export default function MatchingScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const [students, setStudents] = useState<ManagerMatchingStudent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const d = await apiFetch<MatchingResponse>("/api/mobile/manager/matches");
      setStudents(d.students ?? []);
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={scrollS} showsVerticalScrollIndicator={false}>
        <View style={appbarS.wrap}>
          <Text style={[styles.title, { color: t.fg }]}>매칭</Text>
        </View>

        {loading && !students ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.acc} />
          </View>
        ) : error ? (
          <ErrorState title="매칭 대상을 불러오지 못했어요" onRetry={() => void load()} />
        ) : (students?.length ?? 0) === 0 ? (
          <EmptyState
            title="매칭할 학생이 없어요"
            description="상담을 배정받고 진행하면 매칭 대상 학생이 여기에 표시돼요."
          />
        ) : (
          (students ?? []).map((s, i) => (
            <Pressable key={s.id} onPress={() => router.push(`/match/${s.id}` as never)}>
              <MCard style={{ padding: 14, paddingHorizontal: 15, marginTop: i === 0 ? 0 : 9 }}>
                <View style={styles.head}>
                  <Text style={[styles.name, { color: t.fg }]}>
                    {studentLabel(s.name, s.grade)} · {s.subjects}
                  </Text>
                  {s.currentTeacherName ? (
                    <Bst tone="acc" label="배정됨" />
                  ) : (
                    <Bst tone="mut" label="미매칭" />
                  )}
                  <View style={{ marginLeft: "auto" }}>
                    <ChevronRightIcon color={t.mut2} size={20} />
                  </View>
                </View>
                <Text style={[styles.body, { color: t.mut }]}>
                  {s.consultationNote?.trim() || "상담 메모 없음"}
                  {s.currentTeacherName ? ` · 현재 ${s.currentTeacherName}` : ""}
                </Text>
              </MCard>
            </Pressable>
          ))
        )}
        <View style={{ height: 6 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { paddingVertical: 40, alignItems: "center" },
  title: { fontSize: 22, fontFamily: font.extrabold, letterSpacing: -0.66 },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { fontSize: 14, fontFamily: font.extrabold, flexShrink: 1 },
  body: { fontSize: 12.5, marginTop: 7, lineHeight: 19 },
});
