import { prisma } from "@/lib/prisma";

/**
 * 환불 확정 후 서비스 중단 처리 공통부.
 * 갱신결제는 기존 구독을 닫고 새 ACTIVE 구독을 만들기 때문에 결제의 subscriptionId가
 * 지난 구독을 가리킬 수 있다 — 학생의 현재 ACTIVE 구독까지 전부 취소하고,
 * dunning 재청구를 막기 위해 자동결제를 끈다.
 */
export async function stopServiceAfterRefund(payment: {
  subscriptionId: string | null;
  studentId: string | null;
}) {
  if (payment.subscriptionId) {
    await prisma.subscription.updateMany({
      where: { id: payment.subscriptionId, status: { in: ["ACTIVE", "PAUSED", "PAST_DUE"] } },
      data: { status: "CANCELLED" },
    });
  }

  if (payment.studentId) {
    await prisma.subscription.updateMany({
      where: { studentId: payment.studentId, status: { in: ["ACTIVE", "PAUSED", "PAST_DUE"] } },
      data: { status: "CANCELLED" },
    });
    await prisma.billingProfile.updateMany({
      where: { studentId: payment.studentId },
      data: { autoRenew: false },
    });
  }
}
