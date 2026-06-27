import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { Avatar } from "../../components/ui/Avatar";
import { CardIcon, ChevronRightIcon, PersonIcon } from "../../components/ui/Icons";
import { Logo } from "../../components/ui/Logo";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";

interface MeData {
  student: {
    id: string;
    name: string;
    grade: string;
    subjects: string;
  };
  subscription: {
    plan: string;
    status: string;
    periodEnd: string;
  } | null;
}

export default function MyScreen() {
  const { t, color, mode, setColor, toggleMode } = useTheme();
  const { logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<MeData>("/api/mobile/me")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    Alert.alert("로그아웃", "정말 로그아웃 하시겠어요?", [
      { text: "취소", style: "cancel" },
      { text: "로그아웃", style: "destructive", onPress: logout },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={[styles.header, { borderBottomColor: t.line }]}>
        <Logo size={20} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.acc} />
          </View>
        ) : data ? (
          <>
            <View style={[styles.profileCard, { backgroundColor: t.panel, borderColor: t.line }]}>
              <Avatar label={data.student.name.charAt(0)} size={56} radius={16} accent />
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: t.fg }]}>{data.student.name}</Text>
                <Text style={[styles.profileMeta, { color: t.mut }]}>
                  {data.student.grade}
                  {data.student.subjects ? ` · ${data.student.subjects}` : ""}
                </Text>
              </View>
            </View>

            <Pressable
              style={[styles.subCard, { backgroundColor: t.acc }]}
              onPress={() => router.push("/subscription")}
            >
              <View>
                <Text style={styles.subLabel}>구독 플랜</Text>
                <Text style={styles.subPlan}>
                  {data.subscription ? data.subscription.plan : "구독 없음"}
                </Text>
                {data.subscription && (
                  <Text style={styles.subExpiry}>
                    {new Date(data.subscription.periodEnd).toLocaleDateString("ko-KR")} 만료
                  </Text>
                )}
              </View>
              <ChevronRightIcon color="rgba(255,255,255,0.8)" size={20} />
            </Pressable>

            <View style={[styles.section, { backgroundColor: t.panel, borderColor: t.line }]}>
              <Text style={[styles.sectionLabel, { color: t.mut }]}>앱 설정</Text>
              <View style={[styles.settingRow, { borderBottomColor: t.line }]}>
                <Text style={[styles.settingLabel, { color: t.fg }]}>다크 모드</Text>
                <Switch
                  value={mode === "dark"}
                  onValueChange={toggleMode}
                  trackColor={{ false: t.panel2, true: t.acc }}
                  thumbColor="#fff"
                />
              </View>
              <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.settingLabel, { color: t.fg }]}>블루 테마</Text>
                <Switch
                  value={color === "blue"}
                  onValueChange={(v) => setColor(v ? "blue" : "green")}
                  trackColor={{ false: t.panel2, true: t.acc }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: t.panel, borderColor: t.line }]}>
              <Pressable
                style={[styles.menuRow, { borderBottomColor: t.line }]}
                onPress={() => router.push("/subscription")}
              >
                <View style={[styles.menuIcon, { backgroundColor: t.panel2 }]}>
                  <CardIcon color={t.mut} size={18} />
                </View>
                <Text style={[styles.menuLabel, { color: t.fg }]}>구독 관리</Text>
                <ChevronRightIcon color={t.mut2} size={16} />
              </Pressable>
              <Pressable style={styles.menuRow} onPress={handleLogout}>
                <View style={[styles.menuIcon, { backgroundColor: t.panel2 }]}>
                  <PersonIcon color="#E53E3E" size={18} />
                </View>
                <Text style={[styles.menuLabel, { color: "#E53E3E" }]}>로그아웃</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Text style={[styles.empty, { color: t.mut }]}>프로필을 불러올 수 없습니다.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12, gap: 12 },
  center: { paddingTop: 80, alignItems: "center" },
  empty: { textAlign: "center", marginTop: 60, fontSize: 14 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  profileMeta: { fontSize: 13.5, marginTop: 3 },
  subCard: {
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subLabel: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)", marginBottom: 4 },
  subPlan: { fontSize: 20, fontWeight: "800", letterSpacing: -0.5, color: "#fff" },
  subExpiry: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  section: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  settingLabel: { fontSize: 15, fontWeight: "500" },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "500" },
});
