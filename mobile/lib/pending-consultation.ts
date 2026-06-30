import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "concord-pending-consultation";

export type PendingConsultation = {
  grade: string;
  subjects: string;
  gradeLevel: string;
  memo: string;
};

export async function savePendingConsultation(
  data: PendingConsultation,
): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}

export async function getPendingConsultation(): Promise<PendingConsultation | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingConsultation;
    if (!parsed.grade || !parsed.subjects || !parsed.gradeLevel) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearPendingConsultation(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
