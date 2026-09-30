-- Additive only. Apply through the approved deployment database workflow before code rollout.
-- Do not backfill acceptedAt from the legacy fire-and-forget notification stamp.
BEGIN;
SET LOCAL lock_timeout = '5s';

CREATE TABLE "destination_assignment_deliveries" (
  "id" TEXT NOT NULL,
  "tripRequestId" TEXT NOT NULL,
  "revealAt" TIMESTAMP(3) NOT NULL,
  "milestoneHours" INTEGER NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "fromAddress" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "html" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leaseToken" TEXT,
  "acceptedAt" TIMESTAMP(3),
  "providerMessageId" TEXT,
  CONSTRAINT "destination_assignment_deliveries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "destination_assignment_deliveries_tripRequestId_fkey"
    FOREIGN KEY ("tripRequestId") REFERENCES "trip_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "destination_assignment_delivery_identity"
  ON "destination_assignment_deliveries"("tripRequestId", "revealAt", "milestoneHours", "recipientEmail");
CREATE INDEX "destination_assignment_deliveries_acceptedAt_nextAttemptAt_idx"
  ON "destination_assignment_deliveries"("acceptedAt", "nextAttemptAt");

-- Keep dismissal state independent from the user-deletable notifications table.
CREATE TABLE "destination_assignment_notices" (
  "id" TEXT NOT NULL,
  "tripRequestId" TEXT NOT NULL,
  "revealAt" TIMESTAMP(3) NOT NULL,
  "milestoneHours" INTEGER NOT NULL,
  "adminUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "destination_assignment_notices_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "destination_assignment_notices_tripRequestId_fkey"
    FOREIGN KEY ("tripRequestId") REFERENCES "trip_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "destination_assignment_notice_identity"
  ON "destination_assignment_notices"("tripRequestId", "revealAt", "milestoneHours", "adminUserId");

COMMIT;
