# Experience Approval Flow — Specification

## Change: `experience-approval-flow`

All three capabilities are new (no prior specs exist). Each section is a full spec.

---

# experience-review-lifecycle Specification

## Purpose

Defines the authoritative status state machine for Experience records, pricing ownership after the approval gate, and the `reviewNote` feedback contract.

## Requirements

### Requirement: Status State Machine

The system MUST enforce the following lifecycle for Experience records:

- `DRAFT` → `PENDING_REVIEW` (tripper submits)
- `PENDING_REVIEW` → `ACTIVE` (admin approves)
- `PENDING_REVIEW` → `DRAFT` (admin rejects)
- `ACTIVE` → `DRAFT` (tripper edits; reverts to draft, loses ACTIVE)

No other direct transitions are permitted. `INACTIVE` and `ARCHIVED` transitions are out of scope for this change.

#### Scenario: Happy path — submit → approve

- GIVEN an experience in `DRAFT` status with all required fields complete
- WHEN a tripper submits for review
- THEN status becomes `PENDING_REVIEW`
- AND the experience is read-only for the tripper until admin acts

#### Scenario: Happy path — approve sets ACTIVE

- GIVEN an experience in `PENDING_REVIEW`
- WHEN an admin approves with valid `pricingByType`
- THEN status becomes `ACTIVE`
- AND `pricingByType` is persisted on the record

#### Scenario: Rejection returns to DRAFT

- GIVEN an experience in `PENDING_REVIEW`
- WHEN an admin rejects with a non-empty `reviewNote`
- THEN status becomes `DRAFT`
- AND `reviewNote` is persisted on the record
- AND the tripper can edit the experience again

#### Scenario: Invalid transition rejected

- GIVEN an experience in `ACTIVE` status
- WHEN a request attempts to set status directly to `PENDING_REVIEW` without going through `DRAFT`
- THEN the API MUST return a 422 error

---

### Requirement: Pricing Ownership

The system MUST NOT allow trippers to set price fields. `pricingByType` is admin-only and is written exclusively via the approve action.

`pricingByType` MUST be a JSON object whose keys are a subset of the experience's `type[]` array. Each value MUST be a positive number representing the per-person price.

The system MUST validate that every key in `pricingByType` exists in the experience's `type[]` at the API boundary on approve.

#### Scenario: Approve persists per-type pricing

- GIVEN an experience with `type: ["couple", "group"]` in `PENDING_REVIEW`
- WHEN admin approves with `pricingByType: { couple: 250, group: 180 }`
- THEN both prices are saved and the experience becomes `ACTIVE`

#### Scenario: Invalid pricing key rejected

- GIVEN an experience with `type: ["solo"]`
- WHEN admin submits `pricingByType: { couple: 200 }`
- THEN the API MUST return a 422 error with a descriptive message

---

### Requirement: reviewNote Contract

`reviewNote` MUST be a non-empty string when set. It MUST only be written by the admin reject action. It MUST be cleared (set to `null`) when the experience transitions to `ACTIVE`.

#### Scenario: reviewNote cleared on approval

- GIVEN an experience in `DRAFT` with a non-null `reviewNote`
- WHEN a tripper resubmits and admin approves
- THEN `reviewNote` is `null` on the `ACTIVE` record

---

# tripper-experience-submission Specification

## Purpose

Defines the tripper-facing UX for submitting an experience for admin review, the completeness gate, read-only enforcement during pending state, and the rejection feedback banner.

## Requirements

### Requirement: Submit for Review Action

The system MUST provide a "Submit for review" action in `VisibilityStep`. This action MUST be disabled when any required field is missing. Required fields: `title`, `type` (non-empty), `level`, `teaser`, `description`, `heroImage`, `destinationCountry`, `destinationCity`.

On submit, the system MUST call `POST /api/tripper/experiences/[id]/submit` and transition status to `PENDING_REVIEW`.

#### Scenario: Submit enabled when complete

- GIVEN a draft experience with all required fields populated
- WHEN the tripper views `VisibilityStep`
- THEN the "Submit for review" button is enabled

#### Scenario: Submit disabled when incomplete

- GIVEN a draft experience missing `heroImage`
- WHEN the tripper views `VisibilityStep`
- THEN the "Submit for review" button is disabled with a visible reason

#### Scenario: Successful submission

- GIVEN a complete draft experience
- WHEN the tripper clicks "Submit for review" and the API succeeds
- THEN the form enters read-only mode
- AND a "Pending review" status badge is shown in the experience list card

---

### Requirement: Read-Only Enforcement During Review

The system MUST prevent all field edits when `status === PENDING_REVIEW`. All form inputs MUST be disabled. No save, update, or re-submit action is available until the admin acts.

#### Scenario: Form is non-editable while pending

- GIVEN an experience with `status === PENDING_REVIEW`
- WHEN the tripper opens the experience form
- THEN all inputs are read-only/disabled
- AND no save or submit button is rendered

---

### Requirement: Rejection Banner

When `status === DRAFT` AND `reviewNote` is non-null, the system MUST display a dismissible banner at the top of the experience form showing the `reviewNote` text.

Dismissing the banner MUST only hide it in the current session; it MUST reappear on next form load until the experience is approved.

After the tripper edits and resubmits, the banner MUST NOT appear (because `reviewNote` becomes `null` on approval).

#### Scenario: Banner shown on rejected draft

- GIVEN an experience returned to `DRAFT` with a non-null `reviewNote`
- WHEN the tripper opens the form
- THEN the dismissible banner is visible with the `reviewNote` text

#### Scenario: Banner dismissible in session

- GIVEN the rejection banner is visible
- WHEN the tripper clicks dismiss
- THEN the banner hides for the current session

#### Scenario: Banner absent after approval

- GIVEN an experience that was approved (reviewNote cleared)
- WHEN the tripper opens the form
- THEN no rejection banner is rendered

---

### Requirement: Experience List Badge

The experience list MUST show a "Pending review" badge on any card where `status === PENDING_REVIEW`. The badge MUST be visually distinct from `DRAFT` and `ACTIVE` badges.

#### Scenario: Pending badge visible in list

- GIVEN a tripper has one experience in `PENDING_REVIEW`
- WHEN the tripper views the experiences list
- THEN that card shows a "Pending review" badge

---

# admin-experience-review Specification

## Purpose

Defines the admin UI surface and API actions for reviewing pending experiences: the Pending Review tab, the detail side panel, per-type pricing inputs, and approve/reject actions.

## Requirements

### Requirement: Pending Review Tab

The admin experiences page MUST include a "Pending Review" tab that lists only experiences with `status === PENDING_REVIEW`.

The tab MUST show a count badge reflecting the number of pending experiences. An empty state MUST be shown when the list is empty.

#### Scenario: Tab populated with pending experiences

- GIVEN three experiences exist: one `DRAFT`, one `PENDING_REVIEW`, one `ACTIVE`
- WHEN an admin views the experiences page
- THEN the "Pending Review" tab shows exactly one row
- AND the tab badge shows "1"

#### Scenario: Empty state

- GIVEN no experiences are in `PENDING_REVIEW`
- WHEN an admin views the "Pending Review" tab
- THEN an empty state message is displayed

---

### Requirement: Review Side Panel

Clicking a row in the Pending Review tab MUST open a side panel. The side panel MUST display read-only experience info: title, type(s), level, destination (city + country), capacity (minPax–maxPax, minNights–maxNights), description, and hero image.

The side panel MUST render one price-per-person input per entry in the experience's `type[]` array.

The side panel MUST provide two actions: "Approve" and "Reject". Neither action is available until the side panel is fully loaded.

#### Scenario: Panel opens on row click

- GIVEN a pending experience exists
- WHEN an admin clicks the row
- THEN the side panel opens with the experience's read-only data
- AND one price input is rendered for each type in `type[]`

#### Scenario: Panel shows correct number of price inputs

- GIVEN an experience with `type: ["solo", "couple", "group"]`
- WHEN the admin opens the panel
- THEN exactly three price inputs are rendered, labelled by type

---

### Requirement: Approve Action

The "Approve" button MUST be disabled until all per-type price inputs have a positive numeric value.

On click, the system MUST call `POST /api/admin/experiences/[id]/approve` with `pricingByType`.

On success, the experience MUST move to `ACTIVE`, the side panel MUST close, and the row MUST disappear from the Pending Review tab.

#### Scenario: Approve disabled without prices

- GIVEN the side panel is open with two price inputs unfilled
- WHEN the admin clicks "Approve"
- THEN the action is prevented (button disabled or form validation blocks submission)

#### Scenario: Successful approval

- GIVEN all per-type price inputs are filled with positive values
- WHEN the admin clicks "Approve" and the API succeeds
- THEN the experience becomes `ACTIVE`
- AND the row is removed from the Pending Review tab
- AND the side panel closes

---

### Requirement: Reject Action

The "Reject" button MUST open a note input. The system MUST NOT allow submission of a reject action with an empty note.

On confirm, the system MUST call `POST /api/admin/experiences/[id]/reject` with a non-empty `reviewNote`.

On success, the experience MUST return to `DRAFT`, the side panel MUST close, and the row MUST disappear from the Pending Review tab.

#### Scenario: Reject requires note

- GIVEN the reject action is triggered
- WHEN the note input is empty
- THEN the confirm button is disabled

#### Scenario: Successful rejection

- GIVEN a non-empty review note is entered
- WHEN the admin confirms the rejection and the API succeeds
- THEN the experience becomes `DRAFT` with the `reviewNote` saved
- AND the row is removed from the Pending Review tab

---

# API Contracts

### `POST /api/tripper/experiences/[id]/submit`

| Field | Rule |
|-------|------|
| Auth | MUST be authenticated as the experience owner (TRIPPER role) |
| Precondition | Experience MUST be in `DRAFT` status |
| Success | Status → `PENDING_REVIEW`; returns 200 with updated experience |
| 403 | Caller is not the owner |
| 409 | Experience is not in `DRAFT` |
| 422 | Required fields are incomplete |

### `POST /api/admin/experiences/[id]/approve`

| Field | Rule |
|-------|------|
| Auth | MUST be authenticated as ADMIN role |
| Body | `{ pricingByType: Record<string, number> }` |
| Precondition | Experience MUST be in `PENDING_REVIEW` |
| Validation | Every key in `pricingByType` MUST exist in `experience.type[]`; all values MUST be positive numbers |
| Success | Status → `ACTIVE`; `pricingByType` saved; `reviewNote` cleared; returns 200 |
| 403 | Caller is not ADMIN |
| 409 | Experience is not in `PENDING_REVIEW` |
| 422 | Invalid or missing `pricingByType` keys/values |

### `POST /api/admin/experiences/[id]/reject`

| Field | Rule |
|-------|------|
| Auth | MUST be authenticated as ADMIN role |
| Body | `{ reviewNote: string }` |
| Precondition | Experience MUST be in `PENDING_REVIEW` |
| Validation | `reviewNote` MUST be a non-empty string |
| Success | Status → `DRAFT`; `reviewNote` saved; returns 200 |
| 403 | Caller is not ADMIN |
| 409 | Experience is not in `PENDING_REVIEW` |
| 422 | `reviewNote` is empty or missing |

---

# Schema Delta (Non-Negotiable Contracts)

| Change | Detail |
|--------|--------|
| `ExperienceStatus` enum | Add `PENDING_REVIEW` value |
| `Experience.basePrice` | REMOVED |
| `Experience.displayPrice` | REMOVED |
| `Experience.pricingByType` | Added as `Json?`; shape: `Record<string, number>` keyed by type |
| `Experience.reviewNote` | Added as `String?`; written only by admin reject; cleared on admin approve |

---

# experience-wizard-structure Specification

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

# experience-data-model Specification

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

# experience-gallery-consumer Specification

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

## Cross-Cutting Requirements

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

## Schema Delta (experience-media-restructure changes)

| Change | Detail |
|--------|--------|
| `Experience.galleryImages` | REMOVED — destructive drop, no migration |
| `Experience.highlights` | REMOVED — destructive drop, no migration |
| `ActivityEntry.image` | ADDED as `string \| null` within the JSON activities structure |
| `ItineraryDayEntry.image` | ADDED as `string \| null` within the JSON itinerary structure |
