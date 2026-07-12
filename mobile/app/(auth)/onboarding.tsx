import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { font } from "../../styles/app-styles";
import { useTheme } from "../../theme/ThemeProvider";

// ─── 앱 아이콘 (C.) ───────────────────────────────────────────────────────────
// .onb .icon { width:84; height:84; border-radius:24; background:acc; }
// .onb .icon .t { font-size:44; letter-spacing:-.05em; align-items:baseline; }
// .onb .icon .t .d { width:.17em; height:.17em; border-radius:50%; margin-left:.04em; }
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

// ─── 워드마크 (Concord.) ──────────────────────────────────────────────────────
// .dotw.wm { font-size:30; font-weight:800; letter-spacing:-.045em; align-items:baseline; }
// .dotw .d { width:.16em; height:.16em; background:acc-text; margin-left:.04em; }
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
      {/* .onb { flex-col; padding:0 26 30; } */}
      <View style={styles.onb}>

        {/* .mid { flex:1; align-items:center; justify:center; } */}
        <View style={styles.mid}>
          {/* .hero-group { flex-col; align-items:center; gap:18; } */}
          <View style={styles.heroGroup}>
            <AppIcon />
            <Wordmark />
            {/* h2 style="margin-top:14px" */}
            <Text style={[styles.h2, { color: t.fg, marginTop: 14 }]}>
              학생마다 맞는{"\n"}선생님이 다릅니다
            </Text>
          </View>
        </View>

        {/* .reveal-group (하단) */}
        <View>
          {/* .onb-lede { font-size:14; line-height:1.5; text-align:center; margin-bottom:18; } */}
          <Text style={[styles.lede, { color: t.mut }]}>
            전문 매니저가 직접 상담하고,{"\n"}우리 아이에게 꼭 맞는 선생님을 찾아드려요.
          </Text>
          {/* .acts { flex-col; gap:10; } */}
          <View style={styles.acts}>
            {/* .p1 { width:100%; padding:16; border-radius:15; font-weight:800; font-size:16; } */}
            <Pressable
              style={[styles.p1, {
                backgroundColor: t.acc,
                shadowColor: t.acc,
              }]}
              onPress={() => router.push("/consult")}
            >
              <Text style={[styles.p1Text, { color: t.onAcc }]}>무료 상담 신청하기</Text>
            </Pressable>
            {/* .p2 { width:100%; padding:14; font-weight:600; font-size:14; } */}
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

  // .onb
  onb: {
    flex: 1,
    flexDirection: "column",
    paddingHorizontal: 26,
    paddingBottom: 30,
  },

  // .onb .mid
  mid: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  // .onb .hero-group
  heroGroup: {
    flexDirection: "column",
    alignItems: "center",
    gap: 18,
  },

  // .onb .icon
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

  // .onb .icon .t
  iconT: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  // font-size:44; letter-spacing:-.05*44=-2.2
  iconLetter: {
    fontSize: 44,
    fontFamily: font.extrabold,
    letterSpacing: -2.20,
  },
  // .d width:.17*44=7.48, height:7.48, margin-left:.04*44=1.76
  iconDot: {
    width: 7.5,
    height: 7.5,
    borderRadius: 999,
    marginLeft: 1.8,
  },

  // .dotw.wm — font-size:30; margin-top:2
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 2,
  },
  // letter-spacing:-.045*30=-1.35
  wordmark: {
    fontSize: 30,
    fontFamily: font.extrabold,
    letterSpacing: -1.35,
  },
  // .d width:.16*30=4.8, margin-left:.04*30=1.2
  wordmarkDot: {
    width: 4.8,
    height: 4.8,
    borderRadius: 999,
    marginLeft: 1.2,
  },

  // .onb h2 — font-size:23; letter-spacing:-.03*23=-0.69; line-height:1.25*23=28.75
  h2: {
    fontSize: 23,
    fontFamily: font.extrabold,
    letterSpacing: -0.69,
    lineHeight: 29,
    textAlign: "center",
  },

  // .onb-lede — font-size:14; line-height:1.5*14=21; margin-bottom:18
  lede: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 18,
  },

  // .onb .acts
  acts: {
    flexDirection: "column",
    gap: 10,
  },

  // .onb .p1 — padding:16; border-radius:15; font-size:16
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

  // .onb .p2 — padding:14; font-size:14; font-weight:600
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
