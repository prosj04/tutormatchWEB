import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

// ─── 주간 바 차트 (.bars) ─────────────────────────────────────────────────────
// .bars { flex-row; align:flex-end; gap:9; height:96; padding:14 16 0; }
// .bars .b { flex:1; flex-col; align:center; gap:7; height:100%; justify:flex-end; }
// .bars .b i { width:100%; border-radius:6 6 3 3; } — .on uses acc, others panel-2
// .bars .b span { font-size:10.5; }
const WEEK_BARS = [
  { day: "월", pct: 40, active: false },
  { day: "화", pct: 62, active: false },
  { day: "수", pct: 85, active: true },
  { day: "목", pct: 55, active: false },
  { day: "금", pct: 95, active: true },
  { day: "토", pct: 30, active: false },
  { day: "일", pct: 48, active: false },
];

function WeekBars() {
  const { t } = useTheme();
  return (
    <View style={[barsS.wrap]}>
      {WEEK_BARS.map(({ day, pct, active }) => (
        <View key={day} style={barsS.col}>
          <View
            style={[
              barsS.fill,
              { height: `${pct}%`, backgroundColor: active ? t.acc : t.panel2 },
            ]}
          />
          <Text style={[barsS.label, { color: active ? t.accText : t.mut }]}>{day}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── 할일 항목 (.titem / .done) ───────────────────────────────────────────────
// .titem { flex-row; align:center; gap:12; padding:11 12; }
// .ck { width:22; height:22; border-radius:7; border:2px; }
// .titem.done .ck { bg:acc; border-color:acc; }
// .titem .g b { font-size:13.5; font-weight:600; }
// .titem .g p { font-size:11.5; margin-top:1; }
function TodoItem({ done, title, sub, divider }: { done: boolean; title: string; sub: string; divider?: boolean }) {
  const { t } = useTheme();
  return (
    <View style={[todoS.item, divider && { borderTopWidth: 1, borderTopColor: t.line }]}>
      <View style={[
        todoS.ck,
        { borderColor: done ? t.acc : t.line2, backgroundColor: done ? t.acc : "transparent" },
      ]}>
        {done && <Text style={{ color: t.onAcc, fontSize: 12, fontFamily: font.bold }}>✓</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[todoS.gb, { color: done ? t.mut : t.fg, textDecorationLine: done ? "line-through" : "none" }]}>{title}</Text>
        <Text style={[todoS.gp, { color: t.mut2 }]}>{sub}</Text>
      </View>
    </View>
  );
}

const TODOS = [
  { done: true, title: "미적분 4단원 문제 1–20", sub: "수학 · Teacher Noah" },
  { done: true, title: "오답노트 정리", sub: "수학 · Teacher Noah" },
  { done: false, title: "영어 지문 독해 3편", sub: "영어 · Teacher Olivia" },
];

export default function LearningScreen() {
  const { t } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <ScrollView contentContainerStyle={[scrollS, styles.content]} showsVerticalScrollIndicator={false}>
        {/* .appbar .nm font-size:22 */}
        <View style={appbarS.wrap}>
          <Text style={[appbarS.nm, styles.pageTitle, { color: t.fg }]}>내 학습</Text>
        </View>

        {/* .sect-t 주간 학습 시간 + 날짜 링크 */}
        <View style={[sectTS, styles.sectTRow, { marginTop: 0 }]}>
          <Text style={[styles.sectTText, { color: t.fg }]}>주간 학습 시간</Text>
          <Text style={[styles.sectTLink, { color: t.accText }]}>9월 3주</Text>
        </View>

        {/* .card bars chart */}
        <View style={[card, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
          <WeekBars />
          {/* summary row padding:12 16 14 font-size:12.5 border-top:1px */}
          <View style={[styles.barsSummary, { borderTopColor: t.line }]}>
            <Text style={[styles.barsSummaryText, { color: t.mut }]}>
              이번 주 <Text style={{ color: t.fg, fontFamily: font.bold }}>8시간 20분</Text> · 지난주보다 +1h 10m
            </Text>
          </View>
        </View>

        {/* .sect-t 이번 주 과제 + count link */}
        <View style={[sectTS, styles.sectTRow]}>
          <Text style={[styles.sectTText, { color: t.fg }]}>이번 주 과제</Text>
          <Text style={[styles.sectTLink, { color: t.accText }]}>5/7</Text>
        </View>

        {/* .card .todo */}
        <View style={[card, todoS.wrap, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
          {TODOS.map((item, i) => (
            <TodoItem key={item.title} {...item} divider={i > 0} />
          ))}
        </View>

        {/* .sect-t 9월 리포트 */}
        <Text style={[sectTS, styles.sectT, { color: t.fg }]}>9월 리포트</Text>

        {/* report summary card */}
        <View style={[card, styles.reportCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
          <Text style={[styles.reportTitle, { color: t.fg }]}>취약 유형 분석</Text>
          <Text style={[styles.reportBody, { color: t.mut }]}>
            <Text style={{ color: t.accText, fontFamily: font.bold }}>미적분 활용 문제</Text>
            에서 실수가 잦아요. 다음 주 집중 보강 예정.
          </Text>
          <View style={styles.reportActions}>
            {["선생님 코멘트", "학습 계획", "리포트 보기"].map((label) => (
              <Pressable
                key={label}
                style={[styles.reportBtn, { backgroundColor: t.panel2, borderColor: t.line }]}
              >
                <Text style={[styles.reportBtnText, { color: t.fg }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* .card .tok AI 질답 토큰 */}
        <View style={[card, tokS.wrap, styles.tokCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
          {/* .tok .ic width:38 height:38 border-radius:12 */}
          <View style={[tokS.ic, { backgroundColor: accTint(t, 0.12) }]}>
            <Text style={{ fontSize: 18 }}>✨</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[tokS.b, { color: t.fg }]}>AI 질답 토큰</Text>
            <Text style={[tokS.p, { color: t.mut }]}>이번 달 남은 질문</Text>
          </View>
          {/* .tok .n font-size:19 font-weight:800 tabular-nums color:acc-text */}
          <Text style={[tokS.n as any, { color: t.accText }]}>42</Text>
        </View>

        <View style={{ height: 6 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 8 },

  // .appbar .nm font-size:22
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

  // bars summary padding:12 16 14 font-size:12.5 border-top:1px
  barsSummary: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
  },
  barsSummaryText: { fontSize: 12.5 },

  reportCard: { padding: 16 },
  reportTitle: { fontSize: 15, fontFamily: font.bold },
  reportBody: { fontSize: 13, lineHeight: 21, marginTop: 11 },
  reportActions: { flexDirection: "row", gap: 8, marginTop: 13, flexWrap: "wrap" },
  reportBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  reportBtnText: { fontSize: 12.5, fontFamily: font.semibold },

  tokCard: { marginTop: 11 },
});
