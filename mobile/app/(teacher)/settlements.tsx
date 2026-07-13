import { SafeAreaView } from "react-native-safe-area-context";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  card as cardS,
  font,
  scroll as scrollS,
  sectT as sectTS,
} from "../../styles/app-styles";
import { ErrorState } from "../../components/ui/ErrorState";
import { SubHead } from "../../components/ui/SubHead";
import { InfoCircleIcon } from "../../components/teacher/TeacherIcons";
import { apiFetch } from "../../lib/api";
import { won } from "../../lib/format";
import { useTheme } from "../../theme/ThemeProvider";

interface SettlementLesson {
  id: string;
  date: string;
  subject: string;
  studentName: string;
  durationMin: number;
  needsReview?: boolean;
}

interface SettlementResponse {
  year: number;
  month: number;
  hourlyRateKrw: number;
  lessonCount: number;
  totalMinutes: number;
  totalHours: number;
  payoutKrw: number;
  needsReview?: number;
  lessons: SettlementLesson[];
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** 서버 KST 현재월(year/month) 앵커에서 최근 12개월 키(YYYY-MM). */
function recentMonthsFrom(year: number, month: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(year, month - 1 - i, 1);
    out.push(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}`);
  }
  return out;
}


function formatLessonDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]}) ${pad2(
    d.getHours(),
  )}:${pad2(d.getMinutes())}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return `${y}년 ${Number(m)}월`;
}

export default function TeacherSettlementsScreen() {
  const { t, mode } = useTheme();
  const warnColor = mode === "dark" ? "#e8c56b" : "#92610a";

  // month 미선택(빈 문자열)이면 서버가 KST 현재월로 응답 → 그 값으로 초기화.
  const [month, setMonth] = useState("");
  // 첫 응답에서 확정된 서버 KST 현재월. 옵션 목록의 안정적 앵커.
  const [currentMonth, setCurrentMonth] = useState<{ year: number; month: number } | null>(null);
  const [data, setData] = useState<SettlementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const query = month ? `?month=${month}` : "";
      const json = await apiFetch<SettlementResponse>(
        `/api/mobile/teacher/settlements${query}`,
      );
      setData(json);
      if (!month) {
        setCurrentMonth({ year: json.year, month: json.month });
        setMonth(`${json.year}-${pad2(json.month)}`);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  const months = useMemo(() => {
    if (!currentMonth) return [] as string[];
    return recentMonthsFrom(currentMonth.year, currentMonth.month);
  }, [currentMonth]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={scrollS} showsVerticalScrollIndicator={false}>
        <SubHead title="정산" />

        {/* 월 선택 */}
        {months.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.monthRow}
          >
            {months.map((m) => {
              const on = m === month;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMonth(m)}
                  style={[
                    styles.monthChip,
                    { backgroundColor: on ? t.acc : t.panel, borderColor: on ? "transparent" : t.line2 },
                  ]}
                >
                  <Text style={[styles.monthChipText, { color: on ? t.onAcc : t.fg }]}>
                    {monthLabel(m)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {loading && !data ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.acc} />
          </View>
        ) : error ? (
          <ErrorState title="정산 내역을 불러오지 못했어요" onRetry={() => void load()} />
        ) : !data ? null : (
          <>
            {/* KPI */}
            <View style={styles.kpiRow}>
              <View style={[cardS, styles.kpi, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
                <Text style={[styles.kpiNum, { color: t.fg }]}>{data.lessonCount}</Text>
                <Text style={[styles.kpiLabel, { color: t.mut }]}>완료 수업</Text>
              </View>
              <View style={[cardS, styles.kpi, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
                <Text style={[styles.kpiNum, { color: t.fg }]}>
                  {data.totalHours}
                  <Text style={styles.kpiUnit}>시간</Text>
                </Text>
                <Text style={[styles.kpiLabel, { color: t.mut }]}>총 수업 시간</Text>
              </View>
              <View style={[cardS, styles.kpi, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
                <Text style={[styles.kpiNumSm, { color: t.fg }]}>{won(data.payoutKrw)}</Text>
                <Text style={[styles.kpiLabel, { color: t.mut }]}>정산 합계</Text>
              </View>
            </View>

            {data.needsReview && data.needsReview > 0 ? (
              <View style={[styles.banner, { backgroundColor: "rgba(217,119,6,0.1)", borderColor: "rgba(217,119,6,0.25)" }]}>
                <InfoCircleIcon color={warnColor} size={17} />
                <Text style={[styles.bannerText, { color: warnColor }]}>
                  수업 시간이 0분으로 기록된 {data.needsReview}건은 정산 합계에서 제외됐어요. 관리자 검토 후 반영됩니다.
                </Text>
              </View>
            ) : null}

            <Text style={[sectTS, { color: t.fg }]}>완료 수업 내역</Text>
            {data.lessons.length === 0 ? (
              <View style={[cardS, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
                <View style={styles.emptyRow}>
                  <Text style={[styles.emptyText, { color: t.mut }]}>이 달에 완료된 수업이 없습니다.</Text>
                </View>
              </View>
            ) : (
              <View style={[cardS, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
                {data.lessons.map((l, i) => (
                  <View
                    key={l.id}
                    style={[styles.lrow, i > 0 && { borderTopWidth: 1, borderTopColor: t.line }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.lrowTitle, { color: t.fg }]}>{formatLessonDate(l.date)}</Text>
                      <Text style={[styles.lrowSub, { color: t.mut }]}>
                        {l.studentName} · {l.subject}
                        {l.needsReview ? "  · 검토 필요" : ""}
                      </Text>
                    </View>
                    <Text style={[styles.lrowDur, { color: t.fg }]}>{l.durationMin}분</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={[styles.banner, { backgroundColor: "rgba(0,0,0,0)", borderColor: t.line2, marginTop: 14 }]}>
              <InfoCircleIcon color={t.accText} size={17} />
              <Text style={[styles.bannerText, { color: t.mut }]}>
                완료된 수업 기준 조회 전용 내역이에요. 시급 {won(data.hourlyRateKrw)} × 수업 시간으로 계산됩니다.
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

  monthRow: { gap: 8, paddingBottom: 14, paddingRight: 4 },
  monthChip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  monthChipText: { fontSize: 13, fontFamily: font.semibold },

  kpiRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  kpi: { flex: 1, paddingVertical: 16, paddingHorizontal: 10, alignItems: "flex-start" },
  kpiNum: { fontSize: 22, fontFamily: font.extrabold },
  kpiNumSm: { fontSize: 15, fontFamily: font.extrabold },
  kpiUnit: { fontSize: 12, fontFamily: font.bold },
  kpiLabel: { fontSize: 11.5, fontFamily: font.medium, marginTop: 4 },

  emptyRow: { paddingVertical: 16, paddingHorizontal: 16 },
  emptyText: { fontSize: 13, fontFamily: font.medium },

  lrow: { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 16 },
  lrowTitle: { fontSize: 13.5, fontFamily: font.bold },
  lrowSub: { fontSize: 12, fontFamily: font.medium, marginTop: 3 },
  lrowDur: { fontSize: 13.5, fontFamily: font.extrabold, marginLeft: 10 },

  banner: {
    flexDirection: "row",
    gap: 11,
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 4,
  },
  bannerText: { flex: 1, fontSize: 12.5, lineHeight: 19 },
});
