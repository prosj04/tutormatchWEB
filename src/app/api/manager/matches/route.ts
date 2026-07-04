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
  const { teacher, session } = authResult;

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

  // 담당 매니저(booking.managerId 일치) + 완료된 상담이 있어야 매칭 가능.
  // 노스스타 5단계: 강사 배정은 대면 상담 이후에 이뤄진다. 치프는 담당 제약 우회.
  // (결제 여부는 게이트하지 않음 — 신청만 한 학생도 상담 후 매칭 대상이다.)
  const isChief = session.user.role === "CHIEF_MANAGER";
  const completedBooking = await prisma.consultationBooking.findFirst({
    where: {
      studentId,
      status: "COMPLETED",
      ...(isChief ? {} : { managerId: teacher.id }),
    },
    select: { id: true },
  });
  if (!completedBooking) {
    return NextResponse.json(
      { error: "담당하는 학생의 완료된 상담이 있어야 매칭할 수 있습니다." },
      { status: 403 },
    );
  }

  // 수락 대기(PENDING) 또는 활성(ACTIVE) 매칭이 있으면 중복 배정 차단.
  // CANCELLED 매칭만 남은 학생은 재매칭 가능(데드엔드 방지).
  const liveMatch = await prisma.teacherStudent.findFirst({
    where: {
      studentId,
      matchStatus: { in: ["PENDING_STUDENT_ACCEPT", "ACTIVE"] },
    },
  });
  if (liveMatch) {
    return NextResponse.json(
      { error: "이미 배정된 선생님이 있는 학생입니다." },
      { status: 409 },
    );
  }

  // createNotification uses the outer prisma instance — keep it outside
  // the interactive transaction to avoid connection-pool deadlock on Vercel.
  await prisma.$transaction([
    // upsert: 같은 강사와의 CANCELLED 매칭이 남아 있으면 되살려 수락 대기로 전환.
    // (teacherId_studentId 유니크 제약과 충돌 없이 재매칭 지원)
    prisma.teacherStudent.upsert({
      where: { teacherId_studentId: { teacherId, studentId } },
      create: {
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
      update: {
        subjects,
        startDate,
        matchReason,
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
