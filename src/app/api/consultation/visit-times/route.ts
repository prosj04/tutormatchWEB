import { NextResponse } from "next/server";

import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/student-auth";
import {
  getNextWeekDates,
  isValidVisitTimesPayload,
  parseVisitTimes,
  serializeVisitTimes,
  type VisitTimesByDate,
} from "@/lib/visit-consultation";

export async function PATCH(request: Request) {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  let body: { visitPreferredTimes?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body.visitPreferredTimes;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return NextResponse.json({ error: "Invalid visit times" }, { status: 400 });
  }

  const visitMap = raw as VisitTimesByDate;
  const allowedDates = getNextWeekDates().map((d) => d.key);
  if (!isValidVisitTimesPayload(visitMap, allowedDates)) {
    return NextResponse.json({ error: "Invalid visit times" }, { status: 400 });
  }

  const slotCount = Object.values(visitMap).reduce((n, s) => n + s.length, 0);
  if (slotCount === 0) {
    return NextResponse.json(
      { error: "방문 상담 가능 시간대를 1개 이상 선택해 주세요." },
      { status: 400 },
    );
  }

  // Visit-time updates target the student's OPEN booking. History rows
  // (COMPLETED/CANCELLED) are immutable and must not be mutated.
  const booking = await prisma.consultationBooking.findFirst({
    where: {
      studentId: student.id,
      status: { in: ["WAITING", "ASSIGNED"] },
    },
    orderBy: { createdAt: "desc" },
    include: { manager: { include: { user: { select: { id: true } } } } },
  });

  if (!booking) {
    return NextResponse.json({ error: "상담 신청이 없습니다." }, { status: 404 });
  }

  const updated = await prisma.consultationBooking.update({
    where: { id: booking.id },
    data: { visitPreferredTimes: serializeVisitTimes(visitMap) },
  });

  if (booking.manager?.user?.id) {
    await createNotification({
      userId: booking.manager.user.id,
      type: "VISIT_TIMES_UPDATED",
      title: "방문 상담 희망 시간",
      body: `${student.name}님이 방문 상담 가능 시간대를 입력했습니다.`,
      relatedId: booking.id,
    });
  }

  return NextResponse.json({
    visitPreferredTimes: parseVisitTimes(updated.visitPreferredTimes),
  });
}
