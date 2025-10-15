/*
  Warnings:

  - Added the required column `userId` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentStatus" ADD VALUE 'APPROVED';
ALTER TYPE "PaymentStatus" ADD VALUE 'PENDING_WAITING_PAYMENT';
ALTER TYPE "PaymentStatus" ADD VALUE 'PENDING_WAITING_CONFIRMATION';
ALTER TYPE "PaymentStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIALLY_REFUNDED';
ALTER TYPE "PaymentStatus" ADD VALUE 'CHARGEBACK';
ALTER TYPE "PaymentStatus" ADD VALUE 'IN_PROCESS';
ALTER TYPE "PaymentStatus" ADD VALUE 'IN_MEDIATION';
ALTER TYPE "PaymentStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "cardExpiryMonth" INTEGER,
ADD COLUMN     "cardExpiryYear" INTEGER,
ADD COLUMN     "cardholderName" TEXT,
ADD COLUMN     "chargebackAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "chargebackAt" TIMESTAMP(3),
ADD COLUMN     "exchangeRate" DOUBLE PRECISION,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "feeAmount" DOUBLE PRECISION,
ADD COLUMN     "mpDescription" TEXT,
ADD COLUMN     "mpExternalReference" TEXT,
ADD COLUMN     "mpMetadata" JSONB,
ADD COLUMN     "mpStatementDescriptor" TEXT,
ADD COLUMN     "netAmount" DOUBLE PRECISION,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "providerMerchantOrderId" TEXT,
ADD COLUMN     "refundedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "statusDetail" TEXT,
ADD COLUMN     "taxAmount" DOUBLE PRECISION,
ADD COLUMN     "userId" TEXT NOT NULL,
ADD COLUMN     "webhookData" JSONB,
ALTER COLUMN "currency" SET DEFAULT 'ARS';

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
