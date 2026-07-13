import { NextResponse } from "next/server";

import { parentOwnsStudent, requireParent } from "@/lib/parent-page-auth";
import { prisma } from "@/lib/prisma";
import { planIdFromAmount } from "@/lib/pricing-plans";
import { completeStudentPayment } from "@/lib/student-payment";
import type { CashReceipt } from "@/lib/toss-payments";

/**
 * 학부모가 연결된 자녀 명의로 결제를 완료한다.
 * 학생용 /api/payments/complete와 동일한 로직이나, 세션 주체가 PARENT이고
 * studentId를 본문으로 받아 연결 검증 후 completeStudentPayment에 위임한다.
 */
export async function POST(request: Request) {
  const authResult = await requireParent();
  if ("error" in authResult) return authResult.error;
  const { parent, userId } = authResult;

  let body: {
    studentId?: unknown;
    orderId?: unknown;
    paymentKey?: unknown;
    amount?: unknown;
    cashReceipt?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
  if (!studentId) {
    return NextResponse.json({ error: "studentId required" }, { status: 400 });
  }

  const owns = await parentOwnsStudent(parent.id, studentId);
  if (!owns) {
    return NextResponse.json({ error: "연결된 자녀가 아닙니다." }, { status: 403 });
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, deletedAt: null },
    select: { id: true, name: true, grade: true },
  });
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  // paymentKey는 선택 — 학생 라우트와 대칭(D2-1). 이미 COMPLETED된 주문의 재시도/유실
  // 복구 시 paymentKey 없이도 멱등 반환되도록, 필수(400) 대신 optional로 둔다.
  const paymentKey = typeof body.paymentKey === "string" ? body.paymentKey.trim() : "";

  const amount = typeof body.amount === "number" ? body.amount : NaN;
  if (!Number.isFinite(amount)) {
    return NextResponse.json({ error: "amount required" }, { status: 400 });
  }

  // Derive plan from server-calculated price — never trust the client-supplied plan.
  const plan = planIdFromAmount(amount);
  if (!plan) {
    return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
  }

  // Parse optional cashReceipt
  let cashReceipt: CashReceipt = null;
  if (
    body.cashReceipt &&
    typeof body.cashReceipt === "object" &&
    "type" in body.cashReceipt &&
    "receiptUrl" in body.cashReceipt
  ) {
    const cr = body.cashReceipt as Record<string, unknown>;
    if (typeof cr.type === "string" && typeof cr.receiptUrl === "string") {
      cashReceipt = { type: cr.type, receiptUrl: cr.receiptUrl };
    }
  }

  try {
    const result = await completeStudentPayment({
      studentId: student.id,
      studentName: student.name,
      studentGrade: student.grade,
      orderId,
      paymentKey: paymentKey || null,
      amount,
      plan,
      cashReceipt,
      // 결제자 귀속(C-2): 학부모 명의 결제는 학부모 User.id.
      paidByUserId: userId,
    });

    return NextResponse.json({
      ok: true,
      assigned: true,
      plan: result.plan,
      subscription: {
        id: result.subscription.id,
        plan: result.subscription.plan,
        status: result.subscription.status,
        periodEnd: result.subscription.periodEnd?.toISOString() ?? null,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NO_DEFAULT_MANAGER" || msg === "NO_CHIEF_MANAGER") {
      return NextResponse.json(
        { error: "Chief 매니저가 설정되지 않았습니다." },
        { status: 503 },
      );
    }
    if (msg === "PAYMENT_PROCESSING" || msg === "PAYMENT_STATE_INCOMPLETE") {
      return NextResponse.json({ error: "Payment is still processing" }, { status: 409 });
    }
    if (msg.startsWith("TOSS_CONFIRM_FAILED:")) {
      return NextResponse.json({ error: "결제 승인에 실패했습니다." }, { status: 402 });
    }
    throw e;
  }
}
