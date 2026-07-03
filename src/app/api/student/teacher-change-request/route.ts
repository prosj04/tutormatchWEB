import { NextResponse } from "next/server";

import { requireStudent } from "@/lib/student-auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

/** POST /api/student/teacher-change-request
 *  학생이 선생님 교체를 요청한다.
 *  body: { matchId: string; reason?: string }
 */
export async function POST(request: Request) {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  let body: { matchId?: unknown; reason?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const matchId = typeof body.matchId === "string" ? body.matchId.trim() : "";
  if (!matchId) {
    return NextResponse.json({ error: "matchId is required" }, { status: 400 });
  }

  const reason =
    typeof body.reason === "string"
      ? body.reason.trim().substring(0, 500)
      : null;

  // Validate the match belongs to this student and is ACTIVE
  const match = await prisma.teacherStudent.findFirst({
    where: { id: matchId, studentId: student.id },
  });

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  if (match.matchStatus !== "ACTIVE") {
    return NextResponse.json(
      { error: "활성 매칭만 교체 요청이 가능합니다" },
      { status: 409 },
    );
  }

  // Spam guard: prevent duplicate requests within 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const existingRequest = await prisma.notification.findFirst({
    where: {
      type: "TEACHER_CHANGE_REQUEST",
      relatedId: matchId,
      createdAt: { gte: sevenDaysAgo },
    },
  });

  if (existingRequest) {
    return NextResponse.json(
      { error: "이미 접수된 요청이 있습니다" },
      { status: 409 },
    );
  }

  // Resolve notification recipients: booking.managerId first, fallback to all CHIEF_MANAGER users
  // Use the student's current (open or latest) booking to route the request.
  const booking = await prisma.consultationBooking.findFirst({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    select: { managerId: true, manager: { select: { userId: true } } },
  });

  let recipientUserIds: string[];
  if (booking?.manager?.userId) {
    recipientUserIds = [booking.manager.userId];
  } else {
    const chiefManagers = await prisma.teacher.findMany({
      where: { approved: true, user: { role: "CHIEF_MANAGER" } },
      select: { userId: true },
    });
    recipientUserIds = chiefManagers.map((m) => m.userId);
  }

  if (recipientUserIds.length === 0) {
    return NextResponse.json(
      { error: "담당 매니저를 찾을 수 없습니다" },
      { status: 503 },
    );
  }

  const body2 = reason
    ? `${student.name} 학생이 선생님 교체를 요청했습니다. 사유: ${reason}`
    : `${student.name} 학생이 선생님 교체를 요청했습니다.`;

  await Promise.all(
    recipientUserIds.map((userId) =>
      createNotification({
        userId,
        type: "TEACHER_CHANGE_REQUEST",
        title: "선생님 교체 요청",
        body: body2,
        relatedId: matchId,
      }),
    ),
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
