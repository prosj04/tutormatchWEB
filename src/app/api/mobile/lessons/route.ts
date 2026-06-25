import { NextResponse } from "next/server";

import { requireMobileStudent } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

/** GET /api/mobile/lessons?range=today|upcoming */
export async function GET(request: Request) {
  const authResult = await requireMobileStudent(request);
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "upcoming";

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const where =
    range === "today"
      ? { startAt: { gte: startOfDay, lte: endOfDay } }
      : { startAt: { gte: now } };

  const lessons = await prisma.lesson.findMany({
    where: {
      studentId: student.id,
      status: { not: "CANCELLED" },
      ...where,
    },
    orderBy: { startAt: "asc" },
    take: range === "today" ? 5 : 20,
    select: {
      id: true,
      subject: true,
      startAt: true,
      durationMin: true,
      joinUrl: true,
      status: true,
      teacher: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ lessons });
}
