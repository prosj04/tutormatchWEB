import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import {
  BellIcon,
  CardIcon,
  ChatIcon,
  DocumentIcon,
  QuestionIcon,
} from "../../components/ui/Icons";

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
} from "../../styles/app-styles";
import { apiFetch } from "../../lib/api";
import { ANALYTICS_EVENTS, trackEvent } from "../../lib/analytics";
import { EMPTY_STATE_COPY } from "../../lib/student-journey";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

type CheckinItem = { id: string; trigger: string; requestedAt: string };

function CheckinCard({ checkin, onDone }: { checkin: CheckinItem; onDone: () => void }) {
  const { t } = useTheme();
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!score || submitting) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/mobile/satisfaction-checkins/${checkin.id}/respond`, {
        method: "POST",
        body: JSON.stringify({ score, comment: comment.trim() || undefined }),
      });
      onDone();
    } catch {
      // silent — best effort
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[checkinStyles.card, { backgroundColor: t.panel, borderColor: t.line }]}>
      <Text style={[checkinStyles.title, { color: t.fg }]}>첫 수업은 어떠셨나요?</Text>
      <Text style={[checkinStyles.sub, { color: t.mut }]}>1점(아쉬워요) ~ 5점(매우 만족해요)</Text>
      <View style={checkinStyles.stars}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Pressable
            key={s}
            style={[
              checkinStyles.starBtn,
              { backgroundColor: score !== null && s <= score ? t.acc : t.panel2 },
            ]}
            onPress={() => setScore(s)}
          >
            <Text style={[checkinStyles.starText, { color: score !== null && s <= score ? t.onAcc : t.mut }]}>
              {s}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={[checkinStyles.input, { backgroundColor: t.panel2, borderColor: t.line2, color: t.fg }]}
        placeholder="의견을 남겨주세요 (선택)"
        placeholderTextColor={t.mut2}
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={500}
      />
      <Pressable
        style={[checkinStyles.btn, { backgroundColor: score ? t.acc : t.line2 }]}
        onPress={() => void submit()}
        disabled={!score || submitting}
      >
        <Text style={[checkinStyles.btnText, { color: score ? t.onAcc : t.mut }]}>
          {submitting ? "제출 중…" : "제출하기"}
        </Text>
      </Pressable>
    </View>
  );
}

const checkinStyles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  title: { fontSize: 15, fontFamily: font.extrabold, letterSpacing: -0.3, marginBottom: 4 },
  sub: { fontSize: 12, marginBottom: 12 },
  stars: { flexDirection: "row", gap: 8, marginBottom: 12 },
  starBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  starText: { fontSize: 16, fontFamily: font.bold },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 13.5,
    minHeight: 64,
    marginBottom: 12,
    textAlignVertical: "top",
  },
  btn: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { fontSize: 14, fontFamily: font.bold },
});

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
  lessons: Array<{ subject: string; teacher: string; teacherId: string; frequency: string }>;
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
        <Text style={[styles.ringPct, { color: t.accText }]}>{percent}%</Text>
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
  const [error, setError] = useState(false);
  const [checkins, setCheckins] = useState<CheckinItem[]>([]);

  const loadCheckins = useCallback(() => {
    apiFetch<{ checkins: CheckinItem[] }>("/api/mobile/satisfaction-checkins")
      .then((res) => setCheckins(res.checkins))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    const mountAt = Date.now();
    try {
      const res = await apiFetch<HomeData>("/api/mobile/home");
      setData(res);
      console.log(`[perf] 홈탭 mount→render: ${Date.now() - mountAt}ms`);
      trackEvent(ANALYTICS_EVENTS.homeViewed);
      if (!res.todayLesson) {
        trackEvent(ANALYTICS_EVENTS.homeEmptyTodayLessonViewed);
      }
    } catch {
      setData(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    loadCheckins();
  }, [load, loadCheckins]);

  const QUICK = [
    { label: "상담", cta: "consult" as const, onPress: () => { trackEvent(ANALYTICS_EVENTS.homeCtaClicked, { cta_name: "consult" }); router.push("/consult/status"); } },
    { label: "리포트", cta: "report" as const, onPress: () => { trackEvent(ANALYTICS_EVENTS.homeCtaClicked, { cta_name: "report" }); router.push("/(tabs)/learning"); } },
    { label: "질문", cta: "qna" as const, onPress: () => { trackEvent(ANALYTICS_EVENTS.homeCtaClicked, { cta_name: "qna" }); router.push("/(tabs)/qna"); } },
    { label: "구독", cta: "billing" as const, onPress: () => { trackEvent(ANALYTICS_EVENTS.homeCtaClicked, { cta_name: "billing" }); router.push("/billing"); } },
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
              {data?.greetingName ?? "학생"}
            </Text>
          </View>
          {/* .iconbtn width:40 height:40 border-radius:12 border:1px */}
          <Pressable
            style={[iconbtn, { backgroundColor: t.panel, borderColor: t.line }]}
            onPress={() => router.push("/notifications")}
          >
            <BellIcon color={t.fg} size={20} />
            {/* .iconbtn .badge top:7 right:8 width:8 height:8 border-radius:4 */}
            {(data?.unreadCount ?? 0) > 0 && (
              <View style={[iconbtnBadge, { backgroundColor: t.acc }]} />
            )}
          </Pressable>
        </View>

        {loading && !data ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.acc} />
          </View>
        ) : error && !data ? (
          <ErrorState
            title="홈을 불러오지 못했어요"
            onRetry={() => void load()}
          />
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
                      <Text style={[nowS.wt, { color: t.onAcc }]}>
                        {formatTime(data.todayLesson.startAt)}
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                /* .now-foot — 빈 상태: 이유 + 다음 행동 */
                <View style={nowS.foot}>
                  <Text style={{ color: t.onAcc, fontSize: 13, opacity: 0.92 }}>
                    {EMPTY_STATE_COPY.noTodayLesson.title}
                  </Text>
                  <Pressable
                    style={styles.nowCta}
                    onPress={() => {
                      trackEvent(ANALYTICS_EVENTS.homeCtaClicked, { cta_name: "consult_status" });
                      router.push("/consult/status");
                    }}
                  >
                    <Text style={[styles.nowCtaText, { color: t.onAcc }]}>
                      {EMPTY_STATE_COPY.noTodayLesson.cta} ›
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
                  {(data?.weekProgress.total ?? 0) > 0
                    ? `과제 ${data?.weekProgress.total ?? 0}개 중 ${data?.weekProgress.done ?? 0}개 완료 · 좋은 흐름이에요`
                    : EMPTY_STATE_COPY.noWeekTasks.description}
                </Text>
              </View>
            </View>

            {/* 만족도 체크인 카드 */}
            {checkins.length > 0 && (
              <CheckinCard
                checkin={checkins[0]}
                onDone={() => setCheckins((prev) => prev.slice(1))}
              />
            )}

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
                    {label === "상담" ? <ChatIcon color={t.accText} size={18} />
                      : label === "리포트" ? <DocumentIcon color={t.accText} size={18} />
                      : label === "질문" ? <QuestionIcon color={t.accText} size={18} />
                      : <CardIcon color={t.accText} size={18} />}
                  </View>
                  {/* .qa span font-size:11 font-weight:600 */}
                  <Text style={[qaS.label, { color: t.fg }]}>{label}</Text>
                </Pressable>
              ))}
            </View>

            {/* .sect-t 내 수업 + 전체 링크 */}
            <View style={[sectTS, styles.sectTRow, { marginTop: 20 }]}>
              <Text style={[styles.sectTText, { color: t.fg }]}>내 수업</Text>
              <Pressable onPress={() => router.push("/(tabs)/learning")}>
                <Text style={[styles.sectTLink, { color: t.accText }]}>전체</Text>
              </Pressable>
            </View>

            {/* .card (lrow list) */}
            <View style={[card, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
              {(data?.lessons ?? []).length === 0 ? (
                <EmptyState
                  title="배정된 수업이 아직 없어요"
                  description={EMPTY_STATE_COPY.noTodayLesson.description}
                  ctaLabel={EMPTY_STATE_COPY.noTodayLesson.cta}
                  onCta={() => router.push("/consult/status")}
                />
              ) : (
                (data?.lessons ?? []).map((lesson, i) => (
                <View
                  key={`${lesson.teacherId}-${lesson.subject}`}
                  style={[lrowS.wrap, i > 0 && { borderTopWidth: 1, borderTopColor: t.line }]}
                >
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
              )))}
            </View>

            {/* .sect-t 다가오는 일정 + 전체 */}
            <View style={[sectTS, styles.sectTRow, { marginTop: 20 }]}>
              <Text style={[styles.sectTText, { color: t.fg }]}>다가오는 일정</Text>
              <Pressable onPress={() => router.push("/(tabs)/learning")}>
                <Text style={[styles.sectTLink, { color: t.accText }]}>전체</Text>
              </Pressable>
            </View>

            {/* .card (lrow list) */}
            <View style={[card, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
              {(data?.upcoming ?? []).length === 0 ? (
                <EmptyState
                  title={EMPTY_STATE_COPY.noUpcoming.title}
                  description={EMPTY_STATE_COPY.noUpcoming.description}
                />
              ) : (
                (data?.upcoming ?? []).map((item, i) => (
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
                      {item.note ? ` · ${item.note}` : ""}
                    </Text>
                  </View>
                  <Text style={[lrowS.r, { color: t.accText }]}>
                    D-{Math.ceil((new Date(item.startAt).getTime() - Date.now()) / 86400000)}
                  </Text>
                </View>
              )))}
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
    top: 9,
    left: 9,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
  },
  ringPct: { fontSize: 14, fontFamily: font.extrabold },
  ringText: { flex: 1 },

  // lrow avatar text
  lrowAvText: { fontFamily: font.bold, fontSize: 14 },

  chev: { fontSize: 20, fontFamily: font.bold },
});
