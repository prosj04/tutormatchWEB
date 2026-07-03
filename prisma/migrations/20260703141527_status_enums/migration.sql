-- Convert free-string role/status columns to Postgres enums.
-- Values are cast in place (col::text::"Enum") so existing rows are preserved.
-- Prisma's default plan for this diff was DROP COLUMN + ADD COLUMN, which
-- would wipe the data; this hand-written migration replaces it with safe
-- ALTER TABLE ... ALTER COLUMN ... TYPE ... USING statements.

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CHIEF_MANAGER', 'MANAGER', 'TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('WAITING', 'ASSIGNED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING_STUDENT_ACCEPT', 'ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- AlterTable User.role: String -> UserRole (in-place cast, preserves data & indexes)
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING ("role"::text::"UserRole");
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'STUDENT';

-- AlterTable ConsultationBooking.status: String -> ConsultationStatus
ALTER TABLE "ConsultationBooking" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ConsultationBooking" ALTER COLUMN "status" TYPE "ConsultationStatus" USING ("status"::text::"ConsultationStatus");
ALTER TABLE "ConsultationBooking" ALTER COLUMN "status" SET DEFAULT 'WAITING';

-- AlterTable Lesson.status: String -> LessonStatus
ALTER TABLE "Lesson" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Lesson" ALTER COLUMN "status" TYPE "LessonStatus" USING ("status"::text::"LessonStatus");
ALTER TABLE "Lesson" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';

-- AlterTable Subscription.status: String -> SubscriptionStatus
ALTER TABLE "Subscription" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Subscription" ALTER COLUMN "status" TYPE "SubscriptionStatus" USING ("status"::text::"SubscriptionStatus");
ALTER TABLE "Subscription" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable TeacherStudent.matchStatus: String -> MatchStatus
ALTER TABLE "TeacherStudent" ALTER COLUMN "matchStatus" DROP DEFAULT;
ALTER TABLE "TeacherStudent" ALTER COLUMN "matchStatus" TYPE "MatchStatus" USING ("matchStatus"::text::"MatchStatus");
ALTER TABLE "TeacherStudent" ALTER COLUMN "matchStatus" SET DEFAULT 'PENDING_STUDENT_ACCEPT';

-- AlterTable PaymentCompletion.status: String -> PaymentStatus
ALTER TABLE "PaymentCompletion" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "PaymentCompletion" ALTER COLUMN "status" TYPE "PaymentStatus" USING ("status"::text::"PaymentStatus");
ALTER TABLE "PaymentCompletion" ALTER COLUMN "status" SET DEFAULT 'PROCESSING';
