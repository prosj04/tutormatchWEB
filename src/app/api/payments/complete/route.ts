import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { planIdFromAmount } from "@/lib/pricing-plans";
import { completeStudentPayment } from "@/lib/student-payment";

/** 요금제 결제 완료 후 로그인 학생에게 Chief 매니저 즉시 배정 + 구독 활성화 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Student login required" }, { status: 401 });
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true, grade: true },
  });
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  let body: { orderId?: unknown; paymentKey?: unknown; amount?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const paymentKey = typeof body.paymentKey === "string" ? body.paymentKey.trim() : "";
  if (!paymentKey) {
    return NextResponse.json({ error: "paymentKey required" }, { status: 400 });
  }

  const amount = typeof body.amount === "number" ? body.amount : NaN;
  if (!Number.isFinite(amount)) {
    return NextResponse.json({ error: "amount required" }, { status: 400 });
  }

  // Derive plan from server-calculated price — never trust the client-supplied plan.
  const plan = planIdFromAmount(amount);
  if (!plan) {
    return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
  }

  try {
    const result = await completeStudentPayment({
      studentId: student.id,
      studentName: student.name,
      studentGrade: student.grade,
      orderId,
      paymentKey,
      amount,
      plan,
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
