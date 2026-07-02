import { assignChiefManagerToStudent } from "@/lib/student-enrollment";
import { prisma } from "@/lib/prisma";
import { PRICING_PLANS } from "@/lib/pricing-plans";

type CompleteStudentPaymentParams = {
  studentId: string;
  studentName: string;
  studentGrade: string;
  orderId: string;
  paymentKey?: string | null;
  amount?: number | null;
  plan?: string | null;
};

const DEFAULT_PAYMENT_PLAN = "8-1";

function normalizePlan(plan: string | null | undefined) {
  const candidate = typeof plan === "string" && plan.trim() ? plan.trim() : DEFAULT_PAYMENT_PLAN;
  return PRICING_PLANS.some((p) => p.id === candidate) ? candidate : DEFAULT_PAYMENT_PLAN;
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
 * - ACTIVE 구독을 생성/갱신한다.
 * - 결제 학생을 Chief 매니저에게 즉시 배정한다.
 * - orderId 기준 멱등성을 보장한다.
 *
 * 실제 PG 검증은 호출 라우트에서 수행할 수 있도록 분리하고, 이 함수는
 * 결제 완료 이후 학생 상태 전환을 idempotent하게 담당한다.
 */
export async function completeStudentPayment({
  studentId,
  studentName,
  studentGrade,
  orderId,
  paymentKey,
  amount,
  plan,
}: CompleteStudentPaymentParams) {
  const normalizedPlan = normalizePlan(plan);
  const now = new Date();
  const periodEnd = addMonths(now, 1);

  const existingCompletion = await prisma.paymentCompletion.findUnique({
    where: { orderId },
  });

  if (existingCompletion?.status === "COMPLETED") {
    const state = await fetchCurrentCompletionState(existingCompletion.studentId);
    return { ...state, plan: existingCompletion.plan };
  }

  if (existingCompletion?.status === "PROCESSING") {
    try {
      const state = await fetchCurrentCompletionState(existingCompletion.studentId);
      return { ...state, plan: existingCompletion.plan };
    } catch {
      throw new Error("PAYMENT_PROCESSING");
    }
  }

  let completionCreated = false;
  try {
    await prisma.paymentCompletion.create({
      data: {
        orderId,
        studentId,
        plan: normalizedPlan,
        status: "PROCESSING",
        paymentKey: paymentKey ?? null,
        amount: typeof amount === "number" && Number.isFinite(amount) ? amount : null,
      },
    });
    completionCreated = true;

    const { booking, manager } = await assignChiefManagerToStudent({
      studentId,
      studentName,
      studentGrade,
    });

    const existingSubscription = await prisma.subscription.findFirst({
      where: { studentId, status: "ACTIVE" },
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
        amount: typeof amount === "number" && Number.isFinite(amount) ? amount : null,
        subscriptionId: subscription.id,
        bookingId: booking.id,
        completedAt: new Date(),
      },
    });

    return { subscription, booking, manager, plan: normalizedPlan };
  } catch (error) {
    if (completionCreated) {
      await prisma.paymentCompletion.update({
        where: { orderId },
        data: { status: "FAILED" },
      }).catch(() => undefined);
    }
    throw error;
  }
}
