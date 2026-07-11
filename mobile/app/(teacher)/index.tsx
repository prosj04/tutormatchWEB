import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  appbar as appbarS,
  card as cardS,
  font,
  iconbtn as iconbtnS,
  lrow as lrowS,
  now as nowS,
  scroll as scrollS,
  sectT as sectTS,
} from "../../styles/app-styles";
import { ErrorState } from "../../components/ui/ErrorState";
import { BellIcon, ChevronRightIcon } from "../../components/ui/Icons";
import { AlertCircleIcon } from "../../components/teacher/TeacherIcons";
import { apiFetch } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

interface UpcomingLesson {
  id: string;
  startAt: string;
  subject: string;
  durationMin: number;
  status: string;
  studentId: string;
  studentName: string;
}

interface HomeData {
  approved: boolean;
  name: string;
  todayLessonCount: number;
  upcomingLessons: UpcomingLesson[];
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function TeacherHomeScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const d = await apiFetch<HomeData>("/api/mobile/teacher/home");
      setData(d);
    } catch {
      setData(null);
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

  const todayLessons = (data?.upcomingLessons ?? []).filter((l) => isToday(l.startAt));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={scrollS} showsVerticalScrollIndicator={false}>
        {loading && !data ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.acc} />
          </View>
        ) : error ? (
          <ErrorState title="홈을 불러오지 못했어요" onRetry={() => void load()} />
        ) : !data ? null : (
          <>
            {/* appbar */}
            <View style={appbarS.wrap}>
              <View style={{ flex: 1 }}>
                <Text style={[appbarS.hi, { color: t.mut }]}>Teacher</Text>
                <Text style={[appbarS.nm, { color: t.fg }]}>{data.name} 선생님</Text>
              </View>
              {data.approved && (
                <Pressable
                  style={[iconbtnS, styles.iconbtn, { backgroundColor: t.panel, borderColor: t.line }]}
                  onPress={() => router.push("/notifications")}
                >
                  <View style={[styles.badge, { backgroundColor: t.acc, borderColor: t.panel }]} />
                  <BellIcon color={t.fg} size={19} />
                </Pressable>
              )}
            </View>

            {data.approved ? (
              <ApprovedHome data={data} todayLessons={todayLessons} />
            ) : (
              <PendingHome />
            )}
            <View style={{ height: 6 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ApprovedHome({
  data,
  todayLessons,
}: {
  data: HomeData;
  todayLessons: UpcomingLesson[];
}) {
  const { t } = useTheme();
  const router = useRouter();
  const firstLessonPending = data.upcomingLessons.length === 0;

  return (
    <>
      {/* 오늘 수업 (.now) */}
      <View style={[nowS.wrap, { backgroundColor: t.acc }]}>
        <Text style={[nowS.k, { color: t.onAcc }]}>
          {todayLessons.length > 0
            ? `오늘 수업 · ${formatDateLabel(todayLessons[0].startAt)}`
            : "오늘 예정된 수업이 없어요"}
        </Text>
        {todayLessons.map((l, i) => (
          <View key={l.id} style={[nowS.row, i > 0 && { marginTop: 10 }]}>
            <View style={[nowS.av, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Text style={{ color: t.onAcc, fontFamily: font.extrabold, fontSize: 16 }}>
                {l.studentName.charAt(0)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[nowS.nm, { color: t.onAcc }]}>{l.studentName}</Text>
              <Text style={[nowS.meta, { color: t.onAcc }]}>
                {l.subject} · {l.durationMin}분
              </Text>
            </View>
            <View style={nowS.when}>
              <Text style={[nowS.wt as never, { color: t.onAcc }]}>{formatTime(l.startAt)}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 이번 주 요약 타일 */}
      <Text style={[sectTS, { color: t.fg }]}>이번 주</Text>
      <View style={styles.tiles}>
        <Tile value={String(data.upcomingLessons.length)} label="예정 수업" />
        <Tile value={String(data.todayLessonCount)} label="오늘 수업" />
      </View>

      {/* 할 일 */}
      {firstLessonPending && (
        <>
          <Text style={[sectTS, { color: t.fg }]}>할 일</Text>
          <View style={[cardS, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
            <Pressable style={lrowS.wrap} onPress={() => router.push("/(teacher)/students" as never)}>
              <View style={[lrowS.av, { backgroundColor: accTint(t, 0.14), borderRadius: 10 }]}>
                <Text style={{ color: t.accText, fontFamily: font.bold }}>!</Text>
              </View>
              <View style={lrowS.g}>
                <Text style={[lrowS.gb, { color: t.fg }]}>첫 수업일 설정이 필요한 학생</Text>
                <Text style={[lrowS.gp, { color: t.mut }]}>학생 탭에서 첫 수업일을 지정해 주세요</Text>
              </View>
              <View style={lrowS.chev}>
                <ChevronRightIcon color={t.mut2} size={18} />
              </View>
            </Pressable>
          </View>
        </>
      )}
    </>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  const { t } = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
      <Text style={[styles.tileValue, { color: t.fg }]}>{value}</Text>
      <Text style={[styles.tileLabel, { color: t.mut }]}>{label}</Text>
    </View>
  );
}

function PendingHome() {
  const { t } = useTheme();
  const router = useRouter();
  return (
    <>
      {/* 경고 배너 (.banner.warn) */}
      <View style={[styles.banner, { backgroundColor: "rgba(217,119,6,0.1)", borderColor: "rgba(217,119,6,0.25)" }]}>
        <AlertCircleIcon color="#92610a" size={17} />
        <Text style={[styles.bannerText, { color: "#92610a" }]}>
          <Text style={styles.bannerBold}>승인 검토 중이에요. </Text>
          서류 확인 후 보통 2~3일 내 승인됩니다. 승인 전에는 학생·질문 기능이 잠깁니다.
        </Text>
      </View>

      {/* 지원 현황 (.jcard) */}
      <View style={[styles.jcard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
        <Text style={[styles.jk, { color: t.accText }]}>지원 현황</Text>
        <Text style={[styles.jh3, { color: t.fg }]}>서류 접수 완료 · 매니저 검토 중</Text>
        <Text style={[styles.jp, { color: t.mut }]}>
          제출: 재학/졸업 증명 · 신분증 · 프로필. 추가 서류가 필요하면 알림으로 안내드려요.
        </Text>
        <Pressable
          style={[styles.jbtnGhost, { backgroundColor: t.panel, borderColor: t.line2 }]}
          onPress={() => router.push("/(teacher)/my" as never)}
        >
          <Text style={[styles.jbtnGhostText, { color: t.fg }]}>제출 서류 확인</Text>
        </Pressable>
      </View>

      {/* 준비하면 좋아요 */}
      <Text style={[sectTS, { color: t.fg }]}>준비하면 좋아요</Text>
      <View style={[cardS, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
        {[
          { n: "1", title: "프로필 소개 다듬기", sub: "학생·학부모에게 보여질 첫인상이에요" },
          { n: "2", title: "수업 가능 시간 등록", sub: "매칭 속도가 빨라져요" },
        ].map((item, i) => (
          <Pressable
            key={item.n}
            style={[lrowS.wrap, i > 0 && { borderTopWidth: 1, borderTopColor: t.line }]}
            onPress={() => router.push("/(teacher)/my" as never)}
          >
            <View style={[lrowS.av, { backgroundColor: t.panel2, borderRadius: 10 }]}>
              <Text style={{ color: t.accText, fontFamily: font.bold }}>{item.n}</Text>
            </View>
            <View style={lrowS.g}>
              <Text style={[lrowS.gb, { color: t.fg }]}>{item.title}</Text>
              <Text style={[lrowS.gp, { color: t.mut }]}>{item.sub}</Text>
            </View>
            <View style={lrowS.chev}>
              <ChevronRightIcon color={t.mut2} size={18} />
            </View>
          </Pressable>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { paddingVertical: 60, alignItems: "center" },
  iconbtn: {},
  badge: { position: "absolute", top: 7, right: 8, width: 8, height: 8, borderRadius: 4, borderWidth: 2, zIndex: 1 },
  // .tiles { grid 2cols; gap:9; }
  tiles: { flexDirection: "row", gap: 9 },
  // .tile-s { border-radius:16; padding:14 15; }
  tile: { flex: 1, borderWidth: 1, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 15 },
  tileValue: { fontSize: 22, fontFamily: font.extrabold, letterSpacing: -0.44, fontVariant: ["tabular-nums"] },
  tileLabel: { fontSize: 11.5, marginTop: 3 },
  // .banner { flex-row; gap:11; padding:14 15; border-radius:16; margin-bottom:14; }
  banner: {
    flexDirection: "row",
    gap: 11,
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    marginTop: 2,
  },
  bannerText: { flex: 1, fontSize: 12.5, lineHeight: 19 },
  bannerBold: { fontFamily: font.extrabold },
  // .jcard { padding:20 18; border-radius:22; }
  jcard: { paddingVertical: 20, paddingHorizontal: 18, borderRadius: 22, borderWidth: 1 },
  jk: { fontSize: 11.5, fontFamily: font.bold, letterSpacing: 0.92, textTransform: "uppercase" },
  jh3: { fontSize: 19, fontFamily: font.extrabold, letterSpacing: -0.48, marginTop: 9, lineHeight: 25 },
  jp: { fontSize: 13, marginTop: 8, lineHeight: 21 },
  jbtnGhost: {
    marginTop: 15,
    paddingVertical: 14,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
  },
  jbtnGhostText: { fontFamily: font.extrabold, fontSize: 14.5 },
});
