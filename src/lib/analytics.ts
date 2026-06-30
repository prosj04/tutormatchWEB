import type { AnalyticsEventName, AnalyticsPayload } from "@/lib/analytics-events";
import { prisma } from "@/lib/prisma";

export type TrackEventInput = {
  name: AnalyticsEventName | string;
  payload?: AnalyticsPayload;
  platform?: "web" | "mobile";
  userId?: string | null;
};

function serializePayload(payload?: AnalyticsPayload): string {
  if (!payload || Object.keys(payload).length === 0) return "{}";
  try {
    return JSON.stringify(payload);
  } catch {
    return "{}";
  }
}

/** DB에 이벤트 저장 (실패 시 로그만) */
export async function persistAnalyticsEvent(input: TrackEventInput): Promise<void> {
  await prisma.analyticsEvent.create({
    data: {
      name: input.name,
      platform: input.platform ?? "web",
      userId: input.userId ?? null,
      payload: serializePayload(input.payload),
    },
  });
}

/** 서버 측 이벤트 기록 — 구조화 로그 + DB 영속화 */
export function logAnalyticsEvent(input: TrackEventInput): void {
  const entry = {
    ts: new Date().toISOString(),
    event: input.name,
    platform: input.platform ?? "web",
    userId: input.userId ?? null,
    ...input.payload,
  };
  console.info("[analytics]", JSON.stringify(entry));

  void persistAnalyticsEvent(input).catch((err) => {
    console.error(
      "[analytics] persist failed",
      err instanceof Error ? err.message : err,
    );
  });
}
