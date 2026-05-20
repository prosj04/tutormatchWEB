import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { assignDefaultManagerToStudent } from "@/lib/student-enrollment";
import { prisma } from "@/lib/prisma";

/** DELETE ME — 임시: 결제 스킵 API (모든 환경; 제거 전 삭제) */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Student login required" }, { status: 401 });
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
  });
  if (!student) {
    return NextResponse.json({ error: "Student profile missing" }, { status: 404 });
  }

  try {
    await assignDefaultManagerToStudent({
      studentId: student.id,
      studentName: student.name,
      studentGrade: student.grade,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NO_DEFAULT_MANAGER") {
      return NextResponse.json({ error: "No default manager" }, { status: 503 });
    }
    throw e;
  }

  return NextResponse.json({ ok: true, redirect: "/dashboard/consultation?visit=1" });
}
