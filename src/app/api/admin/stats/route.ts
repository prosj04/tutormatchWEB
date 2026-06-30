import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function GET() {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const today = todayKey();

  const [
    studentCount,
    teacherApproved,
    teacherPending,
    activeMatches,
    questionsToday,
    recentStudents,
    unansweredQuestions,
    waitingConsultations,
    assignedConsultations,
    managerLoad,
  ] = await Promise.all([
    prisma.student.count({ where: { name: { not: { startsWith: "[sample]" } } } }),
    prisma.teacher.count({ where: { approved: true, name: { not: { startsWith: "[sample]" } } } }),
    prisma.teacher.count({ where: { approved: false, name: { not: { startsWith: "[sample]" } } } }),
    prisma.teacherStudent.count({ where: { isActive: true, student: { name: { not: { startsWith: "[sample]" } } } } }),
    prisma.question.count({ where: { date: today, student: { name: { not: { startsWith: "[sample]" } } } } }),
    prisma.student.findMany({
      take: 5,
      orderBy: { user: { createdAt: "desc" } },
      where: { name: { not: { startsWith: "[sample]" } } },
      select: {
        name: true,
        user: { select: { createdAt: true } },
      },
    }),
    prisma.question.count({ where: { teacherAnswer: null, student: { name: { not: { startsWith: "[sample]" } } } } }),
    prisma.consultationBooking.count({ where: { status: "WAITING", student: { name: { not: { startsWith: "[sample]" } } } } }),
    prisma.consultationBooking.count({ where: { status: "ASSIGNED", student: { name: { not: { startsWith: "[sample]" } } } } }),
    prisma.teacher.findMany({
      where: { managerStudents: { some: {} }, name: { not: { startsWith: "[sample]" } } },
      select: {
        name: true,
        _count: { select: { managerStudents: true } },
      },
      orderBy: { managerStudents: { _count: "desc" } },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    stats: {
      studentCount,
      teacherApproved,
      teacherPending,
      activeMatches,
      questionsToday,
      unansweredQuestions,
      waitingConsultations,
      assignedConsultations,
    },
    recentStudents: recentStudents.map((s) => ({
      name: s.name,
      createdAt: s.user.createdAt,
    })),
    managerLoad: managerLoad.map((m) => ({
      name: m.name,
      studentCount: m._count.managerStudents,
    })),
  });
}
