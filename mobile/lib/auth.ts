import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_KEY = "concord-access-token";
const REFRESH_KEY = "concord-refresh-token";
const ROLE_KEY = "concord-user-role";

export type UserRole = "STUDENT" | "PARENT" | "TEACHER" | "MANAGER";

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_KEY);
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    AsyncStorage.setItem(ACCESS_KEY, accessToken),
    AsyncStorage.setItem(REFRESH_KEY, refreshToken),
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
    AsyncStorage.removeItem(ACCESS_KEY),
    AsyncStorage.removeItem(REFRESH_KEY),
    AsyncStorage.removeItem(ROLE_KEY),
  ]);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_KEY);
}
