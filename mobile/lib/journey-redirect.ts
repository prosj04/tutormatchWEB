import AsyncStorage from "@react-native-async-storage/async-storage";

import type { StudentJourneyStage } from "./student-journey";

function skipKey(stage: StudentJourneyStage): string {
  return `concord-journey-skip-${stage}`;
}

/** 이번 단계에서 status 강제 진입을 건너뛰기 (홈으로 이동 시) */
export async function skipJourneyRedirect(stage: StudentJourneyStage): Promise<void> {
  await AsyncStorage.setItem(skipKey(stage), "1");
}

export async function shouldSkipJourneyRedirect(
  stage: StudentJourneyStage,
): Promise<boolean> {
  const v = await AsyncStorage.getItem(skipKey(stage));
  return v === "1";
}

/** 단계가 바뀌면 이전 skip 플래그 초기화 */
export async function clearJourneySkipIfStageChanged(
  stage: StudentJourneyStage,
): Promise<void> {
  const stages: StudentJourneyStage[] = [
    "PRE_SIGNUP",
    "ONBOARDED",
    "WAITING",
    "ASSIGNED",
    "MATCHING",
    "ACTIVE",
  ];
  await Promise.all(
    stages
      .filter((s) => s !== stage)
      .map((s) => AsyncStorage.removeItem(skipKey(s))),
  );
}
