import { NextResponse } from "next/server";

import { getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

/** POST /api/mobile/push/register — Expo 푸시 토큰 등록 */
export async function POST(request: Request) {
  const payload = await getMobileUser(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { expoPushToken?: unknown; platform?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const expoPushToken =
    typeof body.expoPushToken === "string" ? body.expoPushToken.trim() : "";
  const platform =
    typeof body.platform === "string" ? body.platform : null;

  if (!expoPushToken) {
    return NextResponse.json(
      { error: "expoPushToken is required" },
      { status: 400 },
    );
  }

  await prisma.pushDevice.upsert({
    where: { expoPushToken },
    create: { userId: payload.sub, expoPushToken, platform },
    update: { userId: payload.sub, platform },
  });

  return NextResponse.json({ ok: true });
}
