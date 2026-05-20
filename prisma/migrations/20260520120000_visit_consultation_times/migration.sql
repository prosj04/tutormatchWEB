-- AlterTable
ALTER TABLE "ConsultationBooking" ALTER COLUMN "preferredTimes" SET DEFAULT '[]';
ALTER TABLE "ConsultationBooking" ADD COLUMN IF NOT EXISTS "visitPreferredTimes" TEXT NOT NULL DEFAULT '{}';
