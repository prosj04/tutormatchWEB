import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

import { ArrowUpRightIcon } from "../../components/ui/Icons";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { apiFetch } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

interface WeeklyData {
  weekStart: string;
  bars: Array<{ date: string; label: string; minutes: number }>;
  totalMinutes: number;
  tasks: { done: number; total: number };
}

interface ReportData {
  report: {
    month: string;
    summary: string;
    weakTypes: string[];
    detail: string | null;
  } | null;
}

function ProgressRing({ percent, size = 64 }: { percent: number; size?: number }) {
  const { t } = useTheme();
  const sw = 6;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.panel2} strokeWidth={sw} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={t.acc}
        strokeWidth={sw}
        fill="none"
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={circ * (1 - Math.min(percent, 100) / 100)}
        strokeLinecap="round"
        rotation="-90"
        originX={size / 2}
        originY={size / 2}
      />
    </Svg>
  );
}

export default function LearningScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const [weekly, setWeekly] = useState<WeeklyData | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<WeeklyData>("/api/mobile/learning/weekly"),
      apiFetch<ReportData>("/api/mobile/reports"),
    ])
      .then(([w, r]) => {
        setWeekly(w);
        setReport(r);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxMinutes = weekly
    ? Math.max(...weekly.bars.map((b) => b.minutes), 30)
    : 60;

  const taskPct =
    weekly && weekly.tasks.total > 0
      ? Math.round((weekly.tasks.done / weekly.tasks.total) * 100)
      : 0;

  const totalH = Math.floor((weekly?.totalMinutes ?? 0) / 60);
  const totalM = (weekly?.totalMinutes ?? 0) % 60;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={[styles.header, { borderBottomColor: t.line }]}>
        <Text style={[styles.title, { color: t.fg }]}>내 학습</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.acc} />
          </View>
        ) : (
          <>
            <SectionTitle label="이번 주 학습 시간" />
            <View style={[styles.barsBox, { backgroundColor: t.panel, borderColor: t.line }]}>
              <View style={styles.barsRow}>
                {weekly?.bars.map((bar) => (
                  <View key={bar.date} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            backgroundColor: bar.minutes > 0 ? t.acc : t.panel2,
                            height: `${Math.max((bar.minutes / maxMinutes) * 100, 4)}%` as `${number}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, { color: t.mut }]}>{bar.label}</Text>
                  </View>
                ))}
              </View>
              <Text style={[styles.totalMin, { color: t.mut }]}>
                이번 주 총{" "}
                <Text style={{ color: t.accText, fontWeight: "700" }}>
                  {totalH > 0 ? `${totalH}시간 ` : ""}
                  {totalM}분
                </Text>
              </Text>
            </View>

            <SectionTitle label="이번 주 과제" />
            <View style={[styles.taskBox, { backgroundColor: t.panel, borderColor: t.line }]}>
              <ProgressRing percent={taskPct} />
              <View>
                <Text style={[styles.taskPct, { color: t.accText }]}>{taskPct}%</Text>
                <Text style={[styles.taskSub, { color: t.mut }]}>
                  {weekly?.tasks.done ?? 0} / {weekly?.tasks.total ?? 0}개 완료
                </Text>
              </View>
            </View>

            {report?.report && (
              <>
                <SectionTitle label={`${report.report.month} 리포트`} />
                <Pressable
                  style={[styles.reportCard, { backgroundColor: t.panel, borderColor: t.line }]}
                  onPress={() => router.push(`/report/${report!.report!.month}`)}
                >
                  <View style={styles.reportTop}>
                    <Text style={[styles.reportMonth, { color: t.fg }]}>
                      {report.report.month}
                    </Text>
                    <ArrowUpRightIcon color={t.accText} size={18} />
                  </View>
                  <Text style={[styles.reportSummary, { color: t.mut }]} numberOfLines={3}>
                    {report.report.summary}
                  </Text>
                  {report.report.weakTypes.length > 0 && (
                    <View style={styles.chips}>
                      {report.report.weakTypes.slice(0, 3).map((w) => (
                        <View
                          key={w}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: accTint(t, 0.1),
                              borderColor: accTint(t, 0.2),
                            },
                          ]}
                        >
                          <Text style={[styles.chipText, { color: t.accText }]}>{w}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Pressable>
              </>
            )}

            {!report?.report && !loading && (
              <View style={[styles.emptyReport, { backgroundColor: t.panel, borderColor: t.line }]}>
                <Text style={[styles.emptyReportText, { color: t.mut }]}>
                  아직 월간 리포트가 없어요
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  center: { paddingTop: 80, alignItems: "center" },
  barsBox: { borderRadius: 16, borderWidth: 1, padding: 16, paddingBottom: 14 },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 100,
    gap: 6,
    marginBottom: 12,
  },
  barCol: { flex: 1, alignItems: "center", gap: 6 },
  barTrack: { flex: 1, width: "100%", justifyContent: "flex-end" },
  barFill: { width: "100%", borderRadius: 5 },
  barLabel: { fontSize: 11, fontWeight: "600" },
  totalMin: { fontSize: 13, textAlign: "center" },
  taskBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  taskPct: { fontSize: 26, fontWeight: "800", letterSpacing: -1 },
  taskSub: { fontSize: 13, marginTop: 3 },
  reportCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  reportTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  reportMonth: { fontSize: 16, fontWeight: "700" },
  reportSummary: { fontSize: 13.5, lineHeight: 20 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  chip: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { fontSize: 12, fontWeight: "600" },
  emptyReport: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 24,
    alignItems: "center",
    marginTop: 8,
  },
  emptyReportText: { fontSize: 14 },
});
