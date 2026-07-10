import { NextResponse } from "next/server";

import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { logAnalyticsEvent } from "@/lib/analytics";
import { issueMobileTokens } from "@/lib/mobile-auth";
import { createParentAccount } from "@/lib/parent-account";

/** POST /api/mobile/parent/register — 학부모 계정 생성(모바일, 토큰 발급) */
export async function POST(request: Request) {
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

  const tokens = issueMobileTokens(result.userId, result.role);

  logAnalyticsEvent({
    name: ANALYTICS_EVENTS.parentRegistered,
    userId: result.userId,
    platform: "mobile",
  });

  return NextResponse.json({ ...tokens }, { status: 201 });
}
