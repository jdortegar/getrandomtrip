-- Top-up reminder idempotency stamp. Additive only: nullable column.
-- AlterTable
ALTER TABLE "payment_shares" ADD COLUMN     "reminderSentAt" TIMESTAMP(3);

