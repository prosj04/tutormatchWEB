import { NextResponse } from "next/server";

import { issueMobileTokens, verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  let body: { refreshToken?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const refreshToken =
    typeof body.refreshToken === "string" ? body.refreshToken : "";
  const payload = verifyMobileToken(refreshToken);
  if (!payload || payload.typ !== "refresh") {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, deletedAt: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 탈퇴(소프트 삭제)한 계정은 리프레시 토큰으로도 재발급 불가 — 세션 연장 차단.
  if (user.deletedAt) {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }

  return NextResponse.json(issueMobileTokens(user.id, user.role));
}
