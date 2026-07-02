-- CreateTable
CREATE TABLE "PaymentCompletion" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "paymentKey" TEXT,
    "amount" INTEGER,
    "subscriptionId" TEXT,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentCompletion_orderId_key" ON "PaymentCompletion"("orderId");

-- CreateIndex
CREATE INDEX "PaymentCompletion_studentId_idx" ON "PaymentCompletion"("studentId");

-- CreateIndex
CREATE INDEX "PaymentCompletion_studentId_status_idx" ON "PaymentCompletion"("studentId", "status");

-- AddForeignKey
ALTER TABLE "PaymentCompletion" ADD CONSTRAINT "PaymentCompletion_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
