import { formatRelativeTime } from "@/lib/notifications";
import {
  completionRate,
  getWeekRange,
  studentStatusBadge,
} from "@/lib/manager-stats";
import { prisma } from "@/lib/prisma";
import { getEffectivePhotoUrl } from "@/lib/profile-gender";
import { parseVisitTimes, type VisitTimesByDate } from "@/lib/visit-consultation";

const STALE_MS = 24 * 60 * 60 * 1000;

export type ManagerConsultationBooking = {
  id: string;
  status: "WAITING" | "ASSIGNED" | "COMPLETED" | "CANCELLED";
  note: string | null;
  managerNote?: string | null;
  preferredTimes: string[];
  visitPreferredTimes: VisitTimesByDate;
  visitConfirmedAt?: string | null;
  createdAt: string;
  timeAgo?: string;
  assignedAt?: string | null;
  assignedAgo?: string | null;
  student: {
    id: string;
    name: string;
    grade: string;
    subjects: string;
    phone: string;
    guardianPhone: string | null;
    region: string | null;
  };
};

export type ManagerMatchingStudent = {
  id: string;
  name: string;
  grade: string;
  subjects: string;
  consultationNote: string | null;
  bookingId: string;
};

export type ManagerMatchingTeacher = {
  id: string;
  name: string;
  subjects: string;
  photoUrl: string | null;
  activeStudentCount: number;
};

export type ManagerMonitoringOverview = {
  studentCount: number;
  avgCompletionRate: number;
  staleQuestions: number;
  atRiskCount: number;
};

export type ManagerMonitoringStudentRow = {
  id: string;
  name: string;
  grade: string;
  teacherName: string;
  completionRate: number;
  unansweredStale: number;
  statusLabel: string;
  statusClassName: string;
};

export type ManagerMonitoringDetailData = {
  student: { name: string; grade: string } | null;
  plans: {
    id: string;
    date: string;
    tasks: { id: string; title: string; isDone: boolean }[];
    comment: string | null;
  }[];
  unansweredQuestions: {
    id: string;
    date: string;
    content: string;
    createdAt: string;
  }[];
  recentComments: { date: string; comment: string | null; commentAt: string | null }[];
};

function mapConsultationBooking(
  booking: {
    id: string;
    status: string;
    note: string | null;
    managerNote: string | null;
    visitPreferredTimes: string;
    visitConfirmedAt: Date | null;
    createdAt: Date;
    assignedAt: Date | null;
    student: {
      id: string;
      name: string;
      grade: string;
      subjects: string;
      phone: string;
      guardianPhone: string | null;
      region: string | null;
    };
  },
): ManagerConsultationBooking {
  return {
    id: booking.id,
    status: booking.status as ManagerConsultationBooking["status"],
    note: booking.note,
    managerNote: booking.managerNote,
    preferredTimes: [],
    visitPreferredTimes: parseVisitTimes(booking.visitPreferredTimes),
    visitConfirmedAt: booking.visitConfirmedAt?.toISOString() ?? null,
    createdAt: booking.createdAt.toISOString(),
    timeAgo: formatRelativeTime(booking.createdAt.toISOString()),
    assignedAt: booking.assignedAt?.toISOString() ?? null,
    assignedAgo: booking.assignedAt
      ? formatRelativeTime(booking.assignedAt.toISOString())
      : null,
    student: booking.student,
  };
}

export async function getManagerWaitingConsultations(): Promise<
  ManagerConsultationBooking[]
> {
  const bookings = await prisma.consultationBooking.findMany({
    where: { status: "WAITING", managerId: null },
    include: {
      student: {
        select: { id: true, name: true, grade: true, subjects: true, phone: true, guardianPhone: true, region: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return bookings.map(mapConsultationBooking);
}

export async function getManagerMineConsultations(
  managerId: string,
): Promise<ManagerConsultationBooking[]> {
  const bookings = await prisma.consultationBooking.findMany({
    where: { managerId },
    include: {
      student: {
        select: { id: true, name: true, grade: true, subjects: true, phone: true, guardianPhone: true, region: true },
      },
    },
    orderBy: [{ assignedAt: "desc" }, { createdAt: "desc" }],
  });

  return bookings.map(mapConsultationBooking);
}

export async function getManagerMatchingData(managerId: string): Promise<{
  students: ManagerMatchingStudent[];
  teachers: ManagerMatchingTeacher[];
}> {
  const completedBookings = await prisma.consultationBooking.findMany({
    where: { managerId, status: "COMPLETED" },
    select: {
      id: true,
      studentId: true,
      note: true,
      managerNote: true,
      student: { select: { id: true, name: true, grade: true, subjects: true, phone: true, guardianPhone: true, region: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const seen = new Set<string>();
  const candidates: typeof completedBookings = [];
  for (const booking of completedBookings) {
    if (seen.has(booking.studentId)) continue;
    seen.add(booking.studentId);
    candidates.push(booking);
  }

  // 매칭 POST 가드와 동일 기준: 수락 대기(PENDING) 또는 활성(ACTIVE) 매칭이 있으면 이미 배정된 학생.
  // (CANCELLED은 재매칭 대상이므로 후보에 남긴다.)
  const alreadyMatchedIds = new Set(
    (
      await prisma.teacherStudent.findMany({
        where: {
          studentId: { in: candidates.map((c) => c.studentId) },
          matchStatus: { in: ["PENDING_STUDENT_ACCEPT", "ACTIVE"] },
        },
        select: { studentId: true },
      })
    ).map((m) => m.studentId),
  );

  const students = candidates
    .filter((booking) => !alreadyMatchedIds.has(booking.studentId))
    .map((booking) => ({
      id: booking.student.id,
      name: booking.student.name,
      grade: booking.student.grade,
      subjects: booking.student.subjects,
      consultationNote: booking.managerNote ?? booking.note,
      bookingId: booking.id,
    }));

  const teachers = await prisma.teacher.findMany({
    where: {
      approved: true,
      name: { not: { startsWith: "[sample]" } },
      user: { role: { in: ["TEACHER", "MANAGER", "CHIEF_MANAGER"] } },
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

  return {
    students,
    teachers: teachers.map((teacher) => ({
      id: teacher.id,
      name: teacher.name,
      subjects: teacher.subjects,
      photoUrl: getEffectivePhotoUrl(teacher.profile?.photoUrl, teacher.gender),
      activeStudentCount: teacher._count.students,
    })),
  };
}

export async function getManagerMonitoringData(managerId: string): Promise<{
  overview: ManagerMonitoringOverview;
  students: ManagerMonitoringStudentRow[];
  weekStart: string;
  weekEnd: string;
}> {
  const range = getWeekRange();
  const staleBefore = new Date(Date.now() - STALE_MS);

  const links = await prisma.managerStudent.findMany({
    where: { managerId, student: { name: { not: { startsWith: "[sample]" } } } },
    include: {
      student: { select: { id: true, name: true, grade: true } },
    },
    orderBy: { student: { name: "asc" } },
  });

  const studentIds = links.map((link) => link.studentId);

  if (studentIds.length === 0) {
    return {
      overview: {
        studentCount: 0,
        avgCompletionRate: 0,
        staleQuestions: 0,
        atRiskCount: 0,
      },
      students: [],
      weekStart: range.start,
      weekEnd: range.end,
    };
  }

  const [plans, staleQuestions, allStaleByStudent, teacherMatches] =
    await Promise.all([
      prisma.studyPlan.findMany({
        where: {
          studentId: { in: studentIds },
          date: { gte: range.start, lte: range.end },
        },
        select: {
          studentId: true,
          tasks: { select: { isDone: true } },
        },
      }),
      prisma.questionMessage.count({
        where: {
          studentId: { in: studentIds },
          sender: "me",
          replyToId: null,
          replies: { none: { sender: "tutor" } },
          createdAt: { lt: staleBefore },
        },
      }),
      prisma.questionMessage.groupBy({
        by: ["studentId"],
        where: {
          studentId: { in: studentIds },
          sender: "me",
          replyToId: null,
          replies: { none: { sender: "tutor" } },
          createdAt: { lt: staleBefore },
        },
        _count: { id: true },
      }),
      prisma.teacherStudent.findMany({
        where: { studentId: { in: studentIds }, isActive: true },
        select: {
          studentId: true,
          teacher: { select: { name: true } },
        },
      }),
    ]);

  const staleMap = new Map(
    allStaleByStudent.map((group) => [group.studentId, group._count.id]),
  );

  const teacherMap = new Map(
    teacherMatches.map((match) => [match.studentId, match.teacher.name]),
  );

  const planStats = new Map<string, { done: number; total: number }>();
  for (const plan of plans) {
    const current = planStats.get(plan.studentId) ?? { done: 0, total: 0 };
    for (const task of plan.tasks) {
      current.total += 1;
      if (task.isDone) current.done += 1;
    }
    planStats.set(plan.studentId, current);
  }

  const students = links.map((link) => {
    const stats = planStats.get(link.studentId) ?? { done: 0, total: 0 };
    const rate = completionRate(stats.done, stats.total);
    const stale = staleMap.get(link.studentId) ?? 0;
    const badge = studentStatusBadge(rate, stale > 0);

    return {
      id: link.student.id,
      name: link.student.name,
      grade: link.student.grade,
      teacherName: teacherMap.get(link.studentId) ?? "—",
      completionRate: rate,
      unansweredStale: stale,
      statusLabel: badge.label,
      statusClassName: badge.className,
    };
  });

  const rates = students.map((student) => student.completionRate);
  const avgCompletionRate =
    rates.length > 0
      ? Math.round(rates.reduce((sum, rate) => sum + rate, 0) / rates.length)
      : 0;

  const atRiskCount = students.filter((student) => student.completionRate < 70)
    .length;

  return {
    overview: {
      studentCount: students.length,
      avgCompletionRate,
      staleQuestions,
      atRiskCount,
    },
    students,
    weekStart: range.start,
    weekEnd: range.end,
  };
}

export async function getManagerMonitoringDetail(
  managerId: string,
  studentId: string,
): Promise<ManagerMonitoringDetailData | null> {
  const link = await prisma.managerStudent.findUnique({
    where: {
      managerId_studentId: {
        managerId,
        studentId,
      },
    },
  });

  if (!link) return null;

  const range = getWeekRange();
  const staleBefore = new Date(Date.now() - STALE_MS);

  const [plans, unanswered, student] = await Promise.all([
    prisma.studyPlan.findMany({
      where: {
        studentId,
        date: { gte: range.start, lte: range.end },
      },
      include: {
        tasks: { orderBy: { order: "asc" } },
      },
      orderBy: { date: "asc" },
    }),
    prisma.questionMessage.findMany({
      where: {
        studentId,
        sender: "me",
        replyToId: null,
        replies: { none: { sender: "tutor" } },
        createdAt: { lt: staleBefore },
      },
      select: { id: true, date: true, body: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.student.findUnique({
      where: { id: studentId },
      select: { name: true, grade: true },
    }),
  ]);

  const recentComments = plans
    .filter((plan) => plan.comment)
    .slice(-3)
    .map((plan) => ({
      date: plan.date,
      comment: plan.comment,
      commentAt: plan.commentAt?.toISOString() ?? null,
    }));

  return {
    student,
    plans: plans.map((plan) => ({
      id: plan.id,
      date: plan.date,
      tasks: plan.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        isDone: task.isDone,
      })),
      comment: plan.comment,
    })),
    unansweredQuestions: unanswered.map((question) => ({
      id: question.id,
      date: question.date ?? "",
      content: question.body,
      createdAt: question.createdAt.toISOString(),
    })),
    recentComments,
  };
}
