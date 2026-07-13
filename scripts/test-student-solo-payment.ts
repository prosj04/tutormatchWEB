/**
 * C-2 회귀 테스트: 학생 단독 결제 경로 무변경 가드 (shouldPromptParentPayment).
 *
 * 재심-8 조건 — 학부모 미연결 가정은 학부모 결제 안내가 절대 노출되지 않고
 * 기존 학생 단독 결제 경로가 그대로 동작해야 한다.
 * 프레임워크 없음 — assert 기반 self-check. 실행:
 *   npx ts-node --transpile-only -O '{"module":"CommonJS","moduleResolution":"node"}' scripts/test-student-solo-payment.ts
 *
 * 순수 predicate만 import하므로 DB 불필요.
 */
import assert from "node:assert/strict";

import { shouldPromptParentPayment } from "../src/lib/payment-payer";

// 핵심 불변식: 미연결 학생 = false — 기존 경로 완전 무변경
assert.equal(shouldPromptParentPayment("STUDENT", false), false, "미연결 학생은 학부모 안내 없음(기존 경로 무변경)");
// 연결 학생 = true — 학부모 결제 기본 안내
assert.equal(shouldPromptParentPayment("STUDENT", true), true, "연결 학생은 학부모 결제 기본 안내");
// 학부모 세션은 자체 자녀 선택 동선 — 이 가드 대상 아님
assert.equal(shouldPromptParentPayment("PARENT", true), false, "학부모 세션은 대상 아님");
// 비로그인·기타 역할 = false (연결 여부 무관)
assert.equal(shouldPromptParentPayment(undefined, true), false, "비로그인은 대상 아님");
assert.equal(shouldPromptParentPayment(null, false), false, "role null은 대상 아님");
assert.equal(shouldPromptParentPayment("TEACHER", true), false, "다른 역할은 대상 아님");

console.log("PASS: student solo payment path guard regression (6 assertions)");
