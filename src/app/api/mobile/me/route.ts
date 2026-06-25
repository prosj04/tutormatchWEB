import { NextResponse } from "next/server";

import { requireMobileStudent } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

/** GET /api/mobile/me — 내 프로필 + 구독 상태 */
export async function GET(request: Request) {
  const authResult = await requireMobileStudent(request);
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const subscription = await prisma.subscription.findFirst({
    where: { studentId: student.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { plan: true, status: true, periodEnd: true },
  });

  return NextResponse.json({
    student: {
      id: student.id,
      name: student.name,
      grade: student.grade,
      subjects: student.subjects,
      gender: student.gender,
    },
    subscription,
  });
}
