-- CreateTable
CREATE TABLE "BillingProfile" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "customerKey" TEXT NOT NULL,
    "billingKey" TEXT NOT NULL,
    "cardCompany" TEXT,
    "cardNumberMasked" TEXT,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingProfile_studentId_key" ON "BillingProfile"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingProfile_customerKey_key" ON "BillingProfile"("customerKey");

-- AddForeignKey
ALTER TABLE "BillingProfile" ADD CONSTRAINT "BillingProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
