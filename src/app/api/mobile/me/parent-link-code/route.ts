import { NextResponse } from "next/server";

import { requireMobileStudent } from "@/lib/mobile-auth";
import { issueParentLinkCode } from "@/lib/parent-link";
import { prisma } from "@/lib/prisma";

/** GET /api/mobile/me/parent-link-code — 현재 유효한 연결 코드 조회 */
export async function GET(request: Request) {
  const authResult = await requireMobileStudent(request);
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const record = await prisma.parentLinkCode.findFirst({
    where: { studentId: student.id, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { code: true, expiresAt: true },
  });

  return NextResponse.json({ code: record?.code ?? null, expiresAt: record?.expiresAt ?? null });
}

/** POST /api/mobile/me/parent-link-code — 학부모 연결 코드 새로 발급 */
export async function POST(request: Request) {
  const authResult = await requireMobileStudent(request);
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const { code, expiresAt } = await issueParentLinkCode(student.id);
  return NextResponse.json({ code, expiresAt }, { status: 201 });
}
