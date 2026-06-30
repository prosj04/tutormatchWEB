import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { apiFetch } from "./api";
import { getAccessToken } from "./auth";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** 로그인 후 Expo 푸시 토큰을 서버에 등록 */
export async function registerPushToken(): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return;

  const push = await Notifications.getExpoPushTokenAsync();
  await apiFetch("/api/mobile/push/register", {
    method: "POST",
    body: JSON.stringify({
      expoPushToken: push.data,
      platform: Platform.OS,
    }),
  });
}
