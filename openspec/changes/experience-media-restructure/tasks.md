# Tasks: Experience Media Restructure

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 600–750 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Foundation (types + reference sweep + schema drop) → PR 2: UI redistribution + i18n + shell wiring |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Types + reference sweep + schema drop + query derivation | PR 1 → main | All consumers compile clean before `db:push`; standalone deploy point |
| 2 | UI redistribution (About/Activities/Itinerary steps) + shell wiring + tab/step deletion + i18n + typecheck pass | PR 2 → main | Depends on PR 1; all user-visible changes |

---

## Phase 1: Types and Foundation

- [x] 1.1 In `src/types/tripper.ts`: add `image: string | null` to `ActivityEntry` and `ItineraryDayEntry` interfaces.
- [x] 1.2 In `src/types/tripper.ts`: remove `galleryImages: string[]` and `highlights: string[]` from `ExperienceFormDraft`; remove `highlights` from the raw `Experience` type if present (keep `FeaturedTripCard.highlights` — it will receive the derived value).
- [x] 1.3 In `NewExperienceShell.tsx`: remove `galleryImages` from `EMPTY_DRAFT` constant.
- [x] 1.4 In `src/lib/helpers/experience-form.ts`: remove the `media` case from `isExperienceTabComplete` and `getMissingFields`.

## Phase 2: Reference Sweep (pre-schema-drop)

> All tasks in this phase MUST pass `npm run typecheck` before Phase 3 proceeds.

- [x] 2.1 **Discovery**: grep the codebase for `highlights` and `galleryImages` identifiers across all `.ts`/`.tsx` files; produce a list of all remaining references beyond the already-known files.
- [x] 2.2 In `src/lib/db/tripper-queries.ts` (~line 109): replace `highlights` select with `activities` select; derive `highlights` in the mapper as `(activities as ActivityEntry[]).slice(0, 3).map(a => a.name)`.
- [x] 2.3 In `src/lib/db/tripper-queries.ts` (~line 302): apply the same `activities`-based highlights derivation in the second query mapper.
- [x] 2.4 In `src/app/[locale]/(secure)/dashboard/tripper/experiences/[id]/page.tsx` (~line 55): remove `highlights: pkg.highlights` and any `galleryImages` reads from the `ExperienceFormDraft` constructor.
- [x] 2.5 In `src/app/[locale]/(secure)/dashboard/admin/(shell)/experiences/[id]/page.tsx` (~line 57): same removal as 2.4.
- [x] 2.6 In `src/app/api/tripper/experiences/route.ts`: remove `galleryImages`/`highlights` from the create payload and Prisma `select` block.
- [x] 2.7 In `src/app/api/tripper/experiences/[id]/route.ts`: remove `galleryImages`/`highlights` from the update payload and `select` block.
- [x] 2.8 In `src/app/api/tripper/experiences/[id]/submit/route.ts`: remove any `galleryImages`/`highlights` references.
- [x] 2.9 In `src/app/api/admin/experiences/[id]/route.ts` and `src/app/api/admin/experiences/route.ts`: remove `galleryImages`/`highlights` from payloads and selects. (admin routes did not reference these fields — confirmed via discovery grep)
- [x] 2.10 Run `npm run typecheck` — must pass with 0 errors before continuing to Phase 3.

## Phase 3: Prisma Schema Drop

- [x] 3.1 In `prisma/schema.prisma`: remove `galleryImages String[]` and `highlights String[]` fields from the `Experience` model.
- [x] 3.2 Run `npm run db:push` — destructive column drop; confirm data loss is accepted.
- [x] 3.3 Run `npm run db:generate` to regenerate the Prisma client.
- [x] 3.4 Run `npm run typecheck` — must still pass after client regeneration.

## Phase 4: UI Redistribution

- [x] 4.1 In `src/components/app/dashboard/tripper/experiences/steps/AboutExperienceStep.tsx`: add full-width hero banner upload (aspect-video click-to-upload tile, wired to `onHeroSelect`/`onHeroRemove` from `imageState`); add blog-post visibility checkbox wired to `draft.isBlogPost`.
- [x] 4.2 In `src/components/app/dashboard/tripper/experiences/steps/ActivitiesListStep.tsx`: add shared tag chip-input block above the entries list (inline, ~15 lines, no separate component); add per-entry `image` upload tile inside each `ActivityEntry` row, wired to `onEntryImageSelect("activities", index, file)` / `onEntryImageRemove("activities", index)`.
- [x] 4.3 In `src/components/app/dashboard/tripper/experiences/steps/ItineraryStep.tsx`: add per-entry image upload tile inside each `ItineraryDayEntry` row, wired to `onEntryImageSelect("itinerary", index, file)` / `onEntryImageRemove("itinerary", index)`.
- [x] 4.4 Delete `src/components/app/dashboard/tripper/experiences/steps/TagsMediaStep.tsx`.
- [x] 4.5 Delete `src/components/app/dashboard/tripper/experiences/steps/VisibilityStep.tsx`.
- [x] 4.6 In `src/components/app/dashboard/tripper/experiences/ExperienceFormContent.tsx`: remove `media` branch/routing, remove `TagsMediaStep`/`VisibilityStep` imports; thread `imageState` (with `onEntryImageSelect`/`onEntryImageRemove`) into `ActivitiesListStep` and `ItineraryStep` props.

## Phase 5: Shell Image State Wiring

- [x] 5.1 In `NewExperienceShell.tsx`: update `ExperienceImageState` interface to replace gallery handlers with `onEntryImageSelect(field, index, file)` and `onEntryImageRemove(field, index)`.
- [x] 5.2 In `NewExperienceShell.tsx`: update `flushPendingBlobs` — remove gallery blob loop; add loop over `draft.activities` and `draft.itinerary`: if `entry.image?.startsWith("blob:")`, upload and replace URL in both form snapshot and draft state; on upload failure set `image: null`.
- [x] 5.3 In `NewExperienceShell.tsx`: remove any remaining `galleryImages` reads from `pendingFilesRef` initialization or autosave logic.

## Phase 6: i18n Dictionaries

- [x] 6.1 In `src/dictionaries/es.json`: remove `media` tab entry from `contentTabs`; remove standalone `tags`/`galleryImages` copy keys if orphaned; add hero image upload label, blog-post checkbox label, and per-entry image upload label under the relevant experience-form section.
- [x] 6.2 In `src/dictionaries/en.json`: apply the exact same additions and removals as 6.1.
- [x] 6.3 In `src/lib/types/dictionary.ts`: update affected interfaces to match the new/removed keys; ensure no type errors for the new copy fields.

## Phase 7: Final Verification

- [x] 7.1 Run `npm run typecheck` — must pass with 0 errors.
- [x] 7.2 Run `npm run lint` — must pass; confirm no raw `<img>` tags introduced, no `highlights`/`galleryImages` refs survive.
- [ ] 7.3 Manual QA: open the experience wizard — verify hero upload in About step, blog-post checkbox in About step, tags block in Activities step, per-activity image upload, per-day image upload in Itinerary step.
- [ ] 7.4 Manual QA: create a draft, upload a per-activity image (blob stage), save/reload — confirm blob is resolved to a persisted URL after `flushPendingBlobs`.
- [ ] 7.5 Manual QA: open `TripperInspirationGallery` for an experience — confirm first 3 activity names appear as highlights; confirm no crash when fewer than 3 activities exist.
