# SEO snippets — headings, descriptions, sentence-case copy

Branch: `feat/seo-snippets` (from `origin/main`, no upstream)

## Objective

Make Google show our own titles/descriptions instead of scraping all-caps hero text
("GET RANDOMTRIP! SCROLL. CURADO CON INTENCIÓN…") on every indexable page.

## Problem / why

- Google rewrote the homepage snippet from visible caps text; the home meta description is generic.
- 4 indexable pages render no `<h1>` (about-us, experiences, experiences/by-type, xsed).
- Missing descriptions: `experiences/by-type/[type]`, `trippers/[tripper]`; `by-tripper` description hard-coded Spanish; root layout has no default.
- `routeMetadata.ts` builds `<title>` from all-caps hero strings ("EXPERIENCIAS | Randomtrip").
- ~120 dictionary values per locale are typed in uppercase instead of styled with CSS `uppercase`.
- Waitlist sitelink ("Get early access…") is pre-launch residue: gate already emits noindex + empty sitemap. No code change; resolves on recrawl.

## Scope / constraints

- Indexable pages only (allowlist `isIndexablePath`, `src/lib/seo/urls.ts`). Skip `(secure)`, auth, noindexed utility pages, and `pdfLayout` (PDF vouchers).
- Brand acronyms stay uppercase (XSED, TGIS, etc.).
- Every copy change in both `es.json` and `en.json`; no hardcoded strings.
- Visual output must not change: any de-capitalized string gets Tailwind `uppercase` where it renders.
- No commits without explicit user approval (user rule overrides ODD auto-commit).

## Tasks

- [x] T1 — Headings + metadata (delegated writer; route: delegated direct — 12 files, writer trigger)
  - `Hero` renders `h1` for all variants; `SecondaryHero` (xsed) renders `h1`; one `h1` per page.
  - `data-nosnippet` on decorative hero text (scroll cue, branding eyebrow, script accent).
  - Sharper `home.meta.description` (es/en, ~150 chars, mentions 48 h reveal).
  - Default site description in root layout; descriptions for by-type and `trippers/[tripper]`; localize by-tripper description.
  - Sentence-case `<title>` for blog / experiences / xsed-drops in `routeMetadata.ts`.
- [x] T2 — Sentence-case dictionary copy (delegated writer; route: delegated direct — dictionaries + 8 render files, writer trigger)
  - Convert all-caps values (excluding acronyms, pdfLayout) to natural case in es/en; add `uppercase` class at each render site that lacks it.
- [~] T3 — Verification: typecheck, lint, affected tests, rendered HTML spot check of `/es`, `/es/about-us`, `/es/xsed`.

## Acceptance criteria

- Each indexable page renders exactly one `<h1>` in server HTML.
- Each indexable page has a localized meta description.
- No indexable `<title>` is all caps.
- Pages look the same (caps still applied via CSS).
- `npm run typecheck`, `npm run lint`, and affected tests pass.

## Progress

- RDD: uncommitted hero video changes reviewed separately (approved, acknowledged) before this work.
- T1 done (uncommitted, awaiting user commit approval):
  - Test-first: updated Hero/SecondaryHero/routeMetadata tests → RED (9 failed), then GREEN.
  - `Hero` always `motion.h1`; `SecondaryHero` title `h1`; `data-nosnippet` on scroll cues, branding wrapper (`display: contents`), script accent.
  - New dict keys (es/en): `experiences.meta.title`, `blogPage.meta.title`, `xsedDropsPage.meta.title`, `trippers.profileMeta.*`; rewrote `home.meta.description`.
  - `routeMetadata` uses meta titles and falls back to `home.meta.description` as the localized site default.
  - by-type description = type hero subtitle; `trippers/[tripper]` description = bio or localized template (+ OG); by-tripper title/description/OG localized.
  - `npm run typecheck`: pass. `npm run lint`: pass (0 warnings).
  - `npx vitest run` Hero, SecondaryHero, routeMetadata, AboutUsLayout, xsed page: 29/29 pass.
  - Full `npx vitest run`: only pre-existing failures in `src/lib/trip-documents/pdf/__tests__/{htmlReferenceLayout,referenceEdgeCases}` (4 tests, same on stashed baseline); `referenceRenders` times out only under full-suite load.

- T2 done (uncommitted, awaiting user commit approval):
  - Converted 51 values per locale (es 51, en 51) in home, aboutUs, experiences, blogPage, trippers, faqPage, xsedPage, xsedDropsPage, xsedLevelCard, packagesByType. Excluded sections verified byte-identical in caps scan (pdfLayout, journey, xsedBook, designSystem, dashboards…); en `xsedBook.hero.subtitle` deliberately left in caps.
  - Brand: `GetRandomtrip!` / `Get Randomtrip`, `XSED`, `TGIS`, `X Suerte Es Domingo`, `Thank God It's Sunday`.
  - `uppercase` added at render sites lacking it: `Hero` (home-variant h1 + scroll indicator), `ExperiencesPageClient` (`titleClassName="uppercase"`), `XsedInternalHero` h1 (xsed/drops title), `HeaderHero` new `titleClassName` prop → faq page and `BlogIndex` default title (not the per-tripper title). All other sites (TrustSignal, ThreeColumns, Button, Section, Blog, DropGrid, FaqBlock, CountDown status row, SecondaryHero subtitle, XsedHero, LevelCard, InspirationBanner, HeaderHero eyebrow) already uppercase.
  - Exceptions left in caps: `home.xsedHero.successMessage` / `xsedPage.xsedHero.successMessage` (shared `XsedNotifyForm` status `<p>` also shows mixed-case `xsedPage.hero.successMessage`; post-submit only, not indexable); `xsedPage.countdown.titleHighlight` (acronym `XSED/TGIS Nº{number}`); sub-threshold labels (`DÍAS/HRS/MIN/SEG`).
  - Tests updated to new casing + `uppercase` class assertions: Hero, TrustSignal, TypePlanner.xsed; new HeaderHero `titleClassName` test.
  - `npm run typecheck`: pass. `npm run lint`: pass. Affected vitest (34 files incl. HeaderHero): all pass.
  - Residual in-scope all-caps: 3 per locale (2 successMessage exceptions + titleHighlight acronym).

## Next step

- T3 — verification + rendered HTML spot check.

## T3 verification (parent)

- `npm run typecheck`: pass. `npm run lint`: pass (0 warnings).
- Focused vitest re-run (Hero, SecondaryHero, routeMetadata): 13/13 pass.
- Diff: 23 files, +293/−147 (excluding this doc and the reviewed hero videos).
- Pending: rendered-HTML / visual QA of `/es`, `/es/about-us`, `/es/xsed`, `/es/experiences` in a running app (not run here).
- Pending: commit (awaiting user approval) → RDD review on that commit → deploy → Search Console reindex request for `/`.
