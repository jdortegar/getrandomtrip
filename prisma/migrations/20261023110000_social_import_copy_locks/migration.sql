ALTER TABLE "social_sources" ADD COLUMN "accountUsername" TEXT NOT NULL DEFAULT 'getrandomtrip.es';
ALTER TABLE "social_sources" ADD COLUMN "copyLocks" JSONB;
ALTER TABLE "social_approvals" ADD COLUMN "copyLocks" JSONB;
