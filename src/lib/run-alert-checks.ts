import { completionRate } from "@/lib/manager-stats";
import { formatDateKey } from "@/lib/study-plan-dates";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";

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
  let staleMatchesChecked = 0;
  let firstLessonRemindersChecked = 0;
  let subscriptionExpiryChecked = 0;
  let lessonRemindersChecked = 0;
  let closedLessons = 0;
  let studySessionsWritten = 0;
  let postConsultationFollowUpsSent = 0;
  let firstLessonSlaBreachesChecked = 0;
  let lessonsAutoCompleted = 0;

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

    const recentWaitingNotifs = await prisma.notification.findMany({
      where: {
        type: "NEW_STUDENT_WAITING",
        relatedId: { in: waitingBookings.map((booking) => booking.id) },
        createdAt: { gte: recentSince },
      },
      select: { userId: true, relatedId: true },
    });
    const waitingAlreadyNotified = new Set(
      recentWaitingNotifs.map((n) => `${n.userId}:${n.relatedId}`),
    );

    for (const booking of waitingBookings) {
      for (const manager of managers) {
        if (waitingAlreadyNotified.has(`${manager.userId}:${booking.id}`)) continue;
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
  // has not yet accepted. Prefer the explicit matchStatus, but also match on
  // isActive = false for rows that predate the matchStatus backfill. Send one
  // in-app reminder per match, deduped against MATCH_ACCEPTANCE_REMINDER
  // notifications from the last 24h keyed by match.id.

  const pendingMatchCutoff = new Date(Date.now() - DAY_MS);

  const pendingMatches = await prisma.teacherStudent.findMany({
    where: {
      OR: [{ matchStatus: "PENDING_STUDENT_ACCEPT" }, { isActive: false }],
      createdAt: { lt: pendingMatchCutoff },
    },
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

  // ── 5b. Stale match acceptance — manager + student alerts ────────────────────
  //
  // Find TeacherStudent records where matchStatus is "PENDING_STUDENT_ACCEPT",
  // respondedAt is null, and createdAt is older than 24h. Notify the responsible
  // manager (via ConsultationBooking.managerId or fall back to CHIEF_MANAGER role),
  // and notify the student that they are waiting for teacher acceptance.
  // Dedup against STALE_MATCH_ACCEPTANCE notifications from the last 24h.

  const staleMatchCutoff = new Date(Date.now() - DAY_MS);

  const staleMatches = await prisma.teacherStudent.findMany({
    where: {
      matchStatus: "PENDING_STUDENT_ACCEPT",
      respondedAt: null,
      createdAt: { lt: staleMatchCutoff },
    },
    select: {
      id: true,
      studentId: true,
      student: {
        select: {
          userId: true,
          name: true,
          consultationBooking: {
            select: {
              managerId: true,
            },
          },
        },
      },
      teacher: { select: { name: true } },
    },
  });

  staleMatchesChecked = staleMatches.length;

  if (staleMatches.length > 0) {
    const matchIds = staleMatches.map((m) => m.id);
    const studentIds = Array.from(new Set(staleMatches.map((m) => m.studentId)));

    // Bulk-fetch recent STALE_MATCH_ACCEPTANCE notifications.
    const recentStaleMatchNotifs = await prisma.notification.findMany({
      where: {
        type: "STALE_MATCH_ACCEPTANCE",
        relatedId: { in: matchIds },
        createdAt: { gte: recentSince },
      },
      select: { userId: true, relatedId: true },
    });
    const staleMatchAlreadyNotified = new Set(
      recentStaleMatchNotifs.map((n) => `${n.userId}:${n.relatedId}`),
    );

    // Bulk-fetch all manager links for affected students (for fallback).
    const managerLinks = await prisma.managerStudent.findMany({
      where: { studentId: { in: studentIds } },
      select: {
        studentId: true,
        manager: { select: { userId: true } },
      },
    });

    const managersByStudent = new Map<string, string[]>();
    for (const link of managerLinks) {
      const arr = managersByStudent.get(link.studentId) ?? [];
      arr.push(link.manager.userId);
      managersByStudent.set(link.studentId, arr);
    }

    // Bulk-fetch CHIEF_MANAGER users for fallback.
    const chiefManagers = await prisma.teacher.findMany({
      where: { approved: true, user: { role: "CHIEF_MANAGER" } },
      select: { userId: true },
    });
    const chiefManagerUserIds = chiefManagers.map((m) => m.userId);

    const staleToCreate: Array<{
      userId: string;
      type: string;
      title: string;
      body: string;
      relatedId: string;
    }> = [];

    for (const match of staleMatches) {
      const studentName = match.student.name;
      const teacherName = match.teacher.name;
      const matchId = match.id;

      // Determine manager recipients.
      let managerUserIds: string[] = [];
      if (match.student.consultationBooking?.managerId) {
        // Get the userId for this manager's teacherId.
        const consultationManager = await prisma.teacher.findUnique({
          where: { id: match.student.consultationBooking.managerId },
          select: { userId: true },
        });
        if (consultationManager) {
          managerUserIds.push(consultationManager.userId);
        }
      }
      // If no explicit manager, fall back to CHIEF_MANAGER role.
      if (managerUserIds.length === 0) {
        managerUserIds = chiefManagerUserIds;
      }

      // Notify manager.
      for (const managerId of managerUserIds) {
        if (!staleMatchAlreadyNotified.has(`${managerId}:${matchId}`)) {
          staleToCreate.push({
            userId: managerId,
            type: "STALE_MATCH_ACCEPTANCE",
            title: "오래된 선생님 배정 대기",
            body: `${studentName}님이 ${teacherName} 선생님 배정을 24시간 이상 수락하지 않았습니다.`,
            relatedId: matchId,
          });
        }
      }

      // Notify student.
      const studentId = match.student.userId;
      if (!staleMatchAlreadyNotified.has(`${studentId}:${matchId}`)) {
        staleToCreate.push({
          userId: studentId,
          type: "STALE_MATCH_ACCEPTANCE",
          title: "선생님 수락 대기",
          body: `${teacherName} 선생님과의 매칭을 수락해 주세요.`,
          relatedId: matchId,
        });
      }
    }

    if (staleToCreate.length > 0) {
      await prisma.notification.createMany({ data: staleToCreate });
      notificationsCreated += staleToCreate.length;
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

  // ── 8. Upcoming lesson reminders ───────────────────────────────────────────
  //
  // Hourly cron windows: send once for lessons roughly 24h and 1h away.
  // relatedId includes the reminder bucket, so repeated hourly runs stay safe.

  const lessonWindowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);
  const upcomingLessons = await prisma.lesson.findMany({
    where: {
      status: "SCHEDULED",
      startAt: { gte: now, lt: lessonWindowEnd },
    },
    select: {
      id: true,
      startAt: true,
      student: { select: { name: true, userId: true } },
      teacher: { select: { name: true, userId: true } },
    },
  });

  const lessonReminderCandidates: Array<{
    userId: string;
    relatedId: string;
    title: string;
    body: string;
  }> = [];

  for (const lesson of upcomingLessons) {
    const minutesUntil = Math.round((lesson.startAt.getTime() - now.getTime()) / 60_000);
    const bucket = minutesUntil >= 23.5 * 60 && minutesUntil <= 24.5 * 60
      ? "24h"
      : minutesUntil >= 30 && minutesUntil <= 90
        ? "1h"
        : null;
    if (!bucket) continue;

    const when = lesson.startAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
    const relatedId = `${lesson.id}:${bucket}`;
    lessonReminderCandidates.push(
      {
        userId: lesson.student.userId,
        relatedId,
        title: bucket === "24h" ? "내일 수업이 있습니다" : "곧 수업이 시작됩니다",
        body: `${lesson.teacher.name} 선생님과의 수업이 ${when}에 예정되어 있습니다.`,
      },
      {
        userId: lesson.teacher.userId,
        relatedId,
        title: bucket === "24h" ? "내일 수업이 있습니다" : "곧 수업이 시작됩니다",
        body: `${lesson.student.name} 학생과의 수업이 ${when}에 예정되어 있습니다.`,
      },
    );
  }

  lessonRemindersChecked = lessonReminderCandidates.length;

  if (lessonReminderCandidates.length > 0) {
    const lessonReminderRelatedIds = Array.from(
      new Set(lessonReminderCandidates.map((candidate) => candidate.relatedId)),
    );
    const recentLessonNotifs = await prisma.notification.findMany({
      where: {
        type: "LESSON_REMINDER",
        relatedId: { in: lessonReminderRelatedIds },
      },
      select: { userId: true, relatedId: true },
    });
    const lessonAlreadyNotified = new Set(
      recentLessonNotifs.map((n) => `${n.userId}:${n.relatedId}`),
    );

    const lessonToCreate = lessonReminderCandidates
      .filter((candidate) => !lessonAlreadyNotified.has(`${candidate.userId}:${candidate.relatedId}`))
      .map((candidate) => ({
        userId: candidate.userId,
        type: "LESSON_REMINDER",
        title: candidate.title,
        body: candidate.body,
        relatedId: candidate.relatedId,
      }));

    if (lessonToCreate.length > 0) {
      await prisma.notification.createMany({ data: lessonToCreate });
      notificationsCreated += lessonToCreate.length;
    }
  }

  // ── NEW-A. Post-consultation lead follow-up (#15) ─────────────────────────
  //
  // ConsultationBooking status "COMPLETED", created 3+ days ago (best available
  // timestamp — no completedAt field), student has NO ACTIVE Subscription,
  // followUpSentAt null → send one follow-up SMS and set followUpSentAt=now.
  // followUpSentAt is the hard dedup: one SMS ever per booking.

  const followUpCutoff = new Date(Date.now() - 3 * DAY_MS);

  const completedBookings = await prisma.consultationBooking.findMany({
    where: {
      status: "COMPLETED",
      followUpSentAt: null,
      createdAt: { lt: followUpCutoff },
    },
    select: {
      id: true,
      studentId: true,
      student: {
        select: {
          phone: true,
          subscriptions: {
            where: { status: "ACTIVE" },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });

  for (const booking of completedBookings) {
    // Skip if student already has an active subscription.
    if (booking.student.subscriptions.length > 0) continue;

    const phone = booking.student.phone;
    if (phone) {
      try {
        await sendSms(
          phone,
          "[Concord] 콘코드 상담 이후 고민되시는 점이 있으신가요? 담당 매니저가 언제든 다시 안내해 드립니다.",
        );
      } catch (e) {
        console.error("[FollowUp] SMS failed:", e);
      }
    }
    // Always mark sent regardless of SMS delivery (fire-and-forget; prevents re-send).
    await prisma.consultationBooking.update({
      where: { id: booking.id },
      data: { followUpSentAt: new Date() },
    });
    postConsultationFollowUpsSent++;
  }

  // ── NEW-B. First-lesson SLA breach (#23) ──────────────────────────────────
  //
  // Subscription ACTIVE, created 7+ days ago, student has zero Lesson records
  // → notify CHIEF_MANAGER users (FIRST_LESSON_SLA_BREACH).
  // Dedup: existence of any FIRST_LESSON_SLA_BREACH notification for relatedId=studentId
  // (no time window — fires once per student ever).

  const slaCutoff = new Date(Date.now() - 7 * DAY_MS);

  const slaSubscriptions = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      createdAt: { lt: slaCutoff },
    },
    select: {
      studentId: true,
      createdAt: true,
      student: { select: { name: true } },
    },
  });

  if (slaSubscriptions.length > 0) {
    // Deduplicate by studentId (a student may have multiple active subscriptions).
    const slaByStudent = new Map<
      string,
      { studentName: string; createdAt: Date }
    >();
    for (const sub of slaSubscriptions) {
      if (!slaByStudent.has(sub.studentId)) {
        slaByStudent.set(sub.studentId, {
          studentName: sub.student.name,
          createdAt: sub.createdAt,
        });
      }
    }

    const slaStudentIds = Array.from(slaByStudent.keys());

    // Check which students have zero lessons.
    const studentsWithLessons = await prisma.lesson.findMany({
      where: { studentId: { in: slaStudentIds } },
      select: { studentId: true },
      distinct: ["studentId"],
    });
    const hasLessonSet = new Set(studentsWithLessons.map((l) => l.studentId));

    const slaBreachStudentIds = slaStudentIds.filter(
      (id) => !hasLessonSet.has(id),
    );
    firstLessonSlaBreachesChecked = slaBreachStudentIds.length;

    if (slaBreachStudentIds.length > 0) {
      // Check which students already have a FIRST_LESSON_SLA_BREACH notification
      // (no time window — once per student ever).
      const existingSlaNotifs = await prisma.notification.findMany({
        where: {
          type: "FIRST_LESSON_SLA_BREACH",
          relatedId: { in: slaBreachStudentIds },
        },
        select: { relatedId: true },
      });
      const slaAlreadyNotified = new Set(
        existingSlaNotifs.map((n) => n.relatedId).filter(Boolean) as string[],
      );

      const slaBreachStudentsToNotify = slaBreachStudentIds.filter(
        (id) => !slaAlreadyNotified.has(id),
      );

      if (slaBreachStudentsToNotify.length > 0) {
        // Fetch CHIEF_MANAGER users.
        const chiefManagersForSla = await prisma.teacher.findMany({
          where: { approved: true, user: { role: "CHIEF_MANAGER" } },
          select: { userId: true },
        });
        const chiefManagerIdsForSla = chiefManagersForSla.map((m) => m.userId);

        const slaToCreate: Array<{
          userId: string;
          type: string;
          title: string;
          body: string;
          relatedId: string;
        }> = [];

        for (const studentId of slaBreachStudentsToNotify) {
          const info = slaByStudent.get(studentId)!;
          const daysElapsed = Math.floor(
            (Date.now() - info.createdAt.getTime()) / DAY_MS,
          );
          for (const managerId of chiefManagerIdsForSla) {
            slaToCreate.push({
              userId: managerId,
              type: "FIRST_LESSON_SLA_BREACH",
              title: "첫 수업 미진행 알림",
              body: `${info.studentName}님이 구독 ${daysElapsed}일 후에도 첫 수업이 진행되지 않았습니다.`,
              relatedId: studentId,
            });
          }
        }

        if (slaToCreate.length > 0) {
          await prisma.notification.createMany({ data: slaToCreate });
          notificationsCreated += slaToCreate.length;
        }
      }
    }
  }

  // ── NEW-C. Lesson auto-complete (60-min buffer) ────────────────────────────
  //
  // Lessons status "SCHEDULED" with startAt + durationMin + 60min in the past
  // → updateMany to "COMPLETED". Count only, no notifications.
  // NOTE: Placed after section 4, which uses a 12h buffer; this catches the
  // 60min–12h window. StudySession writes for this window remain out-of-scope
  // (section 4 handles only its own closed set). No overlap with CANCELLED.

  const lessonAutoCompleteCandidates = await prisma.lesson.findMany({
    where: { status: "SCHEDULED" },
    select: { id: true, startAt: true, durationMin: true },
  });

  const toAutoComplete = lessonAutoCompleteCandidates.filter(
    (l) =>
      l.startAt.getTime() + l.durationMin * 60_000 + 60 * 60_000 < Date.now(),
  );

  if (toAutoComplete.length > 0) {
    await prisma.lesson.updateMany({
      where: { id: { in: toAutoComplete.map((l) => l.id) } },
      data: { status: "COMPLETED" },
    });
    lessonsAutoCompleted = toAutoComplete.length;
  }

  return {
    questionsChecked,
    qnaMessagesChecked,
    weeklyStudentsChecked,
    waitingBookingsChecked,
    pendingMatchesChecked,
    staleMatchesChecked,
    firstLessonRemindersChecked,
    subscriptionExpiryChecked,
    lessonRemindersChecked,
    notificationsCreated,
    weeklyCheckRan: prevWeek != null,
    closedLessons,
    studySessionsWritten,
    postConsultationFollowUpsSent,
    firstLessonSlaBreachesChecked,
    lessonsAutoCompleted,
  };
}
