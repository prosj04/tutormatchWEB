/**
 * 수업 확인 제도 회귀 테스트: 이월 대체 수업 시각 계산 (computeMakeupAt).
 *
 * D+7 무응답 비과실 이월(오너 확정)과 선생님 확인(NOT_STUDENT) 경로가 공유하는
 * 순수 함수 검증. 프레임워크 없음 — assert 기반 self-check. 실행:
 *   npx ts-node --transpile-only -O '{"module":"CommonJS","moduleResolution":"node"}' scripts/test-lesson-carryover.ts
 *
 * 순수 함수만 import하므로 DB 불필요.
 */
import assert from "node:assert/strict";
import path from "node:path";

// lesson-confirm.ts가 "@/lib/*" 별칭을 쓰므로 런타임 별칭 등록(테스트 전용).
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("tsconfig-paths").register({
  baseUrl: path.join(__dirname, ".."),
  paths: { "@/*": ["src/*"] },
});

// 별칭 등록 이후에 로드해야 하므로 require 사용.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { computeMakeupAt } = require("../src/lib/lesson-confirm") as typeof import("../src/lib/lesson-confirm");

const now = new Date("2026-07-13T12:00:00");

// 기본: 기준점 + 7일, 원 수업의 시·분 유지
const original = new Date("2026-07-10T16:30:00");
const anchor = new Date("2026-07-12T10:00:00"); // 마지막 예정 수업
const makeup = computeMakeupAt(anchor, original, now);
assert.ok(makeup, "미래 시각이면 대체 수업 생성");
assert.equal(makeup.getDate(), 19, "기준점 + 7일");
assert.equal(makeup.getHours(), 16, "원 수업 시 유지");
assert.equal(makeup.getMinutes(), 30, "원 수업 분 유지");
assert.equal(makeup.getSeconds(), 0, "초는 0으로 정규화");

// 마지막 예정 수업이 없어 원 수업이 기준점인 경우 (구독 막바지 시나리오)
const selfAnchor = computeMakeupAt(original, original, now);
assert.ok(selfAnchor, "원 수업 + 7일이 미래면 생성");
assert.equal(selfAnchor.getDate(), 17, "원 수업 + 7일");

// 계산 시각이 이미 지났으면 null (자동 생성 불가 → 직접 예약/관리자 격상 경로)
const stale = new Date("2026-06-01T16:30:00");
assert.equal(
  computeMakeupAt(stale, stale, now),
  null,
  "지난 시각이면 null — 이월 불가 격상 대상",
);

// 경계: 정확히 now와 같으면 생성하지 않음 (> now)
const boundaryAnchor = new Date("2026-07-06T09:00:00");
const boundaryOriginal = new Date("2026-07-06T12:00:00");
assert.equal(
  computeMakeupAt(boundaryAnchor, boundaryOriginal, now),
  null,
  "makeupAt === now면 미생성",
);

console.log("PASS: lesson carry-over makeup scheduling (computeMakeupAt)");
