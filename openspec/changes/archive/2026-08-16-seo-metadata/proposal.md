# Proposal: SEO Metadata & Structured Data

## Intent

The site has no `metadataBase`, no OG images on any page, and no JSON-LD structured data. An existing `public/images/opengraph.jpg` (1200×630) is unused. Crawlers receive incomplete social cards and zero structured-data signals. This change wires up site-wide metadata defaults, per-page OG images, and JSON-LD schemas to fix share previews and improve search ranking.

## Scope

### In Scope

- Add `metadataBase` + default OG/Twitter card to root `app/layout.tsx` using `opengraph.jpg`.
- Add `generateMetadata` to home page (`[locale]/page.tsx`) and journey page (`[locale]/journey/page.tsx`).
- Tripper profile pages: switch OG image from `avatarUrl` → `heroImage`, fallback to `opengraph.jpg`.
- Blog post pages: refactor `[slug]/page.tsx` from `"use client"` → RSC shell + client island, add `generateMetadata` + `heroImage` OG.
- `JsonLd` RSC component + schema builders in `src/lib/seo/` for `Organization`, `WebSite`, `Person`/`ProfilePage`, `BlogPosting`, `FAQPage`.
- Inject JSON-LD in root layout (`Organization` + `WebSite`), tripper pages (`Person`/`ProfilePage`), blog pages (`BlogPosting`), about-us/xsed pages (`FAQPage`).

### Out of Scope

- Sitemap expansion (tripper profiles, blog posts, legal pages) — deferred to a separate change.
- Automated OG image generation (e.g., `@vercel/og`) — static images only in this pass.
- i18n of JSON-LD content (single locale output for structured data).

## Capabilities

### New Capabilities

- `seo-metadata-defaults`: `metadataBase`, site-wide OG/Twitter fallback, locale layout metadata.
- `seo-per-page-metadata`: `generateMetadata` implementations for home, journey, tripper, and blog pages.
- `seo-json-ld`: `JsonLd` component + schema builder helpers; `Organization`, `WebSite`, `Person`/`ProfilePage`, `BlogPosting`, `FAQPage` schemas.

### Modified Capabilities

- None (no prior SEO specs).

## Approach

1. Root `layout.tsx`: add `metadataBase`, extend static `metadata` with `openGraph` + `twitter` pointing to `opengraph.jpg`.
2. Create `src/lib/seo/` with `JsonLd.tsx` (RSC, no `"use client"`) and `schemas.ts` (pure builder functions per schema type).
3. Root layout: render `<JsonLd>` for `Organization` + `WebSite`.
4. Home / Journey pages: add `generateMetadata` with translated title/description from the dictionary.
5. Tripper page: update DB query select to include `heroImage`; update `generateMetadata` to prefer `heroImage`.
6. Blog page: extract all interactive logic into a `BlogPostClient.tsx` island; page becomes RSC, add `generateMetadata` + `BlogPosting` JSON-LD.
7. About-us / xsed pages: add `<JsonLd>` with `FAQPage` schema, sourcing FAQ entries from the existing `faqItems` array.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/layout.tsx` | Modified | `metadataBase`, OG/Twitter defaults, `JsonLd` for site schemas |
| `src/app/[locale]/page.tsx` | Modified | Add `generateMetadata` |
| `src/app/[locale]/journey/page.tsx` | Modified | Add `generateMetadata` |
| `src/app/[locale]/trippers/[tripper]/page.tsx` | Modified | `heroImage` OG, `Person` JSON-LD |
| `src/app/[locale]/blog/[slug]/page.tsx` | Modified | RSC refactor, `generateMetadata`, `BlogPosting` JSON-LD |
| `src/app/[locale]/about-us/page.tsx` | Modified | `FAQPage` JSON-LD |
| `src/app/[locale]/xsed/page.tsx` | Modified | `FAQPage` JSON-LD |
| `src/lib/seo/` | New | `JsonLd.tsx`, `schemas.ts` |
| `src/lib/db/tripper-queries.ts` | Modified | Include `heroImage` in select |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Blog RSC refactor breaks existing client state | Med | Keep all `useState`/hooks in `BlogPostClient.tsx`; smoke-test UI parity |
| Missing `heroImage` rows → broken OG tag | Low | Fallback to `opengraph.jpg` via `??` in metadata builder |
| JSON-LD schema validation errors | Low | Validate output with Google Rich Results Test before merging |

## Rollback Plan

All changes are additive metadata/component additions except the blog RSC refactor. To roll back: revert `[slug]/page.tsx` to its `"use client"` version (git revert or branch restore). Removing `JsonLd` and `generateMetadata` calls from layout/pages leaves no functional regression — only SEO signals are lost.

## Dependencies

- `public/images/opengraph.jpg` already exists — no new assets needed.
- No new npm packages required (`next` metadata API + plain JSON-LD objects).

## Success Criteria

- [ ] Sharing any page URL on Slack/Twitter shows a rich card with a 1200×630 image.
- [ ] Google Rich Results Test finds `Organization`, `WebSite` on the home page.
- [ ] Tripper profile and blog post pages pass `BlogPosting`/`ProfilePage` structured-data validation.
- [ ] `metadataBase` is set; no "metadataBase not set" Next.js warning in build output.
- [ ] Blog post page renders identically to current `"use client"` version (no visual regression).
