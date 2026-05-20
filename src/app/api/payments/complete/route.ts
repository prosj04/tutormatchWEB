import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { assignChiefManagerToStudent } from "@/lib/student-enrollment";
import { prisma } from "@/lib/prisma";

/** 요금제 결제 완료 후 로그인 학생에게 Chief 매니저 즉시 배정 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Student login required" }, { status: 401 });
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true, grade: true },
  });
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  let body: { orderId?: unknown; paymentKey?: unknown; amount?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const existing = await prisma.consultationBooking.findUnique({
    where: { studentId: student.id },
    select: { status: true, managerId: true },
  });

  if (existing?.status === "ASSIGNED" || existing?.status === "COMPLETED") {
    return NextResponse.json({ ok: true, alreadyAssigned: true });
  }

  try {
    await assignChiefManagerToStudent({
      studentId: student.id,
      studentName: student.name,
      studentGrade: student.grade,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NO_DEFAULT_MANAGER" || msg === "NO_CHIEF_MANAGER") {
      return NextResponse.json(
        { error: "Chief 매니저가 설정되지 않았습니다." },
        { status: 503 },
      );
    }
    throw e;
  }

  return NextResponse.json({ ok: true, assigned: true });
}
