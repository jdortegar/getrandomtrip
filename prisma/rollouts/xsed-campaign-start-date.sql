-- Additive rollout only. Apply to the explicitly approved shared database
-- before regenerating/deploying the application; do not use prisma db push.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '15s';
ALTER TABLE "public"."site_settings"
  ADD COLUMN IF NOT EXISTS "xsedCampaignStartDate"
  DATE NOT NULL DEFAULT DATE '2026-09-27';
COMMIT;
