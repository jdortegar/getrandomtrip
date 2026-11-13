-- Split payments: INDIVIDUAL trips charge one PaymentShare per payer against the single Payment.
-- Additive only: existing trips default to paymentMode TOTAL and keep their one Payment row.
-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('TOTAL', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "PaymentShareKind" AS ENUM ('SHARE', 'TOP_UP', 'ORGANIZER_REMAINDER');

-- AlterEnum
ALTER TYPE "TripRequestStatus" ADD VALUE 'COLLECTING';

-- AlterTable
ALTER TABLE "trip_requests" ADD COLUMN     "paymentDeadline" TIMESTAMP(3),
ADD COLUMN     "paymentMode" "PaymentMode" NOT NULL DEFAULT 'TOTAL',
ADD COLUMN     "topUpDeadline" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "payment_shares" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "travelerId" TEXT,
    "userId" TEXT,
    "kind" "PaymentShareKind" NOT NULL DEFAULT 'SHARE',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripePaymentIntentId" TEXT,
    "failureReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_shares_stripePaymentIntentId_key" ON "payment_shares"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "payment_shares_paymentId_idx" ON "payment_shares"("paymentId");

-- CreateIndex
CREATE INDEX "payment_shares_travelerId_idx" ON "payment_shares"("travelerId");

-- CreateIndex
CREATE INDEX "payment_shares_status_idx" ON "payment_shares"("status");

-- AddForeignKey
ALTER TABLE "payment_shares" ADD CONSTRAINT "payment_shares_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_shares" ADD CONSTRAINT "payment_shares_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "trip_travelers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_shares" ADD CONSTRAINT "payment_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

