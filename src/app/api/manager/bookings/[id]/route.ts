import { NextResponse } from "next/server";

import { requireManager } from "@/lib/manager-auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireManager();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const { id } = await context.params;

  let body: { status?: unknown; managerNote?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = typeof body.status === "string" ? body.status : "";
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const booking = await prisma.consultationBooking.findFirst({
    where: { id, managerId: teacher.id },
    include: {
      slot: true,
      student: { include: { user: true } },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const managerNote =
    typeof body.managerNote === "string" ? body.managerNote.trim() : undefined;

  if (status === "COMPLETED" && !managerNote) {
    return NextResponse.json(
      { error: "상담 메모를 입력해주세요." },
      { status: 400 },
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.consultationBooking.update({
      where: { id },
      data: {
        status,
        ...(managerNote !== undefined ? { managerNote } : {}),
      },
      include: {
        slot: true,
        student: { include: { user: true } },
      },
    });

    if (status === "CANCELLED") {
      await tx.consultationSlot.update({
        where: { id: booking.slotId },
        data: { isBooked: false },
      });
    }

    if (status === "CONFIRMED") {
      await createNotification({
        userId: booking.student.userId,
        type: "BOOKING_CONFIRMED",
        title: "상담 예약 확정",
        body: `${booking.slot.date} ${booking.slot.startTime} 상담 예약이 확정되었습니다.`,
        relatedId: booking.id,
      });
    }

    return result;
  });

  return NextResponse.json({
    booking: {
      id: updated.id,
      status: updated.status,
      managerNote: updated.managerNote,
    },
  });
}
