-- AlterTable
ALTER TABLE "ConsultationBooking" ADD COLUMN     "visitConfirmedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "pausedUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ManagerCareLog" (
    "id" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "visibleToStudent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManagerCareLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SatisfactionCheckin" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "trigger" TEXT NOT NULL DEFAULT 'FIRST_LESSON_D7',
    "score" INTEGER,
    "comment" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "SatisfactionCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ManagerCareLog_studentId_idx" ON "ManagerCareLog"("studentId");

-- CreateIndex
CREATE INDEX "ManagerCareLog_managerId_idx" ON "ManagerCareLog"("managerId");

-- CreateIndex
CREATE INDEX "SatisfactionCheckin_studentId_idx" ON "SatisfactionCheckin"("studentId");

-- AddForeignKey
ALTER TABLE "ManagerCareLog" ADD CONSTRAINT "ManagerCareLog_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerCareLog" ADD CONSTRAINT "ManagerCareLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SatisfactionCheckin" ADD CONSTRAINT "SatisfactionCheckin_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
