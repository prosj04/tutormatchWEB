import { NextResponse } from "next/server";

import { requireTeacher } from "@/lib/teacher-auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

/** PATCH /api/teacher/lessons/[id]/cancel
 *  선생님이 수업을 취소한다. cancelledBy="TEACHER"로 태그하고
 *  7일 뒤 같은 시간에 보충 수업을 자동 생성한다.
 */
export async function PATCH(_request: Request, context: RouteContext) {
  const authResult = await requireTeacher();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const { id } = await context.params;

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: {
      id: true,
      teacherId: true,
      studentId: true,
      subject: true,
      startAt: true,
      durationMin: true,
      status: true,
      student: { select: { userId: true, name: true } },
    },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  if (lesson.teacherId !== teacher.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (lesson.status !== "SCHEDULED") {
    return NextResponse.json(
      { error: "이미 완료되었거나 취소된 수업입니다" },
      { status: 409 },
    );
  }

  if (lesson.startAt <= new Date()) {
    return NextResponse.json(
      { error: "이미 시작되었거나 과거의 수업은 취소할 수 없습니다" },
      { status: 409 },
    );
  }

  // Cancel the lesson
  const cancelled = await prisma.lesson.update({
    where: { id },
    data: { status: "CANCELLED", cancelledBy: "TEACHER" },
  });

  // Auto-create makeup lesson 7 days later if in the future
  const makeupAt = new Date(lesson.startAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  let makeup: { id: string; startAt: Date } | null = null;
  // P2-21: 보충 미생성 사유를 응답에 실어 무음 실패를 없앤다.
  let makeupSkippedReason: string | null = null;

  if (makeupAt > new Date()) {
    // Guard against duplicate makeup (e.g. if this endpoint is called twice)
    const existing = await prisma.lesson.findFirst({
      where: {
        studentId: lesson.studentId,
        teacherId: lesson.teacherId,
        startAt: makeupAt,
        status: { not: "CANCELLED" },
      },
    });

    if (!existing) {
      makeup = await prisma.lesson.create({
        data: {
          studentId: lesson.studentId,
          teacherId: lesson.teacherId,
          subject: lesson.subject,
          startAt: makeupAt,
          durationMin: lesson.durationMin,
        },
        select: { id: true, startAt: true },
      });
    } else {
      makeupSkippedReason =
        "7일 뒤 같은 시간에 이미 수업이 있어 보충 수업이 생성되지 않았습니다. 다른 시간으로 직접 예약해 주세요.";
    }
  } else {
    makeupSkippedReason =
      "보충 예정 시각(7일 뒤)이 이미 지나 보충 수업이 생성되지 않았습니다. 다른 시간으로 직접 예약해 주세요.";
  }

  // Format makeup date for notification
  const makeupDateStr = makeup
    ? (() => {
        const d = makeup.startAt;
        const yy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        return `${yy}-${mm}-${dd} ${hh}:${min}`;
      })()
    : null;

  const originalDateStr = (() => {
    const d = lesson.startAt;
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  })();

  const notifBody = makeupDateStr
    ? `${teacher.name} 선생님이 ${originalDateStr} 수업을 취소했습니다. 보충 수업이 ${makeupDateStr}에 예정되었습니다.`
    : `${teacher.name} 선생님이 ${originalDateStr} 수업을 취소했습니다.`;

  // Notify student
  await createNotification({
    userId: lesson.student.userId,
    type: "LESSON_CANCELLED_BY_TEACHER",
    title: "수업 취소 안내",
    body: notifBody,
    relatedId: id,
  });

  // Notify manager: booking.managerId first, fallback to all CHIEF_MANAGER users
  // Use the student's current (open or latest) booking to route the notice.
  const booking = await prisma.consultationBooking.findFirst({
    where: { studentId: lesson.studentId },
    orderBy: { createdAt: "desc" },
    select: { manager: { select: { userId: true } } },
  });

  let managerUserIds: string[];
  if (booking?.manager?.userId) {
    managerUserIds = [booking.manager.userId];
  } else {
    const chiefs = await prisma.teacher.findMany({
      where: { approved: true, user: { role: "CHIEF_MANAGER" } },
      select: { userId: true },
    });
    managerUserIds = chiefs.map((m) => m.userId);
  }

  const managerBody = makeupDateStr
    ? `${lesson.student.name} 학생의 ${originalDateStr} 수업이 ${teacher.name} 선생님에 의해 취소되었습니다. 보충 수업: ${makeupDateStr}`
    : `${lesson.student.name} 학생의 ${originalDateStr} 수업이 ${teacher.name} 선생님에 의해 취소되었습니다.`;

  await Promise.all(
    managerUserIds.map((userId) =>
      createNotification({
        userId,
        type: "LESSON_CANCELLED_BY_TEACHER",
        title: "수업 취소 (선생님 귀책)",
        body: managerBody,
        relatedId: id,
      }),
    ),
  );

  return NextResponse.json({
    lesson: cancelled,
    makeup,
    makeupCreated: makeup !== null,
    makeupSkippedReason,
  });
}
