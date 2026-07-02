-- AlterTable
ALTER TABLE "TeacherStudent"
  ADD COLUMN "matchStatus" TEXT NOT NULL DEFAULT 'PENDING_STUDENT_ACCEPT',
  ADD COLUMN "respondedAt" TIMESTAMP(3);

-- Backfill: keep matchStatus in sync with existing isActive values.
UPDATE "TeacherStudent" SET "matchStatus" = 'ACTIVE' WHERE "isActive" = true;
UPDATE "TeacherStudent" SET "matchStatus" = 'PENDING_STUDENT_ACCEPT' WHERE "isActive" = false;

-- CreateIndex
CREATE INDEX "TeacherStudent_matchStatus_idx" ON "TeacherStudent"("matchStatus");

-- CreateIndex
CREATE INDEX "TeacherStudent_studentId_matchStatus_idx" ON "TeacherStudent"("studentId", "matchStatus");
