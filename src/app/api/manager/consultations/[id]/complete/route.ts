import { NextResponse } from "next/server";

import { requireManager } from "@/lib/manager-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireManager();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const { id } = await context.params;

  let body: { managerNote?: unknown; status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const managerNote =
    typeof body.managerNote === "string" ? body.managerNote.trim() : "";

  if (!managerNote) {
    return NextResponse.json(
      { error: "상담 메모를 입력해주세요." },
      { status: 400 },
    );
  }

  const booking = await prisma.consultationBooking.findFirst({
    where: {
      id,
      managerId: teacher.id,
      status: "ASSIGNED",
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // 플로우 개편: 선생님 배정(수락 대기 포함)이 있어야 완료 처리 가능
  const liveMatch = await prisma.teacherStudent.findFirst({
    where: {
      studentId: booking.studentId,
      matchStatus: { in: ["PENDING_STUDENT_ACCEPT", "ACTIVE"] },
    },
    select: { id: true },
  });
  if (!liveMatch) {
    return NextResponse.json(
      { error: "선생님을 먼저 배정해야 완료 처리할 수 있습니다." },
      { status: 400 },
    );
  }

  const updated = await prisma.consultationBooking.update({
    where: { id },
    data: {
      status: "COMPLETED",
      managerNote,
    },
  });

  return NextResponse.json({ booking: updated });
}
