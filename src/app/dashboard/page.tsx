import { redirect } from "next/navigation";

import { StudentDashboardEntry } from "@/components/dashboard/StudentDashboardEntry";
import { isAiAnswerEnabled } from "@/lib/ai-answer";
import { auth } from "@/auth";
import { formatDateKey } from "@/lib/study-plan-dates";
import { resolveStudentJourneyStage } from "@/lib/student-journey";
import { prisma } from "@/lib/prisma";
import { parseGoals, type ConsultationGoals } from "@/lib/consultation-report";

export const metadata = {
  title: "학습 플래너",
};

type SearchParams = { cms_edit?: string | string[] };

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const isEditMode = first(searchParams?.cms_edit) === "1";
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/teacher-portal/dashboard");
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      _count: { select: { teachers: { where: { isActive: true } } } },
    },
  });

  if (!student) {
    redirect("/?signup=1");
  }

  const journeyStage = await resolveStudentJourneyStage(student.id);
  if (journeyStage !== "ACTIVE") {
    redirect("/dashboard/consultation");
  }

  const now = new Date();
  const initialDate = formatDateKey(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  );
  const initialMonthKey = initialDate.slice(0, 7);

  const [planDateRows, rawInitialPlan, rawInitialQuestions, consultationBooking, activeTeacherMatch, rawCareLogs, pendingCheckin] = await Promise.all([
    prisma.studyPlan.findMany({
      where: { studentId: student.id, date: { startsWith: initialMonthKey } },
      select: { date: true },
    }),
    prisma.studyPlan.findFirst({
      where: { studentId: student.id, date: initialDate },
      include: { tasks: { orderBy: { order: "asc" } } },
    }),
    prisma.question.findMany({
      where: { studentId: student.id, date: initialDate },
      orderBy: { createdAt: "desc" },
    }),
    prisma.consultationBooking.findUnique({
      where: { studentId: student.id },
      include: { report: true },
    }),
    prisma.teacherStudent.findFirst({
      where: { studentId: student.id, matchStatus: "ACTIVE", isActive: true },
      select: { id: true, subjects: true, teacher: { select: { name: true } } },
    }),
    prisma.managerCareLog.findMany({
      where: { studentId: student.id, visibleToStudent: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, type: true, note: true, createdAt: true },
    }),
    prisma.satisfactionCheckin.findFirst({
      where: { studentId: student.id, respondedAt: null },
      orderBy: { requestedAt: "desc" },
      select: { id: true, trigger: true, requestedAt: true },
    }),
  ]);

  const learningGoals: ConsultationGoals | null = (() => {
    if (!consultationBooking?.report) return null;
    const goals = parseGoals(consultationBooking.report.goals);
    if (goals.quantitative.length === 0 && goals.qualitative.length === 0) return null;
    return goals;
  })();

  const initialPlan = rawInitialPlan
    ? {
        ...rawInitialPlan,
        commentAt: rawInitialPlan.commentAt?.toISOString() ?? null,
        tasks: rawInitialPlan.tasks.map((task) => ({
          ...task,
          doneAt: task.doneAt?.toISOString() ?? null,
        })),
      }
    : null;

  const initialQuestions = rawInitialQuestions.map((question) => ({
    ...question,
    createdAt: question.createdAt.toISOString(),
    teacherAnswerAt: question.teacherAnswerAt?.toISOString() ?? null,
  }));

  const activeMatch = activeTeacherMatch
    ? {
        matchId: activeTeacherMatch.id,
        teacherName: activeTeacherMatch.teacher.name,
        subjects: activeTeacherMatch.subjects,
      }
    : null;

  const careLogs = rawCareLogs.map((log) => ({
    id: log.id,
    type: log.type as "CONSULT" | "INTERVENTION" | "CHECK",
    note: log.note,
    createdAt: log.createdAt.toISOString(),
  }));

  const satisfactionCheckin = pendingCheckin
    ? {
        id: pendingCheckin.id,
        trigger: pendingCheckin.trigger,
        requestedAt: pendingCheckin.requestedAt.toISOString(),
      }
    : null;

  return (
    <StudentDashboardEntry
      studentName={student.name}
      studentId={student.id}
      initialDate={initialDate}
      initialPlanDates={planDateRows.map((plan) => plan.date)}
      initialPlan={initialPlan}
      initialQuestions={initialQuestions}
      aiAnswerEnabled={isAiAnswerEnabled()}
      isEditMode={isEditMode}
      learningGoals={learningGoals}
      activeMatch={activeMatch}
      careLogs={careLogs}
      satisfactionCheckin={satisfactionCheckin}
    />
  );
}
