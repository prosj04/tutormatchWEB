import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit-log";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const { id } = await context.params;

  let reason: string | undefined;
  try {
    const body = (await request.json()) as { reason?: unknown };
    if (typeof body.reason === "string" && body.reason.trim()) {
      reason = body.reason.trim();
    }
  } catch {
    // reason is optional; ignore parse errors
  }

  // Conditional update: only transition COMPLETED → REFUNDED atomically.
  // If count === 0, payment doesn't exist or is not in COMPLETED state.
  const updated = await prisma.paymentCompletion.updateMany({
    where: { id, status: "COMPLETED" },
    data: { status: "REFUNDED" },
  });

  if (updated.count === 0) {
    const payment = await prisma.paymentCompletion.findUnique({ where: { id } });
    if (!payment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: `Cannot refund payment with status "${payment.status}"` },
      { status: 409 },
    );
  }

  // Fetch the updated payment to get subscriptionId + studentId
  const payment = await prisma.paymentCompletion.findUnique({ where: { id } });

  // Cancel related active subscription if present
  if (payment?.subscriptionId) {
    await prisma.subscription.updateMany({
      where: { id: payment.subscriptionId, status: "ACTIVE" },
      data: { status: "CANCELLED" },
    });
  }

  // 갱신결제는 기존 구독을 CANCELLED로 닫고 새 ACTIVE 구독을 만들기 때문에, 최초
  // 결제의 subscriptionId는 이미 지난 구독을 가리킨다. 환불 시 서비스가 계속되지
  // 않도록 학생의 현재 ACTIVE 구독도 취소하고, dunning 재청구를 막기 위해
  // 자동결제도 끈다.
  if (payment?.studentId) {
    await prisma.subscription.updateMany({
      where: { studentId: payment.studentId, status: "ACTIVE" },
      data: { status: "CANCELLED" },
    });
    await prisma.billingProfile.updateMany({
      where: { studentId: payment.studentId },
      data: { autoRenew: false },
    });
  }

  if (reason) {
    console.log(`[admin/refund] payment=${id} reason="${reason}"`);
  }

  recordAudit({
    actorUserId: session.user.id,
    actorRole: session.user.role ?? "ADMIN",
    action: "PAYMENT_REFUND",
    targetType: "PaymentCompletion",
    targetId: id,
    detail: JSON.stringify({ orderId: payment?.orderId ?? null, reason: reason ?? null }),
  });

  return NextResponse.json({
    ok: true,
    paymentId: id,
    reason: reason ?? null,
  });
}
