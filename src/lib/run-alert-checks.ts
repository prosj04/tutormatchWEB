import { completionRate } from "@/lib/manager-stats";
import { formatDateKey } from "@/lib/study-plan-dates";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

function getKstDate(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  );
}

// Use local-time getters — matches the /api/mobile/learning/weekly date convention
// (server runs UTC, so local = UTC on Vercel).
function lessonDateStr(d: Date): string {
  return formatDateKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

const CLOSE_BUFFER_MS = 12 * 60 * 60 * 1000; // 12 h after lesson ends

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
  let qnaMessagesChecked = 0;
  let waitingBookingsChecked = 0;
  let pendingMatchesChecked = 0;
  let firstLessonRemindersChecked = 0;
  let subscriptionExpiryChecked = 0;
  let closedLessons = 0;
  let studySessionsWritten = 0;

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

  // ── 1b. Stale unanswered QnA chat messages ─────────────────────────────────
  //
  // Mobile QnA stores chat bubbles separately from Question. A thread is stale
  // when the latest student message older than 24h has no later tutor reply.

  const staleStudentMessages = await prisma.questionMessage.findMany({
    where: {
      sender: "me",
      teacherId: { not: null },
      createdAt: { lt: staleBefore },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      studentId: true,
      teacherId: true,
      createdAt: true,
      student: { select: { name: true } },
      teacher: { select: { userId: true } },
    },
  });

  const latestByThread = new Map<string, (typeof staleStudentMessages)[number]>();
  for (const message of staleStudentMessages) {
    if (!message.teacherId) continue;
    const key = `${message.studentId}:${message.teacherId}`;
    if (!latestByThread.has(key)) latestByThread.set(key, message);
  }

  const staleQnaCandidates: Array<{
    messageId: string;
    teacherUserId: string;
    studentName: string;
  }> = [];

  for (const message of Array.from(latestByThread.values())) {
    if (!message.teacherId || !message.teacher) continue;
    const laterTutorReply = await prisma.questionMessage.findFirst({
      where: {
        studentId: message.studentId,
        teacherId: message.teacherId,
        sender: "tutor",
        createdAt: { gt: message.createdAt },
      },
      select: { id: true },
    });
    if (laterTutorReply) continue;
    staleQnaCandidates.push({
      messageId: message.id,
      teacherUserId: message.teacher.userId,
      studentName: message.student.name,
    });
  }

  qnaMessagesChecked = staleQnaCandidates.length;

  if (staleQnaCandidates.length > 0) {
    const messageIds = staleQnaCandidates.map((candidate) => candidate.messageId);
    const recentQnaMessageNotifs = await prisma.notification.findMany({
      where: {
        type: "QUESTION_UNANSWERED",
        relatedId: { in: messageIds },
        createdAt: { gte: recentSince },
      },
      select: { userId: true, relatedId: true },
    });
    const qnaMessageAlreadyNotified = new Set(
      recentQnaMessageNotifs.map((n) => `${n.userId}:${n.relatedId}`),
    );

    const qnaMessageToCreate = staleQnaCandidates
      .filter((candidate) => !qnaMessageAlreadyNotified.has(`${candidate.teacherUserId}:${candidate.messageId}`))
      .map((candidate) => ({
        userId: candidate.teacherUserId,
        type: "QUESTION_UNANSWERED",
        title: "미답변 Q&A 알림",
        body: `${candidate.studentName}님의 Q&A 메시지가 24시간째 답변되지 않았습니다.`,
        relatedId: candidate.messageId,
      }));

    if (qnaMessageToCreate.length > 0) {
      await prisma.notification.createMany({ data: qnaMessageToCreate });
      notificationsCreated += qnaMessageToCreate.length;
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
      where: { approved: true, user: { role: { in: ["CHIEF_MANAGER", "MANAGER"] } } },
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

  // ── 4. Close past lessons + write StudySession ──────────────────────────────
  //
  // Find SCHEDULED lessons whose end time (startAt + durationMin) passed the
  // 12-hour buffer, mark them COMPLETED, then recalculate lesson-sourced
  // StudySession rows for the affected (studentId, date) pairs.
  //
  // Idempotency: source="lesson" rows are deleted and recreated from the full
  // sum of COMPLETED lessons on that date — running twice gives the same result.
  // Lessons already COMPLETED before this cron shipped are only included when
  // they share a date with a newly-closed lesson (known scope limitation).

  const scheduledLessons = await prisma.lesson.findMany({
    where: { status: "SCHEDULED" },
    select: { id: true, studentId: true, startAt: true, durationMin: true },
  });

  const toClose = scheduledLessons.filter(
    (l) => l.startAt.getTime() + l.durationMin * 60_000 + CLOSE_BUFFER_MS < Date.now(),
  );

  if (toClose.length > 0) {
    await prisma.lesson.updateMany({
      where: { id: { in: toClose.map((l) => l.id) } },
      data: { status: "COMPLETED" },
    });
    closedLessons = toClose.length;

    // Deduplicate affected (studentId, date) pairs
    const pairMap = new Map<string, { studentId: string; date: string }>();
    for (const l of toClose) {
      const date = lessonDateStr(l.startAt);
      pairMap.set(`${l.studentId}:${date}`, { studentId: l.studentId, date });
    }
    const pairs = Array.from(pairMap.values());
    const affectedStudentIds = Array.from(new Set(pairs.map((p) => p.studentId)));
    const affectedSet = new Set(pairs.map((p) => `${p.studentId}:${p.date}`));
    const minDate = pairs.map((p) => p.date).sort()[0];

    // Re-sum from ALL completed lessons for these students from minDate onward
    const completedLessons = await prisma.lesson.findMany({
      where: {
        studentId: { in: affectedStudentIds },
        status: "COMPLETED",
        startAt: { gte: new Date(minDate + "T00:00:00.000Z") },
      },
      select: { studentId: true, startAt: true, durationMin: true },
    });

    const minutesByKey = new Map<string, number>();
    for (const l of completedLessons) {
      const key = `${l.studentId}:${lessonDateStr(l.startAt)}`;
      if (affectedSet.has(key)) {
        minutesByKey.set(key, (minutesByKey.get(key) ?? 0) + l.durationMin);
      }
    }

    const sessionData = pairs
      .map(({ studentId, date }) => ({
        studentId,
        date,
        minutes: minutesByKey.get(`${studentId}:${date}`) ?? 0,
        source: "lesson",
      }))
      .filter((s) => s.minutes > 0);

    if (sessionData.length > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.studySession.deleteMany({
          where: {
            OR: sessionData.map(({ studentId, date }) => ({
              studentId,
              date,
              source: "lesson",
            })),
          },
        });
        await tx.studySession.createMany({ data: sessionData });
      });
      studySessionsWritten = sessionData.length;
    }
  }

  // ── 5. Pending teacher-student match acceptance reminders ──────────────────
  //
  // Find TeacherStudent records created more than 24h ago where the student
  // has not yet accepted (isActive = false). Send one in-app reminder per
  // match, deduped against MATCH_ACCEPTANCE_REMINDER notifications from the
  // last 24h keyed by match.id.

  const pendingMatchCutoff = new Date(Date.now() - DAY_MS);

  const pendingMatches = await prisma.teacherStudent.findMany({
    where: { isActive: false, createdAt: { lt: pendingMatchCutoff } },
    select: {
      id: true,
      teacher: { select: { name: true } },
      student: { select: { userId: true } },
    },
  });

  pendingMatchesChecked = pendingMatches.length;

  if (pendingMatches.length > 0) {
    const matchIds = pendingMatches.map((m) => m.id);

    const recentMatchNotifs = await prisma.notification.findMany({
      where: {
        type: "MATCH_ACCEPTANCE_REMINDER",
        relatedId: { in: matchIds },
        createdAt: { gte: recentSince },
      },
      select: { userId: true, relatedId: true },
    });
    const matchAlreadyNotified = new Set(
      recentMatchNotifs.map((n) => `${n.userId}:${n.relatedId}`),
    );

    const matchToCreate: Array<{
      userId: string;
      type: string;
      title: string;
      body: string;
      relatedId: string;
    }> = [];

    for (const match of pendingMatches) {
      const userId = match.student.userId;
      if (!matchAlreadyNotified.has(`${userId}:${match.id}`)) {
        matchToCreate.push({
          userId,
          type: "MATCH_ACCEPTANCE_REMINDER",
          title: "선생님 배정 수락 안내",
          body: `${match.teacher.name} 선생님이 배정되었습니다. 앱에서 수락해 주세요.`,
          relatedId: match.id,
        });
      }
    }

    if (matchToCreate.length > 0) {
      await prisma.notification.createMany({ data: matchToCreate });
      notificationsCreated += matchToCreate.length;
    }
  }

  // ── 6. Accepted match first-lesson scheduling reminders ────────────────────
  //
  // Active matches older than 48h should have at least one non-cancelled lesson.
  // If not, remind the assigned teacher to schedule the first lesson. This keeps
  // the accept-only flow moving without adding decline/reassign paths.

  const firstLessonCutoff = new Date(Date.now() - 2 * DAY_MS);
  const activeMatches = await prisma.teacherStudent.findMany({
    where: { isActive: true, createdAt: { lt: firstLessonCutoff } },
    select: {
      id: true,
      studentId: true,
      teacherId: true,
      student: { select: { name: true } },
      teacher: { select: { userId: true } },
    },
  });

  if (activeMatches.length > 0) {
    const reminderCandidates: Array<{
      matchId: string;
      userId: string;
      studentName: string;
    }> = [];

    for (const match of activeMatches) {
      const existingLesson = await prisma.lesson.findFirst({
        where: {
          studentId: match.studentId,
          teacherId: match.teacherId,
          status: { not: "CANCELLED" },
        },
        select: { id: true },
      });
      if (existingLesson) continue;

      reminderCandidates.push({
        matchId: match.id,
        userId: match.teacher.userId,
        studentName: match.student.name,
      });
    }

    firstLessonRemindersChecked = reminderCandidates.length;

    if (reminderCandidates.length > 0) {
      const matchIdsNeedingLesson = reminderCandidates.map((candidate) => candidate.matchId);
      const recentFirstLessonNotifs = await prisma.notification.findMany({
        where: {
          type: "FIRST_LESSON_REMINDER",
          relatedId: { in: matchIdsNeedingLesson },
          createdAt: { gte: recentSince },
        },
        select: { userId: true, relatedId: true },
      });
      const firstLessonAlreadyNotified = new Set(
        recentFirstLessonNotifs.map((n) => `${n.userId}:${n.relatedId}`),
      );

      const firstLessonToCreate = reminderCandidates
        .filter((candidate) => !firstLessonAlreadyNotified.has(`${candidate.userId}:${candidate.matchId}`))
        .map((candidate) => ({
          userId: candidate.userId,
          type: "FIRST_LESSON_REMINDER",
          title: "첫 수업 일정을 설정해 주세요",
          body: `${candidate.studentName} 학생이 배정을 수락했습니다. 첫 수업 일정을 설정해 주세요.`,
          relatedId: candidate.matchId,
        }));

      if (firstLessonToCreate.length > 0) {
        await prisma.notification.createMany({ data: firstLessonToCreate });
        notificationsCreated += firstLessonToCreate.length;
      }
    }
  }

  // ── 7. Subscription expiry reminders ───────────────────────────────────────
  //
  // Daily cron-friendly reminders for active subscriptions ending in 5 days or
  // 1 day. No auto-billing, no billing key flow — just an in-app renewal notice.

  const now = new Date();
  const expiryWindowEnd = new Date(now.getTime() + 6 * DAY_MS);
  const expiringSubscriptions = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      periodEnd: { not: null, gte: now, lt: expiryWindowEnd },
    },
    select: {
      id: true,
      periodEnd: true,
      student: { select: { userId: true } },
    },
  });

  const expiryCandidates = expiringSubscriptions
    .map((subscription) => {
      if (!subscription.periodEnd) return null;
      const daysLeft = Math.ceil((subscription.periodEnd.getTime() - now.getTime()) / DAY_MS);
      if (daysLeft !== 5 && daysLeft !== 1) return null;
      return {
        subscriptionId: subscription.id,
        userId: subscription.student.userId,
        daysLeft,
        relatedId: `${subscription.id}:${daysLeft}`,
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate != null);

  subscriptionExpiryChecked = expiryCandidates.length;

  if (expiryCandidates.length > 0) {
    const relatedIds = expiryCandidates.map((candidate) => candidate.relatedId);
    const recentExpiryNotifs = await prisma.notification.findMany({
      where: {
        type: "SUBSCRIPTION_EXPIRY_REMINDER",
        relatedId: { in: relatedIds },
      },
      select: { userId: true, relatedId: true },
    });
    const expiryAlreadyNotified = new Set(
      recentExpiryNotifs.map((n) => `${n.userId}:${n.relatedId}`),
    );

    const expiryToCreate = expiryCandidates
      .filter((candidate) => !expiryAlreadyNotified.has(`${candidate.userId}:${candidate.relatedId}`))
      .map((candidate) => ({
        userId: candidate.userId,
        type: "SUBSCRIPTION_EXPIRY_REMINDER",
        title: "구독 만료 안내",
        body: `구독이 ${candidate.daysLeft}일 후 만료됩니다. 계속 이용하려면 플랜을 연장해 주세요.`,
        relatedId: candidate.relatedId,
      }));

    if (expiryToCreate.length > 0) {
      await prisma.notification.createMany({ data: expiryToCreate });
      notificationsCreated += expiryToCreate.length;
    }
  }

  return {
    questionsChecked,
    qnaMessagesChecked,
    weeklyStudentsChecked,
    waitingBookingsChecked,
    pendingMatchesChecked,
    firstLessonRemindersChecked,
    subscriptionExpiryChecked,
    notificationsCreated,
    weeklyCheckRan: prevWeek != null,
    closedLessons,
    studySessionsWritten,
  };
}
