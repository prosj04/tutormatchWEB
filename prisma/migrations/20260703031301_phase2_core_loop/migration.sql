/*
  Warnings:

  - You are about to drop the column `days` on the `HomeworkTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `HomeworkTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `HomeworkTemplate` table. All the data in the column will be lost.
  - Added the required column `title` to the `HomeworkTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "HomeworkTemplate" DROP CONSTRAINT "HomeworkTemplate_studentId_fkey";

-- DropIndex
DROP INDEX "HomeworkTemplate_studentId_idx";

-- DropIndex
DROP INDEX "HomeworkTemplate_teacherId_studentId_idx";

-- AlterTable
ALTER TABLE "ConsultationBooking" ADD COLUMN     "followUpSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "HomeworkTemplate" DROP COLUMN "days",
DROP COLUMN "name",
DROP COLUMN "studentId",
ADD COLUMN     "defaultDays" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subject" TEXT,
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "tasks" SET DEFAULT '[]';

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "cancelledBy" TEXT;

-- AlterTable
ALTER TABLE "PaymentCompletion" ADD COLUMN     "cashReceiptType" TEXT,
ADD COLUMN     "cashReceiptUrl" TEXT;

-- AlterTable
ALTER TABLE "StudyPlan" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'MANUAL';

-- CreateTable
CREATE TABLE "ConsultationReport" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "goals" TEXT NOT NULL DEFAULT '{}',
    "subjectLevels" TEXT,
    "recommendedPlan" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationReport_bookingId_key" ON "ConsultationReport"("bookingId");

-- CreateIndex
CREATE INDEX "ConsultationReport_bookingId_idx" ON "ConsultationReport"("bookingId");

-- CreateIndex
CREATE INDEX "HomeworkTemplate_isDefault_idx" ON "HomeworkTemplate"("isDefault");

-- AddForeignKey
ALTER TABLE "ConsultationReport" ADD CONSTRAINT "ConsultationReport_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ConsultationBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
