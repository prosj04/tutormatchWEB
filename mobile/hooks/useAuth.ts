import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { apiLogin, apiLogout } from "../lib/api";
import {
  clearTokens,
  getAccessToken,
  homeRouteForRole,
  saveRole,
  saveTokens,
  type UserRole,
} from "../lib/auth";
import { registerPushToken } from "../lib/push";

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    getAccessToken().then((t) => setIsLoggedIn(!!t));
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const data = await apiLogin(identifier, password);
    await saveTokens(data.accessToken, data.refreshToken);
    await saveRole(data.user.role);
    setIsLoggedIn(true);
    void registerPushToken().catch(() => {});
    router.replace(homeRouteForRole(data.user.role as UserRole) as never);
  }, [router]);

  const logout = useCallback(async () => {
    // 서버 토큰 폐기(실패 무시) 후 로컬 토큰 삭제
    await apiLogout();
    await clearTokens();
    setIsLoggedIn(false);
    router.replace("/(auth)/onboarding");
  }, [router]);

  return { isLoggedIn, login, logout };
}
