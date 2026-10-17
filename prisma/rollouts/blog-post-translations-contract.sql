-- Contract step of the blog translations rollout (see odd/tasks/blog-translations.md
-- and docs/BlogContentLocales.md).
--
-- Idempotent; apply only to an explicitly approved database AFTER the
-- application code that no longer reads or writes these BlogPost columns is
-- deployed. Translation rows are then the only localized store.
--
-- Drops BlogPost localized columns (title, subtitle, tagline, content, blocks,
-- faq, seo, translations, slug) and the unique index on blog_posts.slug.
-- Keeps sourceLocale, coverUrl, taxonomy, review fields, and translationRows.
-- Extra leftover columns on a database that has not applied this file are
-- ignored by Prisma; creates fail while title remains NOT NULL — expected.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE "blog_posts" DROP CONSTRAINT IF EXISTS "blog_posts_slug_key";
DROP INDEX IF EXISTS "blog_posts_slug_key";

ALTER TABLE "blog_posts"
  DROP COLUMN IF EXISTS "title",
  DROP COLUMN IF EXISTS "subtitle",
  DROP COLUMN IF EXISTS "tagline",
  DROP COLUMN IF EXISTS "content",
  DROP COLUMN IF EXISTS "blocks",
  DROP COLUMN IF EXISTS "faq",
  DROP COLUMN IF EXISTS "seo",
  DROP COLUMN IF EXISTS "translations",
  DROP COLUMN IF EXISTS "slug";

COMMIT;
