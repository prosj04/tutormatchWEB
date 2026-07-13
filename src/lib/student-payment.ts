import { assignChiefManagerToStudent } from "@/lib/student-enrollment";
import { prisma } from "@/lib/prisma";
import { allKnownPlanIds } from "@/lib/pricing-plans";
import { confirmTossPayment, type CashReceipt } from "@/lib/toss-payments";

type CompleteStudentPaymentParams = {
  studentId: string;
  studentName: string;
  studentGrade: string;
  orderId: string;
  paymentKey?: string | null;
  amount?: number | null;
  plan?: string | null;
  cashReceipt?: CashReceipt;
  /** 결제자 귀속(C-2): 결제를 실행한 세션 User.id. 웹훅·자동결제 등 세션 없는 경로는 생략. */
  paidByUserId?: string | null;
};

/** v2 기본 플랜(고등 · 주2회 · 회당 2시간) — 유효성 실패 시 폴백. */
const DEFAULT_PAYMENT_PLAN = "high-w2h2";

const KNOWN_PLAN_IDS: Set<string> = new Set(allKnownPlanIds());

function normalizePlan(plan: string | null | undefined) {
  const candidate = typeof plan === "string" && plan.trim() ? plan.trim() : DEFAULT_PAYMENT_PLAN;
  // v2 신규 id + legacy(4-1/8-1/4-2/8-2) 모두 허용. planIdFromAmount가 서버 신뢰의 원천.
  return KNOWN_PLAN_IDS.has(candidate) ? candidate : DEFAULT_PAYMENT_PLAN;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

async function fetchCurrentCompletionState(studentId: string) {
  const [subscription, booking] = await Promise.all([
    prisma.subscription.findFirst({
      where: { studentId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.consultationBooking.findFirst({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      include: { manager: { select: { id: true, name: true, userId: true } } },
    }),
  ]);

  if (!subscription || !booking) {
    throw new Error("PAYMENT_STATE_INCOMPLETE");
  }

  return {
    subscription,
    booking,
    manager: booking.manager,
  };
}

/**
 * 결제 완료 공통 처리.
 * - Toss 서버 confirm 후 ACTIVE 구독을 생성/갱신한다.
 * - 결제 학생을 Chief 매니저에게 즉시 배정한다.
 * - orderId 기준 멱등성을 보장한다 (COMPLETED 재호출 무해, FAILED 재시도 가능).
 *
 * 호출 라우트에서 paymentKey·amount·plan 유효성을 검증하고 전달해야 한다.
 */
export async function completeStudentPayment({
  studentId,
  studentName,
  studentGrade,
  orderId,
  paymentKey,
  amount,
  plan,
  cashReceipt,
  paidByUserId,
}: CompleteStudentPaymentParams) {
  const normalizedPlan = normalizePlan(plan);
  const now = new Date();
  const periodEnd = addMonths(now, 1);

  const existingCompletion = await prisma.paymentCompletion.findUnique({
    where: { orderId },
  });

  // Already finished — idempotent return without re-confirming Toss.
  if (existingCompletion?.status === "COMPLETED") {
    const state = await fetchCurrentCompletionState(existingCompletion.studentId);
    return { ...state, plan: existingCompletion.plan };
  }

  // Refunded payments must never be re-completed.
  if (existingCompletion?.status === "REFUNDED") {
    throw new Error("PAYMENT_REFUNDED");
  }

  // Another request is currently processing this orderId.
  if (existingCompletion?.status === "PROCESSING") {
    try {
      const state = await fetchCurrentCompletionState(existingCompletion.studentId);
      return { ...state, plan: existingCompletion.plan };
    } catch {
      throw new Error("PAYMENT_PROCESSING");
    }
  }

  // FAILED or null — confirm with Toss before transitioning to PROCESSING.
  // Toss treats a previously-captured FAILED-retry as ALREADY_PROCESSED_PAYMENT (allowed).
  const safeAmount =
    typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  await confirmTossPayment(paymentKey ?? "", orderId, safeAmount);

  const safeStoredAmount =
    typeof amount === "number" && Number.isFinite(amount) ? amount : null;

  let shouldResetOnFailure = false;
  try {
    if (existingCompletion?.status === "FAILED") {
      // Reset FAILED → PROCESSING so the retry can proceed.
      await prisma.paymentCompletion.update({
        where: { orderId },
        data: {
          status: "PROCESSING",
          plan: normalizedPlan,
          paymentKey: paymentKey ?? null,
          amount: safeStoredAmount,
          cashReceiptType: cashReceipt?.type ?? null,
          cashReceiptUrl: cashReceipt?.receiptUrl ?? null,
          // 미제공(웹훅 재시도 등)이면 기존 귀속을 보존한다.
          paidByUserId: paidByUserId ?? undefined,
        },
      });
    } else {
      await prisma.paymentCompletion.create({
        data: {
          orderId,
          studentId,
          plan: normalizedPlan,
          status: "PROCESSING",
          paymentKey: paymentKey ?? null,
          amount: safeStoredAmount,
          cashReceiptType: cashReceipt?.type ?? null,
          cashReceiptUrl: cashReceipt?.receiptUrl ?? null,
          paidByUserId: paidByUserId ?? null,
        },
      });
    }
    shouldResetOnFailure = true;

    const { booking, manager } = await assignChiefManagerToStudent({
      studentId,
      studentName,
      studentGrade,
    });

    const existingSubscription = await prisma.subscription.findFirst({
      where: { studentId, status: { in: ["ACTIVE", "PAUSED"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    const subscription = existingSubscription
      ? await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            plan: normalizedPlan,
            status: "ACTIVE",
            periodStart: now,
            periodEnd,
          },
        })
      : await prisma.subscription.create({
          data: {
            studentId,
            plan: normalizedPlan,
            status: "ACTIVE",
            periodStart: now,
            periodEnd,
          },
        });

    await prisma.paymentCompletion.update({
      where: { orderId },
      data: {
        status: "COMPLETED",
        paymentKey: paymentKey ?? null,
        amount: safeStoredAmount,
        cashReceiptType: cashReceipt?.type ?? null,
        cashReceiptUrl: cashReceipt?.receiptUrl ?? null,
        paidByUserId: paidByUserId ?? undefined,
        subscriptionId: subscription.id,
        bookingId: booking.id,
        completedAt: new Date(),
      },
    });

    return { subscription, booking, manager, plan: normalizedPlan };
  } catch (error) {
    if (shouldResetOnFailure) {
      await prisma.paymentCompletion
        .update({ where: { orderId }, data: { status: "FAILED" } })
        .catch(() => undefined);
    }
    throw error;
  }
}
