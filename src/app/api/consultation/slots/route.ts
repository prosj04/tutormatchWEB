import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/student-auth";
import { todayDateKey } from "@/lib/study-plan-dates";

export async function GET(request: Request) {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;

  const managerId = new URL(request.url).searchParams.get("managerId");
  if (!managerId) {
    return NextResponse.json({ error: "managerId is required" }, { status: 400 });
  }

  const manager = await prisma.teacher.findFirst({
    where: {
      id: managerId,
      approved: true,
      user: { role: "MANAGER" },
    },
    select: { id: true },
  });

  if (!manager) {
    return NextResponse.json({ error: "Manager not found" }, { status: 404 });
  }

  const today = todayDateKey();

  const slots = await prisma.consultationSlot.findMany({
    where: {
      managerId,
      date: { gte: today },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json({
    slots: slots.map((s) => ({
      id: s.id,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      isBooked: s.isBooked,
    })),
  });
}
