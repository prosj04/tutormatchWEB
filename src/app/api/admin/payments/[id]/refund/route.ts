import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

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

  // Fetch the updated payment to get subscriptionId
  const payment = await prisma.paymentCompletion.findUnique({ where: { id } });

  // Cancel related active subscription if present
  if (payment?.subscriptionId) {
    await prisma.subscription.updateMany({
      where: { id: payment.subscriptionId, status: "ACTIVE" },
      data: { status: "CANCELLED" },
    });
  }

  if (reason) {
    console.log(`[admin/refund] payment=${id} reason="${reason}"`);
  }

  return NextResponse.json({
    ok: true,
    paymentId: id,
    reason: reason ?? null,
  });
}
