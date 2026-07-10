import { NextResponse } from "next/server";

import { requireMobileManager } from "@/lib/mobile-auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireMobileManager(request);
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const { id } = await context.params;

  const result = await prisma.consultationBooking.updateMany({
    where: {
      id,
      managerId: null,
      status: "WAITING",
    },
    data: {
      managerId: teacher.id,
      status: "ASSIGNED",
      assignedAt: new Date(),
    },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "이미 다른 매니저가 담당을 선택했습니다." },
      { status: 409 },
    );
  }

  const booking = await prisma.consultationBooking.findUnique({
    where: { id },
    include: { student: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  await createNotification({
    userId: booking.student.userId,
    type: "BOOKING_CONFIRMED",
    title: "매니저가 배정되었습니다",
    body: `${teacher.name} 선생님이 담당 매니저로 배정되었습니다. 희망하신 시간에 연락드릴 예정입니다.`,
    relatedId: booking.id,
  });

  return NextResponse.json({ booking });
}
