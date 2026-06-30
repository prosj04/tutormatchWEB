import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  appbar as appbarS,
  bars as barsS,
  card,
  font,
  scroll as scrollS,
  sectT as sectTS,
  tok as tokS,
  todo as todoS,
} from "../../styles/app-styles";
import { apiFetch } from "../../lib/api";
import { ANALYTICS_EVENTS, trackEvent } from "../../lib/analytics";
import { EMPTY_STATE_COPY } from "../../lib/student-journey";
import { ErrorState } from "../../components/ui/ErrorState";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

// ─── API types ────────────────────────────────────────────────────────────────
interface WeeklyData {
  weekStart: string;
  bars: { date: string; label: string; minutes: number }[];
  totalMinutes: number;
  tasks: { done: number; total: number };
  taskItems: { id: string; title: string; isDone: boolean }[];
}

interface TokenData {
  month: string;
  used: number;
  quota: number;
  remaining: number;
}

interface ReportData {
  report: {
    month: string;
    summary: string;
    weakTypes: string[];
    detail: string;
  } | null;
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function formatMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

function weekLabel(weekStart: string) {
  const d = new Date(weekStart);
  return `${d.getMonth() + 1}월 ${Math.ceil(d.getDate() / 7)}주`;
}

// ─── WeekBars (.bars) ────────────────────────────────────────────────────────
function WeekBars({ bars }: { bars: WeeklyData["bars"] }) {
  const { t } = useTheme();
  const maxMin = Math.max(...bars.map((b) => b.minutes), 1);
  return (
    <View style={[barsS.wrap]}>
      {bars.map(({ label, minutes }) => {
        const pct = Math.max((minutes / maxMin) * 100, minutes > 0 ? 4 : 0);
        const active = minutes > 0;
        return (
          <View key={label} style={barsS.col}>
            <View style={[barsS.fill, { height: `${pct}%`, backgroundColor: active ? t.acc : t.panel2 }]} />
            <Text style={[barsS.label, { color: active ? t.accText : t.mut }]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── TodoItem (.titem / .done) ────────────────────────────────────────────────
function TodoItem({ done, title, divider }: { done: boolean; title: string; divider?: boolean }) {
  const { t } = useTheme();
  return (
    <View style={[todoS.item, divider && { borderTopWidth: 1, borderTopColor: t.line }]}>
      <View style={[
        todoS.ck,
        { borderColor: done ? t.acc : t.line2, backgroundColor: done ? t.acc : "transparent" },
      ]}>
        {done && <Text style={{ color: t.onAcc, fontSize: 12, fontFamily: font.bold }}>✓</Text>}
      </View>
      <Text style={[todoS.gb, { color: done ? t.mut : t.fg, textDecorationLine: done ? "line-through" : "none", flex: 1 }]}>
        {title}
      </Text>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function LearningScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const [weekly, setWeekly] = useState<WeeklyData | null>(null);
  const [tokens, setTokens] = useState<TokenData | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    const mountAt = Date.now();
    try {
      const [w, tk, rp] = await Promise.all([
        apiFetch<WeeklyData>("/api/mobile/learning/weekly"),
        apiFetch<TokenData>("/api/mobile/me/tokens"),
        apiFetch<ReportData>("/api/mobile/reports"),
      ]);
      setWeekly(w);
      setTokens(tk);
      setReport(rp);
      console.log(`[perf] 학습탭 mount→render (3 parallel): ${Date.now() - mountAt}ms`);
      trackEvent(ANALYTICS_EVENTS.learningViewed);
      if ((w?.taskItems ?? []).length === 0) {
        trackEvent(ANALYTICS_EVENTS.learningEmptyTasksViewed);
      }
      if (!rp?.report) {
        trackEvent(ANALYTICS_EVENTS.learningEmptyReportViewed);
      }
    } catch {
      setWeekly(null);
      setTokens(null);
      setReport(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reportMonth = report?.report?.month;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <ScrollView contentContainerStyle={[scrollS, styles.content]} showsVerticalScrollIndicator={false}>
        <View style={appbarS.wrap}>
          <Text style={[appbarS.nm, styles.pageTitle, { color: t.fg }]}>내 학습</Text>
        </View>

        {loading && !weekly && !error ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.acc} />
          </View>
        ) : error ? (
          <ErrorState
            title="학습 데이터를 불러오지 못했어요"
            onRetry={() => void load()}
          />
        ) : (
          <>
            {/* 주간 학습 시간 */}
            <View style={[sectTS, styles.sectTRow, { marginTop: 0 }]}>
              <Text style={[styles.sectTText, { color: t.fg }]}>주간 학습 시간</Text>
              <Text style={[styles.sectTLink, { color: t.accText }]}>
                {weekly ? weekLabel(weekly.weekStart) : ""}
              </Text>
            </View>

            <View style={[card, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
              {weekly ? (
                <WeekBars bars={weekly.bars} />
              ) : (
                <View style={[barsS.wrap]}>
                  {["월","화","수","목","금","토","일"].map((d) => (
                    <View key={d} style={barsS.col}>
                      <View style={[barsS.fill, { height: "0%", backgroundColor: t.panel2 }]} />
                      <Text style={[barsS.label, { color: t.mut }]}>{d}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={[styles.barsSummary, { borderTopColor: t.line }]}>
                <Text style={[styles.barsSummaryText, { color: t.mut }]}>
                  이번 주{" "}
                  <Text style={{ color: t.fg, fontFamily: font.bold }}>
                    {weekly ? formatMinutes(weekly.totalMinutes) : "0분"}
                  </Text>
                </Text>
              </View>
            </View>

            {/* 이번 주 과제 */}
            <View style={[sectTS, styles.sectTRow]}>
              <Text style={[styles.sectTText, { color: t.fg }]}>이번 주 과제</Text>
              <Text style={[styles.sectTLink, { color: t.accText }]}>
                {weekly ? `${weekly.tasks.done}/${weekly.tasks.total}` : "0/0"}
              </Text>
            </View>

            <View style={[card, todoS.wrap, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
              {(weekly?.taskItems ?? []).length > 0 ? (
                (weekly!.taskItems).map((item, i) => (
                  <TodoItem key={item.id} done={item.isDone} title={item.title} divider={i > 0} />
                ))
              ) : (
                <View style={todoS.item}>
                  <Text style={[todoS.gb, { color: t.mut }]}>
                    {EMPTY_STATE_COPY.noWeekTasks.title} · {EMPTY_STATE_COPY.noWeekTasks.description}
                  </Text>
                </View>
              )}
            </View>

            {/* 리포트 */}
            <Text style={[sectTS, styles.sectT, { color: t.fg }]}>
              {report?.report ? `${report.report.month} 리포트` : "최신 리포트"}
            </Text>

            <View style={[card, styles.reportCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
              {report?.report ? (
                <>
                  <Text style={[styles.reportTitle, { color: t.fg }]}>취약 유형 분석</Text>
                  <Text style={[styles.reportBody, { color: t.mut }]}>
                    {report.report.weakTypes.length > 0 ? (
                      <>
                        <Text style={{ color: t.accText, fontFamily: font.bold }}>
                          {report.report.weakTypes[0]}
                        </Text>
                        {"에서 실수가 잦아요. "}
                        {report.report.summary}
                      </>
                    ) : (
                      report.report.summary
                    )}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.reportTitle, { color: t.mut }]}>{EMPTY_STATE_COPY.noReport.title}</Text>
                  <Text style={[styles.reportBody, { color: t.mut }]}>
                    {EMPTY_STATE_COPY.noReport.description}
                  </Text>
                </>
              )}
              <View style={styles.reportActions}>
                {["선생님 코멘트", "학습 계획", "리포트 보기"].map((label) => (
                  <Pressable
                    key={label}
                    style={[styles.reportBtn, { backgroundColor: t.panel2, borderColor: t.line }]}
                    onPress={
                      label === "리포트 보기" && reportMonth
                        ? () => router.push(`/report/${reportMonth}` as Parameters<typeof router.push>[0])
                        : undefined
                    }
                  >
                    <Text style={[styles.reportBtnText, { color: t.fg }]}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* AI 질답 토큰 */}
            <View style={[card, tokS.wrap, styles.tokCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
              <View style={[tokS.ic, { backgroundColor: accTint(t, 0.12) }]}>
                <Text style={{ fontSize: 18 }}>✨</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[tokS.b, { color: t.fg }]}>AI 질답 토큰</Text>
                <Text style={[tokS.p, { color: t.mut }]}>이번 달 남은 질문</Text>
              </View>
              <Text style={[tokS.n as any, { color: t.accText }]}>
                {tokens ? tokens.remaining : "준비 중"}
              </Text>
            </View>

            <View style={{ height: 6 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 8 },
  center: { paddingTop: 80, alignItems: "center" },

  pageTitle: { fontSize: 22, letterSpacing: -0.44 },

  sectT: { fontSize: 14 },
  sectTRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
    marginHorizontal: 2,
    marginTop: 20,
  },
  sectTText: { fontFamily: font.bold, fontSize: 14, letterSpacing: -0.28, flex: 1 },
  sectTLink: { fontSize: 12.5, fontFamily: font.semibold },

  barsSummary: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, borderTopWidth: 1 },
  barsSummaryText: { fontSize: 12.5 },

  reportCard: { padding: 16 },
  reportTitle: { fontSize: 15, fontFamily: font.bold },
  reportBody: { fontSize: 13, lineHeight: 21, marginTop: 11 },
  reportActions: { flexDirection: "row", gap: 8, marginTop: 13, flexWrap: "wrap" },
  reportBtn: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  reportBtnText: { fontSize: 12.5, fontFamily: font.semibold },

  tokCard: { marginTop: 11 },
});
