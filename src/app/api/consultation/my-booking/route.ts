import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/student-auth";

export async function GET() {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const booking = await prisma.consultationBooking.findFirst({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    include: {
      slot: {
        include: {
          manager: { select: { name: true } },
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ booking: null });
  }

  return NextResponse.json({
    booking: {
      id: booking.id,
      status: booking.status,
      note: booking.note,
      createdAt: booking.createdAt.toISOString(),
      managerName: booking.slot.manager.name,
      slot: {
        date: booking.slot.date,
        startTime: booking.slot.startTime,
        endTime: booking.slot.endTime,
      },
    },
  });
}
