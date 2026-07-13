import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { font } from "../../styles/app-styles";
import { useTheme } from "../../theme/ThemeProvider";

function AppIcon() {
  const { t } = useTheme();
  return (
    <View style={[styles.icon, { backgroundColor: t.acc, shadowColor: t.acc }]}>
      <View style={styles.iconT}>
        <Text style={[styles.iconLetter, { color: t.onAcc }]}>C</Text>
        <View style={[styles.iconDot, { backgroundColor: t.onAcc }]} />
      </View>
    </View>
  );
}

function Wordmark() {
  const { t } = useTheme();
  return (
    <View style={styles.wordmarkRow}>
      <Text style={[styles.wordmark, { color: t.fg }]}>Concord</Text>
      <View style={[styles.wordmarkDot, { backgroundColor: t.accText }]} />
    </View>
  );
}

export default function Onboarding() {
  const { t } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.onb}>

        <View style={styles.mid}>
          <View style={styles.heroGroup}>
            <AppIcon />
            <Wordmark />
            <Text style={[styles.h2, { color: t.fg, marginTop: 14 }]}>
              학생마다 맞는{"\n"}선생님이 다릅니다
            </Text>
          </View>
        </View>

        <View>
          <Text style={[styles.lede, { color: t.mut }]}>
            전문 매니저가 직접 상담하고,{"\n"}우리 아이에게 꼭 맞는 선생님을 찾아드려요.
          </Text>
          <View style={styles.acts}>
            <Pressable
              style={[styles.p1, {
                backgroundColor: t.acc,
                shadowColor: t.acc,
              }]}
              onPress={() => router.push("/consult")}
            >
              <Text style={[styles.p1Text, { color: t.onAcc }]}>무료 상담 신청하기</Text>
            </Pressable>
            <Pressable style={styles.p2} onPress={() => router.push("/(auth)/login")}>
              <Text style={[styles.p2Text, { color: t.mut }]}>
                이미 회원이신가요?{" "}
                <Text style={[styles.p2Bold, { color: t.fg }]}>로그인</Text>
              </Text>
            </Pressable>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  onb: {
    flex: 1,
    flexDirection: "column",
    paddingHorizontal: 26,
    paddingBottom: 30,
  },

  mid: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  heroGroup: {
    flexDirection: "column",
    alignItems: "center",
    gap: 18,
  },

  icon: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 34,
    shadowOpacity: 0.36,
    elevation: 16,
  },

  iconT: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  iconLetter: {
    fontSize: 44,
    fontFamily: font.extrabold,
    letterSpacing: -2.20,
  },
  iconDot: {
    width: 7.5,
    height: 7.5,
    borderRadius: 999,
    marginLeft: 1.8,
  },

  wordmarkRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 2,
  },
  wordmark: {
    fontSize: 30,
    fontFamily: font.extrabold,
    letterSpacing: -1.35,
  },
  wordmarkDot: {
    width: 4.8,
    height: 4.8,
    borderRadius: 999,
    marginLeft: 1.2,
  },

  h2: {
    fontSize: 23,
    fontFamily: font.extrabold,
    letterSpacing: -0.69,
    lineHeight: 29,
    textAlign: "center",
  },

  lede: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 18,
  },

  acts: {
    flexDirection: "column",
    gap: 10,
  },

  p1: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: "center",
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    shadowOpacity: 0.30,
    elevation: 8,
  },
  p1Text: {
    fontFamily: font.extrabold,
    fontSize: 16,
  },

  p2: {
    width: "100%",
    paddingVertical: 14,
    alignItems: "center",
  },
  p2Text: {
    fontFamily: font.semibold,
    fontSize: 14,
  },
  p2Bold: {
    fontFamily: font.bold,
  },
});
