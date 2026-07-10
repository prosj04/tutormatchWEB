import { NextResponse } from "next/server";

import { requireMobileTeacher } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authResult = await requireMobileTeacher(request);
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const matches = await prisma.teacherStudent.findMany({
    where: { teacherId: teacher.id, isActive: true },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          grade: true,
          phone: true,
        },
      },
    },
    orderBy: { student: { name: "asc" } },
  });

  const studentIds = matches.map((m) => m.student.id);
  const firstLessons = await prisma.lesson.findMany({
    where: {
      teacherId: teacher.id,
      studentId: { in: studentIds },
      status: { not: "CANCELLED" },
    },
    orderBy: { startAt: "asc" },
    select: { studentId: true, startAt: true },
  });
  const firstLessonMap = new Map<string, string>();
  for (const lesson of firstLessons) {
    if (!firstLessonMap.has(lesson.studentId)) {
      firstLessonMap.set(lesson.studentId, lesson.startAt.toISOString());
    }
  }

  const students = matches.map((m) => ({
    id: m.student.id,
    name: m.student.name,
    grade: m.student.grade,
    phone: m.student.phone,
    subjects: m.subjects,
    startDate: m.startDate,
    firstLessonAt: firstLessonMap.get(m.student.id) ?? null,
  }));

  return NextResponse.json({ students });
}
