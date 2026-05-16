import { NextResponse } from "next/server";

import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/student-auth";

const VALID_TIMES = new Set([
  "오전 9-11시",
  "오전 11-오후 1시",
  "오후 1-3시",
  "오후 3-5시",
  "오후 5-7시",
  "저녁 7-9시",
]);

export async function POST(request: Request) {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  let body: { preferredTimes?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const preferredTimes = Array.isArray(body.preferredTimes)
    ? body.preferredTimes.filter(
        (time): time is string =>
          typeof time === "string" && VALID_TIMES.has(time),
      )
    : [];

  if (preferredTimes.length === 0) {
    return NextResponse.json(
      { error: "희망 연락 시간대를 1개 이상 선택해주세요." },
      { status: 400 },
    );
  }

  const note =
    typeof body.note === "string" && body.note.trim()
      ? body.note.trim()
      : null;

  const existing = await prisma.consultationBooking.findUnique({
    where: { studentId: student.id },
  });

  if (existing?.status === "WAITING" || existing?.status === "ASSIGNED") {
    return NextResponse.json(
      { error: "이미 진행 중인 상담 신청이 있습니다." },
      { status: 409 },
    );
  }

  if (existing?.status === "COMPLETED") {
    return NextResponse.json(
      { error: "이미 상담이 완료되어 매칭을 진행 중입니다." },
      { status: 409 },
    );
  }

  const booking = existing
    ? await prisma.consultationBooking.update({
        where: { id: existing.id },
        data: {
          managerId: null,
          preferredTimes: JSON.stringify(preferredTimes),
          status: "WAITING",
          note,
          managerNote: null,
          assignedAt: null,
        },
      })
    : await prisma.consultationBooking.create({
        data: {
          studentId: student.id,
          managerId: null,
          preferredTimes: JSON.stringify(preferredTimes),
          status: "WAITING",
          note,
        },
      });

  const managers = await prisma.teacher.findMany({
    where: {
      approved: true,
      user: { role: "MANAGER" },
    },
    select: { userId: true },
  });

  await Promise.all(
    managers.map((manager) =>
      createNotification({
        userId: manager.userId,
        type: "NEW_STUDENT_WAITING",
        title: "새로운 상담 신청",
        body: `${student.name}(${student.grade})님이 상담을 신청했습니다.`,
        relatedId: booking.id,
      }),
    ),
  );

  return NextResponse.json(
    {
      booking: {
        id: booking.id,
        status: booking.status,
        note: booking.note,
        preferredTimes,
        createdAt: booking.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
