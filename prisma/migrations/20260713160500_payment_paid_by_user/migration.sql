-- C-2 결제자 귀속: 결제를 실행한 세션 사용자(User.id)를 기록한다.
-- 시스템 자동결제(빌링키 자동갱신)·웹훅 복구 경로는 NULL. 추가 전용 컬럼 — 기존 행 영향 없음.
ALTER TABLE "PaymentCompletion" ADD COLUMN "paidByUserId" TEXT;
