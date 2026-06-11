# Verify Report: Experience Media Restructure — PR 1

**Change**: experience-media-restructure
**Scope**: Phase 1–3 (types + reference sweep + schema drop)
**Mode**: Standard (manual code inspection, no test runner)
**Verdict**: PASS

---

## Task Completeness

| Task | Status | Evidence |
|------|--------|----------|
| 1.1 `ActivityEntry.image: string \| null` added | COMPLETE | `src/types/tripper.ts` line 325 |
| 1.2 `ExperienceFormDraft`: `galleryImages`/`highlights` removed | COMPLETE | Field absent from interface (lines 337–376) |
| 1.3 `EMPTY_DRAFT` updated; gallery handlers removed from shell | COMPLETE | `NewExperienceShell.tsx` lines 30–65; `ExperienceImageState` is hero-only |
| 1.4 `media` case removed from `isExperienceTabComplete`/`getMissingFields` | COMPLETE | No references to `media` in `experience-form.ts` |
| 2.1 Discovery grep completed | COMPLETE | Extra consumers found and fixed (XsedActivitiesStep, xsed.ts, ActivitiesListStep, ItineraryStep) |
| 2.2 `tripper-queries.ts` query 1: `activities` select + derived highlights | COMPLETE | Line 134 — derives highlights from first 3 activity names |
| 2.3 `tripper-queries.ts` query 2: same treatment | COMPLETE | `getTripperExperiencesByTypeAndLevel` selects `activities`, no highlights column |
| 2.4 Tripper edit page: stale refs removed | COMPLETE | No `highlights`/`galleryImages` in page.tsx |
| 2.5 Admin edit page: stale refs removed | COMPLETE | No references found |
| 2.6 `api/tripper/experiences/route.ts`: fields removed from POST | COMPLETE | No references in API routes |
| 2.7 `api/tripper/experiences/[id]/route.ts`: removed from GET/PATCH | COMPLETE | No references in API routes |
| 2.8 `api/tripper/experiences/[id]/submit/route.ts`: removed | COMPLETE | No references in API routes |
| 2.9 Admin API routes: confirmed clean; `api/experiences/route.ts`: highlights removed | COMPLETE | Verified via full API sweep |
| 2.10 `npm run typecheck` — 0 errors | COMPLETE | Confirmed (clean exit, no output) |
| 3.1 Prisma schema: `galleryImages`/`highlights` removed | COMPLETE | `prisma/schema.prisma` — neither field present in `Experience` model |
| 3.2 `npm run db:push` completed | COMPLETE | Per apply-progress (13 rows with non-null data dropped, accepted) |
| 3.3 `npm run db:generate` | COMPLETE | Per apply-progress |
| 3.4 `npm run typecheck` post-regeneration | COMPLETE | Confirmed clean |

All 18 Phase 1–3 tasks: COMPLETE.

---

## Spec Compliance Matrix

### experience-data-model

| Requirement | Status | Notes |
|-------------|--------|-------|
| `galleryImages` removed from `ExperienceFormDraft` | PASS | Field absent |
| `highlights` removed from `ExperienceFormDraft` | PASS | Field absent |
| `galleryImages` removed from Prisma `Experience` model | PASS | Confirmed in schema |
| `highlights` removed from Prisma `Experience` model | PASS | Confirmed in schema |
| `ActivityEntry.image: string \| null` added | PASS | Type present at line 325 |
| `ItineraryDayEntry.image: string \| null` added | PASS | Type present at line 310 |
| `EMPTY_DRAFT` activity default has `image: null` | PASS | Line 60 |
| `EMPTY_DRAFT` itinerary default has `image: null` | PASS | Line 61 |
| `activities` and `itinerary` JSON columns still present | PASS | Lines 169–170 |

### experience-gallery-consumer

| Requirement | Status | Notes |
|-------------|--------|-------|
| `TripperInspirationGallery` derives bullets from `activities` (not `highlights` field) | PASS | Component receives `FeaturedTripCard[]`; `highlights` is populated by `tripper-queries.ts` mapper at line 134 via `activities.slice(0,3).map(a => a.name)` — no direct `highlights` DB read |
| No references to removed `highlights` column in DB selects | PASS | Both query selects confirmed clean |

### Type & Lint Compliance

| Requirement | Status | Notes |
|-------------|--------|-------|
| `npm run typecheck` passes with 0 errors | PASS | Verified live |
| No `galleryImages` references in codebase | PASS | Full sweep clean |
| No stale `highlights` references tied to `ExperienceFormDraft` | PASS | All remaining `highlights` refs are on `FeaturedTrip`, `FeaturedTripCard`, `XsedExperience`, and `ExperienceFormData` — all intentionally kept per task 1.2 |

---

## Issues

### CRITICAL
None.

### WARNINGS
None.

### SUGGESTIONS

**S1**: `ExperienceFormClient.tsx` still uses the legacy `ExperienceFormData` type (which retains a `highlights: string[]` field). This is intentional per apply-progress and task 1.2. However, this older form component is a parallel editing surface that will drift further from the new `ExperienceFormDraft`-based wizard. Consider a future consolidation or deprecation plan for `ExperienceFormClient` + `ExperienceFormData` to avoid maintaining two parallel experience form models.

**S2**: `getTripperExperiencesByTypeAndLevel` (query 2, task 2.3) groups raw packages without applying the highlights derivation — highlights are not surfaced from this query path. If any consumer of this function ever needs highlights in the future, the derivation step would need to be added. Low risk for current usage (it's used for tripper planner filtering/grouping, not the gallery).

---

## Build Evidence

| Command | Result |
|---------|--------|
| `npm run typecheck` | EXIT 0 — 0 errors |
| `npm run db:push` | Completed (per apply-progress; 13 rows data loss accepted) |
| `npm run db:generate` | Completed (per apply-progress) |

---

## Final Verdict

**PASS**

All Phase 1–3 tasks are complete and verified. TypeScript types are correct, both removed fields are gone from `ExperienceFormDraft` and the Prisma schema, all DB-layer references have been swept clean, highlights derivation is wired at the query mapper layer, and `npm run typecheck` exits clean. Zero CRITICAL issues. Zero WARNINGS. Two low-priority suggestions noted.

PR 1 is ready to merge. PR 2 (Phase 4–7) can proceed on top of this base.
