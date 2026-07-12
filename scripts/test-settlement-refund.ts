/**
 * C-28 회귀 테스트: 정산 환불 제외 로직 (isRefundedLesson).
 *
 * REFUNDED 기간에 걸친 회차가 payout에서 제외되는지 경계 포함 검증.
 * 프레임워크 없음 — assert 기반 self-check. 실행:
 *   npx ts-node --transpile-only -O '{"module":"CommonJS","moduleResolution":"node"}' scripts/test-settlement-refund.ts
 *
 * 순수 predicate만 import하므로 DB 불필요.
 */
import assert from "node:assert/strict";

import { isRefundedLesson, type RefundedPeriod } from "../src/lib/settlement-refund";

const S = "student-1";
const OTHER = "student-2";

// 환불 기간: 2026-03-01 ~ 2026-04-01 (반열림), 학생 S
const closed: RefundedPeriod[] = [
  { studentId: S, start: new Date("2026-03-01T00:00:00Z"), end: new Date("2026-04-01T00:00:00Z") },
];
// 오픈엔드 환불(periodEnd null): 2026-03-01 이후 전부
const open: RefundedPeriod[] = [
  { studentId: S, start: new Date("2026-03-01T00:00:00Z"), end: null },
];

// 기간 안 회차 = 제외
assert.equal(isRefundedLesson(closed, S, new Date("2026-03-15T10:00:00Z")), true, "기간 내 회차는 환불 제외 대상");
// start 경계 포함 (>=)
assert.equal(isRefundedLesson(closed, S, new Date("2026-03-01T00:00:00Z")), true, "start 경계는 포함");
// end 경계 미포함 (< end)
assert.equal(isRefundedLesson(closed, S, new Date("2026-04-01T00:00:00Z")), false, "end 경계는 미포함(반열림)");
// 기간 전 회차 = 지급
assert.equal(isRefundedLesson(closed, S, new Date("2026-02-28T23:59:59Z")), false, "기간 전 회차는 정상 지급");
// 다른 학생 = 지급 (환불은 학생 단위)
assert.equal(isRefundedLesson(closed, OTHER, new Date("2026-03-15T10:00:00Z")), false, "다른 학생 회차는 영향 없음");
// 환불 기간 없음 = 지급
assert.equal(isRefundedLesson([], S, new Date("2026-03-15T10:00:00Z")), false, "환불 기록 없으면 전부 지급");
// 오픈엔드: start 이후 무한 제외
assert.equal(isRefundedLesson(open, S, new Date("2027-01-01T00:00:00Z")), true, "periodEnd null이면 start 이후 전부 제외");
assert.equal(isRefundedLesson(open, S, new Date("2026-02-01T00:00:00Z")), false, "오픈엔드도 start 이전은 지급");

console.log("PASS: settlement refund-exclusion regression (8 assertions)");
