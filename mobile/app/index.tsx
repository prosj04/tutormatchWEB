import { Redirect, SplashScreen } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { apiFetch } from "../lib/api";
import { getAccessToken } from "../lib/auth";
import {
  clearJourneySkipIfStageChanged,
  shouldSkipJourneyRedirect,
} from "../lib/journey-redirect";
import {
  type JourneySnapshot,
  needsConsultationTracking,
} from "../lib/student-journey";

export default function Index() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    getAccessToken().then(async (token) => {
      if (!token) {
        setTarget("/(auth)/onboarding");
        SplashScreen.hideAsync();
        return;
      }

      try {
        const journey = await apiFetch<JourneySnapshot>("/api/mobile/me/journey");
        await clearJourneySkipIfStageChanged(journey.stage);

        if (journey.stage === "MATCHING" && journey.activeTeacherCount > 0) {
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
        setTarget("/(tabs)/");
      }
      SplashScreen.hideAsync();
    });
  }, []);

  if (!target) return <View style={{ flex: 1 }} />;
  return <Redirect href={target as Parameters<typeof Redirect>[0]["href"]} />;
}
