# Tasks: SEO Metadata & Structured Data

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~520–580 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Phases 1–4) → PR 2 (Phases 5–6) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation + Dictionary + Root Layout + Per-page metadata | PR 1 | Base: `main`; ~360–385 lines; no client changes |
| 2 | Blog RSC refactor + JSON-LD per page | PR 2 | Base: PR 1 branch; ~190–220 lines; includes smoke-test of blog UI parity |

---

## Phase 1: Foundation — lib/seo creation

- [x] 1.1 Create `src/lib/seo/schemas.ts` with five pure builder functions: `buildOrganizationSchema`, `buildWebSiteSchema`, `buildPersonSchema`, `buildBlogPostingSchema`, `buildFAQPageSchema` — no imports from `@prisma/client`
- [x] 1.2 Create `src/lib/seo/JsonLd.tsx` as a pure RSC (no `"use client"`): accepts `schema` prop, renders `<script type="application/ld+json">` with `dangerouslySetInnerHTML`

## Phase 2: Dictionary Keys

- [x] 2.1 Add `home.meta.title` + `home.meta.description` and `journey.meta.title` + `journey.meta.description` to `src/dictionaries/es.json`
- [x] 2.2 Add the same four keys to `src/dictionaries/en.json` with English copy

## Phase 3: Root Layout

- [x] 3.1 Add `metadataBase` (using `NEXT_PUBLIC_SITE_URL` env var, fallback `https://getrandomtrip.com`), default `openGraph` block, and default `twitter` card block to `src/app/layout.tsx` — both referencing `/images/opengraph.jpg`
- [x] 3.2 Inject `<JsonLd>` with `buildOrganizationSchema()` + `buildWebSiteSchema()` output into the body of `src/app/layout.tsx`

## Phase 4: Per-page Metadata

- [x] 4.1 Add `generateMetadata` to `src/app/[locale]/page.tsx` using `home.meta.title` / `home.meta.description` from the dictionary; include `openGraph` + `twitter` overrides
- [x] 4.2 Add `generateMetadata` to `src/app/[locale]/journey/page.tsx` using `journey.meta` keys; add `robots: { index: false, follow: false }` — Note: journey page split into RSC `page.tsx` + `JourneyPageClient.tsx` to allow `generateMetadata` export; `getAccordionForStep` moved to `lib/helpers/journey.ts` and re-exported from `page.tsx` for test compatibility
- [x] 4.3 Update `generateMetadata` in `src/app/[locale]/trippers/[tripper]/page.tsx`: change OG image source to `heroImage ?? avatarUrl ?? "/images/opengraph.jpg"` (verify `heroImage` is already included in the `getTripperBySlug` select at `tripper-queries.ts:41` — no DB change expected)

## Phase 5: Blog RSC Refactor

- [x] 5.1 Create `src/components/app/blog/BlogPostClient.tsx` (`"use client"`): move all `useState`, `useEffect`, `useMemo`, `useParams`, and handler logic from `[slug]/page.tsx`; accept the blog post record as a prop
- [x] 5.2 Refactor `src/app/[locale]/blog/[slug]/page.tsx` to RSC: remove `"use client"`, add `generateMetadata` with direct Prisma call (use `createdAt` as fallback when `publishedAt` is null), add `<JsonLd>` with `buildBlogPostingSchema()`, wrap `<BlogPostClient>` in `<Suspense fallback={<BlogPostLoading />}>`

## Phase 6: JSON-LD Per Page

- [x] 6.1 Add `<JsonLd>` with `buildPersonSchema()` into `src/app/[locale]/trippers/[tripper]/page.tsx` (use tripper record already fetched for metadata)
- [x] 6.2 Add `<JsonLd>` with `buildFAQPageSchema()` into `src/app/[locale]/about-us/page.tsx` — source FAQ entries from the existing `faqItems` array in that file
- [x] 6.3 Add `<JsonLd>` with `buildFAQPageSchema()` into `src/app/[locale]/xsed/page.tsx` — same pattern as 6.2
