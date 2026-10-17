# Image upload hints owned by the upload components

## Objective

`ImageUploadTile` and `ImageUploadTileGroup` render their own hint copy (formats, minimum size, copyright, too-small error) so every call site shows the same hints without repeating them. The blog gallery gets the same hints as the other image inputs.

## Problem / why

Hints are passed as props from ~9 call sites with duplicated dictionary keys (3× `copyrightHint`, 3× `imageTooSmall`, 3 size-hint keys). The blog gallery passes none, so it shows no hints and no minimum size. The tiles' picker accepts `image/*`, letting users pick formats (HEIC, SVG) that don't match the hint.

## Decisions (grill-me, 2026-10-16)

1. Components read a new `common.imageUpload` dict section (`formats`, `minSize` with `{width}`/`{height}`, `copyright`, `tooSmall`). Props `sizeHint`, `copyrightHint`, `tooSmallLabel` removed — no overrides. Duplicate per-feature keys and types deleted.
2. Format hint "JPG, PNG o WebP." / "JPG, PNG or WebP."; tile pickers `accept="image/jpeg,image/png,image/webp"`. Server `ALLOWED_MIME_TYPES` unchanged.
3. Context sentences stay at the call site; blog `coverImageHint` keeps only the context sentence.
4. Blog gallery: remove duplicate `galleryHint` paragraph; rename key to `galleryAlt` (alt text only).
5. Hints render below the tile(s): formats, min size (omitted without a minimum), copyright.
6. Blog gallery minimum 1280 × 720.
7. Both unused `ImageUploadInput.tsx` files get `@deprecated`; deletion is a separate later commit.

## Scope

- `src/components/ui/ImageUploadTile.tsx`, `src/components/ui/ImageUploadTileGroup.tsx` (+ tests)
- Call sites: experience steps (About, Activities, Itinerary), blog steps (TitleImage, Gallery), XSED admin steps (Identity, SectionFields, Accommodation, Dinner, Activity)
- `src/dictionaries/es.json`, `src/dictionaries/en.json`, `src/lib/types/dictionary.ts`
- `src/components/ui/ImageUploadInput.tsx`, `src/app/[locale]/(secure)/dashboard/admin/ImageUploadInput.tsx` (deprecation tag only)

## Tasks

- [x] T1 — Components own hint copy + picker restriction + call-site/dictionary cleanup + gallery hints/min size + deprecations (route: delegated writer — 2+ non-trivial files)
  - Group renders the hint block once below all tiles (user feedback: hints repeated per tile mid-implementation); tiles inside the group use `ImageUploadTileBody`.
  - Parent fixes: removed dead `imageCopy` props in `resolveXsedStepContent.tsx`; `galleryAlt` is now descriptive alt text ("Foto de la galería del post" / "Post gallery photo").
  - RED: 8/8 new component tests failed before; GREEN after.

## Checks

- RED/GREEN component tests (vitest) for hint rendering, min-size line omission, accept attribute
- `npx vitest run` on affected tests, `npm run typecheck`, `npm run lint`

## Progress

- Delivery strategy: single commit on `develop` (user asked to commit when done); forecast well under the ~400-line slice budget.
- Verification: `npm run typecheck` clean; `npx vitest run src/components/ui src/components/app/dashboard/tripper src/components/app/dashboard/admin/xsed` 217/217; `npm run lint` clean.
- Follow-ups: delete both deprecated `ImageUploadInput.tsx` files; localize the pre-existing English-only too-small toast detail in `ImageUploadTile.tsx` ("min … (actual: …)").
