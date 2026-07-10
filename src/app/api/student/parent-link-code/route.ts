import { NextResponse } from "next/server";

import { issueParentLinkCode } from "@/lib/parent-link";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/student-auth";

/** GET /api/student/parent-link-code — 현재 유효한 연결 코드 조회(없으면 null) */
export async function GET() {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const record = await prisma.parentLinkCode.findFirst({
    where: { studentId: student.id, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { code: true, expiresAt: true },
  });

  return NextResponse.json({ code: record?.code ?? null, expiresAt: record?.expiresAt ?? null });
}

/** POST /api/student/parent-link-code — 학부모 연결 코드 새로 발급 */
export async function POST() {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const { code, expiresAt } = await issueParentLinkCode(student.id);
  return NextResponse.json({ code, expiresAt }, { status: 201 });
}
