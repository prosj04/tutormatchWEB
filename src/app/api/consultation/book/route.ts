import { NextResponse } from "next/server";

import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/student-auth";

export async function POST(request: Request) {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  let body: { slotId?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { slotId, note } = body;
  if (typeof slotId !== "string" || !slotId) {
    return NextResponse.json({ error: "slotId is required" }, { status: 400 });
  }

  const noteValue =
    typeof note === "string" && note.trim() ? note.trim() : null;

  const existing = await prisma.consultationBooking.findFirst({
    where: {
      studentId: student.id,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "이미 진행 중인 상담 예약이 있습니다." },
      { status: 409 },
    );
  }

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const slot = await tx.consultationSlot.findUnique({
        where: { id: slotId },
        include: {
          manager: { include: { user: true } },
        },
      });

      if (!slot || slot.isBooked) {
        throw new Error("SLOT_UNAVAILABLE");
      }

      if (!slot.manager.approved || slot.manager.user.role !== "MANAGER") {
        throw new Error("INVALID_MANAGER");
      }

      await tx.consultationSlot.update({
        where: { id: slotId },
        data: { isBooked: true },
      });

      const created = await tx.consultationBooking.create({
        data: {
          slotId,
          studentId: student.id,
          managerId: slot.managerId,
          note: noteValue,
        },
        include: {
          slot: {
            include: {
              manager: { select: { name: true } },
            },
          },
        },
      });

      await createNotification({
        userId: slot.manager.userId,
        type: "NEW_BOOKING",
        title: "새 상담 예약",
        body: `${student.name} 학생님이 상담을 예약했습니다.`,
        relatedId: created.id,
      });

      return created;
    });

    return NextResponse.json(
      {
        booking: {
          id: booking.id,
          status: booking.status,
          managerName: booking.slot.manager.name,
          slot: {
            date: booking.slot.date,
            startTime: booking.slot.startTime,
            endTime: booking.slot.endTime,
          },
        },
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_UNAVAILABLE") {
      return NextResponse.json(
        { error: "선택한 시간은 이미 예약되었습니다." },
        { status: 409 },
      );
    }
    if (err instanceof Error && err.message === "INVALID_MANAGER") {
      return NextResponse.json({ error: "Invalid manager" }, { status: 400 });
    }
    throw err;
  }
}
