import { NextResponse } from "next/server";

import { requireManager } from "@/lib/manager-auth";
import { formatRelativeTime } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

function parsePreferredTimes(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

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
      preferredTimes: parsePreferredTimes(booking.preferredTimes),
      createdAt: booking.createdAt.toISOString(),
      assignedAt: booking.assignedAt?.toISOString() ?? null,
      assignedAgo: booking.assignedAt
        ? formatRelativeTime(booking.assignedAt.toISOString())
        : null,
      student: booking.student,
    })),
  });
}
