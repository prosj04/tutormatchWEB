import { completionRate } from "@/lib/manager-stats";
import { formatDateKey } from "@/lib/study-plan-dates";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

function getKstDate(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  );
}

function getPreviousWeekRange(): { start: string; end: string } | null {
  const kst = getKstDate();
  if (kst.getDay() !== 1) return null;

  const day = kst.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const thisMonday = new Date(kst);
  thisMonday.setDate(kst.getDate() + mondayOffset);

  const prevMonday = new Date(thisMonday);
  prevMonday.setDate(thisMonday.getDate() - 7);
  const prevSunday = new Date(thisMonday);
  prevSunday.setDate(thisMonday.getDate() - 1);

  return {
    start: formatDateKey(
      prevMonday.getFullYear(),
      prevMonday.getMonth() + 1,
      prevMonday.getDate(),
    ),
    end: formatDateKey(
      prevSunday.getFullYear(),
      prevSunday.getMonth() + 1,
      prevSunday.getDate(),
    ),
  };
}

export async function runAlertChecks() {
  let notificationsCreated = 0;
  let weeklyStudentsChecked = 0;
  let waitingBookingsChecked = 0;

  const staleBefore = new Date(Date.now() - DAY_MS);
  const recentSince = new Date(Date.now() - DAY_MS);

  // ── 1. Stale unanswered questions ─────────────────────────────────────────
  //
  // Single query with targeted select instead of deep include chain.
  const staleQuestions = await prisma.question.findMany({
    where: {
      teacherAnswer: null,
      aiAnswer: { not: null },
      createdAt: { lt: staleBefore },
      isResolved: false,
    },
    select: {
      id: true,
      studentId: true,
      student: {
        select: {
          name: true,
          teachers: {
            where: { isActive: true },
            select: { teacher: { select: { userId: true } } },
          },
        },
      },
    },
  });

  const questionsChecked = staleQuestions.length;

  if (staleQuestions.length > 0) {
    const questionIds = staleQuestions.map((q) => q.id);
    const studentIds = Array.from(new Set(staleQuestions.map((q) => q.studentId)));

    // Bulk-fetch manager links for all involved students.
    // Previously: one managerStudent.findMany per question inside a loop.
    const rawManagerLinks = await prisma.managerStudent.findMany({
      where: { studentId: { in: studentIds } },
      select: {
        studentId: true,
        manager: { select: { userId: true } },
      },
    });

    // userId[] keyed by studentId
    const managersByStudent = new Map<string, string[]>();
    for (const link of rawManagerLinks) {
      const arr = managersByStudent.get(link.studentId) ?? [];
      arr.push(link.manager.userId);
      managersByStudent.set(link.studentId, arr);
    }

    // Bulk-fetch all recent QUESTION_UNANSWERED notifications in one query.
    // Previously: wasNotifiedRecently() called per (teacher|manager) × question.
    const recentQNotifs = await prisma.notification.findMany({
      where: {
        type: "QUESTION_UNANSWERED",
        relatedId: { in: questionIds },
        createdAt: { gte: recentSince },
      },
      select: { userId: true, relatedId: true },
    });
    const alreadyNotified = new Set(
      recentQNotifs.map((n) => `${n.userId}:${n.relatedId}`),
    );

    // Build the full list of needed notifications without any further DB queries.
    const toCreate: Array<{
      userId: string;
      type: string;
      title: string;
      body: string;
      relatedId: string;
    }> = [];

    for (const question of staleQuestions) {
      const studentName = question.student.name;

      for (const match of question.student.teachers) {
        const userId = match.teacher.userId;
        if (!alreadyNotified.has(`${userId}:${question.id}`)) {
          toCreate.push({
            userId,
            type: "QUESTION_UNANSWERED",
            title: "미답변 질문 알림",
            body: `${studentName}님의 질문이 24시간째 답변되지 않았습니다.`,
            relatedId: question.id,
          });
        }
      }

      for (const userId of managersByStudent.get(question.studentId) ?? []) {
        if (!alreadyNotified.has(`${userId}:${question.id}`)) {
          toCreate.push({
            userId,
            type: "QUESTION_UNANSWERED",
            title: "미답변 질문 알림",
            body: `${studentName}님의 질문이 24시간째 답변 대기 중입니다.`,
            relatedId: question.id,
          });
        }
      }
    }

    if (toCreate.length > 0) {
      await prisma.notification.createMany({ data: toCreate });
      notificationsCreated += toCreate.length;
    }
  }

  // ── 2. Weekly progress check ───────────────────────────────────────────────
  const prevWeek = getPreviousWeekRange();

  if (prevWeek) {
    // One query for all manager-student relationships.
    const allLinks = await prisma.managerStudent.findMany({
      select: {
        studentId: true,
        student: { select: { name: true } },
        manager: { select: { userId: true } },
      },
    });

    // Build studentId → { name, managerUserIds[] }
    const byStudent = new Map<string, { name: string; managerUserIds: string[] }>();
    for (const link of allLinks) {
      const entry = byStudent.get(link.studentId) ?? {
        name: link.student.name,
        managerUserIds: [],
      };
      if (!entry.managerUserIds.includes(link.manager.userId)) {
        entry.managerUserIds.push(link.manager.userId);
      }
      byStudent.set(link.studentId, entry);
    }

      const allStudentIds = Array.from(byStudent.keys());

    if (allStudentIds.length > 0) {
      // Single bulk query replaces one studyPlan.findMany per student.
      const allPlans = await prisma.studyPlan.findMany({
        where: {
          studentId: { in: allStudentIds },
          date: { gte: prevWeek.start, lte: prevWeek.end },
        },
        select: {
          studentId: true,
          tasks: { select: { isDone: true } },
        },
      });

      // Aggregate task stats per student in memory.
      const planStats = new Map<string, { done: number; total: number }>();
      for (const plan of allPlans) {
        const s = planStats.get(plan.studentId) ?? { done: 0, total: 0 };
        for (const task of plan.tasks) {
          s.total++;
          if (task.isDone) s.done++;
        }
        planStats.set(plan.studentId, s);
      }

      // Identify at-risk students.
      type Alert = {
        type: string;
        title: string;
        body: string;
        weekKey: string;
        managerUserIds: string[];
      };
      const alerts: Alert[] = [];

      for (const [studentId, { name, managerUserIds }] of Array.from(byStudent.entries())) {
        const stats = planStats.get(studentId);
        if (!stats || stats.total === 0) continue;

        weeklyStudentsChecked++;
        const rate = completionRate(stats.done, stats.total);

        let type: string | null = null;
        let title = "";
        if (rate < 50) {
          type = "PROGRESS_DANGER";
          title = "진도 50%미달";
        } else if (rate < 70) {
          type = "PROGRESS_WARNING";
          title = "진도 70% 미달";
        }
        if (!type) continue;

        alerts.push({
          type,
          title,
          body: `${name}님의 지난주 완료율이 ${rate}%입니다.`,
          weekKey: `${prevWeek.start}_${studentId}`,
          managerUserIds,
        });
      }

      if (alerts.length > 0) {
        // Bulk-check which weekly alerts were already sent.
        const weekKeys = alerts.map((a) => a.weekKey);
        const recentWeeklyNotifs = await prisma.notification.findMany({
          where: {
            type: { in: ["PROGRESS_WARNING", "PROGRESS_DANGER"] },
            relatedId: { in: weekKeys },
            createdAt: { gte: recentSince },
          },
          select: { userId: true, relatedId: true },
        });
        const weeklyAlreadySent = new Set(
          recentWeeklyNotifs.map((n) => `${n.userId}:${n.relatedId}`),
        );

        const weeklyToCreate: Array<{
          userId: string;
          type: string;
          title: string;
          body: string;
          relatedId: string;
        }> = [];

        for (const { type, title, body, weekKey, managerUserIds } of alerts) {
          for (const userId of managerUserIds) {
            if (!weeklyAlreadySent.has(`${userId}:${weekKey}`)) {
              weeklyToCreate.push({ userId, type, title, body, relatedId: weekKey });
            }
          }
        }

        if (weeklyToCreate.length > 0) {
          await prisma.notification.createMany({ data: weeklyToCreate });
          notificationsCreated += weeklyToCreate.length;
        }
      }
    }
  }

  // ── 3. Waiting consultation bookings ──────────────────────────────────────
  const waitingBefore = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const waitingBookings = await prisma.consultationBooking.findMany({
    where: { status: "WAITING", createdAt: { lt: waitingBefore } },
    select: {
      id: true,
      student: { select: { name: true } },
    },
  });

  waitingBookingsChecked = waitingBookings.length;

  if (waitingBookings.length > 0) {
    const managers = await prisma.teacher.findMany({
      where: { approved: true, user: { role: "MANAGER" } },
      select: { userId: true },
    });

    const bookingNotifs: Array<{
      userId: string;
      type: string;
      title: string;
      body: string;
      relatedId: string;
    }> = [];

    for (const booking of waitingBookings) {
      for (const manager of managers) {
        bookingNotifs.push({
          userId: manager.userId,
          type: "NEW_STUDENT_WAITING",
          title: "대기 중인 학생이 있습니다",
          body: `${booking.student.name}님이 매니저 배정을 기다리고 있습니다.`,
          relatedId: booking.id,
        });
      }
    }

    if (bookingNotifs.length > 0) {
      await prisma.notification.createMany({ data: bookingNotifs });
      notificationsCreated += bookingNotifs.length;
    }
  }

  return {
    questionsChecked,
    weeklyStudentsChecked,
    waitingBookingsChecked,
    notificationsCreated,
    weeklyCheckRan: prevWeek != null,
  };
}
