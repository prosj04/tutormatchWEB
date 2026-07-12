-- 수업 확인 제도 — 전부 nullable 추가 컬럼 (무중단·데이터 무영향, 2026-07-13)
ALTER TABLE "Lesson" ADD COLUMN "confirmedAt" TIMESTAMP(3);
ALTER TABLE "Lesson" ADD COLUMN "notHeldReason" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "notHeldFault" TEXT;
