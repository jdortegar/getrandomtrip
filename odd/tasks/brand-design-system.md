# Brand Design System

## Objective

Upgrade `/[locale]/design-system` with the Randomtrip Brand Book 3.1 (ESP) and give AI agents a scoped brand guide.

## Problem

The gallery only shows six color swatches and four type samples. The brand book's palette (dark text tones, secondary palette), color ratio, three type voices, tone of voice, payoffs, logo lockups, photography and Tripper treatment live only in a PDF, so people and agents write off-brand UI and copy.

## Scope (decided in grill-me, 2026-10-18)

- One page, two parts: **Brand** (Essence & North Star, Logo, Color, Typography, Voice & Payoffs, Photography & Trippers) then **Components** (existing six sections). Nav gets a Brand / Components divider.
- Reuse the `GallerySection` shell; book motifs only where they carry information (stacked essence rows, North Star on a sage band, 60/30/10/5 bar, voice do/don't cards, payoff tiles).
- Logo: four book lockups. Single-color ones via CSS `mask-image` of `public/assets/logos/logo_randomtrip_no_tag.svg`; the two-color one uses the original SVG.
- Tokens, two tiers in `src/app/globals.css`: palette tier named after brand colors (`deep-teal`, `mineral-sage`, `ochre`, `off-white`, `canyon-clay`, `deep-teal-dark` #082E30, `sage-dark` #4D5E54, `sky-drift` #6BAAC9); role tier (`primary`, `secondary`, `feature`, `ground`, `xsed`) points at the palette. UI uses role tokens; palette names used directly only for the three roleless colors and the brand section. Page shows the mapping table.
- Canyon Clay stays XSED-only; Sky Drift token-only (no UI role); dark tones only for text over images.
- Editorial voice spec: Barlow Condensed **Bold 700**; page shows a 700 vs 800 comparison.
- All brand content localized es/en. ES verbatim from the book with typos fixed; EN reuses the existing North Star, rest translated per the voice rules.
- Photography uses existing `public/images` photos; Tripper collection frame is page-local `TripperCollectionFrame.tsx`.
- AI guide: `.claude/rules/brand.md`, scoped to `src/components/**`, `src/app/**`, `src/dictionaries/**`, `src/emails/**`.
- Fix `en.json` tagline typo "Wander begin" → "Wonder begins".

## Out of scope / follow-ups

- Promoting `TripperCollectionFrame` to `src/components/common/` when a real screen adopts it.
- Brand-team review of the agent-written English payoffs and voice examples.

## Constraints

- No commits without asking the user each time.
- i18n rule: every string in `es.json` + `en.json` + `DesignSystemDict` type.
- Responsive at 360px and 1280px; AA contrast for text.
- Delivery: worktree `feature/brand-design-system` off `origin/develop`; push/PR are user decisions.

## Tasks

- [x] **T1 Tokens + docs** — two-tier palette in `globals.css`; update `.claude/rules/design-system.md` and `docs/design-system.md` (mapping, call-site rule); fix the `en.json` tagline typo. Route: inline (one mechanical CSS file + docs).
- [x] **T2 Brand part A** — Essence & North Star, Logo lockups, Color (palette + ratio bar + mapping), Typography (three voices, 700 vs 800, image rules); nav divider; es/en copy + types; tests. Route: delegated writer (multi-file).
- [x] **T3 Brand part B** — Voice & Payoffs, Photography & Trippers (`TripperCollectionFrame`); es/en copy + types; tests. Route: delegated writer (multi-file).
- [x] **T4 AI brand guide** — `.claude/rules/brand.md`, scoped by `paths:`, linked from `design-system.md`. Route: inline (one doc).

## Acceptance criteria

- New palette tokens resolve; existing role-token utilities render unchanged colors.
- Page shows all Brand sections in both locales with no hardcoded strings.
- `npm run typecheck`, `npm run lint`, and design-system tests pass.

## Checks

- `npm run typecheck`
- `npm run lint`
- `npx vitest run src/components/app/design-system`

## Progress

- Worktree created: `../getrandomtrip-worktrees/feature-brand-design-system`.
- T1 done (inline): palette tier + role tier in `globals.css`; `.claude/rules/design-system.md` two-tier table, call-site rule, 700 note; `en.json` tagline typo fixed.
  - Found `docs/design-system.md` corrupted since `75ce07e5` (1.2 MB, a table row repeated between every character, on main and develop). Restored from `efb32d1c` and rewrote its Color section + font roles. Its other sections predate the brand tokens (follow-up).
  - Evidence: PostCSS/Tailwind 4.2.4 compile emits every palette var and role vars as `var(--color-<palette>)`; `npx vitest run src/components/app/design-system` → 4 files, 13 tests passed.
  - Commit: pending user approval.
- T2 + T3 done (delegated writer, one pass — multi-file trigger):
  - Page is now Brand (01 Essence, 02 Logo, 03 Color, 04 Typography, 05 Voice & payoffs, 06 Photography) + Components (07 Buttons … 11 Tables). Foundations section and `FoundationExamples.tsx` removed; its palette/type moved into Color/Typography; `foundations.clipboard` → `color.clipboard`. Nav groups (`role="group"`, localized `groups.brand/components` labels, divider) inside the same horizontal scroller; scroll spy, skip link, reduced-motion anchors unchanged. Hero CTA → `#essence`.
  - New `src/components/app/design-system/brand/`: `BrandEssence`, `BrandLogo` (+ `LockupCaption`; mask-image lockups), `BrandColor` (+ `ColorRatioBar`, `ColorMappingTable`), `BrandTypography` (+ `WeightComparison`), `BrandVoice` (+ `VoiceCard`, `PayoffTiles`), `BrandPhotography` (+ `PhotoPrincipleCard`, `TripperCollectionFrame`). `TokenSwatch` gained optional `traits`/`rgb`.
  - Copy: `designSystem` in `es.json`/`en.json` (spliced, rest of file untouched) + `DesignSystem*Dict` interfaces in `dictionary.ts`.
  - Deviation: `public/images/trippers/*.jpg` are grey SVG placeholders, so Tripper frames use real people photos from `public/images/journey-types/` and `hero-image-1.jpeg`; 4th sample is "Vale" (photo is a woman). Payoff tiles use journey-type photos under a `neutral-950/60` overlay.
  - RED: new `BrandSections.test.tsx` + updated `GalleryShell`/`TokenSwatch` tests → 3 files failed (5 tests + missing brand modules). GREEN: `npx vitest run src/components/app/design-system` → 5 files, 29 tests passed. `npm run typecheck` → clean. `npx eslint src/components/app/design-system "src/app/[locale]/design-system" src/lib/types/dictionary.ts` → clean. es/en key-parity test already existed and passes.
  - Known unrelated failure: `src/components/app/about-us/__tests__/AboutUsLayout.test.tsx` CTA `text-white` (2 tests) fails on the base too.
  - Pending: manual QA at 360/1280px in a browser; brand review of English copy. Commit: pending user approval.

- T4 done (inline): `.claude/rules/brand.md` scoped to components/app/dictionaries/emails; essence, palette ratio, logo lockups, three voices, tone of voice table, payoffs (ES + agent-written EN, signature WONDER • WANDER Repeat verified against pg-07), photography, Trippers. Linked from `design-system.md`. Check: structural readback (passive doc).
- Manual QA (Chrome, :3012, `/es/design-system`): all six Brand sections render at 1280px with no console errors; logo masks, ratio bar, 700/800 specimen, voice cards, payoff tiles and Tripper frame verified visually. Chrome's minimum window width is 500px: no horizontal overflow there; true 360px not checked in a real browser.
- Known base failures: `src/components/app/about-us/__tests__/AboutUsLayout.test.tsx` (2 CTA `text-white` assertions) fail on develop too.

## Next step

Commits (ask user); EN payoff review; follow-ups listed above.
