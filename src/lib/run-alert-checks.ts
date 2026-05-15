import { completionRate } from "@/lib/manager-stats";
import { createNotification } from "@/lib/notifications";
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

async function wasNotifiedRecently(
  userId: string,
  type: string,
  relatedId: string,
): Promise<boolean> {
  const since = new Date(Date.now() - DAY_MS);
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      type,
      relatedId,
      createdAt: { gte: since },
    },
  });
  return existing != null;
}

export async function runAlertChecks() {
  let questionsChecked = 0;
  let notificationsCreated = 0;
  let weeklyStudentsChecked = 0;

  const staleBefore = new Date(Date.now() - DAY_MS);

  const staleQuestions = await prisma.question.findMany({
    where: {
      teacherAnswer: null,
      aiAnswer: { not: null },
      createdAt: { lt: staleBefore },
      isResolved: false,
    },
    include: {
      student: {
        include: {
          teachers: {
            where: { isActive: true },
            include: { teacher: { include: { user: true } } },
          },
        },
      },
    },
  });

  questionsChecked = staleQuestions.length;

  for (const question of staleQuestions) {
    const studentName = question.student.name;

    for (const match of question.student.teachers) {
      const teacherUserId = match.teacher.userId;
      const already = await wasNotifiedRecently(
        teacherUserId,
        "QUESTION_UNANSWERED",
        question.id,
      );
      if (!already) {
        await createNotification({
          userId: teacherUserId,
          type: "QUESTION_UNANSWERED",
          title: "미답변 질문 알림",
          body: `${studentName}님의 질문이 24시간째 답변되지 않았습니다.`,
          relatedId: question.id,
        });
        notificationsCreated++;
      }
    }

    const managerLinks = await prisma.managerStudent.findMany({
      where: { studentId: question.studentId },
      include: { manager: { include: { user: true } } },
    });

    for (const link of managerLinks) {
      const managerUserId = link.manager.userId;
      const already = await wasNotifiedRecently(
        managerUserId,
        "QUESTION_UNANSWERED",
        question.id,
      );
      if (!already) {
        await createNotification({
          userId: managerUserId,
          type: "QUESTION_UNANSWERED",
          title: "미답변 질문 알림",
          body: `${studentName}님의 질문이 24시간째 답변 대기 중입니다.`,
          relatedId: question.id,
        });
        notificationsCreated++;
      }
    }
  }

  const prevWeek = getPreviousWeekRange();
  if (prevWeek) {
    const managerLinks = await prisma.managerStudent.findMany({
      include: {
        student: true,
        manager: { include: { user: true } },
      },
    });

    const byStudent = new Map<
      string,
      { studentName: string; managerUserIds: string[] }
    >();

    for (const link of managerLinks) {
      const entry = byStudent.get(link.studentId) ?? {
        studentName: link.student.name,
        managerUserIds: [],
      };
      if (!entry.managerUserIds.includes(link.manager.userId)) {
        entry.managerUserIds.push(link.manager.userId);
      }
      byStudent.set(link.studentId, entry);
    }

    for (const [studentId, { studentName, managerUserIds }] of Array.from(
      byStudent.entries(),
    )) {
      const plans = await prisma.studyPlan.findMany({
        where: {
          studentId,
          date: { gte: prevWeek.start, lte: prevWeek.end },
        },
        include: { tasks: true },
      });

      let done = 0;
      let total = 0;
      for (const plan of plans) {
        for (const task of plan.tasks) {
          total++;
          if (task.isDone) done++;
        }
      }

      if (total === 0) continue;

      weeklyStudentsChecked++;
      const rate = completionRate(done, total);

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

      const body = `${studentName}님의 지난주 완료율이 ${rate}%입니다.`;
      const weekKey = `${prevWeek.start}_${studentId}`;

      for (const userId of managerUserIds) {
        const already = await wasNotifiedRecently(userId, type, weekKey);
        if (already) continue;
        await createNotification({
          userId,
          type,
          title,
          body,
          relatedId: weekKey,
        });
        notificationsCreated++;
      }
    }
  }

  return {
    questionsChecked,
    weeklyStudentsChecked,
    notificationsCreated,
    weeklyCheckRan: prevWeek != null,
  };
}
