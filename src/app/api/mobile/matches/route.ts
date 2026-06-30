import { NextResponse } from "next/server";

import { requireMobileStudent } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

/** GET /api/mobile/matches — 배정(추천) 선생님 목록 */
export async function GET(request: Request) {
  const authResult = await requireMobileStudent(request);
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const matches = await prisma.teacherStudent.findMany({
    where: { studentId: student.id, isActive: true },
    orderBy: { createdAt: "asc" },
    select: {
      subjects: true,
      teacher: {
        select: {
          id: true,
          name: true,
          subjects: true,
          education: true,
          experience: true,
          bio: true,
        },
      },
    },
  });

  const teachers = matches.map((m) => {
    const subject =
      m.subjects.split(/[,\s]+/).filter(Boolean)[0] ??
      m.teacher.subjects.split(/[,\s]+/).filter(Boolean)[0] ??
      m.teacher.subjects;
    return {
      id: m.teacher.id,
      name: m.teacher.name,
      subject,
      education: m.teacher.education,
      experience: m.teacher.experience,
      why: m.teacher.bio || `${student.name} 학생의 학습 목표에 맞춰 배정된 선생님이에요.`,
      initials: m.teacher.name[0] ?? "T",
    };
  });

  return NextResponse.json({ teachers, studentName: student.name });
}
