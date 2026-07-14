import { NextResponse } from "next/server";

import { requireMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/mobile/auth/logout — tokenVersion +1로 전 기기 토큰 폐기.
 * 클라이언트 로컬 토큰 삭제와 무관하게 서버 측에서 세션을 무효화한다.
 */
export async function POST(request: Request) {
  const result = await requireMobileUser(request);
  if ("error" in result) return result.error;

  await prisma.user.update({
    where: { id: result.userId },
    data: { tokenVersion: { increment: 1 } },
  });
  return NextResponse.json({ ok: true });
}
