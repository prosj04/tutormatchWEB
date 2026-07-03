import { prisma } from "@/lib/prisma";

export function addDays(date: string, offset: number) {
  const [year, month, day] = date.split("-").map(Number);
  const d = new Date(year, month - 1, day + offset, 12, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function distributeTasks(tasks: string[], days: 4 | 7) {
  const buckets = Array.from({ length: days }, () => [] as string[]);
  if (tasks.length === 0) return buckets;

  const activeDays = Math.min(days, tasks.length);
  // 앞쪽 날짜에 살짝 더 많은 과제를 배치하되, 가능한 모든 날짜에 최소 1개씩 배분한다.
  const weights = Array.from({ length: activeDays }, (_, index) => activeDays - index + 1);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const baseCounts = weights.map((weight) => Math.floor((tasks.length * weight) / totalWeight));

  if (tasks.length >= activeDays) {
    for (let i = 0; i < activeDays; i += 1) {
      baseCounts[i] = Math.max(1, baseCounts[i]);
    }
  }

  let assigned = baseCounts.reduce((sum, count) => sum + count, 0);
  const remainders = weights
    .map((weight, index) => ({
      index,
      value: (tasks.length * weight) / totalWeight - Math.floor((tasks.length * weight) / totalWeight),
    }))
    .sort((a, b) => b.value - a.value);

  while (assigned < tasks.length) {
    for (const { index } of remainders) {
      if (assigned >= tasks.length) break;
      baseCounts[index] += 1;
      assigned += 1;
    }
  }

  while (assigned > tasks.length) {
    for (let i = activeDays - 1; i >= 0; i -= 1) {
      if (assigned <= tasks.length) break;
      if (baseCounts[i] > 1) {
        baseCounts[i] -= 1;
        assigned -= 1;
      }
    }
  }

  let cursor = 0;
  for (let dayIndex = 0; dayIndex < activeDays; dayIndex += 1) {
    const count = baseCounts[dayIndex];
    buckets[dayIndex].push(...tasks.slice(cursor, cursor + count));
    cursor += count;
  }

  return buckets;
}

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
