# Apply Progress: Experience Media Restructure — PR 1

**Change**: experience-media-restructure
**Mode**: Standard (no test runner)
**PR**: 1 of 2 (stacked-to-main)
**Batch**: Phase 1–3

---

## Completed Tasks

- [x] 1.1 Add `image: string | null` to `ActivityEntry` and `ItineraryDayEntry`
- [x] 1.2 Remove `galleryImages: string[]` and `highlights: string[]` from `ExperienceFormDraft`
- [x] 1.3 Remove `galleryImages` from `EMPTY_DRAFT` in `NewExperienceShell.tsx`; remove gallery handlers, `MAX_GALLERY` constant, and gallery loop in `flushPendingBlobs`; update `ExperienceImageState` to hero-only
- [x] 1.4 Remove `media` case from `isExperienceTabComplete` and `getMissingFields` in `experience-form.ts`
- [x] 2.1 Discovery grep — found all references; extra files: `ExperienceFormClient.tsx` (uses `ExperienceFormData.highlights` — untouched, different type), `BlogComposer.tsx` (`galleryImages` is a local variable from blog blocks — unrelated), `xsed/drops/[slug]/page.tsx` (`galleryImages` is a local variable — unrelated), `xsed.ts` (default activity object), `ActivitiesListStep.tsx` / `ItineraryStep.tsx` / `XsedActivitiesStep.tsx` (EMPTY_ENTRY / EMPTY_DAY — fixed with `image: null`)
- [x] 2.2 `tripper-queries.ts` query 1 (~line 109): select `activities` instead of `highlights`; derive `highlights = activities.slice(0,3).map(a => a.name)` in mapper
- [x] 2.3 `tripper-queries.ts` query 2 (~line 302): same treatment for `getTripperExperiencesByTypeAndLevel`
- [x] 2.4 Tripper edit page — removed `highlights: pkg.highlights` and `galleryImages` reads; updated default activity/itinerary entries with `image: null`
- [x] 2.5 Admin edit page — same removals and `image: null` defaults
- [x] 2.6 `src/app/api/tripper/experiences/route.ts` — removed `galleryImages` and `highlights` from POST create payload
- [x] 2.7 `src/app/api/tripper/experiences/[id]/route.ts` — removed from GET select and PATCH destructure + update data
- [x] 2.8 `src/app/api/tripper/experiences/[id]/submit/route.ts` — removed `galleryImages: []` and `highlights: []` from draft-for-check shape
- [x] 2.9 `src/app/api/admin/experiences/[id]/route.ts` — confirmed no references (admin API only manages `isActive`/`isFeatured`); `src/app/api/experiences/route.ts` — removed `highlights` from POST create
- [x] 2.10 `npm run typecheck` — 0 errors before Phase 3
- [x] 3.1 `prisma/schema.prisma` — removed `galleryImages String[] @default([])` and `highlights String[] @default([])` from `Experience` model
- [x] 3.2 `npm run db:push --accept-data-loss` — columns dropped (13 rows with non-null data lost, accepted per spec)
- [x] 3.3 `npm run db:generate` — Prisma client regenerated
- [x] 3.4 `npm run typecheck` — 0 errors post-regeneration

---

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/types/tripper.ts` | Modified | Added `image: string | null` to `ActivityEntry` and `ItineraryDayEntry`; removed `galleryImages` and `highlights` from `ExperienceFormDraft` |
| `src/lib/helpers/experience-form.ts` | Modified | Removed `media` case from `isExperienceTabComplete` and `getMissingFields` |
| `src/lib/db/tripper-queries.ts` | Modified | Added `ActivityEntry` import; both queries now select `activities` and derive `highlights` from first 3 activity names |
| `src/components/app/dashboard/tripper/experiences/NewExperienceShell.tsx` | Modified | Removed `galleryImages`/`highlights` from `EMPTY_DRAFT`; removed gallery handler functions and `MAX_GALLERY`; removed gallery loop from `flushPendingBlobs`; `ExperienceImageState` now hero-only; activity/itinerary defaults have `image: null` |
| `src/components/app/dashboard/tripper/experiences/steps/TagsMediaStep.tsx` | Modified | Stripped `highlights` and `galleryImages` form field usage; stripped gallery image state handlers — component still compiles, will be deleted in PR 2 |
| `src/components/app/dashboard/tripper/experiences/steps/ActivitiesListStep.tsx` | Modified | `EMPTY_ENTRY` now includes `image: null` |
| `src/components/app/dashboard/tripper/experiences/steps/ItineraryStep.tsx` | Modified | `EMPTY_DAY` now includes `image: null` |
| `src/components/app/dashboard/admin/xsed/steps/XsedActivitiesStep.tsx` | Modified | `EMPTY_ENTRY` now includes `image: null` |
| `src/types/xsed.ts` | Modified | Default `activities` array entry includes `image: null` |
| `src/app/[locale]/(secure)/dashboard/tripper/experiences/[id]/page.tsx` | Modified | Removed `highlights`/`galleryImages` from draft constructor; defaults have `image: null` |
| `src/app/[locale]/(secure)/dashboard/admin/(shell)/experiences/[id]/page.tsx` | Modified | Same as tripper edit page |
| `src/app/api/tripper/experiences/route.ts` | Modified | Removed `galleryImages`/`highlights` from POST create |
| `src/app/api/tripper/experiences/[id]/route.ts` | Modified | Removed from GET select and PATCH destructure + update |
| `src/app/api/tripper/experiences/[id]/submit/route.ts` | Modified | Removed from draft-for-check shape |
| `src/app/api/experiences/route.ts` | Modified | Removed `highlights` from POST create |
| `prisma/schema.prisma` | Modified | Dropped `galleryImages` and `highlights` from `Experience` model |

---

## Deviations from Design

None — implementation matches design.

## Issues Found

1. `XsedActivitiesStep.tsx` and `src/types/xsed.ts` were not listed in known consumers but were surfaced by the discovery grep — both had `ActivityEntry` defaults missing `image`. Fixed.
2. `ActivitiesListStep.tsx` and `ItineraryStep.tsx` also had `EMPTY_ENTRY`/`EMPTY_DAY` constants that needed `image: null`. Fixed.
3. `src/app/api/experiences/route.ts` (the non-tripper-namespaced route) also had `highlights` in its POST payload — fixed in task 2.9.

## Remaining Tasks

- [ ] Phase 4 (UI redistribution — PR 2 scope)
- [ ] Phase 5 (Shell entry-image state wiring — PR 2 scope)
- [ ] Phase 6 (i18n dictionaries — PR 2 scope)
- [ ] Phase 7 (Final verification — PR 2 scope)

## Workload / PR Boundary

- Mode: stacked PR slice
- Current work unit: PR 1 — Foundation (types + reference sweep + schema drop)
- Boundary: starts at type changes, ends at schema drop + typecheck clean
- Estimated review budget impact: ~150–180 changed lines (well within 400-line budget for this slice)
