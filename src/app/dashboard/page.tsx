import { redirect } from "next/navigation";

import { StudentDashboardEntry } from "@/components/dashboard/StudentDashboardEntry";
import { isAiAnswerEnabled } from "@/lib/ai-answer";
import { auth } from "@/auth";
import { formatDateKey } from "@/lib/study-plan-dates";
import { resolveStudentJourneyStage } from "@/lib/student-journey";
import { prisma } from "@/lib/prisma";

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

  const [planDateRows, rawInitialPlan, rawInitialQuestions] = await Promise.all([
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
  ]);

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
    />
  );
}
