# Apply Progress: Experience Media Restructure — PR 1 + PR 2

**Change**: experience-media-restructure
**Mode**: Standard (no test runner)
**PR**: 2 of 2 complete (stacked-to-main)
**Batch**: Phase 1–7 (all phases)

---

## Completed Tasks

### Phase 1: Types and Foundation
- [x] 1.1 Add `image: string | null` to `ActivityEntry` and `ItineraryDayEntry`
- [x] 1.2 Remove `galleryImages: string[]` and `highlights: string[]` from `ExperienceFormDraft`
- [x] 1.3 Remove `galleryImages` from `EMPTY_DRAFT` in `NewExperienceShell.tsx`; remove gallery handlers, `MAX_GALLERY` constant, and gallery loop in `flushPendingBlobs`; update `ExperienceImageState` to hero-only
- [x] 1.4 Remove `media` case from `isExperienceTabComplete` and `getMissingFields` in `experience-form.ts`

### Phase 2: Reference Sweep
- [x] 2.1 Discovery grep — found all references
- [x] 2.2 `tripper-queries.ts` query 1: select `activities`, derive highlights
- [x] 2.3 `tripper-queries.ts` query 2: same treatment
- [x] 2.4 Tripper edit page — removed `highlights`/`galleryImages` reads
- [x] 2.5 Admin edit page — same removals
- [x] 2.6 `src/app/api/tripper/experiences/route.ts` — removed from POST create payload
- [x] 2.7 `src/app/api/tripper/experiences/[id]/route.ts` — removed from GET/PATCH
- [x] 2.8 `src/app/api/tripper/experiences/[id]/submit/route.ts` — removed
- [x] 2.9 Admin API routes — confirmed no references; `src/app/api/experiences/route.ts` — removed `highlights`
- [x] 2.10 `npm run typecheck` — 0 errors before Phase 3

### Phase 3: Prisma Schema Drop
- [x] 3.1 `prisma/schema.prisma` — removed `galleryImages`/`highlights` from `Experience` model
- [x] 3.2 `npm run db:push --accept-data-loss` — columns dropped
- [x] 3.3 `npm run db:generate` — Prisma client regenerated
- [x] 3.4 `npm run typecheck` — 0 errors post-regeneration

### Phase 4: UI Redistribution
- [x] 4.1 `AboutExperienceStep.tsx`: full-width hero banner upload + blog-post checkbox
- [x] 4.2 `ActivitiesListStep.tsx`: shared tag chip-input block + per-entry image upload tile
- [x] 4.3 `ItineraryStep.tsx`: per-entry image upload tile
- [x] 4.4 Deleted `TagsMediaStep.tsx`
- [x] 4.5 Deleted `VisibilityStep.tsx`
- [x] 4.6 `ExperienceFormContent.tsx`: removed `media` branch; threaded `imageState` into About/Activities/Itinerary steps

### Phase 5: Shell Image State Wiring
- [x] 5.1 `NewExperienceShell.tsx`: `ExperienceImageState` extended with `onEntryImageSelect`/`onEntryImageRemove`
- [x] 5.2 `NewExperienceShell.tsx`: `flushPendingBlobs` extended for activities/itinerary blobs
- [x] 5.3 `NewExperienceShell.tsx`: no remaining gallery reads

### Phase 6: i18n Dictionaries
- [x] 6.1 `src/dictionaries/es.json`: removed `media` tab, dead copy keys; added `entryImageLabel`
- [x] 6.2 `src/dictionaries/en.json`: same
- [x] 6.3 `src/lib/types/dictionary.ts`: updated interfaces

### Phase 7: Final Verification
- [x] 7.1 `npm run typecheck` — 0 errors
- [x] 7.2 No raw `<img>` tags; no stale refs; lint tool unavailable (`next lint` not in this Next.js version) — verified manually
- [ ] 7.3 Manual QA: experience wizard (pending)
- [ ] 7.4 Manual QA: blob→URL persistence (pending)
- [ ] 7.5 Manual QA: TripperInspirationGallery highlights (pending)

---

## Files Changed (PR 2)

| File | Action | Description |
|------|--------|-------------|
| `src/components/app/dashboard/tripper/experiences/NewExperienceShell.tsx` | Modified | Extended `ExperienceImageState`; added entry image handlers; extended `flushPendingBlobs` |
| `src/components/app/dashboard/tripper/experiences/steps/AboutExperienceStep.tsx` | Modified | Hero banner upload + blog-post checkbox |
| `src/components/app/dashboard/tripper/experiences/steps/ActivitiesListStep.tsx` | Modified | Tag chip-input + per-entry image tile |
| `src/components/app/dashboard/tripper/experiences/steps/ItineraryStep.tsx` | Modified | Per-day image tile |
| `src/components/app/dashboard/tripper/experiences/ExperienceFormContent.tsx` | Modified | Removed `media` branch; threaded imageState |
| `src/components/app/dashboard/tripper/experiences/steps/TagsMediaStep.tsx` | Deleted | |
| `src/components/app/dashboard/tripper/experiences/steps/VisibilityStep.tsx` | Deleted | |
| `src/components/app/dashboard/tripper/experiences/ExperienceFormClient.tsx` | Deleted | Dead code |
| `src/components/app/dashboard/tripper/experiences/ExperienceFormNav.tsx` | Deleted | Dead code |
| `src/dictionaries/es.json` | Modified | Removed media tab + dead keys; added `entryImageLabel` |
| `src/dictionaries/en.json` | Modified | Same |
| `src/lib/types/dictionary.ts` | Modified | Updated `TripperExperiencesDict` |

---

## Deviations from Design

1. `ExperienceFormClient.tsx` and `ExperienceFormNav.tsx` deleted (dead code — nothing imported them; they referenced removed dict keys causing typecheck errors).

## Workload / PR Boundary

- Mode: stacked PR slice
- Current work unit: PR 2 — UI redistribution + shell wiring + cleanup + i18n
- Boundary: starts at step UI changes, ends at typecheck clean
