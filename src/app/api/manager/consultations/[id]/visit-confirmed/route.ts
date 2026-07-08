import { NextResponse } from "next/server";

import { requireManager } from "@/lib/manager-auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { formatDateWithWeekday } from "@/lib/visit-consultation";

type RouteContext = { params: Promise<{ id: string }> };

/** PATCH /api/manager/consultations/[id]/visit-confirmed
 *  body: { visitConfirmedAt: string (ISO) | null }
 *  Sets or clears the confirmed in-person consultation datetime.
 */
export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireManager();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const { id } = await context.params;

  // 취소·완료된 상담에는 방문 확정 시각을 설정/변경하지 못하도록 진행 중 상태로 제한.
  const booking = await prisma.consultationBooking.findFirst({
    where: { id, managerId: teacher.id, status: { notIn: ["CANCELLED", "COMPLETED"] } },
    select: { id: true, student: { select: { userId: true } } },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let visitConfirmedAt: Date | null = null;
  if (body["visitConfirmedAt"] !== null && body["visitConfirmedAt"] !== undefined) {
    if (typeof body["visitConfirmedAt"] !== "string") {
      return NextResponse.json(
        { error: "visitConfirmedAt must be an ISO string or null" },
        { status: 400 },
      );
    }
    const d = new Date(body["visitConfirmedAt"]);
    if (isNaN(d.getTime())) {
      return NextResponse.json(
        { error: "visitConfirmedAt is not a valid date" },
        { status: 400 },
      );
    }
    visitConfirmedAt = d;
  }

  const updated = await prisma.consultationBooking.update({
    where: { id },
    data: { visitConfirmedAt },
    select: { id: true, visitConfirmedAt: true },
  });

  if (visitConfirmedAt) {
    const kst = new Date(visitConfirmedAt.getTime() + 9 * 60 * 60 * 1000);
    const hh = String(kst.getUTCHours()).padStart(2, "0");
    const mm = String(kst.getUTCMinutes()).padStart(2, "0");
    await createNotification({
      userId: booking.student.userId,
      type: "BOOKING_CONFIRMED",
      title: "방문 상담 일시가 확정되었습니다",
      body: `${formatDateWithWeekday(kst.toISOString().slice(0, 10))} ${hh}:${mm}에 방문 상담이 진행됩니다.`,
      relatedId: id,
    });
  }

  return NextResponse.json({
    visitConfirmedAt: updated.visitConfirmedAt?.toISOString() ?? null,
  });
}
