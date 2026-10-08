-- Additive only. Apply through the approved deployment database workflow before code rollout.
-- reviews.locale is the language the review was written in ("es" | "en"), fixed at submission.
-- Existing rows are backfilled from the author's users.locale (last-browsed UI language),
-- which is the best available signal; rows whose author has no valid locale keep 'es'.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "locale" TEXT NOT NULL DEFAULT 'es';

-- Backfill from the author's preferred UI locale; anything else stays 'es'.
UPDATE "reviews" AS r
SET "locale" = u."locale"
FROM "users" AS u
WHERE r."userId" = u."id"
  AND u."locale" IN ('es', 'en');

CREATE INDEX IF NOT EXISTS "reviews_isApproved_isPublic_locale_idx"
  ON "reviews"("isApproved", "isPublic", "locale");

COMMIT;
