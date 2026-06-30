import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { logAnalyticsEvent } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";

/** 학생의 첫 활성 매칭 시 ACTIVE 이벤트 기록 */
export async function trackJourneyActiveIfFirst(studentId: string): Promise<void> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { userId: true },
  });
  if (!student) return;

  const activeCount = await prisma.teacherStudent.count({
    where: { studentId, isActive: true },
  });
  if (activeCount !== 1) return;

  logAnalyticsEvent({
    name: ANALYTICS_EVENTS.journeyActiveReached,
    userId: student.userId,
    platform: "web",
  });
}
