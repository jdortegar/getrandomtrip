-- Additive, isolated rollout. Apply only to the explicitly approved database
-- BEFORE deploying code that enqueues sales. No historical backfill.
BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE TABLE "sale_notification_deliveries" (
  "paymentId" TEXT NOT NULL PRIMARY KEY,
  "stripePaymentIntentId" TEXT NOT NULL,
  "tripRequestId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "leaseToken" TEXT,
  "sentAt" TIMESTAMP(3),
  "lastError" TEXT
);
CREATE UNIQUE INDEX "sale_notification_deliveries_stripePaymentIntentId_key"
  ON "sale_notification_deliveries" ("stripePaymentIntentId");
CREATE INDEX "sale_notification_deliveries_sentAt_nextAttemptAt_idx"
  ON "sale_notification_deliveries" ("sentAt", "nextAttemptAt");
COMMIT;
