# Design: Experience Media Restructure

## Technical Approach

Distribute media UI into its contextual host steps and replace the two top-level media arrays (`galleryImages`, `highlights`) with per-entry images on `ActivityEntry`/`ItineraryDayEntry` plus query-time highlight derivation. The `media` tab and its `TagsMediaStep`/`VisibilityStep` substeps are deleted from routing, dictionaries, and completion logic. Because `activities`/`itinerary` are already Prisma `Json?` columns, per-entry `image` is a type-only change with no SQL column. Only `galleryImages` and `highlights` are dropped as real Postgres columns (destructive, no backfill — confirmed).

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|----------|--------|-----------------------|-----------|
| Per-entry pending uploads | Key `pendingFilesRef` by blob URL (existing pattern), iterate `activities`/`itinerary` in `flushPendingBlobs` | Per-entry `Map`/index-keyed refs | Blob URL is already the map key and lives in form state; entries already carry their blob URL, so flush stays a blob-scan with no index bookkeeping |
| Highlights derivation | Derive in `tripper-queries.ts` mapping from first 3 `activities[].name` | Derive inside `TripperInspirationGallery.tsx` | Component consumes `FeaturedTripCard.highlights`; deriving at the query keeps the component untouched and the contract stable |
| Image handlers | Generic `onEntryImageSelect(field, index, file)` / remove on `ExperienceImageState` | Keep hero+gallery handler shape | Gallery is gone; activities and itinerary need the same per-index operation, so one generic handler covers both arrays |
| Hero UI | Full-width banner (aspect-video, click-to-upload) in `AboutExperienceStep` | Reuse 96×96 tile | Hero is the card's main image; banner preview matches its prominence |
| Tags block | Inline chip-input inside `ActivitiesListStep` (shared, above entries) | New shared component | Tag logic is ~15 lines; inlining avoids a premature abstraction |

## Data Flow

    AboutExperienceStep (hero, blog checkbox) ─┐
    ActivitiesListStep (tags + per-activity img)├─ onChange/imageState ─→ NewExperienceShell form state
    ItineraryStep (per-day img) ───────────────┘                              │
                                                                    flushPendingBlobs (blob→URL)
                                                                              │
                                                              POST/PATCH /api/tripper/experiences
                                                                              │
                                              Prisma Experience (activities/itinerary JSON carry image)
                                                                              │
                                          tripper-queries → highlights = activities[0..2].name → FeaturedTripCard

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Drop `galleryImages`, `highlights` columns from `Experience` |
| `src/types/tripper.ts` | Modify | Drop `galleryImages`/`highlights` from `ExperienceFormDraft`; add `image: string \| null` to `ActivityEntry` + `ItineraryDayEntry`; drop `highlights` from `Experience`/`FeaturedTripCard` if unused after derivation (keep `FeaturedTripCard.highlights` — now query-derived) |
| `.../experiences/NewExperienceShell.tsx` | Modify | Remove `galleryImages` from `EMPTY_DRAFT`; replace gallery handlers with generic entry-image handlers; extend `flushPendingBlobs` to scan activities/itinerary blobs; update `ExperienceImageState` |
| `.../experiences/ExperienceFormContent.tsx` | Modify | Remove `media` branch + `TagsMediaStep`/`VisibilityStep` imports; thread `imageState` into Activities/Itinerary steps |
| `.../steps/AboutExperienceStep.tsx` | Modify | Add full-width hero banner upload + blog-post checkbox (from VisibilityStep) |
| `.../steps/ActivitiesListStep.tsx` | Modify | Add shared tag chip-input block + per-activity image upload |
| `.../steps/ItineraryStep.tsx` | Modify | Add per-day image upload |
| `.../steps/TagsMediaStep.tsx`, `VisibilityStep.tsx` | Delete | Substeps removed |
| `src/lib/helpers/experience-form.ts` | Modify | Remove `media` case from `isExperienceTabComplete` + `getMissingFields` |
| `src/lib/db/tripper-queries.ts` | Modify | BOTH queries (~line 109 + ~line 302): select `activities` instead of `highlights`, derive `highlights` from `activities[0..2].name` in the mapper |
| `.../tripper/TripperInspirationGallery.tsx` | None | Consumes derived `FeaturedTripCard.highlights` — unchanged |
| `.../dashboard/tripper/experiences/[id]/page.tsx` (line ~55), `.../dashboard/admin/(shell)/experiences/[id]/page.tsx` (line ~57) | Modify | Remove `highlights: pkg.highlights` and `galleryImages` reads; these feed `ExperienceFormDraft` which no longer has those fields |
| API routes (`.../experiences/route.ts`, `[id]/route.ts`, `[id]/submit/route.ts`, `api/experiences/route.ts`) | Modify | Remove `galleryImages`/`highlights` from create/update payloads and `select` blocks |
| `src/dictionaries/{es,en}.json` | Modify | Remove `media` tab from `contentTabs`; relocate `tags`/`heroImage` keys; add per-entry image + blog-post copy in both locales |

## Interfaces / Contracts

```ts
// ActivityEntry / ItineraryDayEntry gain:
image: string | null;

// ExperienceImageState (generic per-entry):
interface ExperienceImageState {
  onHeroSelect: (file: File) => void;
  onHeroRemove: () => void;
  onEntryImageSelect: (field: "activities" | "itinerary", index: number, file: File) => void;
  onEntryImageRemove: (field: "activities" | "itinerary", index: number) => void;
}
```

`flushPendingBlobs` keeps hero handling, drops the gallery loop, and adds: for each of `activities` and `itinerary`, if `entry.image?.startsWith("blob:")`, upload and replace in both snapshot and form state; on failure set `image: null`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|--------------|----------|
| Static | Types, drops, no dangling refs | `npm run typecheck` + `npm run lint` |
| Manual | Hero banner, blog checkbox, tags, per-entry upload, draft restore, autosave | QA the wizard end-to-end; confirm blob→URL persistence after reload |
| Manual | Derived highlights | Verify `TripperInspirationGallery` shows first 3 activity names |

No automated test runner exists — Standard Mode.

## Migration / Rollout

Destructive `db:push` drops `galleryImages`/`highlights` columns; no backfill (user-confirmed data loss is acceptable). Rollback = revert commits and restore columns via `db:push` before any further migration; dropped column data is unrecoverable.

## Open Questions

- [ ] None blocking. Concrete `highlights` consumers identified (both `tripper-queries.ts` queries, tripper + admin experience detail pages, gallery via derived card) — all listed in File Changes and must compile clean before the column drop.
