import { NextResponse } from "next/server";

import { requireManager } from "@/lib/manager-auth";
import { formatRelativeTime } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { parseVisitTimes } from "@/lib/visit-consultation";

export async function GET() {
  const authResult = await requireManager();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const bookings = await prisma.consultationBooking.findMany({
    where: { managerId: teacher.id },
    include: {
      student: {
        select: { id: true, name: true, grade: true, subjects: true },
      },
    },
    orderBy: [{ assignedAt: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    bookings: bookings.map((booking) => ({
      id: booking.id,
      status: booking.status,
      note: booking.note,
      managerNote: booking.managerNote,
      preferredTimes: [],
      visitPreferredTimes: parseVisitTimes(booking.visitPreferredTimes),
      createdAt: booking.createdAt.toISOString(),
      assignedAt: booking.assignedAt?.toISOString() ?? null,
      assignedAgo: booking.assignedAt
        ? formatRelativeTime(booking.assignedAt.toISOString())
        : null,
      student: booking.student,
    })),
  });
}
