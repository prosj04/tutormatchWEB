import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_KEY = "concord-access-token";
const REFRESH_KEY = "concord-refresh-token";

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_KEY);
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    AsyncStorage.setItem(ACCESS_KEY, accessToken),
    AsyncStorage.setItem(REFRESH_KEY, refreshToken),
  ]);
}

export async function clearTokens() {
  await Promise.all([
    AsyncStorage.removeItem(ACCESS_KEY),
    AsyncStorage.removeItem(REFRESH_KEY),
  ]);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_KEY);
}
