-- CreateTable
CREATE TABLE "HomeworkTemplate" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT,
    "name" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "tasks" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeworkTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomeworkTemplate_teacherId_idx" ON "HomeworkTemplate"("teacherId");

-- CreateIndex
CREATE INDEX "HomeworkTemplate_studentId_idx" ON "HomeworkTemplate"("studentId");

-- CreateIndex
CREATE INDEX "HomeworkTemplate_teacherId_studentId_idx" ON "HomeworkTemplate"("teacherId", "studentId");

-- AddForeignKey
ALTER TABLE "HomeworkTemplate" ADD CONSTRAINT "HomeworkTemplate_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeworkTemplate" ADD CONSTRAINT "HomeworkTemplate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
