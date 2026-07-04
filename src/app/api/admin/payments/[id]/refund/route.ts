import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit-log";
import { stopServiceAfterRefund } from "@/lib/payment-refund";
import { cancelTossPayment } from "@/lib/toss-payments";

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

  const payment = await prisma.paymentCompletion.findUnique({ where: { id } });
  if (!payment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (payment.status !== "COMPLETED") {
    return NextResponse.json(
      { error: `Cannot refund payment with status "${payment.status}"` },
      { status: 409 },
    );
  }

  // Toss 실취소가 DB 상태 변경보다 선행 — 취소 실패 시 DB를 건드리지 않아
  // "장부상 환불·실결제 유지" 불일치를 원천 차단한다. Toss 성공 후 DB 갱신이
  // 실패해도 웹훅 CANCELED 동기화가 상태를 수렴시킨다.
  if (payment.paymentKey) {
    try {
      await cancelTossPayment(payment.paymentKey, reason ?? "관리자 환불");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error(`[admin/refund] Toss cancel failed (payment=${id}):`, msg);
      return NextResponse.json(
        { error: "Toss 결제 취소에 실패했습니다. 결제 상태를 확인해 주세요." },
        { status: 502 },
      );
    }
  } else {
    // 레거시/수기 결제 등 paymentKey 미보유 건 — DB 상태만 전환하고 흔적을 남긴다.
    console.warn(`[admin/refund] No paymentKey on payment=${id}; DB-only refund`);
  }

  // Conditional update: only transition COMPLETED → REFUNDED atomically.
  const updated = await prisma.paymentCompletion.updateMany({
    where: { id, status: "COMPLETED" },
    data: { status: "REFUNDED" },
  });

  if (updated.count === 0) {
    // 동시 요청이 먼저 처리한 경우 — Toss 취소는 멱등이므로 상태만 보고한다.
    const current = await prisma.paymentCompletion.findUnique({
      where: { id },
      select: { status: true },
    });
    return NextResponse.json(
      { error: `Cannot refund payment with status "${current?.status ?? "UNKNOWN"}"` },
      { status: 409 },
    );
  }

  await stopServiceAfterRefund(payment);

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
