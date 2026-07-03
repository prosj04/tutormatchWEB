-- DropIndex
DROP INDEX "ConsultationBooking_studentId_key";

-- CreateIndex
CREATE INDEX "ConsultationBooking_studentId_createdAt_idx" ON "ConsultationBooking"("studentId", "createdAt");
