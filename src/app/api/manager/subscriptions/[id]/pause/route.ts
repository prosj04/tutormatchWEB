import { NextResponse } from "next/server";

import { requireManager } from "@/lib/manager-auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit-log";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const authResult = await requireManager();
  if ("error" in authResult) return authResult.error;
  const { teacher, session } = authResult;

  const { id: subscriptionId } = await context.params;

  let body: {
    action?: unknown;
    until?: unknown;
    reason?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, until, reason } = body;

  if (action === "PAUSE") {
    if (typeof reason === "string" && reason.trim()) {
      console.log(`[subscription-pause] reason: ${reason.trim().slice(0, 500)}`);
    }
    // Validate action and until
    if (typeof until !== "string") {
      return NextResponse.json(
        { error: "until is required (ISO date)" },
        { status: 400 }
      );
    }

    const pauseUntilDate = new Date(until);
    if (isNaN(pauseUntilDate.getTime())) {
      return NextResponse.json(
        { error: "until must be a valid ISO date" },
        { status: 400 }
      );
    }

    // Validate max pause duration (35 days from now)
    const now = new Date();
    const maxPauseDate = new Date(now);
    maxPauseDate.setDate(maxPauseDate.getDate() + 35);

    if (pauseUntilDate > maxPauseDate) {
      return NextResponse.json(
        { error: "Pause duration cannot exceed 35 days" },
        { status: 400 }
      );
    }

    // Find subscription with student relationship
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { student: true },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    if (subscription.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Subscription must be ACTIVE to pause" },
        { status: 409 }
      );
    }

    // Verify manager manages this student (either via ConsultationBooking.managerId or is CHIEF_MANAGER)
    const managesStudent = await prisma.consultationBooking.findFirst({
      where: {
        studentId: subscription.studentId,
        managerId: teacher.id,
      },
    });

    if (!managesStudent && session.user.role !== "CHIEF_MANAGER") {
      return NextResponse.json(
        { error: "You do not manage this student" },
        { status: 403 }
      );
    }

    // Pause the subscription
    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: "PAUSED",
        pausedAt: now,
        pausedUntil: pauseUntilDate,
      },
    });

    recordAudit({
      actorUserId: session.user.id,
      actorRole: session.user.role ?? "MANAGER",
      action: "SUBSCRIPTION_PAUSE",
      targetType: "Subscription",
      targetId: subscriptionId,
      detail: JSON.stringify({
        until,
        reason: typeof reason === "string" ? reason.trim().slice(0, 500) : null,
      }),
    });

    return NextResponse.json({ subscription: updated }, { status: 200 });
  } else if (action === "RESUME") {
    // Find subscription with student relationship
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { student: true },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    if (subscription.status !== "PAUSED") {
      return NextResponse.json(
        { error: "Subscription must be PAUSED to resume" },
        { status: 409 }
      );
    }

    // Verify manager manages this student (either via ConsultationBooking.managerId or is CHIEF_MANAGER)
    const managesStudent = await prisma.consultationBooking.findFirst({
      where: {
        studentId: subscription.studentId,
        managerId: teacher.id,
      },
    });

    if (!managesStudent && session.user.role !== "CHIEF_MANAGER") {
      return NextResponse.json(
        { error: "You do not manage this student" },
        { status: 403 }
      );
    }

    // Resume and extend periodEnd by paused duration
    // Note: auto-resume at pausedUntil is handled manually for now (cron follow-up later).
    let newPeriodEnd = subscription.periodEnd;

    if (
      subscription.pausedAt &&
      subscription.periodEnd &&
      newPeriodEnd
    ) {
      const pausedDuration =
        new Date().getTime() - subscription.pausedAt.getTime();
      newPeriodEnd = new Date(newPeriodEnd.getTime() + pausedDuration);
    }

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: "ACTIVE",
        periodEnd: newPeriodEnd,
        pausedAt: null,
        pausedUntil: null,
      },
    });

    recordAudit({
      actorUserId: session.user.id,
      actorRole: session.user.role ?? "MANAGER",
      action: "SUBSCRIPTION_RESUME",
      targetType: "Subscription",
      targetId: subscriptionId,
    });

    return NextResponse.json({ subscription: updated }, { status: 200 });
  } else {
    return NextResponse.json(
      { error: "action must be PAUSE or RESUME" },
      { status: 400 }
    );
  }
}
