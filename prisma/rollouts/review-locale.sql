-- Additive rollout only; run against the explicitly approved target before
-- deploying/regenerating the application. Existing review content stays intact;
-- only the new "locale" column is added and backfilled from users.locale.
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
