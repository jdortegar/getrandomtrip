-- Additive only. Apply through the approved deployment database workflow before code rollout.
-- Columns are nullable: legacy rows keep departureTimeZone NULL (read as America/Argentina/Buenos_Aires)
-- until scripts/backfill-departure-time-zone.ts is approved and applied.
--
-- revealNotifiedAt means "the provider accepted the reveal email". It is stamped here ONLY for trips
-- that have already departed (startDate more than 1 day in the past, so no zone can still be pre-departure),
-- because the reveal cron retries every REVEALED trip with a NULL stamp until departure. Upcoming REVEALED
-- trips stay NULL on purpose so they are (re)sent. If a still-upcoming trip was already notified by hand,
-- the operator stamps it explicitly after this migration, e.g.:
--   UPDATE "trip_requests" SET "revealNotifiedAt" = NOW() WHERE "id" = '<trip id>';
-- (and the matching "trip_travelers" rows by "tripRequestId" for companions emailed manually).
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE "trip_requests"
  ADD COLUMN "departureTimeZone" TEXT,
  ADD COLUMN "revealNotifiedAt" TIMESTAMP(3);

ALTER TABLE "trip_travelers"
  ADD COLUMN "revealNotifiedAt" TIMESTAMP(3);

UPDATE "trip_requests"
SET "revealNotifiedAt" = "destinationRevealedAt"
WHERE "destinationRevealedAt" IS NOT NULL
  AND "startDate" IS NOT NULL
  AND "startDate" < NOW() - INTERVAL '1 day';

UPDATE "trip_travelers" AS t
SET "revealNotifiedAt" = r."revealNotifiedAt"
FROM "trip_requests" AS r
WHERE t."tripRequestId" = r."id"
  AND r."revealNotifiedAt" IS NOT NULL;

COMMIT;
