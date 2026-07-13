"use client";

import type { AnalyticsEventName, AnalyticsPayload } from "@/lib/analytics-events";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function forwardToGa4(name: string, payload?: AnalyticsPayload): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  // GA4 표준 전자상거래 이벤트로 매핑해 전환 리포트에 잡히게 한다
  if (name === "payment_completed") {
    window.gtag("event", "purchase", {
      currency: "KRW",
      value: typeof payload?.amount === "number" ? payload.amount : undefined,
      transaction_id: payload?.order_id ?? undefined,
      items: payload?.plan_id ? [{ item_id: payload.plan_id }] : undefined,
    });
    return;
  }
  if (name === "consultation_submitted") {
    // GA4 표준 리드 이벤트로 매핑 — 상담 신청 전환 리포트용
    window.gtag("event", "generate_lead", {
      currency: "KRW",
      source: payload?.source ?? undefined,
    });
    return;
  }
  if (name === "checkout_started") {
    window.gtag("event", "begin_checkout", {
      currency: "KRW",
      value: typeof payload?.amount === "number" ? payload.amount : undefined,
      items: payload?.plan_id ? [{ item_id: payload.plan_id }] : undefined,
    });
    return;
  }
  window.gtag("event", name, payload ?? {});
}

/** 웹 클라이언트 이벤트 전송 (fire-and-forget) — DB(AnalyticsEvent) + GA4 이중 계측 */
export function trackEvent(
  name: AnalyticsEventName | string,
  payload?: AnalyticsPayload,
): void {
  forwardToGa4(name, payload);
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, payload, platform: "web" }),
    keepalive: true,
  }).catch(() => {});
}
