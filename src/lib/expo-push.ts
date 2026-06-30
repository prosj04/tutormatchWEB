import { prisma } from "@/lib/prisma";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

type PushMessage = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

/** Expo Push API로 토큰 목록에 알림 발송 */
export async function sendExpoPush(
  tokens: string[],
  message: PushMessage,
): Promise<void> {
  if (tokens.length === 0) return;

  const payload = tokens.map((to) => ({
    to,
    sound: "default" as const,
    title: message.title,
    body: message.body,
    data: message.data ?? {},
  }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload.length === 1 ? payload[0] : payload),
    });
    if (!res.ok) {
      console.error("[expo-push] send failed", await res.text());
    }
  } catch (e) {
    console.error("[expo-push] send error:", e);
  }
}

/** 사용자의 등록된 PushDevice로 알림 발송 */
export async function sendExpoPushToUser(
  userId: string,
  message: PushMessage,
): Promise<void> {
  const devices = await prisma.pushDevice.findMany({
    where: { userId },
    select: { expoPushToken: true },
  });
  await sendExpoPush(
    devices.map((d) => d.expoPushToken),
    message,
  );
}
