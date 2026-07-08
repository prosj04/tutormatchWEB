import { NextResponse } from "next/server";

import { getMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

const WEEKDAY_LABEL = ["일", "월", "화", "수", "목", "금", "토"];

/** GET /api/mobile/tutors/[id]/slots — 강사 상담 가능 시간 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  await getMobileUser(request);

  // 승인된(데모 아닌) 강사의 슬롯만 노출 — 임의 teacherId로 가용시간 조회 차단.
  const tutor = await prisma.teacher.findFirst({
    where: { id: params.id, approved: true, name: { not: { startsWith: "[sample]" } } },
    select: { id: true },
  });
  if (!tutor) {
    return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
  }

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
