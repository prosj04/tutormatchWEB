import { NextResponse } from "next/server";

import { requireStudent } from "@/lib/student-auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

/** POST /api/student/satisfaction-checkins/[id]/respond
 *  body: { score: 1-5, comment?: string (max 500) }
 *  Only the owning student, only when respondedAt is null.
 *  If score <= 3, notifies the manager via SATISFACTION_LOW_SCORE.
 */
export async function POST(request: Request, context: RouteContext) {
  const authResult = await requireStudent();
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  const { id } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const score = typeof body["score"] === "number" ? body["score"] : null;
  if (score === null || !Number.isInteger(score) || score < 1 || score > 5) {
    return NextResponse.json(
      { error: "score must be an integer between 1 and 5" },
      { status: 400 },
    );
  }

  const comment =
    typeof body["comment"] === "string"
      ? body["comment"].trim().substring(0, 500) || null
      : null;

  const checkin = await prisma.satisfactionCheckin.findFirst({
    where: { id, studentId: student.id },
  });

  if (!checkin) {
    return NextResponse.json({ error: "Checkin not found" }, { status: 404 });
  }

  if (checkin.respondedAt !== null) {
    return NextResponse.json(
      { error: "Already responded" },
      { status: 409 },
    );
  }

  const updated = await prisma.satisfactionCheckin.update({
    where: { id },
    data: { score, comment, respondedAt: new Date() },
  });

  // If score <= 3, notify the student's manager
  if (score <= 3) {
    const booking = await prisma.consultationBooking.findUnique({
      where: { studentId: student.id },
      select: {
        managerId: true,
        manager: { select: { userId: true } },
      },
    });

    let recipientUserIds: string[] = [];
    if (booking?.manager?.userId) {
      recipientUserIds = [booking.manager.userId];
    } else {
      const chiefs = await prisma.teacher.findMany({
        where: { approved: true, user: { role: "CHIEF_MANAGER" } },
        select: { userId: true },
      });
      recipientUserIds = chiefs.map((c) => c.userId);
    }

    await Promise.all(
      recipientUserIds.map((userId) =>
        createNotification({
          userId,
          type: "SATISFACTION_LOW_SCORE",
          title: "만족도 낮은 학생 확인 필요",
          body: `${student.name} 학생이 첫 수업 만족도 ${score}점을 남겼습니다. 확인이 필요합니다.`,
          relatedId: student.id,
        }),
      ),
    );
  }

  return NextResponse.json({ checkin: updated }, { status: 200 });
}
