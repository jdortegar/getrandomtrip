# Blog translations as a symmetric table

## Objective

Replace `BlogPost`'s Spanish-in-columns + optional `translations.en` JSON with a symmetric `BlogPostTranslation` table: every locale (including the source) is a row, the post records an explicit `sourceLocale`, and each translation has its own slug and server-computed completeness.

## Problem / why

The current model infers language from data (`hasDistinctSpanishCopy`), stores the two languages asymmetrically (columns vs JSON, every field defined twice), shares one slug across languages, drops captions/embeds in English, and does not scale to a third locale. The user asked for a robust, senior-grade design.

## Decisions (grill-me, 2026-10-16)

1. `BlogPost` keeps shared data + `sourceLocale`; every locale is a `BlogPostTranslation` row (title, subtitle, tagline, content, blocks, faq, seo, slug, isComplete), unique (postId, locale).
2. Each translation owns its full ordered `blocks` (text + media; URLs shared, captions/embed titles localized). Source-media mismatch is a non-blocking editor warning.
3. `BlogPost.status` stays the single publish/review gate. `isComplete` is server-computed on every write and indexed. A locale is public iff post PUBLISHED && translation complete. The source translation must be complete to submit/publish.
4. Slug per translation, unique (locale, slug), generated from that locale's title (backfill included). Wrong-locale slug → 301 to the correct locale's slug.
5. Slug follows the title until first publish, then is frozen (explicit regenerate only). `BlogPostSlugHistory` (locale, slug → translationId) serves 301s.
6. Review copies clone translation rows (slug null); changedFields tokens are `<locale>.<field>`; approval upserts/deletes per locale in one transaction; slugs are out of review.
7. Rollout: expand → idempotent backfill (dry-run / diff-only, counts) → deploy reads-new + dual-write old columns → verify → contract later. Dev first; every production step needs explicit user approval.
8. One repository module in `src/lib/blog/` is the only code touching translations. Public API/pages keep a flattened localized shape + `availableLocales`; the editor gets translations keyed by locale. No cross-locale fallback.
9. Any supported locale can be the source; changeable only to a complete translation. Posts without a complete translation in a locale are hidden on that locale's blog.
10. `locale` is TEXT + CHECK constraint; one `CONTENT_LOCALES` constant (reusing `LOCALES` from `src/lib/i18n/config.ts`) drives the type and zod validation.
11. Delivery: feature-branch chain into `feature/blog-translations`; contract as a separate later PR. Test-first per slice.

## Constraints

- Schema changes ship as hand-applied, idempotent SQL in `prisma/rollouts/` (`BEGIN; SET LOCAL lock_timeout='5s'; … IF NOT EXISTS …; COMMIT;`) mirrored in `prisma/schema.prisma`; `db:migrate` is `db push`.
- No SQL is applied to any database without explicit user approval of the target.
- Commits only after the user approves each one (standing user rule).

## Tasks

- [x] T1 — Schema + core: expand rollout SQL, Prisma models, `CONTENT_LOCALES`, completeness + slug utilities, unit tests (route: delegated writer — 2+ non-trivial files)
- [ ] T2 — Backfill script (idempotent, dry-run / diff-only, counts) + fixture tests
- [ ] T3 — Repository module + public reads (blog page, public API, sitemap, hreflang, slug redirects)
- [ ] T4 — Write APIs (tripper/admin) on new tables + dual-write old columns; `sourceLocale` rules
- [ ] T5 — Review flow: clone/overwrite translation rows, `<locale>.<field>` diffs + peek
- [ ] T6 — Editor UI: `draft.translations[locale]`, source picker, regenerate slug, media-mismatch warning, AI translate from source
- [ ] T7 — (later, separate PR) Contract rollout + remove dual-write

## Checks

Per slice: test-first Vitest (observe RED → GREEN), `npm run typecheck`, `npm run lint`. After backfill: dev DB counts, sample URLs per locale, redirects. Playwright `/es` and `/en` blog smoke before merging to `develop`.

## Progress

- Branch `feature/blog-translations` cut from `develop` (2026-10-16).
- Delivery strategy: feature-branch chain; slice boundaries recorded per task.

### T1 — Schema + core (route: delegated writer; trigger: 2+ non-trivial files)

- Files: `prisma/rollouts/blog-post-translations.sql` (expand, idempotent: `sourceLocale` + DO-block CHECK, `blog_post_translations`, `blog_post_slug_history`, Prisma-named indexes/FKs, locale CHECKs), `prisma/schema.prisma` (`sourceLocale`, `BlogPostTranslation` via `translationRows`, `BlogPostSlugHistory`; legacy `translations Json?` untouched), `src/lib/blog/locales.ts` (`CONTENT_LOCALES` = `LOCALES`, `contentLocaleSchema`, `isContentLocale`), `src/lib/blog/translation-completeness.ts` (`hasBlogArticleContent` moved here, `isBlogTranslationComplete`, `findMediaMismatch`), `src/lib/blog/translation-slug.ts` (`slugForTitle` folds diacritics then uses `@/lib/helpers/slugify`, `resolveUniqueSlug` -2/-3…, `shouldRegenerateSlug`), `src/lib/blog/translation-schema.ts` (row payload incl. media blocks, shared size limits, by-locale record), `src/types/blog.ts` (`ContentLocale`, `BlogBlock`, `BlogMediaBlock`, `BlogTranslationContent`, `BlogMediaMismatch`). `content-locale.ts` keeps its exports and now delegates (`isEnglishBlogReady` → `isBlogTranslationComplete`; shared zod primitives).
- RED: `npx vitest run` on the 4 new test files → 4 files failed (modules not found), before implementation.
- GREEN: same 4 files → 24/24 passed.
- Verification: `npx prisma validate` valid; `npx prisma generate` ok; `npx vitest run src/lib/blog` 11 files / 90 tests passed; `npm run typecheck` clean; `npm run lint` clean.
- No SQL applied anywhere. Uncommitted, awaiting parent spot check.
