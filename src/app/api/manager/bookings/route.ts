import { NextResponse } from "next/server";

import { requireManager } from "@/lib/manager-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireManager();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const bookings = await prisma.consultationBooking.findMany({
    where: { managerId: teacher.id },
    include: {
      student: { select: { id: true, name: true, grade: true } },
      slot: { select: { date: true, startTime: true, endTime: true } },
    },
  });

  bookings.sort((a, b) => {
    const d = a.slot.date.localeCompare(b.slot.date);
    if (d !== 0) return d;
    return a.slot.startTime.localeCompare(b.slot.startTime);
  });

  return NextResponse.json({
    bookings: bookings.map((b) => ({
      id: b.id,
      status: b.status,
      note: b.note,
      managerNote: b.managerNote,
      createdAt: b.createdAt.toISOString(),
      student: b.student,
      slot: b.slot,
    })),
  });
}
