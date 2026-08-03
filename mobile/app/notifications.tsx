import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  card,
  notif as notifS,
  scroll as scrollS,
} from "../styles/app-styles";
import { BellIcon } from "../components/ui/Icons";
import { SkeletonListCard } from "../components/ui/Skeleton";
import { SubHead } from "../components/ui/SubHead";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { apiFetch } from "../lib/api";
import { getRole, type UserRole } from "../lib/auth";
import { useTheme } from "../theme/ThemeProvider";
import { accTint } from "../theme/tokens";

interface NotificationItem {
  id: string;
  type: string;
  category: string;
  title: string;
  body: string;
  timeAgo: string;
  icon: string;
  accent: boolean;
  isRead: boolean;
}

/**
 * 알림 type + 로그인 역할 → 대상 화면 딥링크. 웹 resolveNotificationHref 수준으로 확장.
 * 같은 타입이라도 역할별로 스택이 다르므로((tabs)/(teacher)/(manager)/(parent)) role로 분기.
 * 매핑 불가한 type은 null(탭 없음).
 */
function routeForType(type: string, role: UserRole | null): string | null {
  // 역할별 기본 홈
  const home =
    role === "TEACHER"
      ? "/(teacher)"
      : role === "MANAGER"
        ? "/(manager)"
        : role === "PARENT"
          ? "/(parent)"
          : "/(tabs)";

  switch (type) {
    // 질문/답변 — 학생: qna 탭, 강사: 질문 큐
    case "NEW_QUESTION":
    case "QUESTION_UNANSWERED":
      return role === "TEACHER" ? "/(teacher)/questions" : "/(tabs)/qna";
    case "TEACHER_ANSWERED":
      return "/(tabs)/qna";

    // 리포트·학습 진도
    case "TEACHER_COMMENT":
    case "MONTHLY_REPORT_READY":
      return role === "PARENT" ? "/(parent)/reports" : "/(tabs)/learning";
    case "PROGRESS_WARNING":
    case "PROGRESS_DANGER":
      return role === "MANAGER"
        ? "/(manager)/monitoring"
        : role === "TEACHER"
          ? "/(teacher)/students"
          : "/(tabs)/learning";

    // 수업 일정 / 예약 확정 / 배정
    case "NEW_BOOKING":
    case "NEW_STUDENT_WAITING":
      return role === "MANAGER" ? "/(manager)" : home;
    case "BOOKING_CONFIRMED":
    case "VISIT_TIMES_UPDATED":
      return home;
    case "TEACHER_ASSIGNED":
    case "MATCH_ACCEPTANCE_REMINDER":
    case "STALE_MATCH_ACCEPTANCE":
      return home;
    case "NEW_STUDENT_ASSIGNED":
    case "POST_CONSULTATION_FOLLOWUP":
      return role === "TEACHER" ? "/(teacher)/students" : home;

    // 첫 수업 관련
    case "FIRST_LESSON_SET":
      return role === "PARENT" ? "/(parent)/reports" : home;
    case "FIRST_LESSON_REMINDER":
    case "FIRST_LESSON_SLA_BREACH":
      return role === "TEACHER" ? "/(teacher)/students" : home;
    case "LESSON_REMINDER":
      return home;

    // 수업 취소 — 학부모: 리포트, 학생: 홈, 강사: 학생
    case "LESSON_CANCELLED_BY_TEACHER":
      return role === "TEACHER"
        ? "/(teacher)/students"
        : role === "PARENT"
          ? "/(parent)/reports"
          : "/(tabs)";

    // 수업 확인 제도 — 강사: 확인 카드가 있는 홈, 학부모: 리포트, 학생: 홈
    case "LESSON_CONFIRM_REQUEST":
      return role === "TEACHER" ? "/(teacher)" : home;
    case "LESSON_COMPLETED_CONFIRMED":
    case "LESSON_NOT_HELD":
      return role === "TEACHER"
        ? "/(teacher)/students"
        : role === "PARENT"
          ? "/(parent)/reports"
          : "/(tabs)";

    // 상담 리마인더
    case "CONSULTATION_REMINDER":
      return role === "PARENT"
        ? "/(parent)/consult"
        : role === "MANAGER"
          ? "/(manager)"
          : home;

    // 구독·결제 계열 — 학부모: 결제 화면, 학생: 홈
    case "SUBSCRIPTION_EXPIRY_REMINDER":
    case "SUBSCRIPTION_EXPIRY_SOON":
    case "SUBSCRIPTION_EXPIRED_SOON":
    case "SUBSCRIPTION_EXPIRED":
    case "SUBSCRIPTION_RENEWED":
    case "SUBSCRIPTION_RENEWAL_FAILED":
    case "SUBSCRIPTION_AUTO_CANCELLED":
      return role === "PARENT" ? "/(parent)/payments" : home;

    // 만족도 체크인 — 학생: 홈, 매니저(저평가): 모니터링
    case "SATISFACTION_CHECKIN_REQUEST":
    case "SATISFACTION_CHECKIN_REMINDER":
      return home;
    case "SATISFACTION_LOW_SCORE":
      return role === "MANAGER" ? "/(manager)/monitoring" : home;

    default:
      return null;
  }
}

interface NotificationsData {
  unreadCount: number;
  notifications: NotificationItem[];
}

function NCategory({ label }: { label: string }) {
  const { t } = useTheme();
  return <Text style={[notifS.cat, { color: t.mut2 }]}>{label}</Text>;
}

function NRow({
  accent,
  unread,
  icon,
  title,
  body,
  time,
  divider,
  onPress,
}: {
  accent: boolean;
  unread?: boolean;
  icon: string;
  title: string;
  body: string;
  time: string;
  divider?: boolean;
  onPress?: () => void;
}) {
  const { t } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        notifS.row,
        divider && { borderTopWidth: 1, borderTopColor: t.line },
        // 시안: 미읽음 행 배경 accent 5%
        unread && { backgroundColor: accTint(t, 0.05) },
        pressed && onPress && { backgroundColor: accTint(t, 0.1) },
      ]}
    >
      <View style={[notifS.ic, { backgroundColor: accent ? accTint(t, 0.12) : t.panel2 }]}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <View style={notifS.g}>
        <Text style={[notifS.gb, { color: t.fg }]}>{title}</Text>
        <Text style={[notifS.gp, { color: t.mut }]}>{body}</Text>
        <Text style={[notifS.tm, { color: t.mut2 }]}>{time}</Text>
      </View>
      {unread && <View style={[notifS.ud, { backgroundColor: t.acc }]} />}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<NotificationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    void getRole().then(setRole);
  }, []);

  const load = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    apiFetch<NotificationsData>("/api/mobile/notifications")
      .then(setData)
      .catch(() => setError(true))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markAllRead() {
    try {
      await apiFetch("/api/mobile/notifications", { method: "PATCH" });
      load();
    } catch {
      // ignore
    }
  }

  // 개별 읽음 처리 + 로컬 state 낙관적 갱신 후 딥링크 이동(G-4).
  const openNotification = useCallback(
    (item: NotificationItem) => {
      const target = routeForType(item.type, role);
      if (!item.isRead) {
        setData((prev) =>
          prev
            ? {
                unreadCount: Math.max(0, prev.unreadCount - 1),
                notifications: prev.notifications.map((n) =>
                  n.id === item.id ? { ...n, isRead: true, accent: false } : n,
                ),
              }
            : prev,
        );
        void apiFetch("/api/mobile/notifications", {
          method: "PATCH",
          body: JSON.stringify({ ids: [item.id] }),
        }).catch(() => {
          // 실패해도 이동은 진행 — 다음 로드 시 정합화
        });
      }
      if (target) router.push(target as never);
    },
    [role, router],
  );

  const sections = useMemo(() => {
    if (!data?.notifications.length) return [];
    const map = new Map<string, NotificationItem[]>();
    for (const n of data.notifications) {
      const list = map.get(n.category) ?? [];
      list.push(n);
      map.set(n.category, list);
    }
    return Array.from(map.entries()).map(([cat, items]) => ({ cat, items }));
  }, [data]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <ScrollView
        contentContainerStyle={[scrollS, styles.content]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={t.mut2} colors={[t.acc]} />
        }
      >
        <SubHead
          title="알림"
          actionLabel={data && data.unreadCount > 0 ? "모두 읽음" : undefined}
          onAction={data && data.unreadCount > 0 ? markAllRead : undefined}
        />

        {loading ? (
          <SkeletonListCard rows={3} />
        ) : error ? (
          <ErrorState onRetry={() => load()} />
        ) : sections.length === 0 ? (
          <EmptyState
            icon={<BellIcon color={t.accText} size={24} />}
            title="새 알림이 없어요"
            description="수업·리포트·메시지 알림이 오면 여기에 표시됩니다."
          />
        ) : (
          <View style={[card, styles.notifCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
            {sections.map((section) => (
              <View key={section.cat}>
                <NCategory label={section.cat} />
                {section.items.map((item, i) => (
                  <NRow
                    key={item.id}
                    accent={item.accent}
                    unread={!item.isRead}
                    icon={item.icon}
                    title={item.title}
                    body={item.body}
                    time={item.timeAgo}
                    divider={i > 0}
                    onPress={() => openNotification(item)}
                  />
                ))}
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 6 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 8 },
  notifCard: { overflow: "hidden" },
});
