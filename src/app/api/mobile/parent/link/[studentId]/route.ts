import { NextResponse } from "next/server";

import { parentChildOrNull, requireMobileParent } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ studentId: string }> };

/** DELETE /api/mobile/parent/link/[studentId] — 자녀 연결 해제(모바일) */
export async function DELETE(request: Request, context: RouteContext) {
  const authResult = await requireMobileParent(request);
  if ("error" in authResult) return authResult.error;

  const { studentId } = await context.params;
  if (!(await parentChildOrNull(authResult.parent.id, studentId))) {
    return NextResponse.json({ error: "연결되지 않은 자녀입니다." }, { status: 404 });
  }

  await prisma.parentStudent.delete({
    where: { parentId_studentId: { parentId: authResult.parent.id, studentId } },
  });
  return NextResponse.json({ ok: true });
}
