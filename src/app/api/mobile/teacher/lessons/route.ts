import { NextResponse } from "next/server";
import { LessonStatus } from "@prisma/client";

import { requireMobileTeacher } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

const LESSON_STATUSES = Object.values(LessonStatus);

function isLessonStatus(value: string): value is LessonStatus {
  return (LESSON_STATUSES as string[]).includes(value);
}

/** GET /api/mobile/teacher/lessons?studentId=&status=SCHEDULED&upcoming=1
 *  Returns lessons for the authed teacher, optionally filtered by studentId, status,
 *  and upcoming (startAt > now).
 */
export async function GET(request: Request) {
  const authResult = await requireMobileTeacher(request);
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId") ?? undefined;
  const rawStatus = searchParams.get("status") ?? undefined;
  const status =
    rawStatus && isLessonStatus(rawStatus) ? rawStatus : undefined;
  const upcoming = searchParams.get("upcoming") === "1";

  const lessons = await prisma.lesson.findMany({
    where: {
      teacherId: teacher.id,
      ...(studentId ? { studentId } : {}),
      ...(status ? { status } : {}),
      ...(upcoming ? { startAt: { gt: new Date() } } : {}),
    },
    select: {
      id: true,
      startAt: true,
      subject: true,
      durationMin: true,
      status: true,
    },
    orderBy: { startAt: "asc" },
    take: 50,
  });

  return NextResponse.json({
    lessons: lessons.map((l) => ({
      id: l.id,
      startAt: l.startAt.toISOString(),
      subject: l.subject,
      durationMin: l.durationMin,
      status: l.status,
    })),
  });
}
