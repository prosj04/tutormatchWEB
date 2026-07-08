import { NextResponse } from "next/server";

import { requireChiefManagerOrAdmin } from "@/lib/admin-auth";
import { trackJourneyActiveIfFirst } from "@/lib/analytics-journey";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireChiefManagerOrAdmin();
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
  const authResult = await requireChiefManagerOrAdmin();
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

  const teacher = await prisma.teacher.findFirst({
    where: { id: teacherId, approved: true, user: { deletedAt: null } },
  });
  const student = await prisma.student.findFirst({
    where: { id: studentId, deletedAt: null },
  });
  if (!teacher || !student) {
    return NextResponse.json({ error: "Teacher or student not found" }, { status: 404 });
  }

  const existing = await prisma.teacherStudent.findUnique({
    where: { teacherId_studentId: { teacherId, studentId } },
  });

  if (existing) {
    // 이미 ACTIVE면 과목/시작일만 갱신하고 상태 유지.
    if (existing.matchStatus === "ACTIVE") {
      const match = await prisma.teacherStudent.update({
        where: { id: existing.id },
        data: { subjects: subjects.trim(), startDate },
        include: {
          teacher: { select: { id: true, name: true } },
          student: { select: { id: true, name: true, grade: true } },
        },
      });
      await trackJourneyActiveIfFirst(studentId);
      return NextResponse.json({ match });
    }

    // PENDING/CANCELLED → 수락 대기로 (재)배정. CANCELLED 부활은 조용히 처리하지 않고
    // 학생에게 다시 알림을 보내 명시적 재배정으로 만든다.
    const wasCancelled = existing.matchStatus === "CANCELLED";
    const match = await prisma.teacherStudent.update({
      where: { id: existing.id },
      data: {
        subjects: subjects.trim(),
        startDate,
        isActive: false,
        matchStatus: "PENDING_STUDENT_ACCEPT",
        respondedAt: null,
      },
      include: {
        teacher: { select: { id: true, name: true } },
        student: { select: { id: true, name: true, grade: true } },
      },
    });
    if (wasCancelled) {
      await createNotification({
        userId: student.userId,
        type: "TEACHER_ASSIGNED",
        title: "선생님이 배정되었습니다",
        body: `${teacher.name} 선생님이 다시 배정되었습니다. 선생님 정보를 확인하고 수락해 주세요.`,
        relatedId: teacherId,
      });
    }
    return NextResponse.json({ match });
  }

  const match = await prisma.teacherStudent.create({
    data: {
      teacherId,
      studentId,
      subjects: subjects.trim(),
      startDate,
      isActive: false,
      matchStatus: "PENDING_STUDENT_ACCEPT",
      respondedAt: null,
    },
    include: {
      teacher: { select: { id: true, name: true } },
      student: { select: { id: true, name: true, grade: true } },
    },
  });

  await createNotification({
    userId: student.userId,
    type: "TEACHER_ASSIGNED",
    title: "선생님이 배정되었습니다",
    body: `${teacher.name} 선생님이 배정되었습니다. 선생님 정보를 확인하고 수락해 주세요.`,
    relatedId: teacherId,
  });

  return NextResponse.json({ match }, { status: 201 });
}
