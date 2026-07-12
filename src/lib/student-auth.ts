import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireStudent() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }
  if (session.user.role !== "STUDENT") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { deletedAt: true, role: true } } },
  });

  if (!student) {
    return {
      error: NextResponse.json({ error: "Student not found" }, { status: 404 }),
    } as const;
  }

  // 소프트삭제·역할변경 즉시 반영(모바일 getMobileUser와 동일 정책)
  if (student.user.deletedAt !== null || student.user.role !== session.user.role) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }

  return { session, student, userId: session.user.id } as const;
}

export function isValidDateString(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export function isValidMonthString(month: string): boolean {
  return /^\d{4}-\d{2}$/.test(month);
}
