import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { card, font, scroll as scrollS } from "../../styles/app-styles";
import { SubHead } from "../../components/ui/SubHead";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { apiFetch } from "../../lib/api";
import { EMPTY_STATE_COPY } from "../../lib/student-journey";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

interface ReportData {
  report: {
    month: string;
    summary: string;
    weakTypes: string[];
    detail: string | null;
  } | null;
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-");
  return `${y}년 ${Number(m)}월 학습 리포트`;
}

export default function ReportScreen() {
  const { t } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    const month =
      id && id !== "latest" && /^\d{4}-\d{2}$/.test(id) ? id : null;
    const path = month
      ? `/api/mobile/reports?month=${month}`
      : "/api/mobile/reports";
    setLoading(true);
    setError(false);
    apiFetch<ReportData>(path)
      .then(setData)
      .catch(() => {
        setData(null);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const report = data?.report;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <ScrollView contentContainerStyle={[scrollS, styles.content]} showsVerticalScrollIndicator={false}>
        <SubHead title={report ? formatMonthLabel(report.month) : "학습 리포트"} />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.acc} />
          </View>
        ) : error ? (
          <ErrorState
            title="학습 리포트를 불러오지 못했어요"
            onRetry={load}
          />
        ) : !report ? (
          <EmptyState
            title={EMPTY_STATE_COPY.noReport.title}
            description={EMPTY_STATE_COPY.noReport.description}
          />
        ) : (
          <>
            <View style={[card, styles.summaryCard, { backgroundColor: t.panel, borderColor: t.line }]}>
              <Text style={[styles.sectionTitle, { color: t.fg }]}>이번 달 요약</Text>
              <Text style={[styles.body, { color: t.mut }]}>{report.summary}</Text>
            </View>

            {report.weakTypes.length > 0 && (
              <View style={[card, styles.summaryCard, { backgroundColor: t.panel, borderColor: t.line }]}>
                <Text style={[styles.sectionTitle, { color: t.fg }]}>취약 유형</Text>
                {report.weakTypes.map((wt) => (
                  <View key={wt} style={[styles.chip, { backgroundColor: accTint(t, 0.1) }]}>
                    <Text style={[styles.chipText, { color: t.accText }]}>{wt}</Text>
                  </View>
                ))}
              </View>
            )}

            {report.detail && (
              <View style={[card, styles.summaryCard, { backgroundColor: t.panel, borderColor: t.line }]}>
                <Text style={[styles.sectionTitle, { color: t.fg }]}>선생님 코멘트</Text>
                <Text style={[styles.body, { color: t.mut }]}>{report.detail}</Text>
              </View>
            )}
          </>
        )}
        <View style={{ height: 6 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 8 },
  center: { paddingVertical: 48, alignItems: "center" },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontFamily: font.bold, marginBottom: 8 },
  body: { fontSize: 13.5, lineHeight: 21 },
  chip: {
    alignSelf: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    marginTop: 6,
  },
  chipText: { fontSize: 12, fontFamily: font.bold },
});
