import { NextResponse } from "next/server";

import { logAnalyticsEvent } from "@/lib/analytics";
import type { AnalyticsPayload } from "@/lib/analytics-events";
import { getMobileUser } from "@/lib/mobile-auth";
import { auth } from "@/auth";

/**
 * POST /api/events — 클라이언트 이벤트 수집 (웹/앱 공통)
 * body: { name: string; payload?: object; platform?: "web" | "mobile" }
 */
export async function POST(request: Request) {
  let body: { name?: unknown; payload?: unknown; platform?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const platform =
    body.platform === "mobile" || body.platform === "web"
      ? body.platform
      : "web";

  const payload =
    body.payload && typeof body.payload === "object" && !Array.isArray(body.payload)
      ? (body.payload as AnalyticsPayload)
      : undefined;

  let userId: string | null = null;
  if (platform === "mobile") {
    const mobileUser = getMobileUser(request);
    userId = mobileUser?.sub ?? null;
  } else {
    const session = await auth();
    userId = session?.user?.id ?? null;
  }

  logAnalyticsEvent({ name, payload, platform, userId });

  return new NextResponse(null, { status: 204 });
}
