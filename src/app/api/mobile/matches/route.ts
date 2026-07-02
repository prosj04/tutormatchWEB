import { NextResponse } from "next/server";

import { requireMobileStudent } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { acceptTeacherStudentMatch } from "@/lib/teacher-student-match";

/** GET /api/mobile/matches — 배정(추천) 선생님 목록 */
export async function GET(request: Request) {
  const authResult = await requireMobileStudent(request);
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const matches = await prisma.teacherStudent.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      subjects: true,
      isActive: true,
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
      matchId: m.id,
      id: m.teacher.id,
      name: m.teacher.name,
      subject,
      education: m.teacher.education,
      experience: m.teacher.experience,
      why: m.teacher.bio || `${student.name} 학생의 학습 목표에 맞춰 배정된 선생님이에요.`,
      initials: m.teacher.name[0] ?? "T",
      accepted: m.isActive,
    };
  });

  return NextResponse.json({ teachers, studentName: student.name });
}

/** POST /api/mobile/matches — 학생이 배정 선생님 수락 */
export async function POST(request: Request) {
  const authResult = await requireMobileStudent(request);
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  let body: { teacherId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const teacherId = typeof body.teacherId === "string" ? body.teacherId : "";
  if (!teacherId) {
    return NextResponse.json({ error: "teacherId required" }, { status: 400 });
  }

  const match = await prisma.teacherStudent.findFirst({
    where: { studentId: student.id, teacherId },
  });

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  const result = await acceptTeacherStudentMatch(match.id, student.id, student.name);
  if (!result.ok) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, accepted: true });
}
