ALTER TABLE "social_approvals" ADD COLUMN "translationMode" TEXT NOT NULL DEFAULT 'full';
ALTER TABLE "social_revision_jobs" ADD COLUMN "translationMode" TEXT NOT NULL DEFAULT 'full';
ALTER TABLE "social_approvals" ADD CONSTRAINT "social_approvals_translation_mode_check" CHECK ("translationMode" IN ('full', 'caption'));
ALTER TABLE "social_revision_jobs" ADD CONSTRAINT "social_revision_jobs_translation_mode_check" CHECK ("translationMode" IN ('full', 'caption'));
