import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";

export async function requireStudent() {
  const guard = await requireRole(["STUDENT"]);
  if ("error" in guard) return guard;

  const student = await prisma.student.findUnique({
    where: { userId: guard.userId },
    include: { user: { select: { deletedAt: true, role: true } } },
  });

  if (!student) {
    return {
      error: NextResponse.json({ error: "Student not found" }, { status: 404 }),
    } as const;
  }

  // 소프트삭제·역할변경 즉시 반영(모바일 getMobileUser와 동일 정책)
  if (student.user.deletedAt !== null || student.user.role !== guard.session.user.role) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }

  return { session: guard.session, student, userId: guard.userId } as const;
}

export function isValidDateString(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export function isValidMonthString(month: string): boolean {
  return /^\d{4}-\d{2}$/.test(month);
}
