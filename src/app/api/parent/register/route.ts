import { NextResponse } from "next/server";

import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { logAnalyticsEvent } from "@/lib/analytics";
import { createParentAccount } from "@/lib/parent-account";

/** POST /api/parent/register — 학부모 계정 생성(웹). 생성 후 로그인은 NextAuth로. */
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

  logAnalyticsEvent({
    name: ANALYTICS_EVENTS.parentRegistered,
    userId: result.userId,
    platform: "web",
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
