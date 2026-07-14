import { NextResponse } from "next/server";

import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { logAnalyticsEvent } from "@/lib/analytics";
import { issueMobileTokens } from "@/lib/mobile-auth";
import { createParentAccount } from "@/lib/parent-account";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

/** POST /api/mobile/parent/register — 학부모 계정 생성(모바일, 토큰 발급) */
export async function POST(request: Request) {
  if (!checkRateLimit("register", clientIp(request), { windowMs: 10 * 60_000, max: 5 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { name?: unknown; email?: unknown; password?: unknown; phone?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await createParentAccount(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // 방금 생성된 계정 — tokenVersion은 스키마 기본값 0.
  const tokens = issueMobileTokens(result.userId, result.role, 0);

  logAnalyticsEvent({
    name: ANALYTICS_EVENTS.parentRegistered,
    userId: result.userId,
    platform: "mobile",
  });

  return NextResponse.json({ ...tokens }, { status: 201 });
}
