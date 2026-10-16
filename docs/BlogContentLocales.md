# Publish authored blog translations

Spanish stays in the existing blog fields. English is optional and stored in
`blog_posts.translations.en`. Public English pages omit untranslated/incomplete
posts rather than falling back to Spanish. The editor language toggle is
independent of the dashboard language and opens in Spanish.

## Deploy safely

1. Obtain explicit approval for the target database. The configured database may
   be remote; neither `db:push` nor `db:migrate` is a dry run (both push schema).
2. Apply only `prisma/rollouts/blog-content-translations.sql` using an approved
   database connection. It adds one nullable JSONB column with a bounded lock
   wait. No content updates or backfill are required.
3. Generate the Prisma client and deploy the application after the column exists.
   This version selects the column: deploying first causes query failures, not a
   fallback to Spanish. Roll back application code without dropping the column.
4. In the blog editor, switch to English, author copy, then save. Check both
   public locales, list pagination, detail metadata, and review approval.

## Rollout: translation table

The symmetric `blog_post_translations` model (see
`odd/tasks/blog-translations.md`) rolls out in this order. Every database step
needs explicit approval of the target database; dev goes first.

1. Approve the target database.
2. Apply `prisma/rollouts/blog-post-translations.sql` (additive, idempotent).
3. `npm run db:backfill-blog-translations` — dry run (default): prints counts
   (posts, `es`/`en` rows planned vs existing, invalid `en` JSON, slug history,
   slug collisions, incomplete rows per locale) and writes nothing.
4. `npm run db:backfill-blog-translations -- --apply` — creates missing rows,
   one transaction per post. Re-runnable: existing rows and their slugs are
   never modified. Exits non-zero unless `es` rows equal posts.
5. `npm run db:backfill-blog-translations -- --diff-only` — compares legacy
   columns/JSON with stored rows field by field and prints drift. Run it again
   during the dual-write verification phase.
6. Deploy the code that reads the new tables (later slices).

English rows get the Spanish post's media blocks appended in order with their
Spanish captions, matching today's public English rendering; editors translate
those captions later.

## Content contract

| Concern               | Behavior                                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spanish               | Existing fields, HTML and unsupported legacy blocks are preserved on translation-only saves.                                                                                          |
| English drafts        | Incomplete copy saves; it does not block Spanish publication.                                                                                                                         |
| Readiness             | Write APIs derive `en.ready` from a title and usable article content. Empty editor paragraphs do not count. Client readiness flags are discarded.                                     |
| Visibility            | Existing publication/active/review-copy guards still apply. Queries filter the English readiness flag before limits, counts or interleaving; the resolver also validates the payload. |
| Missing optional copy | Subtitle, tagline, FAQ, SEO, quotes/citations and image captions never inherit Spanish text.                                                                                          |
| Shared data           | Slug, cover/gallery URLs, taxonomy, author and review workflow. No auto-translation.                                                                                                  |
| Editing               | Canonical raw GETs keep Spanish-only drafts discoverable. Content language is explicitly labeled. Rich-text editors remount per content language.                                     |
| Review                | English changes count as content edits. Published TRIPPER posts revert for review; RANDOMTRIP posts retain their existing direct-edit semantics. Approval copies both languages.      |
| PATCH                 | Omitted translations preserve data; `null` or `{ "en": null }` removes English. A supplied English object replaces its prior copy, including omitted optional fields.                 |

Translation HTML follows the existing trusted-author HTML handling; this feature
is not a general HTML sanitizer. Copy limits are validated at the write boundary.
Future direct database importers must use the same normalizer to derive readiness.
