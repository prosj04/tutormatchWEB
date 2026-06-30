import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { apiLogin } from "../lib/api";
import { clearTokens, getAccessToken, saveTokens } from "../lib/auth";
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
    setIsLoggedIn(true);
    void registerPushToken().catch(() => {});
    router.replace("/(tabs)/");
  }, [router]);

  const logout = useCallback(async () => {
    await clearTokens();
    setIsLoggedIn(false);
    router.replace("/(auth)/onboarding");
  }, [router]);

  return { isLoggedIn, login, logout };
}
