-- CreateTable
CREATE TABLE "ConsultationLead" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "subjects" TEXT NOT NULL DEFAULT '[]',
    "preferredTime" TEXT,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "source" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultationLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsultationLead_status_idx" ON "ConsultationLead"("status");

-- CreateIndex
CREATE INDEX "ConsultationLead_createdAt_idx" ON "ConsultationLead"("createdAt");
