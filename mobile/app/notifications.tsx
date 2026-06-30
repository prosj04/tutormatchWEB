import { SafeAreaView } from "react-native-safe-area-context";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { SubHead } from "../components/ui/SubHead";
import { EmptyState } from "../components/ui/EmptyState";
import { apiFetch } from "../lib/api";
import { useTheme } from "../theme/ThemeProvider";
import { accTint } from "../theme/tokens";

interface NotificationItem {
  id: string;
  category: string;
  title: string;
  body: string;
  timeAgo: string;
  icon: string;
  accent: boolean;
  isRead: boolean;
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
}: {
  accent: boolean;
  unread?: boolean;
  icon: string;
  title: string;
  body: string;
  time: string;
  divider?: boolean;
}) {
  const { t } = useTheme();
  return (
    <View style={[notifS.row, divider && { borderTopWidth: 1, borderTopColor: t.line }]}>
      <View style={[notifS.ic, { backgroundColor: accent ? accTint(t, 0.12) : t.panel2 }]}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <View style={notifS.g}>
        <Text style={[notifS.gb, { color: t.fg }]}>{title}</Text>
        <Text style={[notifS.gp, { color: t.mut }]}>{body}</Text>
        <Text style={[notifS.tm, { color: t.mut2 }]}>{time}</Text>
      </View>
      {unread && <View style={[notifS.ud, { backgroundColor: t.acc }]} />}
    </View>
  );
}

export default function NotificationsScreen() {
  const { t } = useTheme();
  const [data, setData] = useState<NotificationsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<NotificationsData>("/api/mobile/notifications")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
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
      <ScrollView contentContainerStyle={[scrollS, styles.content]} showsVerticalScrollIndicator={false}>
        <SubHead
          title="알림"
          actionLabel={data && data.unreadCount > 0 ? "모두 읽음" : undefined}
          onAction={data && data.unreadCount > 0 ? markAllRead : undefined}
        />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.acc} />
          </View>
        ) : !data || sections.length === 0 ? (
          <EmptyState
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
  center: { paddingVertical: 40, alignItems: "center" },
  notifCard: { overflow: "hidden" },
});
