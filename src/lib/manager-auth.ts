import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getTeacherByUserId } from "@/lib/get-teacher-cache";
import { prisma } from "@/lib/prisma";

export async function requireManager() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }
  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "MANAGER" &&
    session.user.role !== "CHIEF_MANAGER"
  ) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }

  const teacher = await getTeacherByUserId(session.user.id);

  if (!teacher) {
    return {
      error: NextResponse.json({ error: "Manager not found" }, { status: 404 }),
    } as const;
  }

  // 캐시(getTeacherByUserId)는 deletedAt/role을 담지 않으므로 별도 재조회로
  // 소프트삭제·역할변경 즉시 반영(모바일 getMobileUser와 동일 정책)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { deletedAt: true, role: true },
  });
  if (!user || user.deletedAt !== null || user.role !== session.user.role) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }

  return { session, teacher, userId: session.user.id } as const;
}
