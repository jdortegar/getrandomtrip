# Video loading — Phase 3 step 1: lazy, connection-aware background videos

## Objective

Stop background videos from competing with the hero for bandwidth: only fetch a video when its section is on screen, and never on slow / data-saver connections.

## Problem

Production Lighthouse mobile baseline (2026-10-06, before image phases 1/2a were released):

| Page | Score | LCP | Weight | Biggest item |
|---|---|---|---|---|
| `/` | 72 | 8.8 s | 16.7 MB | `hero-xsed.mp4` ~11 MB (below the fold) |
| `/journey` | 67 | 9.8 s | 5.2 MB | `hero-video-1.mp4` 3.3 MB |
| `/trippers` | 64 | 10.3 s | 32 MB | `trippers-hero.mp4` ~29 MB |

`VideoBackground` and `BackgroundVideo` use `preload="auto"` + `autoPlay`, so every video (including below-the-fold ones) starts downloading on page load. Images are < 1 MB per page.

## Why

The optimized still (Phase 2a) already paints the hero; the video is an enhancement and should never delay it.

## Scope (authorized)

- `src/components/media/VideoBackground.tsx`, `src/components/journey/HeaderHero.tsx`, `src/components/media/BackgroundVideo.tsx`, `src/components/media/BgVideo.tsx` (if used).
- One shared hook/helper for "should load video" (in-view + connection check).

Out of scope: re-encoding video files (Phase 3 step 2), blur placeholders.

## Constraints

- Strict TDD: RED → GREEN → REFACTOR. Runner: `npx vitest run <path>` (source: user CLAUDE.md "Strict TDD Mode: enabled").
- Still image stays visible until the video can play (no flash, no gray).
- Respect `prefers-reduced-motion` (no autoplaying video).
- SSR-safe: the server render must not emit a video `src` that starts a download.
- No new user-visible strings. No raw `<img>`.
- Never commit/push automatically — ask the user.

## Tasks

- [x] T1 — Shared hook (e.g. `useShouldLoadVideo`): true only when the element is near the viewport AND connection allows (not `saveData`, not `2g`/`slow-2g`) AND not `prefers-reduced-motion`. Route: delegated writer.
- [x] T2 — `VideoBackground`: no `src`/`<source>` until the hook allows; `preload="none"` → attach + play when allowed; pause when scrolled away. Route: delegated writer.
- [x] T3 — `HeaderHero` video: same behavior, keep its existing fade-in-when-ready. Route: delegated writer.
- [x] T4 — `BackgroundVideo` / `BgVideo`: same behavior, or report them unused. Route: delegated writer.

Route evidence: 4+ non-trivial files → writer trigger fired; one bounded writer.

## Acceptance criteria

- Initial SSR HTML of `/`, `/journey`, `/trippers` contains no video `src` that the browser would fetch before hydration and visibility.
- Below-the-fold `XsedHero` video is not requested until scrolled near.
- With Save-Data / 2g / reduced motion, no video is requested; the still remains.
- `npm run typecheck`, `npm run lint`, `npx vitest run src/components src/hooks` pass.

## Checks

- `npx vitest run src/components src/hooks`
- `npm run typecheck`
- `npm run lint`

## Progress

- Branch `perf/video-lazy-loading` created off `develop` (faed0627).

## Verification evidence

- TDD (writer): T1 hook RED (module missing) → GREEN 10/10; T2 VideoBackground RED 4/4 → GREEN 4/4; T3 HeaderHero RED 4 new → GREEN 6/6.
- Parent fix: writer's VideoBackground emitted `<source .webm>` before mp4, but `hero-video-1`, `hero-xsed`, `trippers-hero` have no `.webm` → a 404 per video. Test changed to expect mp4 only (RED 1 failed) → mp4-only source (GREEN).
- `npx vitest run src/components src/hooks`: 182 files / 1407 tests passed; `npm run typecheck`: clean; `npm run lint`: clean.
- SSR (`curl` against local dev on this branch): `/` 2 videos, `/trippers` 1 video — all `preload="none"`, 0 `.mp4/.webm` URLs, 0 posters; `/journey` renders its video client-side only.
- Not yet measured: production Lighthouse after release (baseline above).

## Decisions

- Hook `useShouldLoadVideo(ref)` → `{ isInView, shouldLoad }`; rootMargin 200px; blocks on `saveData`, `2g`/`slow-2g`, `prefers-reduced-motion`; missing Connection API = OK; `shouldLoad` is sticky, `isInView` drives play/pause.
- `HeaderHero` fade-in timer waits for `shouldLoad` (otherwise it revealed an empty video after 2 s).
- `Hero.test.tsx` now asserts no video `src`/`<source>` in SSR markup (by design).
- `BackgroundVideo.tsx`, `BgVideo.tsx`: unused (dead code), untouched.
- Engram mirror: pending (save failed — multiple active sessions match the project).

## Next step

Ask to commit (no auto-commit). Then Phase 3 step 2: re-encode videos (and add matching .webm if wanted).
