import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const ACCESS_KEY = "concord-access-token";
const REFRESH_KEY = "concord-refresh-token";
const ROLE_KEY = "concord-user-role";

export type UserRole = "STUDENT" | "PARENT" | "TEACHER" | "MANAGER";

/** SecureStore 우선, 없으면 구버전 AsyncStorage 평문 토큰을 1회 이관 후 삭제. */
async function getToken(key: string): Promise<string | null> {
  const secure = await SecureStore.getItemAsync(key);
  if (secure) return secure;
  const legacy = await AsyncStorage.getItem(key);
  if (legacy) {
    await SecureStore.setItemAsync(key, legacy);
    await AsyncStorage.removeItem(key);
  }
  return legacy;
}

export async function getAccessToken(): Promise<string | null> {
  return getToken(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return getToken(REFRESH_KEY);
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
  ]);
}

export async function saveRole(role: string) {
  await AsyncStorage.setItem(ROLE_KEY, role);
}

export async function getRole(): Promise<UserRole | null> {
  const r = await AsyncStorage.getItem(ROLE_KEY);
  if (r === "STUDENT" || r === "PARENT" || r === "TEACHER" || r === "MANAGER") return r;
  return null;
}

/** 역할별 홈 라우트 — 로그인 직후·앱 진입 게이트 공용. */
export function homeRouteForRole(role: UserRole | null): string {
  if (role === "PARENT") return "/(parent)";
  if (role === "TEACHER") return "/(teacher)";
  if (role === "MANAGER") return "/(manager)";
  return "/";
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
    // 구버전 평문 잔재도 함께 제거
    AsyncStorage.removeItem(ACCESS_KEY),
    AsyncStorage.removeItem(REFRESH_KEY),
    AsyncStorage.removeItem(ROLE_KEY),
  ]);
}
