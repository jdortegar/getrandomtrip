# Delta Spec: Experience Media Restructure

## Change: `experience-media-restructure`

Domains affected: `experience-wizard-structure`, `experience-data-model`, `experience-gallery-consumer`.

All three are structural deltas with no prior standalone spec — each section is a full delta description against the current implementation.

---

# experience-wizard-structure

## REMOVED Requirements

### Requirement: Media Tab

The `media` tab and its two substeps (`TagsMediaStep`, `VisibilityStep`) SHALL NOT exist in the wizard after this change.

(Reason: media has been distributed to contextually relevant host steps; a dedicated tab is no longer needed.)

### Requirement: Media Tab Completion Logic

The `experience-form.ts` helper MUST NOT contain a branch for `media` tab completion after this change.

(Reason: tab removed; completion logic for it is dead code.)

---

## MODIFIED Requirements

### Requirement: AboutExperienceStep Content

`AboutExperienceStep` MUST render:

- All previously existing about-step fields (title, type, level, teaser, description, destination, capacity, etc.)
- A full-width hero image banner upload control (previously in `TagsMediaStep`)
- A blog-post visibility checkbox (previously in `VisibilityStep`)

(Previously: AboutExperienceStep held only the core about fields; hero image and visibility were in the `media` tab substeps.)

#### Scenario: Hero image upload in about step

- GIVEN a tripper is on `AboutExperienceStep`
- WHEN they interact with the hero image upload area
- THEN the image is stored as `heroImage` on the form draft
- AND the full-width banner preview renders when an image is present

#### Scenario: Visibility checkbox in about step

- GIVEN a tripper is on `AboutExperienceStep`
- WHEN they toggle the blog-post visibility checkbox
- THEN the `isBlogPost` flag is updated on the form draft

#### Scenario: Submit for review still available

- GIVEN the tripper has completed all required fields including heroImage
- WHEN the tripper is on `AboutExperienceStep`
- THEN the submit-for-review action remains accessible (not blocked by the removal of VisibilityStep)

---

### Requirement: ActivitiesListStep Content

`ActivitiesListStep` MUST render:

- All previously existing activity entry fields
- A shared experience-level tag block (previously in `TagsMediaStep`)
- A per-activity image upload control on each `ActivityEntry`

(Previously: tags lived in `TagsMediaStep`; no per-activity image upload existed.)

#### Scenario: Tags block present in activities-list substep

- GIVEN a tripper is on the `activities-list` substep
- WHEN the step renders
- THEN the shared experience-level tags UI is visible

#### Scenario: Per-activity image upload

- GIVEN a tripper is editing an activity entry
- WHEN they upload an image for that entry
- THEN the image is stored as `image` on the specific `ActivityEntry`
- AND only that entry's image is affected

#### Scenario: No image is a valid state

- GIVEN an activity entry with no image uploaded
- WHEN the form is saved
- THEN `ActivityEntry.image` is persisted as `null` without error

---

### Requirement: ItineraryStep Content

`ItineraryStep` MUST render a per-day image upload control on each `ItineraryDayEntry`.

(Previously: no per-day image upload existed on itinerary entries.)

#### Scenario: Per-day image upload

- GIVEN a tripper is editing an itinerary day entry
- WHEN they upload an image for that day
- THEN the image is stored as `image` on the specific `ItineraryDayEntry`

#### Scenario: No image is a valid state

- GIVEN an itinerary day entry with no image
- WHEN the form is saved
- THEN `ItineraryDayEntry.image` is persisted as `null` without error

---

# experience-data-model

## REMOVED Requirements

### Requirement: galleryImages Field

`galleryImages: string[]` MUST NOT exist on `ExperienceFormDraft` or on the Prisma `Experience` model after this change.

(Reason: replaced by per-entry `image` fields on `ActivityEntry` and `ItineraryDayEntry`; production data loss accepted — no migration needed.)

### Requirement: highlights Field

`highlights: string[]` MUST NOT exist on `ExperienceFormDraft` or on the Prisma `Experience` model after this change.

(Reason: replaced by derived highlights from activity names at render time; production data loss accepted.)

---

## ADDED Requirements

### Requirement: ActivityEntry Image Field

`ActivityEntry` MUST include an `image: string | null` field in the TypeScript type and in the Prisma JSON storage structure.

#### Scenario: ActivityEntry with image serializes correctly

- GIVEN an `ActivityEntry` has `image` set to a non-null URL string
- WHEN the experience is saved
- THEN the `image` value is persisted alongside the other `ActivityEntry` fields

#### Scenario: ActivityEntry without image serializes correctly

- GIVEN an `ActivityEntry` has no image
- WHEN the experience is saved
- THEN `image` is stored as `null` with no type error

---

### Requirement: ItineraryDayEntry Image Field

`ItineraryDayEntry` MUST include an `image: string | null` field in the TypeScript type and in the Prisma JSON storage structure.

#### Scenario: ItineraryDayEntry with image serializes correctly

- GIVEN an `ItineraryDayEntry` has `image` set to a non-null URL string
- WHEN the experience is saved
- THEN the `image` value is persisted alongside the other `ItineraryDayEntry` fields

---

### Requirement: Distributed Pending-File Tracking

`NewExperienceShell` MUST track pending image files on a per-entry basis (keyed by entry identifier) rather than as a flat gallery list.

#### Scenario: Uploading an activity image does not affect other entries

- GIVEN two activity entries exist
- WHEN the tripper uploads an image for activity entry A
- THEN activity entry B's pending-file state is unchanged

---

# experience-gallery-consumer

## MODIFIED Requirements

### Requirement: TripperInspirationGallery Highlights Source

`TripperInspirationGallery` MUST derive its highlights display from the first 3 activity names of the experience's `activities` array.

It MUST NOT read a `highlights` field — that field no longer exists.

If fewer than 3 activities exist, the gallery MUST display only the available names.

(Previously: highlights were read from a stored `highlights: string[]` field on the experience record.)

#### Scenario: Gallery derives highlights from activities

- GIVEN an experience has activities named ["Kayak", "Snorkel", "Hiking", "Cooking"]
- WHEN `TripperInspirationGallery` renders
- THEN only the first 3 names — "Kayak", "Snorkel", "Hiking" — appear as highlights

#### Scenario: Fewer than 3 activities

- GIVEN an experience has 2 activities
- WHEN `TripperInspirationGallery` renders
- THEN both activity names appear as highlights (no null/undefined rendered)

#### Scenario: No highlights field dependency

- GIVEN an experience record has no `highlights` property
- WHEN `TripperInspirationGallery` renders
- THEN no TypeScript error occurs and the component renders without crashing

---

# Cross-Cutting Requirements

### Requirement: Dual-Locale Dictionary Coverage

Every user-visible string introduced or relocated by this change MUST be present in both `src/dictionaries/es.json` and `src/dictionaries/en.json`.

No string MUST be hardcoded inside a component. Keys MUST be added to the relevant type interface in `src/lib/types/dictionary.ts`.

#### Scenario: Relocated copy present in both locales

- GIVEN hero image upload label, visibility checkbox label, and per-entry image upload label exist in the UI
- WHEN `npm run typecheck` runs
- THEN no missing dictionary key type errors are reported for either locale

---

### Requirement: Type and Lint Compliance

After all changes, `npm run typecheck` and `npm run lint` MUST pass with zero errors. No references to the removed `galleryImages` or `highlights` fields MUST remain in the codebase.

#### Scenario: No stale references to removed fields

- GIVEN the change is fully applied
- WHEN `npm run typecheck` runs
- THEN no errors referencing `galleryImages` or `highlights` are reported

---

# Schema Delta (Non-Negotiable Contracts)

| Change | Detail |
|--------|--------|
| `Experience.galleryImages` | REMOVED — destructive drop, no migration |
| `Experience.highlights` | REMOVED — destructive drop, no migration |
| `ActivityEntry.image` | ADDED as `string \| null` within the JSON activities structure |
| `ItineraryDayEntry.image` | ADDED as `string \| null` within the JSON itinerary structure |
