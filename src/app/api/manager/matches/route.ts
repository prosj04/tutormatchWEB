import { NextResponse } from "next/server";

import { getManagerMatchingData } from "@/lib/manager-portal-data";
import { requireManager } from "@/lib/manager-auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { todayDateKey } from "@/lib/study-plan-dates";

export async function GET() {
  const authResult = await requireManager();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  return NextResponse.json(await getManagerMatchingData(teacher.id));
}

export async function POST(request: Request) {
  const authResult = await requireManager();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  let body: {
    teacherId?: unknown;
    studentId?: unknown;
    subjects?: unknown;
    startDate?: unknown;
    matchReason?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { teacherId, studentId } = body;
  if (typeof teacherId !== "string" || typeof studentId !== "string") {
    return NextResponse.json({ error: "Invalid ids" }, { status: 400 });
  }

  const subjects =
    typeof body.subjects === "string" && body.subjects.trim()
      ? body.subjects.trim()
      : null;
  if (!subjects) {
    return NextResponse.json({ error: "Subjects required" }, { status: 400 });
  }

  const startDate =
    typeof body.startDate === "string" ? body.startDate : todayDateKey();

  const matchReason =
    typeof body.matchReason === "string"
      ? body.matchReason.trim().substring(0, 500)
      : null;

  const targetTeacher = await prisma.teacher.findFirst({
    where: {
      id: teacherId,
      approved: true,
      user: { role: { in: ["TEACHER", "MANAGER", "CHIEF_MANAGER"] } },
    },
    include: { user: true },
  });

  if (!targetTeacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const existing = await prisma.teacherStudent.findFirst({
    where: { studentId },
  });
  if (existing) {
    return NextResponse.json(
      { error: "이미 배정된 선생님이 있는 학생입니다." },
      { status: 409 },
    );
  }

  // createNotification uses the outer prisma instance — keep it outside
  // the interactive transaction to avoid connection-pool deadlock on Vercel.
  await prisma.$transaction([
    prisma.teacherStudent.create({
      data: {
        teacherId,
        studentId,
        subjects,
        startDate,
        matchReason,
        // 학생이 앱에서 수락하기 전까지는 ACTIVE 단계로 전환하지 않는다.
        isActive: false,
        matchStatus: "PENDING_STUDENT_ACCEPT",
        respondedAt: null,
      },
    }),
    prisma.managerStudent.upsert({
      where: {
        managerId_studentId: {
          managerId: teacher.id,
          studentId,
        },
      },
      create: {
        managerId: teacher.id,
        studentId,
      },
      update: {},
    }),
  ]);

  // 선생님에게는 학생이 배정을 수락한 시점에 알림을 보낸다 (src/app/api/mobile/matches/route.ts 참고).
  await createNotification({
    userId: student.userId,
    type: "TEACHER_ASSIGNED",
    title: "선생님이 배정되었습니다",
    body: `${targetTeacher.name} 선생님이 배정되었습니다. 앱에서 선생님 정보를 확인하고 수락해 주세요.`,
    relatedId: teacherId,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
