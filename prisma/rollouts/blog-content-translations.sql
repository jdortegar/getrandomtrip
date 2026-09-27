-- Additive rollout only; run against the explicitly approved target before
-- deploying/regenerating the application. Existing Spanish rows stay intact.
BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "translations" JSONB;
COMMIT;
