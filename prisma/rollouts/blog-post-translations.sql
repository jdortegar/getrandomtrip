-- Expand step of the blog translations rollout (see odd/tasks/blog-translations.md).
-- Additive and idempotent (safe to re-run); apply only to the explicitly
-- approved database BEFORE deploying code that reads or writes these tables.
--
-- Adds BlogPost."sourceLocale" plus a symmetric per-locale translation table
-- and a slug history table for 301s. Nothing is copied here: the backfill
-- script (dry-run / diff-only first) populates rows afterwards, and a later,
-- separate contract rollout drops the legacy Spanish columns and the
-- "translations" JSONB once dual-write is removed.
--
-- Locale CHECK constraints mirror CONTENT_LOCALES (src/lib/blog/locales.ts);
-- Prisma cannot express them, so they live only here.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE "blog_posts"
  ADD COLUMN IF NOT EXISTS "sourceLocale" TEXT NOT NULL DEFAULT 'es';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'blog_posts_sourceLocale_check'
      AND conrelid = '"blog_posts"'::regclass
  ) THEN
    ALTER TABLE "blog_posts"
      ADD CONSTRAINT "blog_posts_sourceLocale_check"
      CHECK ("sourceLocale" IN ('es', 'en'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "blog_post_translations" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "tagline" TEXT,
  "content" TEXT,
  "blocks" JSONB,
  "faq" JSONB,
  "seo" JSONB,
  "slug" TEXT,
  "isComplete" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "blog_post_translations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "blog_post_translations_postId_fkey" FOREIGN KEY ("postId")
    REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "blog_post_translations_locale_check"
    CHECK ("locale" IN ('es', 'en'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "blog_post_translations_postId_locale_key"
  ON "blog_post_translations" ("postId", "locale");
-- NULL slugs (review copies) never collide in a plain unique index.
CREATE UNIQUE INDEX IF NOT EXISTS "blog_post_translations_locale_slug_key"
  ON "blog_post_translations" ("locale", "slug");
CREATE INDEX IF NOT EXISTS "blog_post_translations_locale_isComplete_idx"
  ON "blog_post_translations" ("locale", "isComplete");

CREATE TABLE IF NOT EXISTS "blog_post_slug_history" (
  "id" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "translationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "blog_post_slug_history_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "blog_post_slug_history_translationId_fkey" FOREIGN KEY ("translationId")
    REFERENCES "blog_post_translations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "blog_post_slug_history_locale_check"
    CHECK ("locale" IN ('es', 'en'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "blog_post_slug_history_locale_slug_key"
  ON "blog_post_slug_history" ("locale", "slug");
CREATE INDEX IF NOT EXISTS "blog_post_slug_history_translationId_idx"
  ON "blog_post_slug_history" ("translationId");

COMMIT;
