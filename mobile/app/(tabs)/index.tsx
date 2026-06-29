import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

import {
  appbar as appbarS,
  card,
  font,
  iconbtn,
  iconbtnBadge,
  lrow as lrowS,
  now as nowS,
  qa as qaS,
  ringCard as ringCardS,
  scroll as scrollS,
  sectT as sectTS,
  shadowSm,
} from "../../styles/app-styles";
import { apiFetch } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

interface HomeData {
  greetingName: string;
  unreadCount: number;
  todayLesson: {
    id: string;
    subject: string;
    topic: string;
    startAt: string;
    teacher: { id: string; name: string };
  } | null;
  upcoming: Array<{
    id: string;
    subject: string;
    startAt: string;
    teacher: { id: string; name: string };
    note?: string;
  }>;
  lessons: Array<{ subject: string; teacher: string; frequency: string }>;
  weekProgress: { done: number; total: number; percent: number };
}

// ─── ProgressRing (react-native-svg 기반) ─────────────────────────────────────
// .ring { width:74; height:74; border-radius:37; }
// .ring i { width:56; height:56; border-radius:28; font-size:17; font-weight:800; }
function ProgressRing({ percent }: { percent: number }) {
  const { t } = useTheme();
  const size = ringCardS.ring.width as number;   // 74
  const inner = ringCardS.inner.width as number; // 56
  const sw = (size - inner) / 2;                 // 9
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <View style={styles.ringWrap}>
      <Svg width={size} height={size}>
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
      {/* inner circle */}
      <View style={[styles.ringInner, { backgroundColor: t.panel }]}>
        <Text style={[ringCardS.inner, styles.ringPct, { color: t.accText }]}>{percent}%</Text>
      </View>
    </View>
  );
}

function pad(n: number) { return n.toString().padStart(2, "0"); }
function formatTime(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const DOW = ["일", "월", "화", "수", "목", "금", "토"];
function formatDay(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]})`;
}

export default function HomeScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<HomeData>("/api/mobile/home")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const QUICK = [
    { label: "상담", onPress: () => router.push("/consult") },
    { label: "리포트", onPress: () => router.push("/(tabs)/learning") },
    { label: "질문", onPress: () => router.push("/(tabs)/qna") },
    { label: "구독", onPress: () => router.push("/billing") },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <ScrollView
        contentContainerStyle={[scrollS, styles.scrollContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* .appbar flex-row align:center gap:12 padding:8 2 16 */}
        <View style={appbarS.wrap}>
          <View style={styles.greetBlock}>
            {/* .hi font-size:12 font-weight:600 */}
            <Text style={[appbarS.hi, { color: t.mut }]}>
              {loading || !data ? "안녕하세요 👋" : `안녕하세요 👋`}
            </Text>
            {/* .nm font-size:19 font-weight:800 letter-spacing:-.03em margin-top:1 */}
            <Text style={[appbarS.nm, { color: t.fg }]}>
              {data?.greetingName ?? "학부모님"}
            </Text>
          </View>
          {/* .iconbtn width:40 height:40 border-radius:12 border:1px */}
          <Pressable
            style={[iconbtn, { backgroundColor: t.panel, borderColor: t.line }]}
            onPress={() => router.push("/notifications")}
          >
            <Text style={{ fontSize: 18 }}>🔔</Text>
            {/* .iconbtn .badge top:7 right:8 width:8 height:8 border-radius:4 */}
            {(data?.unreadCount ?? 0) > 0 && (
              <View style={[iconbtnBadge, { backgroundColor: t.acc }]} />
            )}
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.acc} />
          </View>
        ) : (
          <>
            {/* .now padding:18 border-radius:22 gradient(acc→acc-press) shadow:0 12 26 acc/.32 */}
            <View style={[nowS.wrap, styles.nowShadow, { shadowColor: t.acc, backgroundColor: t.acc }]}>
              {/* .now .k font-size:11.5 font-weight:700 letter-spacing:.08em uppercase opacity:.85 */}
              <Text style={[nowS.k, { color: t.onAcc }]}>오늘 수업</Text>

              {data?.todayLesson ? (
                <>
                  {/* .now .row flex-row align:center gap:12 margin-top:12 */}
                  <View style={nowS.row}>
                    {/* .now .av width:46 height:46 border-radius:14 bg:rgba(255,255,255,.2) */}
                    <View style={[nowS.av, styles.nowAv]}>
                      <Text style={[styles.nowAvText, { color: t.onAcc }]}>
                        {data.todayLesson.teacher.name[0]}
                      </Text>
                    </View>
                    <View>
                      {/* .now .nm font-size:17 font-weight:800 letter-spacing:-.02em */}
                      <Text style={[nowS.nm, { color: t.onAcc }]}>
                        {data.todayLesson.teacher.name}
                      </Text>
                      {/* .now .meta font-size:13 opacity:.9 margin-top:1 */}
                      <Text style={[nowS.meta, { color: t.onAcc }]}>
                        {data.todayLesson.subject} · {data.todayLesson.topic}
                      </Text>
                    </View>
                    {/* .when margin-left:auto align:flex-end gap:3 */}
                    <View style={nowS.when}>
                      {/* .wd font-size:12.5 font-weight:700 opacity:.92 */}
                      <Text style={[nowS.wd, { color: t.onAcc }]}>
                        {formatDay(data.todayLesson.startAt)}
                      </Text>
                      {/* .wt font-size:22 font-weight:800 letter-spacing:-.01em tabular-nums line-height:1 */}
                      <Text style={[nowS.wt as any, { color: t.onAcc }]}>
                        {formatTime(data.todayLesson.startAt)}
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                /* .now-foot — 빈 상태: 이유 + 다음 행동 */
                <View style={nowS.foot}>
                  <Text style={{ color: t.onAcc, fontSize: 13, opacity: 0.92 }}>
                    아직 배정된 수업이 없어요
                  </Text>
                  <Pressable
                    style={styles.nowCta}
                    onPress={() => router.push("/consult")}
                  >
                    <Text style={[styles.nowCtaText, { color: t.onAcc }]}>
                      상담 진행 상태 보기 ›
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* .sect-t 이번 주 학습 */}
            <Text style={[sectTS, styles.sectT, { color: t.fg }]}>이번 주 학습</Text>

            {/* .card .ring-card flex-row align:center gap:16 padding:16 18 */}
            <View style={[card, ringCardS.wrap, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
              <ProgressRing percent={data?.weekProgress.percent ?? 0} />
              <View style={styles.ringText}>
                {/* .ring-card .t b font-size:15 font-weight:700 letter-spacing:-.02em */}
                <Text style={[ringCardS.tb, { color: t.fg }]}>
                  목표 달성률 {data?.weekProgress.percent ?? 0}%
                </Text>
                {/* .ring-card .t p font-size:12.5 margin-top:3 */}
                <Text style={[ringCardS.tp, { color: t.mut }]}>
                  과제 {data?.weekProgress.total ?? 0}개 중 {data?.weekProgress.done ?? 0}개 완료 · 좋은 흐름이에요
                </Text>
              </View>
            </View>

            {/* .sect-t 바로가기 */}
            <Text style={[sectTS, styles.sectT, { color: t.fg }]}>바로가기</Text>

            {/* .qa grid 4cols gap:9 */}
            <View style={qaS.grid}>
              {QUICK.map(({ label, onPress }) => (
                <Pressable
                  key={label}
                  style={[qaS.btn, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}
                  onPress={onPress}
                >
                  {/* .qa .ic width:34 height:34 border-radius:11 */}
                  <View style={[qaS.ic, { backgroundColor: accTint(t, 0.10) }]}>
                    <Text style={{ fontSize: 16 }}>
                      {label === "상담" ? "💬" : label === "리포트" ? "📄" : label === "질문" ? "❓" : "💳"}
                    </Text>
                  </View>
                  {/* .qa span font-size:11 font-weight:600 */}
                  <Text style={[qaS.label, { color: t.fg }]}>{label}</Text>
                </Pressable>
              ))}
            </View>

            {/* .sect-t 내 수업 + 전체 링크 */}
            <View style={[sectTS, styles.sectTRow, { marginTop: 20 }]}>
              <Text style={[styles.sectTText, { color: t.fg }]}>내 수업</Text>
              <Text style={[styles.sectTLink, { color: t.accText }]}>전체</Text>
            </View>

            {/* .card (lrow list) */}
            <View style={[card, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
              {(data?.lessons ?? [
                { subject: "수학", teacher: "Teacher Noah", frequency: "주 2회" },
                { subject: "영어", teacher: "Teacher Olivia", frequency: "주 1회" },
              ]).map((lesson, i) => (
                <View
                  key={lesson.subject}
                  style={[lrowS.wrap, i > 0 && { borderTopWidth: 1, borderTopColor: t.line }]}
                >
                  {/* .lrow .av width:42 height:42 border-radius:12 */}
                  <View style={[lrowS.av, { backgroundColor: accTint(t, 0.12), borderRadius: 10 }]}>
                    <Text style={[styles.lrowAvText, { color: t.accText }]}>
                      {lesson.subject[0]}
                    </Text>
                  </View>
                  <View style={lrowS.g}>
                    <Text style={[lrowS.gb, { color: t.fg }]}>{lesson.subject}</Text>
                    <Text style={[lrowS.gp, { color: t.mut }]}>{lesson.teacher} · {lesson.frequency}</Text>
                  </View>
                  <Text style={[styles.chev, { color: t.mut2 }]}>›</Text>
                </View>
              ))}
            </View>

            {/* .sect-t 다가오는 일정 + 전체 */}
            <View style={[sectTS, styles.sectTRow, { marginTop: 20 }]}>
              <Text style={[styles.sectTText, { color: t.fg }]}>다가오는 일정</Text>
              <Text style={[styles.sectTLink, { color: t.accText }]}>전체</Text>
            </View>

            {/* .card (lrow list) */}
            <View style={[card, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
              {(data?.upcoming ?? [
                { id: "1", subject: "영어", teacher: { name: "Teacher Olivia" }, startAt: new Date(Date.now() + 86400000).toISOString(), note: "독해 첨삭" },
                { id: "2", subject: "매니저 상담", teacher: { name: "매니저" }, startAt: new Date(Date.now() + 3 * 86400000).toISOString(), note: "전화" },
              ]).map((item, i) => (
                <View
                  key={item.id}
                  style={[lrowS.wrap, i > 0 && { borderTopWidth: 1, borderTopColor: t.line }]}
                >
                  <View style={[lrowS.av, { backgroundColor: accTint(t, 0.12) }]}>
                    <Text style={[styles.lrowAvText, { color: t.accText }]}>
                      {item.teacher.name[0]}
                    </Text>
                  </View>
                  <View style={lrowS.g}>
                    <Text style={[lrowS.gb, { color: t.fg }]}>
                      {item.teacher.name} · {item.subject}
                    </Text>
                    <Text style={[lrowS.gp, { color: t.mut }]}>
                      {formatDay(item.startAt)} {formatTime(item.startAt)}
                      {(item as any).note ? ` · ${(item as any).note}` : ""}
                    </Text>
                  </View>
                  <Text style={[lrowS.r as any, { color: t.accText }]}>
                    D-{Math.ceil((new Date(item.startAt).getTime() - Date.now()) / 86400000)}
                  </Text>
                </View>
              ))}
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
  scrollContent: { paddingBottom: 8 },

  greetBlock: { flex: 1 },
  center: { paddingTop: 80, alignItems: "center" },

  // .now shadow:0 12 26 acc/.32
  nowShadow: {
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 26,
    shadowOpacity: 0.32,
    elevation: 10,
  },

  // .now .av bg:rgba(255,255,255,.2)
  nowAv: { backgroundColor: "rgba(255,255,255,0.2)" },
  nowAvText: { fontFamily: font.extrabold, fontSize: 16 },

  // 빈 상태 CTA (오늘 수업 없음)
  nowCta: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  nowCtaText: { fontSize: 12.5, fontFamily: font.bold },

  // .sect-t row (with link)
  sectT: { fontSize: 14 },
  sectTRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
    marginHorizontal: 2,
  },
  sectTText: { fontFamily: font.bold, fontSize: 14, letterSpacing: -0.28, flex: 1 },
  // .sect-t a margin-left:auto font-size:12.5 font-weight:600 color:acc-text
  sectTLink: { fontSize: 12.5, fontFamily: font.semibold },

  // ring wrap for overlay
  ringWrap: { width: 74, height: 74, position: "relative" },
  ringInner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 37,
    margin: 9,
  },
  ringPct: { fontSize: 14, fontFamily: font.extrabold },
  ringText: { flex: 1 },

  // lrow avatar text
  lrowAvText: { fontFamily: font.bold, fontSize: 14 },

  chev: { fontSize: 20, fontFamily: font.bold },
});
