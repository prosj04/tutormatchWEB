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

import { BellIcon, ChevronRightIcon } from "../../components/ui/Icons";
import { Logo } from "../../components/ui/Logo";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { apiFetch } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

interface HomeData {
  greetingName: string;
  unreadCount: number;
  todayLesson: {
    id: string;
    subject: string;
    startAt: string;
    teacher: { id: string; name: string };
  } | null;
  upcoming: Array<{
    id: string;
    subject: string;
    startAt: string;
    teacher: { id: string; name: string };
  }>;
  weekProgress: { done: number; total: number; percent: number };
}

function ProgressRing({ percent, size = 72 }: { percent: number; size?: number }) {
  const { t } = useTheme();
  const sw = 7;
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

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]}) ${formatTime(iso)}`;
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={[styles.header, { borderBottomColor: t.line }]}>
        <Logo size={22} />
        <Pressable
          style={[styles.bell, { backgroundColor: t.panel, borderColor: t.line }]}
          onPress={() => router.push("/notifications")}
        >
          <BellIcon color={t.fg} size={20} />
          {(data?.unreadCount ?? 0) > 0 && (
            <View style={[styles.badge, { backgroundColor: t.acc }]}>
              <Text style={[styles.badgeText, { color: t.onAcc }]}>
                {(data?.unreadCount ?? 0) > 9 ? "9+" : data!.unreadCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.acc} />
          </View>
        ) : !data ? (
          <Text style={[styles.empty, { color: t.mut }]}>데이터를 불러올 수 없습니다.</Text>
        ) : (
          <>
            <Text style={[styles.greeting, { color: t.mut }]}>
              안녕하세요,{" "}
              <Text style={{ color: t.fg, fontWeight: "800" }}>{data.greetingName}</Text>님
            </Text>

            {data.todayLesson ? (
              <View style={[styles.nowCard, { backgroundColor: t.acc }]}>
                <Text style={[styles.nowLabel, { color: accTint(t, 0.65) }]}>오늘 수업</Text>
                <Text style={[styles.nowSubject, { color: t.onAcc }]}>
                  {data.todayLesson.subject}
                </Text>
                <Text style={[styles.nowTeacher, { color: accTint(t, 0.8) }]}>
                  {data.todayLesson.teacher.name} 선생님 · {formatTime(data.todayLesson.startAt)}
                </Text>
                <View style={[styles.nowInfo, { backgroundColor: accTint(t, 0.15) }]}>
                  <Text style={[styles.nowInfoText, { color: t.onAcc }]}>
                    수업 시작 전 푸시 알림으로 안내드려요
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.nowCardEmpty, { backgroundColor: t.panel, borderColor: t.line }]}>
                <Text style={[styles.nowEmptyText, { color: t.mut }]}>
                  오늘 예정된 수업이 없어요
                </Text>
              </View>
            )}

            <SectionTitle label="이번 주 달성률" />
            <View style={[styles.progressBox, { backgroundColor: t.panel, borderColor: t.line }]}>
              <ProgressRing percent={data.weekProgress.percent} />
              <View style={styles.progressRight}>
                <Text style={[styles.progressPct, { color: t.accText }]}>
                  {data.weekProgress.percent}%
                </Text>
                <Text style={[styles.progressSub, { color: t.mut }]}>
                  {data.weekProgress.done} / {data.weekProgress.total || "0"} 과제 완료
                </Text>
              </View>
            </View>

            {data.upcoming.length > 0 && (
              <>
                <SectionTitle label="다가오는 수업" />
                {data.upcoming.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.scheduleRow, { backgroundColor: t.panel, borderColor: t.line }]}
                    onPress={() => router.push(`/teacher/${item.teacher.id}`)}
                  >
                    <View style={styles.scheduleMeta}>
                      <Text style={[styles.scheduleSubject, { color: t.fg }]}>
                        {item.subject}
                      </Text>
                      <Text style={[styles.scheduleTeacher, { color: t.mut }]}>
                        {item.teacher.name} 선생님
                      </Text>
                    </View>
                    <View style={styles.scheduleRight}>
                      <Text style={[styles.scheduleDate, { color: t.accText }]}>
                        {formatDate(item.startAt)}
                      </Text>
                      <ChevronRightIcon color={t.mut2} size={16} />
                    </View>
                  </Pressable>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 9, fontWeight: "800" },
  scroll: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 4 },
  center: { paddingTop: 80, alignItems: "center" },
  empty: { textAlign: "center", marginTop: 60, fontSize: 14 },
  greeting: { fontSize: 15, marginVertical: 16 },
  nowCard: { borderRadius: 20, padding: 20, marginBottom: 4 },
  nowLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  nowSubject: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  nowTeacher: { fontSize: 14, marginTop: 4, fontWeight: "500" },
  nowInfo: { marginTop: 14, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 },
  nowInfoText: { fontSize: 12.5, fontWeight: "500" },
  nowCardEmpty: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 26,
    alignItems: "center",
    marginBottom: 4,
  },
  nowEmptyText: { fontSize: 14 },
  progressBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  progressRight: { flex: 1 },
  progressPct: { fontSize: 28, fontWeight: "800", letterSpacing: -1 },
  progressSub: { fontSize: 13, marginTop: 3 },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  scheduleMeta: { flex: 1 },
  scheduleSubject: { fontSize: 15, fontWeight: "700" },
  scheduleTeacher: { fontSize: 12.5, marginTop: 2 },
  scheduleRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  scheduleDate: { fontSize: 12.5, fontWeight: "600" },
});
