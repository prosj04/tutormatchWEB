import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * 학생 자동결제 토글. body: { enabled: boolean }.
 * enabled=false 로 해지해도 billingKey는 유지 → 언제든 토글로 재활성.
 * 카드 재등록 없이 다음 결제일부터 자동 청구 여부만 바뀐다.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Student login required" }, { status: 401 });
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  let body: { enabled?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "enabled(boolean) required" }, { status: 400 });
  }

  const profile = await prisma.billingProfile.findUnique({
    where: { studentId: student.id },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "No billing profile" }, { status: 404 });
  }

  const updated = await prisma.billingProfile.update({
    where: { studentId: student.id },
    data: { autoRenew: body.enabled },
    select: { autoRenew: true },
  });

  return NextResponse.json({ ok: true, autoRenew: updated.autoRenew });
}
