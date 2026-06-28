import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SubHead } from "../components/ui/SubHead";
import { apiFetch } from "../lib/api";
import { useTheme } from "../theme/ThemeProvider";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsScreen() {
  const { t } = useTheme();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ notifications: Notification[] }>("/api/mobile/notifications")
      .then((d) => setItems(d.notifications))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.head}>
        <SubHead title="알림" />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={t.acc} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.empty, { color: t.mut }]}>새 알림이 없어요</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View
              style={[
                styles.row,
                {
                  backgroundColor: item.isRead ? t.bg : t.panel,
                  borderColor: t.line,
                },
              ]}
            >
              {!item.isRead && (
                <View style={[styles.dot, { backgroundColor: t.acc }]} />
              )}
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: t.fg }]}>{item.title}</Text>
                <Text style={[styles.rowBody, { color: t.mut }]}>{item.body}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  head: { paddingHorizontal: 20, paddingTop: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { fontSize: 14 },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 8, paddingTop: 4 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 14.5, fontWeight: "700" },
  rowBody: { fontSize: 13.5, marginTop: 3, lineHeight: 19 },
});
