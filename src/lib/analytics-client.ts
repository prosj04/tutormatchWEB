"use client";

import type { AnalyticsEventName, AnalyticsPayload } from "@/lib/analytics-events";

/** 웹 클라이언트 이벤트 전송 (fire-and-forget) */
export function trackEvent(
  name: AnalyticsEventName | string,
  payload?: AnalyticsPayload,
): void {
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, payload, platform: "web" }),
    keepalive: true,
  }).catch(() => {});
}
