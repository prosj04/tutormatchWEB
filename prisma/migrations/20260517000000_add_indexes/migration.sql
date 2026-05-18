-- AddIndex Teacher.approved
CREATE INDEX IF NOT EXISTS "Teacher_approved_idx" ON "Teacher"("approved");

-- AddIndex ConsultationBooking.(status, createdAt)
CREATE INDEX IF NOT EXISTS "ConsultationBooking_status_createdAt_idx" ON "ConsultationBooking"("status", "createdAt");

-- AddIndex Notification.(userId, isRead)
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
