import { NextResponse } from "next/server";

import { requireChiefManagerOrAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function GET() {
  const authResult = await requireChiefManagerOrAdmin();
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
    // 탈퇴(소프트 삭제)한 학생/강사는 익명화된 채 남으므로 집계에서 제외.
    prisma.student.count({ where: { name: { not: { startsWith: "[sample]" } }, deletedAt: null } }),
    prisma.teacher.count({ where: { approved: true, name: { not: { startsWith: "[sample]" } }, user: { deletedAt: null } } }),
    // 탈퇴 강사는 approved:false 로 남아 pending 카운트를 부풀리므로 반드시 제외.
    prisma.teacher.count({ where: { approved: false, name: { not: { startsWith: "[sample]" } }, user: { deletedAt: null } } }),
    prisma.teacherStudent.count({ where: { isActive: true, student: { name: { not: { startsWith: "[sample]" } } } } }),
    prisma.questionMessage.count({
      where: {
        sender: "me",
        replyToId: null,
        date: today,
        student: { name: { not: { startsWith: "[sample]" } } },
      },
    }),
    prisma.student.findMany({
      take: 5,
      orderBy: { user: { createdAt: "desc" } },
      where: { name: { not: { startsWith: "[sample]" } }, deletedAt: null },
      select: {
        name: true,
        user: { select: { createdAt: true } },
      },
    }),
    prisma.questionMessage.count({
      where: {
        sender: "me",
        replyToId: null,
        replies: { none: { sender: "tutor" } },
        student: { name: { not: { startsWith: "[sample]" } } },
      },
    }),
    prisma.consultationBooking.count({ where: { status: "WAITING", student: { name: { not: { startsWith: "[sample]" } } } } }),
    prisma.consultationBooking.count({ where: { status: "ASSIGNED", student: { name: { not: { startsWith: "[sample]" } } } } }),
    prisma.teacher.findMany({
      where: { managerStudents: { some: {} }, name: { not: { startsWith: "[sample]" } }, user: { deletedAt: null } },
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
