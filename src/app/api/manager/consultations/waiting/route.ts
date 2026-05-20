import { NextResponse } from "next/server";

import { requireManager } from "@/lib/manager-auth";
import { formatRelativeTime } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { parseVisitTimes } from "@/lib/visit-consultation";

export async function GET() {
  const authResult = await requireManager();
  if ("error" in authResult) return authResult.error;

  const bookings = await prisma.consultationBooking.findMany({
    where: { status: "WAITING", managerId: null },
    include: {
      student: {
        select: { id: true, name: true, grade: true, subjects: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    bookings: bookings.map((booking) => ({
      id: booking.id,
      status: booking.status,
      note: booking.note,
      preferredTimes: [],
      visitPreferredTimes: parseVisitTimes(booking.visitPreferredTimes),
      createdAt: booking.createdAt.toISOString(),
      timeAgo: formatRelativeTime(booking.createdAt.toISOString()),
      student: booking.student,
    })),
  });
}
