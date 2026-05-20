import { NextResponse } from "next/server";

import { requireManager } from "@/lib/manager-auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { getEffectivePhotoUrl } from "@/lib/profile-gender";
import { todayDateKey } from "@/lib/study-plan-dates";

export async function GET() {
  const authResult = await requireManager();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const completedBookings = await prisma.consultationBooking.findMany({
    where: { managerId: teacher.id, status: "COMPLETED" },
    select: {
      id: true,
      studentId: true,
      note: true,
      managerNote: true,
      student: { select: { id: true, name: true, grade: true, subjects: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // De-duplicate by studentId (keep most recent booking per student)
  const seen = new Set<string>();
  const candidates: typeof completedBookings = [];
  for (const booking of completedBookings) {
    if (seen.has(booking.studentId)) continue;
    seen.add(booking.studentId);
    candidates.push(booking);
  }

  // Single query replaces N per-booking prisma.teacherStudent.count() calls
  const alreadyMatchedIds = new Set(
    (
      await prisma.teacherStudent.findMany({
        where: { studentId: { in: candidates.map((c) => c.studentId) }, isActive: true },
        select: { studentId: true },
      })
    ).map((m) => m.studentId),
  );

  const students = candidates
    .filter((b) => !alreadyMatchedIds.has(b.studentId))
    .map((b) => ({
      id: b.student.id,
      name: b.student.name,
      grade: b.student.grade,
      subjects: b.student.subjects,
      consultationNote: b.managerNote ?? b.note,
      bookingId: b.id,
    }));

  const teachers = await prisma.teacher.findMany({
    where: {
      approved: true,
      user: { role: { in: ["TEACHER", "MANAGER"] } },
    },
    include: {
      profile: { select: { photoUrl: true } },
      _count: {
        select: {
          students: { where: { isActive: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    students,
    teachers: teachers.map((t) => ({
      id: t.id,
      name: t.name,
      subjects: t.subjects,
      photoUrl: getEffectivePhotoUrl(t.profile?.photoUrl, t.gender),
      activeStudentCount: t._count.students,
    })),
  });
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

  const targetTeacher = await prisma.teacher.findFirst({
    where: {
      id: teacherId,
      approved: true,
      user: { role: { in: ["TEACHER", "MANAGER"] } },
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
    where: { studentId, isActive: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "이미 매칭된 학생입니다." },
      { status: 409 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.teacherStudent.create({
      data: {
        teacherId,
        studentId,
        subjects,
        startDate,
        isActive: true,
      },
    });

    await tx.managerStudent.upsert({
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
    });

    await createNotification({
      userId: targetTeacher.userId,
      type: "NEW_STUDENT_ASSIGNED",
      title: "새로운 학생이 배정되었습니다",
      body: `${student.name} 학생이 배정되었습니다. 담당 과목: ${subjects}`,
      relatedId: studentId,
    });

    await createNotification({
      userId: student.userId,
      type: "TEACHER_ASSIGNED",
      title: "선생님이 배정되었습니다",
      body: `${targetTeacher.name} 선생님이 담당 선생님으로 배정되었습니다.`,
      relatedId: teacherId,
    });
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
