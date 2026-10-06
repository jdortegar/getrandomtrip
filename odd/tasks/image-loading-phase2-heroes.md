# Image loading — Phase 2a: heroes

## Objective

Make the hero (usually the LCP image) arrive first and at the right size.

## Problem

Hero images are CSS `background-image: url(...)`, so they bypass `next/image`: no resizing, no AVIF/WebP, no responsive variants, no preload. The browser discovers them late (after CSS/JS) and downloads the full original even on phones.

## Why

Converting to `next/image` with `fill` + `priority` + `sizes="100vw"` lets Next preload a right-sized, modern-format hero.

## Scope (authorized)

- `src/components/layout/TravelHero.tsx:82`
- `src/components/journey/HeaderHero.tsx:100,161`
- `src/components/landing/exploration/XsedIntro.tsx:19`
- `src/components/media/VideoBackground.tsx:28` (poster/fallback)
- Any other above-the-fold hero using `backgroundImage: url(...)` found by sweep (list before changing).

Out of scope (Phase 2b): blur placeholders, Prisma columns, backfill.

## Constraints

- Strict TDD: RED → GREEN → REFACTOR. Runner: `npx vitest run <path>` (source: user CLAUDE.md "Strict TDD Mode: enabled").
- Visual parity: same crop/position (`object-cover` + existing `background-position` → `object-position`), same overlays and z-order.
- Use `Img`/`SafeImage` wrappers; no raw `<img>`; no new user-visible strings.
- Only one `priority` image per page.
- Never commit/push automatically — ask the user.

## Tasks

- [x] T1 — TravelHero → next/image (`fill`, `priority`, `sizes="100vw"`, object-position parity). Route: delegated writer.
- [x] T2 — HeaderHero (both backgrounds) → next/image; keep the fallback-while-video-loads behavior. Route: delegated writer.
- [x] T3 — XsedIntro → next/image (check whether it is above the fold before adding `priority`). Route: delegated writer.
- [x] T4 — VideoBackground fallback/poster → next/image with `priority`. Route: delegated writer.
- [x] T5 — Sweep remaining `backgroundImage: url(` heroes; convert above-the-fold ones, list the rest. Route: delegated writer.

Route evidence: 4+ non-trivial files → writer trigger fired; one bounded writer.

## Acceptance criteria

- No hero above the fold renders its image via CSS `url()`.
- Each converted hero renders a `next/image` with `fill`, `sizes="100vw"`, and `priority` when above the fold.
- Overlays, text and video still layer correctly (manual QA at 360px and 1280px).
- `npm run typecheck`, `npm run lint`, affected vitest suites pass.

## Checks

- `npx vitest run src/components`
- `npm run typecheck`
- `npm run lint`

## Progress

- Branch `perf/image-loading-phase2-heroes` created off `develop` (9c9e2a56).

## Verification evidence

- TDD: `HeroImages.test.tsx` RED 5 failed / 2 passed → GREEN 7/7.
- Writer: `npx vitest run src/components`: 169 files / 1328 tests passed; `npm run typecheck`: clean; `npm run lint`: clean.
- Parent spot check: HeroImages + Hero tests: 12 passed.
- Browser QA (Claude in Chrome, local dev on this branch, 2026-10-06):
  - 1280px: `/`, `/journey`, `/trippers`, `/blog`, `/faq`, `/xsed` — heroes load via `/_next/image`, `object-fit: cover`, `50% 50%`, 0 CSS `url()` backgrounds. Landing hero is the first image request (`w=1600`).
  - 360px (iframe emulation; window resize not honored): `/`, `/faq`, `/xsed` — centered crop, no horizontal overflow, no gray fallbacks.
  - Found + fixed: dictionaries pointed `XsedHero`/`XsedIntro` to missing `/images/hero-xsed.jpg` (404). Pre-existing, but the conversion made it visible as the SafeImage gray logo block. Repointed es/en (3 each) to existing `/images/fallbacks/hero-xsed.png`. Re-ran `npx vitest run src/components`: 1328 passed; typecheck clean.
  - Confirmed: VideoBackground `poster` causes a duplicate raw download of `/images/hero-image-1.jpeg`.
  - Found: landing preloads two 1600w heroes at once (main + below-fold XsedHero) because VideoBackground hardcodes `priority`.
  - Unrelated: `/trippers` test tripper `@carla-prueba` avatar 404 on stage (data, TripperCard not touched).
  - Side effect: visiting `/journey` created a draft trip (draftId 7b738a0e…) in the stage DB.

## Decisions

- Wrapper: `SafeImage` with `fill` (handles SVG / non-allowlisted hosts). `bg-center` → `object-center`.
- `priority`: TravelHero, HeaderHero (both), VideoBackground. XsedIntro not priority (tab content below landing hero).
- HeaderHero `<video poster>` removed: video is `opacity-0` until ready, so the poster was invisible and caused a duplicate full-size download.
- VideoBackground `poster` kept: `Hero.test.tsx` asserts it. Likely duplicate download of the original; dropping it is a follow-up for the user.
- TravelHero is not imported anywhere (dead code); converted anyway.
- T5 sweep: no other hero needs converting. Left as-is: TripperSettingsHeroCard (dashboard live preview), toaster SVG data URI, FaqSection mask-image, RichTextInput CSS @import.
- Open: on `/journey` and `/trippers` the hero priority coexists with the first-card priority and the Navbar logo priority.

## Follow-up fixes (user-approved 2026-10-06)

- [x] T6 — `VideoBackground` `priority` prop (default true); `XsedHero` `priority` prop (default false, below the fold on landing and /xsed); `XsedUnavailablePage` passes `priority` (its top hero). Route: inline (3 small files).
- [x] T7 — Drop `VideoBackground` `<video poster>` (duplicate raw download); `Hero.test.tsx` now asserts no poster. Route: inline.
- TDD: RED 4 failed / 12 passed → GREEN 16/16 (HeroImages + Hero tests).
- `npx vitest run src/components`: 169 files / 1332 tests passed; `npm run typecheck`: clean; `npm run lint`: clean.
- SSR check (`curl localhost:3010/`): only one hero preload (`hero-image-1.jpeg`); `hero-xsed` no longer preloaded; 0 `poster=` attributes.

## Next step

Ask to commit (no auto-commit).
