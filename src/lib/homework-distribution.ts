import { addDays, distributeTasks } from "@/lib/homework-distribution-core";
import { prisma } from "@/lib/prisma";

// Re-export the pure helpers so existing server importers stay unchanged.
export { addDays, distributeTasks } from "@/lib/homework-distribution-core";

/**
 * Auto-applies a teacher's default homework template once a first lesson
 * date is set. Gated behind ENABLE_AUTO_HOMEWORK_DISTRIBUTION; only runs when
 * a default template exists, and is idempotent per lesson via
 * the `teacher:auto:first-lesson:${lessonId}` task source.
 */
export async function autoApplyFirstLessonHomeworkTemplate({
  teacherId,
  studentId,
  lessonId,
  startDate,
}: {
  teacherId: string;
  studentId: string;
  lessonId: string;
  startDate: string;
}) {
  if (process.env.ENABLE_AUTO_HOMEWORK_DISTRIBUTION !== "true") return;

  const template = await prisma.homeworkTemplate.findFirst({
    where: { teacherId, isDefault: true },
  });
  if (!template) return;

  const days = template.defaultDays === 4 ? 4 : template.defaultDays === 7 ? 7 : null;
  if (!days) return;

  let taskArray: string[] = [];
  try {
    const parsed = JSON.parse(template.tasks);
    taskArray = Array.isArray(parsed) ? parsed.map((t) => (typeof t === 'object' && t.title ? t.title : String(t))) : [];
  } catch {
    taskArray = [];
  }
  if (taskArray.length === 0) return;
  const tasks = taskArray;

  const source = `teacher:auto:first-lesson:${lessonId}`;
  const buckets = distributeTasks(tasks, days);
  const dates = Array.from({ length: days }, (_, dayIndex) => ({
    date: addDays(startDate, dayIndex),
    tasks: buckets[dayIndex],
  })).filter((entry) => entry.tasks.length > 0);
  if (dates.length === 0) return;

  const existingPlans = await prisma.studyPlan.findMany({
    where: { studentId, date: { in: dates.map((entry) => entry.date) } },
    select: { id: true, date: true, tasks: { select: { order: true, source: true } } },
  });
  const existingPlanMap = new Map(existingPlans.map((plan) => [plan.date, plan]));

  const targets = dates.filter(({ date }) => {
    const existingPlan = existingPlanMap.get(date);
    if (!existingPlan) return true;
    return !existingPlan.tasks.some((task) => task.source === source);
  });
  if (targets.length === 0) return;

  await prisma.$transaction(
    targets.map(({ date, tasks: dayTasks }) => {
      const existingPlan = existingPlanMap.get(date);
      if (existingPlan) {
        const nextOrder =
          existingPlan.tasks.length > 0
            ? Math.max(...existingPlan.tasks.map((task) => task.order)) + 1
            : 0;
        return prisma.studyPlan.update({
          where: { id: existingPlan.id },
          data: {
            tasks: {
              create: dayTasks.map((title, order) => ({
                title,
                order: nextOrder + order,
                source,
              })),
            },
          },
        });
      }

      return prisma.studyPlan.create({
        data: {
          studentId,
          date,
          tasks: {
            create: dayTasks.map((title, order) => ({ title, order, source })),
          },
        },
      });
    }),
  );
}
