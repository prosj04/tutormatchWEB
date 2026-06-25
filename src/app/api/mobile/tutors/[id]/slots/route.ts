import { NextResponse } from "next/server";

import { getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

const WEEKDAY_LABEL = ["일", "월", "화", "수", "목", "금", "토"];

/** GET /api/mobile/tutors/[id]/slots — 강사 상담 가능 시간 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  getMobileUser(request);

  const slots = await prisma.tutorAvailability.findMany({
    where: { teacherId: params.id },
    orderBy: [{ weekday: "asc" }, { time: "asc" }],
    select: { id: true, weekday: true, time: true, isOpen: true },
  });

  return NextResponse.json({
    slots: slots.map((s) => ({
      id: s.id,
      weekday: s.weekday,
      time: s.time,
      label: `${WEEKDAY_LABEL[s.weekday] ?? "?"} ${s.time}`,
      isOpen: s.isOpen,
    })),
  });
}
