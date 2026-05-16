import { NextResponse } from "next/server";

import { requireManager } from "@/lib/manager-auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, context: RouteContext) {
  const authResult = await requireManager();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const { id } = await context.params;

  const booking = await prisma.consultationBooking.findFirst({
    where: {
      id,
      managerId: teacher.id,
      status: "ASSIGNED",
    },
    include: { student: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const updated = await prisma.consultationBooking.update({
    where: { id },
    data: {
      managerId: null,
      status: "WAITING",
      assignedAt: null,
      managerNote: null,
    },
  });

  await createNotification({
    userId: booking.student.userId,
    type: "BOOKING_CONFIRMED",
    title: "상담이 취소되었습니다",
    body: "담당 매니저 배정이 취소되었습니다. 다른 매니저가 다시 배정될 예정입니다.",
    relatedId: booking.id,
  });

  return NextResponse.json({ booking: updated });
}
