import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { trackJourneyActiveIfFirst } from "@/lib/analytics-journey";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const matches = await prisma.teacherStudent.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      teacher: { select: { id: true, name: true, approved: true } },
      student: { select: { id: true, name: true, grade: true } },
    },
  });

  return NextResponse.json({ matches });
}

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  let body: {
    teacherId?: unknown;
    studentId?: unknown;
    subjects?: unknown;
    startDate?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const teacherId = body.teacherId;
  const studentId = body.studentId;
  const subjects = body.subjects;
  const startDate = body.startDate;

  if (
    typeof teacherId !== "string" ||
    typeof studentId !== "string" ||
    typeof subjects !== "string" ||
    !subjects.trim() ||
    typeof startDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate)
  ) {
    return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
  }

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!teacher || !student) {
    return NextResponse.json({ error: "Teacher or student not found" }, { status: 404 });
  }

  const existing = await prisma.teacherStudent.findUnique({
    where: { teacherId_studentId: { teacherId, studentId } },
  });

  if (existing) {
    const match = await prisma.teacherStudent.update({
      where: { id: existing.id },
      data: {
        subjects: subjects.trim(),
        startDate,
        isActive: true,
      },
      include: {
        teacher: { select: { id: true, name: true } },
        student: { select: { id: true, name: true, grade: true } },
      },
    });
    await trackJourneyActiveIfFirst(studentId);
    return NextResponse.json({ match });
  }

  const match = await prisma.teacherStudent.create({
    data: {
      teacherId,
      studentId,
      subjects: subjects.trim(),
      startDate,
      isActive: true,
    },
    include: {
      teacher: { select: { id: true, name: true } },
      student: { select: { id: true, name: true, grade: true } },
    },
  });

  await trackJourneyActiveIfFirst(studentId);

  return NextResponse.json({ match }, { status: 201 });
}
