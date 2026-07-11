import { Redirect, SplashScreen } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppIcon, Logo } from "../components/ui/Logo";
import { useTheme } from "../theme/ThemeProvider";
import { apiFetch } from "../lib/api";
import { getAccessToken, getRole, homeRouteForRole } from "../lib/auth";
import {
  clearJourneySkipIfStageChanged,
  shouldSkipJourneyRedirect,
} from "../lib/journey-redirect";
import {
  type JourneySnapshot,
  needsConsultationTracking,
} from "../lib/student-journey";

function Splash() {
  const { t } = useTheme();
  return (
    <View style={[styles.splash, { backgroundColor: t.bg }]}>
      <AppIcon size={88} />
      <Logo size={24} />
      <View style={styles.dots}>
        <View style={[styles.dot, { backgroundColor: t.mut2, opacity: 0.4 }]} />
        <View style={[styles.dot, { backgroundColor: t.mut2, opacity: 0.7 }]} />
        <View style={[styles.dot, { backgroundColor: t.acc, opacity: 1 }]} />
      </View>
    </View>
  );
}

export default function Index() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    getAccessToken().then(async (token) => {
      if (!token) {
        setTarget("/(auth)/onboarding");
        SplashScreen.hideAsync();
        return;
      }

      // 역할 게이트: 학부모·선생님·매니저는 각자의 탭 세트로 (학생 여정 로직 미적용)
      const role = await getRole();
      if (role && role !== "STUDENT") {
        setTarget(homeRouteForRole(role));
        SplashScreen.hideAsync();
        return;
      }

      try {
        const journey = await apiFetch<JourneySnapshot>("/api/mobile/me/journey");
        await clearJourneySkipIfStageChanged(journey.stage);

        if (journey.stage === "MATCHING") {
          setTarget("/consult/match");
        } else if (
          needsConsultationTracking(journey.stage) &&
          !(await shouldSkipJourneyRedirect(journey.stage))
        ) {
          setTarget("/consult/status");
        } else {
          setTarget("/(tabs)/");
        }
      } catch {
        const remainingToken = await getAccessToken();
        setTarget(remainingToken ? "/(tabs)/" : "/(auth)/onboarding");
      }
      SplashScreen.hideAsync();
    });
  }, []);

  if (!target) return <Splash />;
  return <Redirect href={target as Parameters<typeof Redirect>[0]["href"]} />;
}

const styles = StyleSheet.create({
  // .splash { flex:1; align-items:center; justify-content:center; gap:18; }
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  // .splash .ld { flex-row; gap:6; margin-top:6; }
  dots: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  // .splash .ld i { width:7; height:7; border-radius:50%; }
  dot: { width: 7, height: 7, borderRadius: 999 },
});
