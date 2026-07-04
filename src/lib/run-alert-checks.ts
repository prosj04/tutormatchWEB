import { completionRate } from "@/lib/manager-stats";
import { formatDateKey } from "@/lib/study-plan-dates";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { createNotification } from "@/lib/notifications";
import { getV2PlanById } from "@/lib/pricing-plans";
import { chargeBillingKey } from "@/lib/toss-payments";

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
  // Retained for /api/cron/check-alerts response compatibility. Always 0 under
  // the unified model (see §1 below).
  const qnaMessagesChecked = 0;
  let waitingBookingsChecked = 0;
  let pendingMatchesChecked = 0;
  let staleMatchesChecked = 0;
  let firstLessonRemindersChecked = 0;
  let subscriptionExpiryChecked = 0; // kept for backward compat — total of all expiry stages
  let lessonRemindersChecked = 0;
  let closedLessons = 0;
  let studySessionsWritten = 0;
  let postConsultationFollowUpsSent = 0;
  let firstLessonSlaBreachesChecked = 0;
  let lessonsAutoCompleted = 0;
  let consultationRemindersChecked = 0;
  let satisfactionCheckinsCreated = 0;
  let subscriptionsAutoResumed = 0;
  let renewalChargesAttempted = 0;
  let renewalChargesSucceeded = 0;
  let renewalChargesFailed = 0;
  let renewalSkippedPaused = 0;
  let renewalSkippedNoBilling = 0;
  let renewalSkippedAutoRenewOff = 0;
  let renewalSkippedLegacyPlan = 0;
  let subscriptionsAutoCancelled = 0;

  const now = new Date();
  const staleBefore = new Date(Date.now() - DAY_MS);
  const recentSince = new Date(Date.now() - DAY_MS);

  // ── 1. Stale unanswered QnA root messages ────────────────────────────────
  //
  // QnA is unified onto `QuestionMessage`. A "question" is a root student message
  // (sender="me", replyToId=null). It becomes stale when it is 24h+ old and has
  // no tutor reply (sender="tutor") in its replies list.
  //
  // NOTE: `qnaMessagesChecked` used to count mobile chat threads, `questionsChecked`
  // used to count web questions — both keys stay on the return so the cron route
  // response shape doesn't change. Under the unified model, `qnaMessagesChecked`
  // is intentionally 0.
  const staleRootMessages = await prisma.questionMessage.findMany({
    where: {
      sender: "me",
      replyToId: null,
      isResolved: false,
      createdAt: { lt: staleBefore },
      replies: { none: { sender: "tutor" } },
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

  const questionsChecked = staleRootMessages.length;

  if (staleRootMessages.length > 0) {
    const questionIds = staleRootMessages.map((q) => q.id);
    const studentIds = Array.from(
      new Set(staleRootMessages.map((q) => q.studentId)),
    );

    // Bulk-fetch manager links for all involved students.
    const rawManagerLinks = await prisma.managerStudent.findMany({
      where: { studentId: { in: studentIds } },
      select: {
        studentId: true,
        manager: { select: { userId: true } },
      },
    });

    const managersByStudent = new Map<string, string[]>();
    for (const link of rawManagerLinks) {
      const arr = managersByStudent.get(link.studentId) ?? [];
      arr.push(link.manager.userId);
      managersByStudent.set(link.studentId, arr);
    }

    // Bulk-fetch recent QUESTION_UNANSWERED notifications for dedup.
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

    const toCreate: Array<{
      userId: string;
      type: string;
      title: string;
      body: string;
      relatedId: string;
    }> = [];

    for (const question of staleRootMessages) {
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

  // `qnaMessagesChecked` is retained on the return payload for backward compat
  // with the /api/cron/check-alerts response shape. Under the unified model,
  // the unified check above owns everything, so this counter is always 0.
  void qnaMessagesChecked;

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
  // has not yet accepted (matchStatus === PENDING_STUDENT_ACCEPT). Cancelled
  // matches must be excluded so students are not nudged to accept a teacher
  // that was already withdrawn. Send one in-app reminder per match, deduped
  // against MATCH_ACCEPTANCE_REMINDER notifications from the last 24h.

  const pendingMatchCutoff = new Date(Date.now() - DAY_MS);

  const pendingMatches = await prisma.teacherStudent.findMany({
    where: {
      matchStatus: "PENDING_STUDENT_ACCEPT",
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
          // ConsultationBooking is a history collection. Take the most-recent
          // row for manager attribution.
          consultationBookings: {
            orderBy: { createdAt: "desc" },
            take: 1,
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

      // Determine manager recipients from the student's current (most-recent) booking.
      const currentBooking = match.student.consultationBookings[0];
      let managerUserIds: string[] = [];
      if (currentBooking?.managerId) {
        // Get the userId for this manager's teacherId.
        const consultationManager = await prisma.teacher.findUnique({
          where: { id: currentBooking.managerId },
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

  // ── 5c. Consultation visit reminder (#6) ──────────────────────────────────
  //
  // ConsultationBooking status "ASSIGNED" with visitConfirmedAt set and within
  // the next 36 hours (and still in the future) → remind the student and notify
  // the manager.
  // Dedup: existence of any CONSULTATION_REMINDER notification keyed by bookingId
  // (no time window — fires once per booking, ever).

  const consultationReminderWindow = new Date(now.getTime() + 36 * 60 * 60 * 1000);

  const upcomingConsultations = await prisma.consultationBooking.findMany({
    where: {
      status: "ASSIGNED",
      visitConfirmedAt: { not: null, gte: now, lt: consultationReminderWindow },
    },
    select: {
      id: true,
      visitConfirmedAt: true,
      managerId: true,
      student: {
        select: {
          userId: true,
          name: true,
        },
      },
    },
  });

  consultationRemindersChecked = upcomingConsultations.length;

  if (upcomingConsultations.length > 0) {
    const bookingIds = upcomingConsultations.map((b) => b.id);

    const existingConsultNotifs = await prisma.notification.findMany({
      where: {
        type: "CONSULTATION_REMINDER",
        relatedId: { in: bookingIds },
      },
      select: { userId: true, relatedId: true },
    });
    const consultAlreadySent = new Set(
      existingConsultNotifs.map((n) => `${n.userId}:${n.relatedId}`),
    );

    // Resolve manager userIds for bookings that have a managerId.
    const managerIds = upcomingConsultations
      .map((b) => b.managerId)
      .filter((id): id is string => id != null);

    const managerTeachers =
      managerIds.length > 0
        ? await prisma.teacher.findMany({
            where: { id: { in: managerIds } },
            select: { id: true, userId: true },
          })
        : [];
    const managerUserIdByTeacherId = new Map(
      managerTeachers.map((t) => [t.id, t.userId]),
    );

    // Manager-only notifications (no SMS) collected for bulk insert.
    const consultManagerToCreate: Array<{
      userId: string;
      type: string;
      title: string;
      body: string;
      relatedId: string;
    }> = [];

    for (const booking of upcomingConsultations) {
      if (!booking.visitConfirmedAt) continue;
      const visitStr = booking.visitConfirmedAt.toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
      });

      // Notify student via createNotification — triggers SMS automatically.
      const studentKey = `${booking.student.userId}:${booking.id}`;
      if (!consultAlreadySent.has(studentKey)) {
        await createNotification({
          userId: booking.student.userId,
          type: "CONSULTATION_REMINDER",
          title: "방문 상담 일정 안내",
          body: `${visitStr}에 방문 상담이 예정되어 있습니다. 잊지 말고 방문해 주세요!`,
          relatedId: booking.id,
        });
        notificationsCreated++;
      }

      // Notify manager (if assigned) — in-app only, no SMS.
      if (booking.managerId) {
        const managerUserId = managerUserIdByTeacherId.get(booking.managerId);
        if (managerUserId) {
          const managerKey = `${managerUserId}:${booking.id}`;
          if (!consultAlreadySent.has(managerKey)) {
            consultManagerToCreate.push({
              userId: managerUserId,
              type: "CONSULTATION_REMINDER",
              title: "방문 상담 일정 안내",
              body: `${booking.student.name}님의 방문 상담이 ${visitStr}에 예정되어 있습니다.`,
              relatedId: booking.id,
            });
          }
        }
      }
    }

    if (consultManagerToCreate.length > 0) {
      await prisma.notification.createMany({ data: consultManagerToCreate });
      notificationsCreated += consultManagerToCreate.length;
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

  // ── 7. Subscription expiry reminders (BR-1) ────────────────────────────────
  //
  // Three stages, each fires at most once per subscription (hard dedup via
  // notification-existence check, no time window — safe under any cron cadence):
  //
  //   SUBSCRIPTION_EXPIRY_SOON  — periodEnd within 5 days (> 1 day remaining)
  //   SUBSCRIPTION_EXPIRED_SOON — periodEnd within 1 day (still in future)
  //   SUBSCRIPTION_EXPIRED      — periodEnd in the past, status still ACTIVE
  //
  // PAUSED subscriptions are skipped.  No status mutation — leave that to billing.
  // Student gets warm renewal SMS; manager gets an in-app care nudge.

  // ── 7a. Expiry-soon stages (periodEnd still in the future) ─────────────────
  const expiryWindowEnd = new Date(now.getTime() + 5 * DAY_MS);
  const expiringSubscriptions = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      periodEnd: { not: null, gte: now, lt: expiryWindowEnd },
    },
    select: {
      id: true,
      studentId: true,
      periodEnd: true,
      student: {
        select: {
          userId: true,
          name: true,
          managerLinks: {
            select: { manager: { select: { userId: true } } },
          },
        },
      },
    },
  });

  type ExpiryCandidate = {
    subscriptionId: string;
    studentUserId: string;
    studentName: string;
    managerUserIds: string[];
    type: "SUBSCRIPTION_EXPIRY_SOON" | "SUBSCRIPTION_EXPIRED_SOON";
    relatedId: string;
  };

  const expiryCandidates: ExpiryCandidate[] = [];

  for (const sub of expiringSubscriptions) {
    if (!sub.periodEnd) continue;
    const msLeft = sub.periodEnd.getTime() - now.getTime();
    const daysLeft = msLeft / DAY_MS;

    let type: "SUBSCRIPTION_EXPIRY_SOON" | "SUBSCRIPTION_EXPIRED_SOON" | null = null;
    if (daysLeft <= 1) {
      type = "SUBSCRIPTION_EXPIRED_SOON";
    } else if (daysLeft <= 5) {
      type = "SUBSCRIPTION_EXPIRY_SOON";
    }
    if (!type) continue;

    expiryCandidates.push({
      subscriptionId: sub.id,
      studentUserId: sub.student.userId,
      studentName: sub.student.name,
      managerUserIds: sub.student.managerLinks.map((l) => l.manager.userId),
      type,
      relatedId: `${sub.id}:${type}`,
    });
  }

  subscriptionExpiryChecked = expiryCandidates.length;

  if (expiryCandidates.length > 0) {
    const expirySoonRelatedIds = expiryCandidates.map((c) => c.relatedId);
    // Include both student relatedIds and manager relatedIds (relatedId:mgr).
    const expirySoonAllRelatedIds = [
      ...expirySoonRelatedIds,
      ...expirySoonRelatedIds.map((id) => `${id}:mgr`),
    ];

    const existingExpirySoonNotifs = await prisma.notification.findMany({
      where: {
        type: { in: ["SUBSCRIPTION_EXPIRY_SOON", "SUBSCRIPTION_EXPIRED_SOON"] },
        relatedId: { in: expirySoonAllRelatedIds },
      },
      select: { userId: true, relatedId: true },
    });
    const expirySoonAlreadySent = new Set(
      existingExpirySoonNotifs.map((n) => `${n.userId}:${n.relatedId}`),
    );

    // Manager-only notifications collected for bulk insert (no SMS for manager).
    const expiryManagerToCreate: Array<{
      userId: string;
      type: string;
      title: string;
      body: string;
      relatedId: string;
    }> = [];

    for (const candidate of expiryCandidates) {
      const renewalBody =
        "구독이 곧 만료됩니다. 수업을 계속하시려면 재결제를 진행해 주세요. 웹 결제 페이지에서 재결제하실 수 있습니다.";

      // Notify student via createNotification — triggers SMS automatically.
      if (!expirySoonAlreadySent.has(`${candidate.studentUserId}:${candidate.relatedId}`)) {
        await createNotification({
          userId: candidate.studentUserId,
          type: candidate.type,
          title: "구독 만료 안내",
          body: renewalBody,
          relatedId: candidate.relatedId,
        });
        notificationsCreated++;
      }

      // Notify manager(s) — in-app only, no SMS.
      const managerRelatedId = `${candidate.relatedId}:mgr`;
      for (const managerId of candidate.managerUserIds) {
        if (!expirySoonAlreadySent.has(`${managerId}:${managerRelatedId}`)) {
          expiryManagerToCreate.push({
            userId: managerId,
            type: candidate.type,
            title: "학생 구독 만료 임박",
            body: `${candidate.studentName}님의 구독이 곧 만료됩니다. 재결제를 안내해 주세요.`,
            relatedId: managerRelatedId,
          });
        }
      }
    }

    if (expiryManagerToCreate.length > 0) {
      await prisma.notification.createMany({ data: expiryManagerToCreate });
      notificationsCreated += expiryManagerToCreate.length;
    }
  }

  // ── 7b. Already-expired subscriptions (periodEnd in the past, still ACTIVE) ─
  const expiredSubscriptions = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      periodEnd: { not: null, lt: now },
    },
    select: {
      id: true,
      studentId: true,
      student: {
        select: {
          userId: true,
          name: true,
          managerLinks: {
            select: { manager: { select: { userId: true } } },
          },
        },
      },
    },
  });

  if (expiredSubscriptions.length > 0) {
    subscriptionExpiryChecked += expiredSubscriptions.length;

    const expiredSubIds = expiredSubscriptions.map((s) => s.id);
    // Include both student relatedIds (subId) and manager relatedIds (subId:mgr).
    const expiredRelatedIds = [
      ...expiredSubIds,
      ...expiredSubIds.map((id) => `${id}:mgr`),
    ];

    const existingExpiredNotifs = await prisma.notification.findMany({
      where: {
        type: "SUBSCRIPTION_EXPIRED",
        relatedId: { in: expiredRelatedIds },
      },
      select: { userId: true, relatedId: true },
    });
    const expiredAlreadySent = new Set(
      existingExpiredNotifs.map((n) => `${n.userId}:${n.relatedId}`),
    );

    // Manager-only notifications collected for bulk insert (no SMS for manager).
    const expiredManagerToCreate: Array<{
      userId: string;
      type: string;
      title: string;
      body: string;
      relatedId: string;
    }> = [];

    for (const sub of expiredSubscriptions) {
      // Notify student via createNotification — triggers SMS automatically.
      const studentKey = `${sub.student.userId}:${sub.id}`;
      if (!expiredAlreadySent.has(studentKey)) {
        await createNotification({
          userId: sub.student.userId,
          type: "SUBSCRIPTION_EXPIRED",
          title: "구독이 만료되었습니다",
          body: "구독이 만료되었습니다. 수업을 계속하시려면 재결제를 진행해 주세요. 웹 결제 페이지에서 재결제하실 수 있습니다.",
          relatedId: sub.id,
        });
        notificationsCreated++;
      }

      // Notify manager(s) — in-app only, no SMS.
      for (const managerId of sub.student.managerLinks.map((l) => l.manager.userId)) {
        const mgrKey = `${managerId}:${sub.id}:mgr`;
        if (!expiredAlreadySent.has(mgrKey)) {
          expiredManagerToCreate.push({
            userId: managerId,
            type: "SUBSCRIPTION_EXPIRED",
            title: "학생 구독 만료",
            body: `${sub.student.name}님의 구독이 만료되었습니다. 재결제를 안내해 주세요.`,
            relatedId: `${sub.id}:mgr`,
          });
        }
      }
    }

    if (expiredManagerToCreate.length > 0) {
      await prisma.notification.createMany({ data: expiredManagerToCreate });
      notificationsCreated += expiredManagerToCreate.length;
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
      createdAt: true,
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

  // History model guard: if the student has any newer ConsultationBooking row
  // (e.g. a re-consultation was started after this COMPLETED one), skip.
  // The follow-up is only meaningful when this is the student's LATEST booking.
  const supersedingStudentIds = new Set<string>();
  if (completedBookings.length > 0) {
    const supersedingRows = await prisma.consultationBooking.findMany({
      where: {
        studentId: { in: completedBookings.map((b) => b.studentId) },
        OR: completedBookings.map((b) => ({
          studentId: b.studentId,
          createdAt: { gt: b.createdAt },
        })),
      },
      select: { studentId: true },
    });
    for (const row of supersedingRows) {
      supersedingStudentIds.add(row.studentId);
    }
  }

  for (const booking of completedBookings) {
    // Skip if student already has an active subscription.
    if (booking.student.subscriptions.length > 0) continue;
    // Skip if a newer booking exists for this student.
    if (supersedingStudentIds.has(booking.studentId)) continue;

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

  // ── NEW-D. Satisfaction check-in D+7 (§24.1-3) ───────────────────────────
  //
  // Students whose FIRST non-cancelled lesson was COMPLETED and started 7+ days
  // ago, and who have NO SatisfactionCheckin row yet → create one row
  // (trigger FIRST_LESSON_D7, requestedAt now) + in-app notify + SMS.
  // Dedup: the SatisfactionCheckin row itself is the hard dedup (query excludes
  // students who already have one).

  const checkinCutoff = new Date(Date.now() - 7 * DAY_MS);

  // Find one completed lesson per student — the earliest (first lesson).
  // We group in-memory after the query to avoid a raw GROUP BY.
  const completedLessonsForCheckin = await prisma.lesson.findMany({
    where: {
      status: "COMPLETED",
      startAt: { lt: checkinCutoff },
      student: { satisfactionCheckins: { none: {} } },
    },
    select: {
      studentId: true,
      startAt: true,
      student: {
        select: {
          userId: true,
          name: true,
        },
      },
    },
    orderBy: { startAt: "asc" },
  });

  // Keep only the FIRST completed lesson per student.
  const firstCompletedByStudent = new Map<
    string,
    { studentId: string; studentUserId: string; studentName: string; startAt: Date }
  >();
  for (const lesson of completedLessonsForCheckin) {
    if (!firstCompletedByStudent.has(lesson.studentId)) {
      firstCompletedByStudent.set(lesson.studentId, {
        studentId: lesson.studentId,
        studentUserId: lesson.student.userId,
        studentName: lesson.student.name,
        startAt: lesson.startAt,
      });
    }
  }

  const checkinCandidates = Array.from(firstCompletedByStudent.values());

  for (const candidate of checkinCandidates) {
    // Hard dedup: @@unique([studentId, trigger]) on SatisfactionCheckin. A
    // concurrent cron run inserting the same row throws P2002 — skip it and
    // its notification instead of crashing the whole alert pass.
    try {
      await prisma.satisfactionCheckin.create({
        data: {
          studentId: candidate.studentId,
          trigger: "FIRST_LESSON_D7",
          requestedAt: new Date(),
        },
      });
    } catch (err) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code?: unknown }).code === "P2002"
      ) {
        continue;
      }
      throw err;
    }

    // In-app notification (createNotification dispatches SMS automatically
    // because SATISFACTION_CHECKIN_REQUEST is in SMS_NOTIFICATION_TYPES).
    await createNotification({
      userId: candidate.studentUserId,
      type: "SATISFACTION_CHECKIN_REQUEST",
      title: "첫 수업 소감을 알려주세요",
      body: "첫 수업 후 일주일이 지났어요. 수업은 어떠셨나요? 대시보드에서 알려주세요.",
      relatedId: candidate.studentId,
    });

    notificationsCreated++;
    satisfactionCheckinsCreated++;
  }

  // ── AUTO-RESUME. Paused subscriptions past pausedUntil ────────────────────
  //
  // Subscription status "PAUSED" with pausedUntil < now → resume:
  // status "ACTIVE", extend periodEnd by (now - pausedAt) when periodEnd non-null,
  // clear pausedAt/pausedUntil. Mirrors RESUME logic in the manager pause route.

  const pausedSubscriptions = await prisma.subscription.findMany({
    where: {
      status: "PAUSED",
      pausedUntil: { not: null, lt: now },
    },
    select: {
      id: true,
      pausedAt: true,
      periodEnd: true,
      student: {
        select: {
          name: true,
          managerLinks: { select: { manager: { select: { userId: true } } } },
        },
      },
    },
  });

  if (pausedSubscriptions.length > 0) {
    for (const sub of pausedSubscriptions) {
      let newPeriodEnd = sub.periodEnd;
      if (sub.pausedAt && sub.periodEnd) {
        const pausedDuration = now.getTime() - sub.pausedAt.getTime();
        newPeriodEnd = new Date(sub.periodEnd.getTime() + pausedDuration);
      }
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: "ACTIVE",
          periodEnd: newPeriodEnd,
          pausedAt: null,
          pausedUntil: null,
        },
      });
      subscriptionsAutoResumed++;
    }
  }

  // ── AUTO-RENEWAL. Toss 빌링키 정기결제 + dunning ────────────────────────────
  //
  // Rule: charge at/after periodEnd. periodEnd yyyymmdd(UTC)로 orderId를 고정하여
  // D+0/D+1/D+3 재시도가 모두 동일 orderId를 공유 → PaymentCompletion(unique orderId)로
  // idempotency 보장. Toss도 동일 orderId 중복 캡처를 거절한다.
  //
  // Dunning day-gating (hourly cron 안전):
  //   d = floor((now - periodEnd) / DAY_MS)  — d>=0 상태에서만 청구.
  //   ACTIVE 정상 만료 → d ∈ {0} 에서 최초 시도.
  //   PAST_DUE (실패 이력) → d ∈ {1, 3} 에서만 추가 시도.
  //   d >= 7 & PAST_DUE → 자동 CANCELLED + 최종 안내.
  //
  // Race protection: 같은 orderId의 PaymentCompletion.updatedAt이 최근 20h 이내면 스킵
  //   (동일 dunning 버킷 안에서 이중 시도 방지).
  //
  // New period model: completeStudentPayment는 ACTIVE 구독 있으면 UPDATE, 없으면 CREATE.
  //   이력 보존을 위해 청구 성공 직전 기존 ACTIVE를 CANCELLED로 마감(periodEnd 원본 유지) →
  //   completeStudentPayment가 새 Subscription row를 생성하도록 유도한다.
  //
  // Never charge: autoRenew=false, PAUSED, BillingProfile 부재, legacy plan(v2 아님).
  //   이 경우 SUBSCRIPTION_EXPIRY_SOON 알림이 계속 수동 결제를 유도한다.

  const renewalCandidates = await prisma.subscription.findMany({
    where: {
      status: { in: ["ACTIVE", "PAST_DUE"] },
      // Charge when now >= periodEnd (inclusive boundary).
      periodEnd: { not: null, lte: now },
    },
    select: {
      id: true,
      studentId: true,
      plan: true,
      status: true,
      periodEnd: true,
      student: {
        select: {
          userId: true,
          name: true,
          grade: true,
          billingProfile: {
            select: {
              customerKey: true,
              billingKey: true,
              autoRenew: true,
            },
          },
        },
      },
    },
  });

  for (const sub of renewalCandidates) {
    if (!sub.periodEnd) continue;

    const daysPast = Math.floor(
      (now.getTime() - sub.periodEnd.getTime()) / DAY_MS,
    );
    if (daysPast < 0) continue;

    // Final cancellation on D+7 for dunning-failed subscriptions.
    if (sub.status === "PAST_DUE" && daysPast >= 7) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "CANCELLED" },
      });
      subscriptionsAutoCancelled++;

      // Final notice — hard dedup by relatedId including a stable suffix.
      const relatedId = `${sub.id}:auto-cancelled`;
      const existing = await prisma.notification.findFirst({
        where: {
          userId: sub.student.userId,
          type: "SUBSCRIPTION_AUTO_CANCELLED",
          relatedId,
        },
        select: { id: true },
      });
      if (!existing) {
        await createNotification({
          userId: sub.student.userId,
          type: "SUBSCRIPTION_AUTO_CANCELLED",
          title: "구독 자동 해지",
          body: "자동결제가 계속 실패하여 구독이 해지되었습니다. 계속 이용하시려면 결제 페이지에서 다시 결제해 주세요.",
          relatedId,
        });
        notificationsCreated++;
      }
      continue;
    }

    // Skip PAUSED entirely (defense in depth — findMany already excludes).
    if ((sub.status as string) === "PAUSED") {
      renewalSkippedPaused++;
      continue;
    }

    const billing = sub.student.billingProfile;
    if (!billing) {
      renewalSkippedNoBilling++;
      continue;
    }
    if (!billing.autoRenew) {
      renewalSkippedAutoRenewOff++;
      continue;
    }

    const v2Plan = getV2PlanById(sub.plan);
    if (!v2Plan) {
      // Legacy plan — cannot resolve authoritative amount. Skip; expiry alerts handle it.
      renewalSkippedLegacyPlan++;
      continue;
    }

    // Dunning day-gate: {0, 1, 3} only. Other days between attempts are silent.
    const chargeableToday =
      (sub.status === "ACTIVE" && daysPast === 0) ||
      (sub.status === "PAST_DUE" && (daysPast === 1 || daysPast === 3));
    if (!chargeableToday) continue;

    // Stable orderId across all dunning attempts for this period.
    const yyyymmdd = `${sub.periodEnd.getUTCFullYear()}${String(
      sub.periodEnd.getUTCMonth() + 1,
    ).padStart(2, "0")}${String(sub.periodEnd.getUTCDate()).padStart(2, "0")}`;
    const orderId = `renewal-${sub.id}-${yyyymmdd}`;

    // Idempotency: existing COMPLETED means already renewed for this period.
    // Recent attempt (< 20h) means another cron in the same bucket already tried.
    const existingCompletion = await prisma.paymentCompletion.findUnique({
      where: { orderId },
      select: { status: true, updatedAt: true },
    });
    if (existingCompletion?.status === "COMPLETED") continue;
    if (existingCompletion?.status === "REFUNDED") continue;
    if (
      existingCompletion &&
      now.getTime() - existingCompletion.updatedAt.getTime() < 20 * 60 * 60 * 1000
    ) {
      continue;
    }

    renewalChargesAttempted++;

    const orderName = `Concord ${v2Plan.title} 자동결제`;

    try {
      const charged = await chargeBillingKey({
        billingKey: billing.billingKey,
        customerKey: billing.customerKey,
        amount: v2Plan.priceKrw,
        orderId,
        orderName,
        customerName: sub.student.name,
      });

      // Toss가 HTTP 200을 주더라도 status가 DONE이 아니면(대기·중단 등) 실제 결제가
      // 확정된 게 아니므로 성공 처리 금지 — throw로 아래 실패(FAILED) 분기로 보낸다.
      // 금액도 서버 신뢰값과 일치하는지 재확인(유령 ACTIVE 구독·오알림 방지).
      if (charged.status !== "DONE" || charged.amount !== v2Plan.priceKrw) {
        throw new Error(
          `TOSS_BILLING_NOT_DONE:status=${charged.status}:amount=${charged.amount}`,
        );
      }

      // Preserve immutable history + issue a new Subscription period. We do NOT
      // reuse completeStudentPayment here because it re-runs confirmTossPayment
      // which requires a widget-issued paymentKey — renewal charges instead go
      // through chargeBillingKey and return their own paymentKey directly.
      const renewalPeriodStart = new Date();
      const renewalPeriodEnd = new Date(renewalPeriodStart);
      renewalPeriodEnd.setMonth(renewalPeriodEnd.getMonth() + 1);

      await prisma.$transaction(async (tx) => {
        // Close the current ACTIVE/PAST_DUE row keeping its ORIGINAL periodEnd
        // (do not mutate historical boundaries).
        await tx.subscription.update({
          where: { id: sub.id },
          data: { status: "CANCELLED" },
        });

        const newSub = await tx.subscription.create({
          data: {
            studentId: sub.studentId,
            plan: sub.plan,
            status: "ACTIVE",
            periodStart: renewalPeriodStart,
            periodEnd: renewalPeriodEnd,
          },
        });

        await tx.paymentCompletion.upsert({
          where: { orderId },
          create: {
            orderId,
            studentId: sub.studentId,
            plan: sub.plan,
            status: "COMPLETED",
            paymentKey: charged.paymentKey || null,
            amount: charged.amount,
            subscriptionId: newSub.id,
            completedAt: new Date(),
          },
          update: {
            status: "COMPLETED",
            paymentKey: charged.paymentKey || null,
            amount: charged.amount,
            subscriptionId: newSub.id,
            completedAt: new Date(),
          },
        });
      });

      renewalChargesSucceeded++;

      await createNotification({
        userId: sub.student.userId,
        type: "SUBSCRIPTION_RENEWED",
        title: "자동결제 완료",
        body: `${v2Plan.title} 플랜이 자동 결제되어 다음 달 이용이 갱신되었습니다.`,
        relatedId: `${sub.id}:${yyyymmdd}`,
      });
      notificationsCreated++;
    } catch (chargeError) {
      renewalChargesFailed++;
      console.error("[renewal] chargeBillingKey failed:", chargeError);

      // Mark PaymentCompletion FAILED so the next dunning bucket can detect prior
      // failure and gate correctly. Guard the update on status so a concurrent
      // run that already COMPLETED/REFUNDED this order (same-bucket race) is never
      // clobbered back to FAILED — that would falsely re-charge a paid student.
      const failedMsg =
        chargeError instanceof Error ? chargeError.message : String(chargeError);
      const failedUpdate = await prisma.paymentCompletion.updateMany({
        where: { orderId, status: { notIn: ["COMPLETED", "REFUNDED"] } },
        data: { status: "FAILED", amount: v2Plan.priceKrw, plan: sub.plan },
      });
      if (failedUpdate.count === 0) {
        const existing = await prisma.paymentCompletion.findUnique({
          where: { orderId },
          select: { id: true },
        });
        if (!existing) {
          await prisma.paymentCompletion.create({
            data: {
              orderId,
              studentId: sub.studentId,
              plan: sub.plan,
              status: "FAILED",
              amount: v2Plan.priceKrw,
            },
          });
        }
      }
      void failedMsg;

      // Transition Subscription → PAST_DUE (from ACTIVE) so dunning gate applies.
      if (sub.status === "ACTIVE") {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "PAST_DUE" },
        });
      }

      // Notify student. Dedup by dunning-attempt bucket.
      const notifRelatedId = `${sub.id}:${yyyymmdd}:d${daysPast}`;
      const existingFailNotif = await prisma.notification.findFirst({
        where: {
          userId: sub.student.userId,
          type: "SUBSCRIPTION_RENEWAL_FAILED",
          relatedId: notifRelatedId,
        },
        select: { id: true },
      });
      if (!existingFailNotif) {
        await createNotification({
          userId: sub.student.userId,
          type: "SUBSCRIPTION_RENEWAL_FAILED",
          title: "자동결제 실패 안내",
          body: "등록된 카드로 결제가 승인되지 않았습니다. 결제 페이지에서 카드를 확인해 주세요.",
          relatedId: notifRelatedId,
        });
        notificationsCreated++;
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
    consultationRemindersChecked,
    satisfactionCheckinsCreated,
    subscriptionsAutoResumed,
    renewalChargesAttempted,
    renewalChargesSucceeded,
    renewalChargesFailed,
    renewalSkippedPaused,
    renewalSkippedNoBilling,
    renewalSkippedAutoRenewOff,
    renewalSkippedLegacyPlan,
    subscriptionsAutoCancelled,
  };
}
