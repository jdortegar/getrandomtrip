# Feature: ExperienceCard

## Objective
New `ExperienceCard` component (photo-header card variant of `LevelCard`) matching Figma node
`CARD_Modo explora - solo` (RPFzLE7HYxhniTCcsuej3r, node 6011-36312), populated with the content
and photos from the `Randomtrip-36-tarjetas` artifact, rendered in place of `LevelCard`.

## Scope (authorized)
- Only the existing cards: XSED + essenza / explora / explora-plus / bivouac / atelier per traveler
  type; honeymoon keeps only atelier. No BABYMOON / MINIMOON.
- Pricing unchanged (prices still come from traveler-types / pricing resolvers).
- `LevelCard` stays in the codebase; `TypePlanner` and `XsedLevelCard` render `ExperienceCard`.
- Artifact copy is Spanish only; English is translated in this change (i18n rule).

## Constraints
- Design-system tokens only; `<Img>` wrapper; no hardcoded UI strings; types in `src/types/`.
- Photos copied to `public/images/experience-cards/<type>/<level>.jpg` (downscaled to 1000px).

## Tasks
- [x] T1 Card content data module (es + en) + types — route: delegated writer (2+ non-trivial files) — `13a452ce`
- [x] T2 `ExperienceCard` component + tests — route: delegated writer — `8078b6b5`
- [x] T3 Swap into `TypePlanner` / `XsedLevelCard`, dictionary strings, update affected tests — route: delegated writer — `5d6e915f`
- [x] T4 Restyle to Figma node 6011-36312 (300×620, stacked 50px title, 12–18px type) — route: inline

## Checks
`npm run typecheck`, `npm run lint`, focused vitest for by-type / xsed / ExperienceCard.

## Delivery
Strategy: ask-on-risk. Forecast exceeds ~400 authored lines (data content heavy); data is mostly
copy, so a single PR is proposed. RDD: off (global) — ordinary checks only.

## Progress / Evidence
- Photos copied (31 files, 5.3 MB).
- T1 `13a452ce`: `src/lib/data/experience-cards.ts` (31 cards, es + en), types in `src/types/planner.ts`,
  `Level.card` wired in `getPlannerLevelsForType`; photos committed. Test
  `src/lib/data/__tests__/experience-cards.test.ts` (every type × level + XSED resolves in es/en,
  honeymoon only atelier, photo files exist). Data-only: no meaningful RED.
- T2 `8078b6b5`: `ExperienceCard` + `experienceCard` dict section (es/en/type). RED observed
  (missing module), then GREEN 7/7.
- T3 `5d6e915f`: TypePlanner + XsedLevelCard render ExperienceCard; `TypePlanner.xsed.test.tsx`
  updated (white surface, card names, `USD {price}`, tag instead of XSED badge).
- Checks: `npm run typecheck` pass; `npm run lint` pass; focused vitest 24 files / 210 tests pass.
  Full suite: 13 failing files, all pre-existing (same set being fixed on
  `fix/pre-existing-test-failures`) except the admin approve route test, which passes in isolation.

## Decisions
- XSED card no longer passes `badgeLabel` ("Sunday Glitch"): the photo tag already shows
  "THE SUNDAY GLITCH". EN XSED name is "TGIS™" (existing EN brand).
- XSED card content is resolved in `XsedLevelCard` (not `xsed-catalog`, whose `Level` is the
  checkout shape, not the planner shape).
- Selected state is a 4px teal overlay border (box-shadow ring would be hidden under the photo).
- Spanish alt "…; fotografía original conservada." trimmed (internal note, not alt text).
- T4 restyle targets node `6011-36312` (was `6011-36217`): card 300×620, photo 135.5px,
  title 50px/45px stacked on spaces, details 12px (teal label / gray value).
- Space-separated names stack (`MODO EXPLORA`, `ATELIER GETAWAY`); one-word names stay one line.
- Figma hex `#285e64` / `#4a4a4a` mapped to `text-primary` / `text-neutral-600` (tokens).
- Lucide transport/clock icons kept; artifact photos kept (no Figma temp assets).

## Next step
PR when approved. Visual QA of the restyle: gallery card matches 6011-36312 type scale;
carousel row still needs a pass at 1280 once Turbopack can boot this worktree.
