import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/ui/Button";
import { AppIcon, Logo } from "../../components/ui/Logo";
import { useTheme } from "../../theme/ThemeProvider";

export default function Onboarding() {
  const { t } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mid}>
          <AppIcon size={84} />
          <View style={{ marginTop: 28 }}>
            <Logo size={30} />
          </View>
          <Text style={[styles.h2, { color: t.fg }]}>
            학생마다 맞는{"\n"}선생님이 다릅니다
          </Text>
          <Text style={[styles.sub, { color: t.mut }]}>
            전문 매니저가 직접 상담하고,{"\n"}우리 아이에게 꼭 맞는 선생님을 찾아드려요.
          </Text>
          <View style={[styles.trust, { backgroundColor: t.panel, borderColor: t.line }]}>
            {[
              { value: "500+", label: "상담" },
              { value: "400+", label: "매칭" },
              { value: "98%", label: "만족" },
            ].map(({ value, label }) => (
              <View key={label} style={styles.trustItem}>
                <Text style={[styles.trustValue, { color: t.accText }]}>{value}</Text>
                <Text style={[styles.trustLabel, { color: t.mut }]}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.actions, { borderTopColor: t.line, backgroundColor: t.bg }]}>
        <Button label="무료 상담 신청하기" onPress={() => router.push("/consult")} />
        <Button
          label="이미 회원이신가요? 로그인"
          variant="ghost"
          onPress={() => router.push("/(auth)/login")}
          style={{ marginTop: 4 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  mid: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 56,
  },
  h2: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -1,
    textAlign: "center",
    marginTop: 20,
    lineHeight: 38,
  },
  sub: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 14,
  },
  trust: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 36,
    paddingVertical: 18,
    paddingHorizontal: 8,
    width: "100%",
    justifyContent: "space-around",
  },
  trustItem: { alignItems: "center" },
  trustValue: { fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },
  trustLabel: { fontSize: 12.5, fontWeight: "500", marginTop: 3 },
  actions: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
    borderTopWidth: 1,
    gap: 4,
  },
});
