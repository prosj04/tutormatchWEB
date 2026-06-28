import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import {
  bars as barsS,
  card,
  font,
  ringCard as ringCardS,
  scroll as scrollS,
  scrow as scrowS,
  sectT as sectTS,
} from "../../styles/app-styles";
import { SubHead } from "../../components/ui/SubHead";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

// ─── ProgressRing ─────────────────────────────────────────────────────────────
// .ring { width:74; height:74; border-radius:37; }
// .ring i { width:56; height:56; border-radius:28; font-weight:800; font-size:17; bg:panel; }
// CSS draws the ring via conic-gradient; RN uses SVG stroke.
function ProgressRing({ percent }: { percent: number }) {
  const { t } = useTheme();
  const size = 74;
  const sw = 9;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <View style={[ringCardS.ring, { position: "relative", alignItems: "center", justifyContent: "center" }]}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.panel2} strokeWidth={sw} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={t.acc} strokeWidth={sw} fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={circ * (1 - Math.min(percent, 100) / 100)}
          strokeLinecap="round"
          rotation="-90"
          originX={size / 2} originY={size / 2}
        />
      </Svg>
      {/* .ring i */}
      <View style={[ringCardS.inner, { backgroundColor: t.panel }]}>
        <Text style={[styles.ringScore, { color: t.fg }]}>{percent}점</Text>
      </View>
    </View>
  );
}

// ─── ScRow 과목별 변화 행 (.scrow) ────────────────────────────────────────────
// .scrow { flex-row; align:center; gap:12; padding:14 16; }
// .scrow .sj { font-size:13.5; font-weight:700; flex:1; }
// .scrow .ch { flex-row; align:baseline; gap:6; tabular-nums; font-size:13; color:mut-2; }
// .scrow .ch b { font-size:16; font-weight:800; color:fg; }
// .scrow .up { font-weight:700; font-size:12; margin-left:8; gap:2; color:acc-text; }
function ScRow({ subject, from, to, up, divider }: {
  subject: string; from: number; to: number; up: number; divider?: boolean;
}) {
  const { t } = useTheme();
  return (
    <View style={[scrowS.wrap, divider && { borderTopWidth: 1, borderTopColor: t.line }]}>
      <Text style={[scrowS.sj, { color: t.fg }]}>{subject}</Text>
      <View style={[scrowS.ch as any]}>
        <Text style={{ color: t.mut2, fontSize: 13 }}>{from} →</Text>
        <Text style={[scrowS.chB, { color: t.fg }]}>{to}</Text>
      </View>
      <View style={[scrowS.up]}>
        {/* ↑ arrow as unicode to avoid SVG complexity */}
        <Text style={{ color: t.accText, fontSize: 11, fontFamily: font.bold }}>↑</Text>
        <Text style={{ color: t.accText, fontSize: 12, fontFamily: font.bold }}>{up}</Text>
      </View>
    </View>
  );
}

// ─── WeekBars 주간 학습 시간 (4-bar variant for month view) ───────────────────
const MONTH_BARS = [
  { label: "1주", pct: 45, active: false },
  { label: "2주", pct: 60, active: false },
  { label: "3주", pct: 78, active: true },
  { label: "4주", pct: 92, active: true },
];

function WeekBars() {
  const { t } = useTheme();
  return (
    <View style={[barsS.wrap]}>
      {MONTH_BARS.map(({ label, pct, active }) => (
        <View key={label} style={barsS.col}>
          <View style={[barsS.fill, { height: `${pct}%`, backgroundColor: active ? t.acc : t.panel2 }]} />
          <Text style={[barsS.label, { color: active ? t.accText : t.mut }]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ReportScreen() {
  const { t } = useTheme();
  // id is used for future API integration (e.g. "2026-09")
  const { id: _id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <ScrollView contentContainerStyle={[scrollS, styles.content]} showsVerticalScrollIndicator={false}>
        <SubHead title="9월 학습 리포트" actionLabel="공유" />

        {/* .card .ring-card — 종합 학습 점수 */}
        <View style={[card, ringCardS.wrap, { backgroundColor: t.panel, borderColor: t.line }]}>
          <ProgressRing percent={82} />
          <View style={{ flex: 1 }}>
            <Text style={[ringCardS.tb, { color: t.fg }]}>종합 학습 점수 82</Text>
            <Text style={[ringCardS.tp, { color: t.mut }]}>지난달 74 → 8점 상승</Text>
          </View>
        </View>

        {/* .sect-t 과목별 변화 */}
        <Text style={[sectTS, styles.sectT, { color: t.fg }]}>과목별 변화</Text>

        {/* .card .scrow list */}
        <View style={[card, styles.scrowCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
          <ScRow subject="수학" from={78} to={89} up={11} />
          <ScRow subject="영어" from={71} to={78} up={7} divider />
        </View>

        {/* .sect-t 주간 학습 시간 */}
        <Text style={[sectTS, styles.sectT, { color: t.fg }]}>주간 학습 시간</Text>

        {/* .card .bars */}
        <View style={[card, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
          <WeekBars />
          <View style={[styles.barsSummary, { borderTopColor: t.line }]}>
            <Text style={[styles.barsSummaryText, { color: t.mut }]}>
              9월 총 <Text style={{ color: t.fg, fontFamily: font.bold }}>34시간 20분</Text> · 꾸준히 증가
            </Text>
          </View>
        </View>

        {/* .sect-t 선생님 코멘트 */}
        <Text style={[sectTS, styles.sectT, { color: t.fg }]}>선생님 코멘트</Text>

        {/* teacher comment card */}
        <View style={[card, styles.commentCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
          <View style={styles.commentHeader}>
            <View style={[styles.commentAv, { backgroundColor: accTint(t, 0.14) }]}>
              <Text style={[styles.commentAvText, { color: t.accText }]}>N</Text>
            </View>
            <Text style={[styles.commentName, { color: t.fg }]}>Teacher Noah · 수학</Text>
          </View>
          <Text style={[styles.commentBody, { color: t.mut }]}>
            미적분 활용 문제 정답률이 눈에 띄게 올랐어요. 다음 달엔 킬러 문항 접근법을 집중적으로 다뤄볼게요. 지금처럼만 하면 충분히 더 올라갑니다.
          </Text>
        </View>

        <View style={{ height: 6 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 8 },

  sectT: { fontSize: 14 },

  // .ring i score text: font-size:17 font-weight:800
  ringScore: { fontSize: 17, fontFamily: font.extrabold },

  scrowCard: { overflow: "hidden" },

  // bars summary: padding:12 16 14; font-size:12.5; border-top:1px
  barsSummary: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
  },
  barsSummaryText: { fontSize: 12.5 },

  // teacher comment: padding:15 16
  commentCard: { padding: 15, paddingHorizontal: 16 },
  commentHeader: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 10 },
  // av: width:34 height:34 border-radius:10
  commentAv: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  commentAvText: { fontSize: 13, fontFamily: font.bold },
  commentName: { fontSize: 13.5, fontFamily: font.bold },
  // body: font-size:13; line-height:1.65 → 21.45
  commentBody: { fontSize: 13, lineHeight: 21.45 },
});
