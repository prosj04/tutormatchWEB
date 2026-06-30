import { Prisma } from "@prisma/client";

import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { prisma } from "@/lib/prisma";

export const FUNNEL_EVENT_NAMES = [
  ANALYTICS_EVENTS.landingConsultationCtaClicked,
  ANALYTICS_EVENTS.consultationSubmitted,
  ANALYTICS_EVENTS.consultationPostSignupClicked,
  ANALYTICS_EVENTS.studentRegistered,
  ANALYTICS_EVENTS.journeyActiveReached,
] as const;

export type FunnelStepKey =
  | "ctaClicked"
  | "consultationSubmitted"
  | "postSignupClicked"
  | "studentRegistered"
  | "activeReached";

export type FunnelStep = {
  key: FunnelStepKey;
  label: string;
  eventName: string | null;
  total: number;
  uniqueUsers: number;
};

export type FunnelSnapshot = {
  days: number;
  since: string;
  steps: FunnelStep[];
  activeMatchesNow: number;
  rates: {
    consultationFromCta: number | null;
    signupFromConsultation: number | null;
    activeFromSignup: number | null;
  };
};

const STEP_META: Array<{
  key: FunnelStepKey;
  label: string;
  eventName: string | null;
}> = [
  {
    key: "ctaClicked",
    label: "상담 CTA 클릭",
    eventName: ANALYTICS_EVENTS.landingConsultationCtaClicked,
  },
  {
    key: "consultationSubmitted",
    label: "상담 신청 완료",
    eventName: ANALYTICS_EVENTS.consultationSubmitted,
  },
  {
    key: "postSignupClicked",
    label: "상담 후 가입 CTA",
    eventName: ANALYTICS_EVENTS.consultationPostSignupClicked,
  },
  {
    key: "studentRegistered",
    label: "학생 가입",
    eventName: ANALYTICS_EVENTS.studentRegistered,
  },
  {
    key: "activeReached",
    label: "수업 시작(ACTIVE)",
    eventName: ANALYTICS_EVENTS.journeyActiveReached,
  },
];

function pct(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export async function getFunnelSnapshot(days = 30): Promise<FunnelSnapshot> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const eventNames = STEP_META.map((s) => s.eventName).filter(
    (n): n is string => n !== null,
  );

  const [grouped, activeMatchesNow] = await Promise.all([
    prisma.analyticsEvent.groupBy({
      by: ["name"],
      where: {
        createdAt: { gte: since },
        name: { in: eventNames },
      },
      _count: { id: true },
    }),
    prisma.teacherStudent.count({
      where: {
        isActive: true,
        student: { name: { not: { startsWith: "[sample]" } } },
      },
    }),
  ]);

  const totalByName = new Map(grouped.map((g) => [g.name, g._count.id]));

  const uniqueRows = await prisma.$queryRaw<Array<{ name: string; count: bigint }>>`
    SELECT "name", COUNT(DISTINCT "userId")::bigint AS count
    FROM "AnalyticsEvent"
    WHERE "createdAt" >= ${since}
      AND "name" IN (${Prisma.join(eventNames)})
      AND "userId" IS NOT NULL
    GROUP BY "name"
  `;
  const uniqueByName = new Map(
    uniqueRows.map((row) => [row.name, Number(row.count)]),
  );

  const steps: FunnelStep[] = STEP_META.map((meta) => ({
    key: meta.key,
    label: meta.label,
    eventName: meta.eventName,
    total: meta.eventName ? (totalByName.get(meta.eventName) ?? 0) : 0,
    uniqueUsers: meta.eventName ? (uniqueByName.get(meta.eventName) ?? 0) : 0,
  }));

  const cta = steps.find((s) => s.key === "ctaClicked")?.total ?? 0;
  const consultation = steps.find((s) => s.key === "consultationSubmitted")?.total ?? 0;
  const signup = steps.find((s) => s.key === "studentRegistered")?.total ?? 0;
  const active = steps.find((s) => s.key === "activeReached")?.total ?? 0;

  return {
    days,
    since: since.toISOString(),
    steps,
    activeMatchesNow,
    rates: {
      consultationFromCta: pct(consultation, cta),
      signupFromConsultation: pct(signup, consultation),
      activeFromSignup: pct(active, signup),
    },
  };
}
