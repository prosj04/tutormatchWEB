import { NextResponse } from "next/server";

import { requireMobileStudent } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

/** GET /api/mobile/satisfaction-checkins — 미응답 체크인 목록 */
export async function GET(request: Request) {
  const authResult = await requireMobileStudent(request);
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const checkins = await prisma.satisfactionCheckin.findMany({
    where: { studentId: student.id, respondedAt: null },
    orderBy: { requestedAt: "asc" },
    select: { id: true, trigger: true, requestedAt: true },
  });

  return NextResponse.json({ checkins });
}
