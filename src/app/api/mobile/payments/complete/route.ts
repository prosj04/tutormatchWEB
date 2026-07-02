import { NextResponse } from "next/server";

import { requireMobileStudent } from "@/lib/mobile-auth";
import { completeStudentPayment } from "@/lib/student-payment";

type RequestBody = {
  orderId?: unknown;
  paymentKey?: unknown;
  amount?: unknown;
  plan?: unknown;
};

/** POST /api/mobile/payments/complete — 모바일 결제 완료 후 구독 활성화 + Chief 매니저 배정 */
export async function POST(request: Request) {
  const authResult = await requireMobileStudent(request);
  if ("error" in authResult) return authResult.error;
  const { student } = authResult;

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  try {
    const result = await completeStudentPayment({
      studentId: student.id,
      studentName: student.name,
      studentGrade: student.grade,
      orderId,
      paymentKey: typeof body.paymentKey === "string" ? body.paymentKey : null,
      amount: typeof body.amount === "number" ? body.amount : null,
      plan: typeof body.plan === "string" ? body.plan : null,
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
    throw e;
  }
}
