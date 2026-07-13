import { ANALYTICS_EVENTS, type AnalyticsEventName, type AnalyticsPayload } from "@/lib/analytics-events";
import { prisma } from "@/lib/prisma";

export type TrackEventInput = {
  name: AnalyticsEventName | string;
  payload?: AnalyticsPayload;
  platform?: "web" | "mobile";
  userId?: string | null;
};

function serializePayload(payload?: AnalyticsPayload): string {
  if (!payload || Object.keys(payload).length === 0) return "{}";
  try {
    return JSON.stringify(payload);
  } catch {
    return "{}";
  }
}

/** DB에 이벤트 저장 (실패 시 로그만) */
async function persistAnalyticsEvent(input: TrackEventInput): Promise<void> {
  await prisma.analyticsEvent.create({
    data: {
      name: input.name,
      platform: input.platform ?? "web",
      userId: input.userId ?? null,
      payload: serializePayload(input.payload),
    },
  });
}

/** 서버 측 이벤트 기록 — 구조화 로그 + DB 영속화 */
export function logAnalyticsEvent(input: TrackEventInput): void {
  const entry = {
    ts: new Date().toISOString(),
    event: input.name,
    platform: input.platform ?? "web",
    userId: input.userId ?? null,
    ...input.payload,
  };
  console.info("[analytics]", JSON.stringify(entry));

  void persistAnalyticsEvent(input).catch((err) => {
    console.error(
      "[analytics] persist failed",
      err instanceof Error ? err.message : err,
    );
  });
}

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
