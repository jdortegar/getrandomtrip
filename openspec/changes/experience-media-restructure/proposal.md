produc# Proposal: Experience Media Restructure

## Intent

The experience creation wizard isolates all media into a dedicated `media` tab (hero image, gallery, tags, highlights, visibility). This fragments the authoring flow: trippers set context in one tab and media in another, and the flat `galleryImages`/`highlights` arrays don't map to the activities they illustrate. We are distributing media into the steps where it is contextually relevant, removing the `media` tab, and replacing decoupled gallery/highlights data with per-entry images and derived highlights.

## Scope

### In Scope

- Remove the `media` tab and both substeps (`tags`, `visibility`) from the wizard
- Move hero image upload (full-width banner UI) and the blog-post visibility checkbox into `AboutExperienceStep`
- Relocate the shared experience-level tag block into the `activities-list` substep
- Add per-entry `image` upload to each `ActivityEntry` (`ActivitiesListStep`) and each `ItineraryDayEntry` (`ItineraryStep`)
- Delete `galleryImages` and `highlights` from `ExperienceFormDraft` and Prisma schema
- Derive `TripperInspirationGallery` highlights from the first 3 activity names
- Update `NewExperienceShell` pending-file handling and autosave for distributed image state
- Remove the `media` tab branch from `experience-form.ts` completion logic
- Update `es.json` and `en.json` dictionaries

### Out of Scope

- Tab completion rules for `about`/`activities` (unchanged)
- Image storage/upload backend mechanics (reused as-is)
- Data migration/backfill of existing `galleryImages`/`highlights` records (deferred)

## Capabilities

### New Capabilities

- None

### Modified Capabilities

- None (UI/data-structure refactor; no spec-level behavior change)

## Approach

Collapse the tab structure first (`media` tab gone), then move each piece of UI to its contextual host step, passing the relevant form slice + handlers down. Replace top-level media arrays with per-entry `image: string | null` on `ActivityEntry` and `ItineraryDayEntry`. `TripperInspirationGallery` computes highlights from activity names at render, eliminating stored `highlights`. `NewExperienceShell` tracks pending image files per-entry instead of one gallery list.

## Affected Areas

| Area                                                | Impact   | Description                                               |
| --------------------------------------------------- | -------- | --------------------------------------------------------- |
| `.../experiences/NewExperienceShell.tsx`            | Modified | Tab list, pending-file map, autosave                      |
| `.../experiences/ExperienceFormContent.tsx`         | Modified | Remove `media` substep routing                            |
| `.../steps/AboutExperienceStep.tsx`                 | Modified | Hero banner + visibility checkbox                         |
| `.../steps/ActivitiesListStep.tsx`                  | Modified | Tag block + per-activity image                            |
| `.../steps/ItineraryStep.tsx`                       | Modified | Per-day image                                             |
| `.../steps/TagsMediaStep.tsx`, `VisibilityStep.tsx` | Removed  | Substeps deleted                                          |
| `src/lib/helpers/experience-form.ts`                | Modified | Drop `media` case                                         |
| `src/types/tripper.ts`                              | Modified | Drop `galleryImages`/`highlights`; add `image` to entries |
| `prisma/schema.prisma`                              | Modified | Drop `galleryImages`/`highlights` columns                 |
| `.../tripper/TripperInspirationGallery.tsx`         | Modified | Derive highlights from activities                         |
| `src/dictionaries/{es,en}.json`                     | Modified | Relocated/new keys                                        |

## Risks

| Risk                                                 | Likelihood | Mitigation                                                   |
| ---------------------------------------------------- | ---------- | ------------------------------------------------------------ |
| Existing rows lose `galleryImages`/`highlights` data | High       | Accept loss (deferred migration); confirm no consumer breaks |
| Untranslated relocated copy                          | Med        | Enforce dual-dictionary update                               |
| Pending-file autosave regression                     | Med        | Verify per-entry upload + draft restore                      |

## Rollback Plan

Revert the change commits. Prisma column removal requires restoring the schema fields and re-running `db:push`; no data restore is possible for dropped columns, so rollback before any production migration.

## Dependencies

- None external; Prisma schema change requires `db:push` / migration coordination.

## Success Criteria

- [ ] `media` tab and `Tags`/`Visibility` steps no longer render
- [ ] Hero banner, visibility checkbox, tag block, and per-entry images function in their new hosts
- [ ] `galleryImages`/`highlights` removed from types, schema, and all consumers
- [ ] `TripperInspirationGallery` shows highlights from activity names
- [ ] `npm run typecheck` and `npm run lint` pass
