-- Baseline tables that existed in the live Supabase schema but were missing
-- from the original Prisma migration history. All statements are idempotent so
-- this migration is safe for databases that already have these objects.

CREATE TABLE IF NOT EXISTS "TeacherStudent" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjects" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeacherStudent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StudyPlan" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "comment" TEXT,
    "commentAt" TIMESTAMP(3),
    "commentBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudyPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StudyTask" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "StudyTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Question" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "aiAnswer" TEXT,
    "teacherAnswer" TEXT,
    "teacherAnswerAt" TIMESTAMP(3),
    "answeredBy" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TeacherProfile" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "photoUrl" TEXT,
    "intro" TEXT,
    "career" TEXT,
    "education" TEXT,
    "certificates" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeacherProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ConsultationBooking" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "managerId" TEXT,
    "preferredTimes" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "note" TEXT,
    "managerNote" TEXT,
    "assignedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConsultationBooking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ManagerStudent" (
    "id" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ManagerStudent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TeacherStudent_teacherId_studentId_key" ON "TeacherStudent"("teacherId", "studentId");
CREATE INDEX IF NOT EXISTS "TeacherStudent_teacherId_idx" ON "TeacherStudent"("teacherId");
CREATE INDEX IF NOT EXISTS "TeacherStudent_studentId_idx" ON "TeacherStudent"("studentId");
CREATE INDEX IF NOT EXISTS "TeacherStudent_isActive_idx" ON "TeacherStudent"("isActive");

CREATE INDEX IF NOT EXISTS "StudyPlan_studentId_idx" ON "StudyPlan"("studentId");
CREATE INDEX IF NOT EXISTS "StudyPlan_date_idx" ON "StudyPlan"("date");
CREATE INDEX IF NOT EXISTS "StudyPlan_studentId_date_idx" ON "StudyPlan"("studentId", "date");

CREATE INDEX IF NOT EXISTS "Question_studentId_idx" ON "Question"("studentId");
CREATE INDEX IF NOT EXISTS "Question_studentId_date_idx" ON "Question"("studentId", "date");
CREATE INDEX IF NOT EXISTS "Question_isResolved_idx" ON "Question"("isResolved");
CREATE INDEX IF NOT EXISTS "Question_createdAt_idx" ON "Question"("createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "TeacherProfile_teacherId_key" ON "TeacherProfile"("teacherId");

CREATE UNIQUE INDEX IF NOT EXISTS "ConsultationBooking_studentId_key" ON "ConsultationBooking"("studentId");
CREATE INDEX IF NOT EXISTS "ConsultationBooking_managerId_idx" ON "ConsultationBooking"("managerId");
CREATE INDEX IF NOT EXISTS "ConsultationBooking_status_idx" ON "ConsultationBooking"("status");
CREATE INDEX IF NOT EXISTS "ConsultationBooking_managerId_status_idx" ON "ConsultationBooking"("managerId", "status");
CREATE INDEX IF NOT EXISTS "ConsultationBooking_status_createdAt_idx" ON "ConsultationBooking"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

CREATE UNIQUE INDEX IF NOT EXISTS "ManagerStudent_managerId_studentId_key" ON "ManagerStudent"("managerId", "studentId");
CREATE INDEX IF NOT EXISTS "ManagerStudent_managerId_idx" ON "ManagerStudent"("managerId");
CREATE INDEX IF NOT EXISTS "ManagerStudent_studentId_idx" ON "ManagerStudent"("studentId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherStudent_teacherId_fkey') THEN
    ALTER TABLE "TeacherStudent" ADD CONSTRAINT "TeacherStudent_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherStudent_studentId_fkey') THEN
    ALTER TABLE "TeacherStudent" ADD CONSTRAINT "TeacherStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudyPlan_studentId_fkey') THEN
    ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudyTask_planId_fkey') THEN
    ALTER TABLE "StudyTask" ADD CONSTRAINT "StudyTask_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StudyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Question_studentId_fkey') THEN
    ALTER TABLE "Question" ADD CONSTRAINT "Question_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherProfile_teacherId_fkey') THEN
    ALTER TABLE "TeacherProfile" ADD CONSTRAINT "TeacherProfile_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ConsultationBooking_studentId_fkey') THEN
    ALTER TABLE "ConsultationBooking" ADD CONSTRAINT "ConsultationBooking_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ConsultationBooking_managerId_fkey') THEN
    ALTER TABLE "ConsultationBooking" ADD CONSTRAINT "ConsultationBooking_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_userId_fkey') THEN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ManagerStudent_managerId_fkey') THEN
    ALTER TABLE "ManagerStudent" ADD CONSTRAINT "ManagerStudent_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ManagerStudent_studentId_fkey') THEN
    ALTER TABLE "ManagerStudent" ADD CONSTRAINT "ManagerStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
