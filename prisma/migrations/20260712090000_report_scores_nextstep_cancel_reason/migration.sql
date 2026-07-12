-- 전부 nullable 추가 컬럼 — 무중단·데이터 무영향 (2026-07-12 백엔드 확장 4건)
ALTER TABLE "MonthlyReport" ADD COLUMN "overallScore" INTEGER;
ALTER TABLE "MonthlyReport" ADD COLUMN "prevScore" INTEGER;
ALTER TABLE "MonthlyReport" ADD COLUMN "subjectScores" TEXT;
ALTER TABLE "MonthlyReport" ADD COLUMN "teacherComment" TEXT;
ALTER TABLE "MonthlyReport" ADD COLUMN "managerComment" TEXT;
ALTER TABLE "ConsultationBooking" ADD COLUMN "nextStep" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "cancelReason" TEXT;
