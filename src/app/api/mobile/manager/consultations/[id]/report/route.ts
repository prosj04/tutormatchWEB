import { NextResponse } from "next/server";

import { requireMobileManager } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import {
  parseGoals,
  validateGoals,
  serializeGoals,
} from "@/lib/consultation-report";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireMobileManager(request);
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const { id } = await context.params;

  const booking = await prisma.consultationBooking.findFirst({
    where: { id: id, managerId: teacher.id },
    include: { report: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.status === "CANCELLED") {
    return NextResponse.json({ error: "취소된 상담에는 처리할 수 없습니다" }, { status: 409 });
  }

  const report = booking.report
    ? {
        goals: parseGoals(booking.report.goals),
        subjectLevels: booking.report.subjectLevels
          ? (JSON.parse(booking.report.subjectLevels) as Record<string, string>)
          : null,
        recommendedPlan: booking.report.recommendedPlan,
        note: booking.report.note,
      }
    : null;

  return NextResponse.json({ report });
}

export async function PUT(request: Request, context: RouteContext) {
  const authResult = await requireMobileManager(request);
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const { id } = await context.params;

  const booking = await prisma.consultationBooking.findFirst({
    where: { id: id, managerId: teacher.id },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.status === "CANCELLED") {
    return NextResponse.json({ error: "취소된 상담에는 처리할 수 없습니다" }, { status: 409 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const goalsResult = validateGoals(body["goals"] ?? { quantitative: [], qualitative: [] });
  if (!goalsResult.ok) {
    return NextResponse.json({ error: goalsResult.error }, { status: 400 });
  }

  // Validate subjectLevels: optional JSON object (not array)
  let subjectLevelsStr: string | null = null;
  if (body["subjectLevels"] !== undefined && body["subjectLevels"] !== null) {
    if (
      typeof body["subjectLevels"] !== "object" ||
      Array.isArray(body["subjectLevels"])
    ) {
      return NextResponse.json(
        { error: "subjectLevels must be an object" },
        { status: 400 },
      );
    }
    subjectLevelsStr = JSON.stringify(body["subjectLevels"]);
  }

  const recommendedPlan =
    typeof body["recommendedPlan"] === "string"
      ? body["recommendedPlan"].trim() || null
      : null;

  const note =
    typeof body["note"] === "string" ? body["note"].trim() || null : null;

  const report = await prisma.consultationReport.upsert({
    where: { bookingId: id },
    create: {
      bookingId: id,
      goals: serializeGoals(goalsResult.goals),
      subjectLevels: subjectLevelsStr,
      recommendedPlan,
      note,
    },
    update: {
      goals: serializeGoals(goalsResult.goals),
      subjectLevels: subjectLevelsStr,
      recommendedPlan,
      note,
    },
  });

  return NextResponse.json({
    report: {
      goals: goalsResult.goals,
      subjectLevels: subjectLevelsStr
        ? (JSON.parse(subjectLevelsStr) as Record<string, string>)
        : null,
      recommendedPlan: report.recommendedPlan,
      note: report.note,
    },
  });
}
