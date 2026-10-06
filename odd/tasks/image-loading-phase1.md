# Image loading — Phase 1

## Objective

Cut the time users stare at an empty gray block before images appear.

## Problem

- Card/grid images inherit `sizes="100vw"` (Img default) and download up to 1600px variants for ~300px cards.
- `TripperCard` / `TravelerTypeCard` mark every instance `priority`, preloading whole grids and starving the hero.
- `/api/upload` returns `Cache-Control: private, max-age=86400` with no ETag, so Netlify CDN never caches uploaded images and every miss costs a function + Blobs read.
- `next.config.js` lacks AVIF and a long `minimumCacheTTL`, so optimized variants are regenerated often.
- First `BgCarousel` slide is lazy-loaded.

## Why

Smaller responsive downloads + CDN-cacheable immutable uploads + correct priority = images arrive sooner.

## Scope (authorized)

- `src/app/api/upload/[...path]/route.ts`, `src/app/api/upload/route.ts` (cache headers, ETag/304)
- `next.config.js` (`images.formats`, `images.minimumCacheTTL`)
- Card/grid image components: add `sizes`; make repeated-card `priority` opt-in
- `BgCarousel` first slide priority

Out of scope (Phase 2): hero CSS backgrounds → next/image, blur placeholders, Prisma columns.

## Constraints

- Strict TDD: RED → GREEN → REFACTOR. Runner: `npx vitest run <path>` (source: user CLAUDE.md "Strict TDD Mode: enabled").
- No raw `<img>`; no new user-visible strings.
- Never commit/push automatically — ask the user (memory: Never Auto-Commit).

## Tasks

- [x] T1 — `/api/upload` cache: immutable public caching + ETag/304 on path-keyed route; keep query-keyed route safe for CDN. Route: delegated writer.
- [x] T2 — `next.config.js`: `formats: ["image/avif","image/webp"]`, `minimumCacheTTL: 31536000`. Route: delegated writer.
- [x] T3 — Card/grid `sizes` + priority opt-in (DropCard, BlogCard, TripperCard, TravelerTypeCard, TripCard, PackageCard, FavoriteCard, TestimonialCard, BlogList, TripperBlog, TripperGallery, by-tripper page). Route: delegated writer.
- [x] T4 — `BgCarousel` first slide `priority`. Route: delegated writer.

Route evidence: 10+ non-trivial files → writer trigger fired; one bounded writer.

## Acceptance criteria

- Upload GET responses for path-keyed URLs are `public, max-age=31536000, immutable` with an ETag; matching `If-None-Match` returns 304.
- No card/grid component relies on the `100vw` default.
- Repeated cards no longer all preload.
- `npm run typecheck`, `npm run lint`, and affected vitest suites pass.

## Checks

- `npx vitest run src/app/api/upload src/components`
- `npm run typecheck`
- `npm run lint`

## Progress

- Branch `perf/image-loading-phase1` created off `develop` (1c9557d6).

## Verification evidence

- Writer: `npx vitest run src/app/api/upload src/components`: 171 files / 1338 tests passed; `npm run typecheck`: clean; `npm run lint`: clean.
- TDD: T1 RED 5 failures → GREEN 17/17 (src/app/api/upload); T3/T4 RED 5/6 → GREEN 6/6 (ImageSizes.test.tsx).
- Parent spot check: upload + ImageSizes + xsed suites: 11 files / 79 tests passed.
- Safety check: GET /api/upload is unauthenticated by design (sessions only on POST/DELETE; trip documents avoid it per ADR-1); all keys end in Date.now(), so public immutable caching does not widen access.

## Decisions

- ETag = sha1 of Blobs etag (fallback: key hash; keys immutable).
- `?key=` route stays `private` (Netlify CDN keys on path only → cross-user collision); gains ETag/304 only.
- Img default `sizes="100vw"` untouched; cards pass explicit `sizes`. Repeated-card priority is opt-in, index 0 only.
- Known tradeoff: a deleted upload may stay CDN-cached up to 1 year at its old URL.

## Next step

Merged via PR #247 (9c9e2a56) into develop on 2026-10-06. Phase 1 complete. Phase 2 (hero CSS bg → next/image, blur placeholders) not started.

## Commits

- 74a43f93 perf(upload): T1
- ac66445c perf(images): T2-T4 + this document
- Review: assessed medium (503 lines, slice budget reached); user declined review for this candidate.
