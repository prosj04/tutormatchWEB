/**
 * 정산 환불 제외 판정 (순수 함수, 의존성 없음).
 *
 * settlement.ts(admin)와 teacher/settlements route가 공유한다 — 환불 제외 경계를
 * 한 곳에 둔다. prisma를 import하지 않으므로 DB 없이 테스트 가능.
 * 회귀 테스트: scripts/test-settlement-refund.ts
 */
export type RefundedPeriod = { studentId: string; start: Date; end: Date | null };

/**
 * `studentId`의 `startAt` 회차가 REFUNDED 구독 기간 안에 들면 payout에서 제외.
 * 끝은 반열림(`< end`), `end === null`이면 오픈엔드(`start` 이후 전부).
 */
export function isRefundedLesson(
  refundedPeriods: RefundedPeriod[],
  studentId: string,
  startAt: Date,
): boolean {
  return refundedPeriods.some(
    (p) =>
      p.studentId === studentId &&
      startAt >= p.start &&
      (p.end === null || startAt < p.end),
  );
}
