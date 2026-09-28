-- Additive only. Apply through the deployment database workflow before shipping code.
ALTER TABLE "trip_requests"
  ADD COLUMN "travelerDetailsReminderSentAt" TIMESTAMP(3),
  ADD COLUMN "travelerDetailsReminderClaimedAt" TIMESTAMP(3);
