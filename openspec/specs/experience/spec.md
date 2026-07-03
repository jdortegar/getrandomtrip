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

---

# experience-admin-edit Specification (experience-approval-flow-v2 addition)

## Purpose

Allows an admin to edit all fields of a `PENDING_REVIEW` experience via a lazy review copy before sending proposed changes to the tripper for acceptance. The original is never overwritten until the tripper explicitly approves.

## Requirements

### Requirement: Lazy Copy Creation

The system MUST create exactly one review copy per original experience per approval cycle. The copy MUST be created on the admin's first edit, inside a single transaction that also sets `reviewLockedBy` on the original. The copy MUST have `isReviewCopy = true` and `parentId` pointing to the original's `id`. Identity fields (`id`, `ownerId`, `createdAt`, `slug`) MUST NOT be copied — the copy receives its own generated `id`. If a non-INACTIVE copy already exists for the original, the system MUST NOT create a second copy.

#### Scenario: First admin edit creates copy

- GIVEN an experience in `PENDING_REVIEW` with no existing review copy
- WHEN an admin triggers the start-edit action
- THEN a new Experience row is created with `isReviewCopy = true` and `parentId = original.id`
- AND `reviewLockedBy` is set to the acting admin's id on the original
- AND the copy has its own unique `id` distinct from the original

#### Scenario: Second start-edit on same experience is blocked

- GIVEN an experience in `PENDING_REVIEW` with an existing non-INACTIVE review copy
- WHEN a different admin triggers start-edit
- THEN the API MUST return 409 with the locking admin's identity
- AND no second copy is created

#### Scenario: Copy identity fields are independent

- GIVEN a review copy was created
- WHEN the copy record is inspected
- THEN `copy.id`, `copy.ownerId`, `copy.createdAt`, and `copy.slug` differ from the original's values

---

### Requirement: Admin Edit Scope

While editing the review copy, the admin MUST be able to modify all fields available in `NewExperienceShell`, including media fields. Autosave MUST route to the copy's endpoint (keyed by `adminCopyId`), not to the original. The original MUST remain unchanged during admin editing.

#### Scenario: Autosave routes to copy

- GIVEN an admin is editing the review copy
- WHEN an autosave fires
- THEN the PATCH request targets the copy record (via `adminCopyId`)
- AND the original record is unmodified

#### Scenario: Original read-only during admin edit

- GIVEN a review copy exists and `reviewLockedBy` is set
- WHEN the original's direct edit endpoint is called
- THEN the API MUST return 409 indicating the experience is locked for review editing

---

### Requirement: Discard Copy

The admin MUST be able to discard the review copy at any time before sending it to the tripper. Discarding MUST delete the copy record and clear `reviewLockedBy` on the original in a single transaction. After discard, the original MUST return to `PENDING_REVIEW` with no lock.

#### Scenario: Discard removes copy and clears lock

- GIVEN a review copy exists and the original has `reviewLockedBy` set
- WHEN the admin triggers discard-copy
- THEN the copy record is hard-deleted
- AND `reviewLockedBy` on the original is set to `null`
- AND the original's status remains `PENDING_REVIEW`

---

### Requirement: changedFields Computation

When the admin sends the copy to the tripper, the system MUST compute `changedFields` by deep-comparing the copy's field values against the original's. The result MUST be stored on the copy record. `changedFields` MUST contain at least one entry — the system MUST NOT allow sending a copy with zero changed fields.

#### Scenario: changedFields populated on send

- GIVEN the admin edited the copy's `description` and `heroImage`
- WHEN the admin triggers send-to-tripper
- THEN `copy.changedFields` contains `["description", "heroImage"]`

#### Scenario: No-change send is rejected

- GIVEN the admin opened the copy but made no edits
- WHEN the admin attempts to send-to-tripper
- THEN the API MUST return 422 with a message indicating no fields were changed

---

### Requirement: Send to Tripper Action

Sending the copy to the tripper MUST transition the original's status to `PENDING_TRIPPER_REVIEW`, clear `reviewLockedBy`, and trigger an email notification to the tripper. The copy MUST persist (not be deleted) with `changedFields` populated.

#### Scenario: Send transitions original status

- GIVEN a review copy with at least one changed field
- WHEN the admin confirms send-to-tripper
- THEN the original status becomes `PENDING_TRIPPER_REVIEW`
- AND `reviewLockedBy` on the original is cleared
- AND the tripper receives an email notification

#### Scenario: Form mode becomes read-only after send

- GIVEN the admin just sent the copy to the tripper
- WHEN either admin views the original experience
- THEN the form renders in `adminReadOnly` mode (no further editing)

---

### Requirement: Soft-Lock Warning

When an admin opens a `PENDING_REVIEW` experience that is already locked by another admin, the system MUST display a soft-lock warning banner identifying the locking admin. The second admin MUST NOT be able to start a new edit.

#### Scenario: Warning shown when locked

- GIVEN admin A holds the lock on experience X
- WHEN admin B opens experience X in the admin panel
- THEN a warning banner is visible showing admin A's name/email
- AND the start-edit button is disabled for admin B

---

## API Contracts

| Endpoint | Auth | Precondition | Success | Error |
|----------|------|--------------|---------|-------|
| `POST /api/admin/experiences/[id]/start-edit` | ADMIN | `PENDING_REVIEW`, no active copy | 201 copy created, `reviewLockedBy` set | 409 locked / 403 not admin |
| `POST /api/admin/experiences/[id]/send-to-tripper` | ADMIN | copy exists, `changedFields` non-empty | 200, original → `PENDING_TRIPPER_REVIEW` | 422 no changes / 403 / 409 |
| `POST /api/admin/experiences/[id]/discard-copy` | ADMIN | copy exists | 200, copy deleted, lock cleared | 403 / 404 no copy |

---

# experience-tripper-review Specification (experience-approval-flow-v2 addition)

## Purpose

Allows the tripper to review the admin's proposed copy read-only, inspect which fields changed, and either approve (overwriting the original atomically) or reject (keeping the copy as an INACTIVE reference and reverting the original to DRAFT).

## Requirements

### Requirement: Tripper Review Screen

The system MUST provide a read-only view of the review copy when the original is in `PENDING_TRIPPER_REVIEW`. The view MUST display the `changedFields` list so the tripper knows exactly what the admin changed. All inputs MUST be disabled — the tripper cannot edit the copy. For each eligible field — a top-level scalar rendered via `FormField`/`TextAreaInput`/`RichTextInput`, or a scalar sub-field of an `accommodations`/`activities` array entry rendered the same way — that differs from the tripper's original, the view MUST expose a per-field peek toggle so the tripper can swap the displayed value between the admin's suggested value and the tripper's own original value, in place, without leaving the page. Toggling MUST change only the displayed value — the copy's actual field values, which are applied on approve, MUST NOT be affected by which value was on display. The changed-fields summary and the approve/reject actions MUST render together in a sticky bar pinned below the site header, reachable from every tab and scroll position, not only after navigating to a specific tab.

(Previously: the read-only view showed only the admin's edited value per changed field, with no way to inspect the tripper's original value without leaving the page; peek was scoped only to `title`/`teaser`/`description` on the About step, and approve/reject only appeared at the bottom of the last tab.)

#### Scenario: Review screen shows changed fields

- GIVEN an original in `PENDING_TRIPPER_REVIEW` with a review copy
- WHEN the tripper opens the experience
- THEN a read-only form renders in `adminReadOnly` mode
- AND a `changedFields` summary is visible (e.g. "Admin changed: description, heroImage")

#### Scenario: PATCH blocked during PENDING_TRIPPER_REVIEW

- GIVEN an experience in `PENDING_TRIPPER_REVIEW`
- WHEN any PATCH request is sent to the tripper experiences endpoint
- THEN the API MUST return 409

#### Scenario: Peek toggle appears only on eligible changed fields

- GIVEN a field in `changedFields` rendered via `FormField` or `TextAreaInput` in `adminReadOnly` mode with an available original value
- WHEN the tripper views the review screen
- THEN a peek toggle icon renders next to the field, defaulting to `EyeOff` with tooltip "Click to see original content" / "Ver contenido original"

#### Scenario: Peek toggle absent on non-eligible fields

- GIVEN a field that is either unchanged, or is rendered via multi-select, image upload, `DaysInput`/`DurationInput`, a native `<select>`, or any field within an `itinerary` entry
- WHEN the tripper views the review screen
- THEN no peek toggle icon renders for that field, regardless of its changed status

#### Scenario: Peek toggle on a changed nested list entry field

- GIVEN `changedFields` includes the array-level key (`hotels` for `accommodations`, `activities` for `activities`) AND a specific entry's scalar sub-field (e.g. `accommodations[0].hotelName`, `activities[1].description`) differs from the original entry at the same index
- WHEN the tripper views that entry
- THEN a peek toggle renders on that specific field only — sibling fields within the same entry that did not individually change show no toggle, even though the entry's parent array is flagged changed
- AND if the admin added a new entry with no original counterpart at that index, no peek toggle renders for any field in that entry

#### Scenario: Peek toggle on a RichTextInput field swaps to a static preview, not the live editor

- GIVEN a changed `description` or `risks` field (rendered via `RichTextInput`/TinyMCE) with an eligible original value
- WHEN the tripper toggles the field to show the original
- THEN the TinyMCE editor unmounts and a static read-only preview of the original HTML renders in its place, struck through
- AND toggling back remounts the live editor showing the admin's edited HTML, unchanged from before the toggle
- AND at no point does toggling call the field's `onChange` — TinyMCE's `setcontent` event firing on a controlled-value swap MUST NOT be used to drive this preview, since that would let TinyMCE's own change-detection silently overwrite the admin's edit with the original

#### Scenario: Toggling swaps the displayed value to the original

- GIVEN an eligible changed field currently showing the admin's edited value with an `EyeOff` icon
- WHEN the tripper clicks the peek toggle
- THEN the field's displayed value swaps in place to the tripper's original value with `line-through` styling
- AND the icon becomes `Eye` with tooltip "Click to see admin's suggestion" / "Ver sugerencia del admin"
- AND clicking the icon again reverts the field to the admin's edited value and the `EyeOff` icon
- AND each field's toggle state is independent of every other field's toggle state

#### Scenario: Empty original value shows a placeholder

- GIVEN an eligible changed field whose original value was an empty string
- WHEN the tripper toggles the field to show the original value
- THEN the field displays a muted italic placeholder "(no content)" / "(sin contenido)" instead of a blank value

#### Scenario: Approve applies the copy's real value regardless of toggle state

- GIVEN an eligible changed field currently toggled to display the tripper's original value
- WHEN the tripper approves the copy
- THEN the original is overwritten with the copy's actual edited value for that field, not the value that was on display at the moment of approval

#### Scenario: Unrelated fields and call sites render unchanged

- GIVEN a field within the review screen that is not in `changedFields`, or any `FormField`/`TextAreaInput` usage outside the tripper review-copy screen
- WHEN the form renders
- THEN no peek toggle icon appears and no visual or behavioral change occurs, because the peek capability is an opt-in prop that defaults to inactive

#### Scenario: Changed-fields summary and approve/reject actions are always reachable

- GIVEN a review copy with one or more changed fields
- WHEN the tripper switches tabs or scrolls the page
- THEN a single bar showing the changed-fields summary and the Approve/Reject actions stays pinned directly below the site header at all times
- AND no separate per-tab banner or bottom-of-tab action area duplicates this content

#### Scenario: Approve/reject show independent loading state

- GIVEN the tripper clicks either Reject or Approve
- WHEN the request is in flight
- THEN only the clicked button shows its loading spinner; the other button shows its normal icon
- AND both buttons are disabled until the request settles, preventing a second concurrent submission

---

### Requirement: Tripper Approve Copy

When the tripper approves, the system MUST overwrite the original with the copy's data in a single transaction. Identity fields (`id`, `ownerId`, `createdAt`, `slug`) MUST NOT be overwritten. After overwrite, the copy MUST be hard-deleted and the original MUST transition to `ACTIVE`. An email MUST be sent to the admin confirming tripper approval.

#### Scenario: Approve overwrites original atomically

- GIVEN a review copy with `changedFields: ["description"]`
- WHEN the tripper approves
- THEN the original's `description` matches the copy's `description`
- AND the copy record no longer exists
- AND the original status is `ACTIVE`
- AND the original's `id`, `ownerId`, `createdAt`, and `slug` are unchanged

#### Scenario: Admin receives email on tripper approval

- GIVEN the tripper approved the copy
- WHEN the transaction completes
- THEN an email is sent to the admin notifying them of the approval

---

### Requirement: Tripper Reject Copy

When the tripper rejects, the copy MUST be set to `INACTIVE` (not deleted) as a reference. The original MUST transition to `DRAFT`. An email MUST be sent to the admin. The tripper may then edit and resubmit the original.

#### Scenario: Reject preserves copy as INACTIVE

- GIVEN an original in `PENDING_TRIPPER_REVIEW` with a review copy
- WHEN the tripper rejects
- THEN the copy status becomes `INACTIVE`
- AND the original status becomes `DRAFT`
- AND the admin receives an email notification

#### Scenario: Tripper can edit after reject

- GIVEN the original is now in `DRAFT` after tripper rejection
- WHEN the tripper opens the experience form
- THEN all inputs are editable (standard DRAFT behavior)

---

### Requirement: INACTIVE Copy Cleanup on Resubmit

When a tripper submits a `DRAFT` experience that has an associated `INACTIVE` review copy, the system MUST hard-delete that `INACTIVE` copy in the same transaction as the status transition to `PENDING_REVIEW`.

#### Scenario: Resubmit cleans up INACTIVE copy

- GIVEN an experience in `DRAFT` with an associated `INACTIVE` review copy
- WHEN the tripper submits for review
- THEN the experience transitions to `PENDING_REVIEW`
- AND the INACTIVE copy is hard-deleted
- AND no orphaned copy records remain

---

## API Contracts

| Endpoint | Auth | Precondition | Success | Error |
|----------|------|--------------|---------|-------|
| `POST /api/tripper/experiences/[id]/approve-copy` | TRIPPER (owner) | `PENDING_TRIPPER_REVIEW`, copy exists | 200, original → `ACTIVE`, copy deleted | 403 / 409 |
| `POST /api/tripper/experiences/[id]/reject-copy` | TRIPPER (owner) | `PENDING_TRIPPER_REVIEW`, copy exists | 200, copy → `INACTIVE`, original → `DRAFT` | 403 / 409 |

---

# experience-approval-flow-v2: Updated Status State Machine

## MODIFIED Requirements

### Requirement: Status State Machine (Extended)

The system MUST enforce the following lifecycle for Experience records (including original v1 transitions plus v2 additions):

- `DRAFT` → `PENDING_REVIEW` (tripper submits; INACTIVE copy cleaned up if present)
- `PENDING_REVIEW` → `ACTIVE` (admin approves directly, no copy)
- `PENDING_REVIEW` → `DRAFT` (admin rejects directly)
- `PENDING_REVIEW` → `PENDING_TRIPPER_REVIEW` (admin edits + sends copy to tripper)
- `PENDING_TRIPPER_REVIEW` → `ACTIVE` (tripper approves copy)
- `PENDING_TRIPPER_REVIEW` → `DRAFT` (tripper rejects copy)
- `ACTIVE` → `DRAFT` (tripper edits; reverts to draft, loses ACTIVE)

No other direct transitions are permitted.

#### Scenario: Happy path — submit → approve (no copy)

- GIVEN an experience in `DRAFT` with all required fields complete
- WHEN a tripper submits for review
- THEN status becomes `PENDING_REVIEW`
- AND the experience is read-only for the tripper until admin acts

#### Scenario: Admin approves directly — no copy path

- GIVEN an experience in `PENDING_REVIEW` with no review copy
- WHEN an admin approves with valid `pricingByType`
- THEN status becomes `ACTIVE`
- AND `pricingByType` is persisted on the record

#### Scenario: Admin approves — copy exists path

- GIVEN an experience in `PENDING_REVIEW` with an existing review copy
- WHEN an admin approves
- THEN the copy data is used to overwrite the original (same atomic overwrite as tripper approve)
- AND the copy is hard-deleted
- AND status becomes `ACTIVE`

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

### Requirement: Approve Action (Updated)

The "Approve" button MUST be disabled until all per-type price inputs have a positive numeric value (direct path). On click, the system MUST call `POST /api/admin/experiences/[id]/approve` with `pricingByType`. The approve endpoint MUST check whether a review copy exists. If a copy exists, the endpoint MUST perform the copy→original overwrite atomically before setting `ACTIVE`. If no copy exists, the endpoint MUST follow the existing direct-approve path. On success, the experience MUST be `ACTIVE`, the side panel MUST close, and the row MUST disappear from the Pending Review tab.

#### Scenario: Approve disabled without prices

- GIVEN the side panel is open with two price inputs unfilled
- WHEN the admin clicks "Approve"
- THEN the action is prevented (button disabled or form validation blocks submission)

#### Scenario: Direct approve — no copy

- GIVEN all per-type price inputs are filled and no review copy exists
- WHEN the admin clicks "Approve" and the API succeeds
- THEN the experience becomes `ACTIVE`
- AND the row is removed from the Pending Review tab

#### Scenario: Copy-based approve

- GIVEN a review copy exists for the experience
- WHEN the admin clicks "Approve"
- THEN the copy data overwrites the original atomically
- AND the copy is deleted
- AND the experience becomes `ACTIVE`

---

## ADDED Requirements (experience-approval-flow-v2)

### Requirement: ExperienceStatus Enum Extension

The `ExperienceStatus` Prisma enum MUST include `PENDING_TRIPPER_REVIEW` as a valid value. All TypeScript types and runtime constants that reference `ExperienceStatus` MUST be updated to handle the new value.

#### Scenario: New status accepted at API boundary

- GIVEN `PENDING_TRIPPER_REVIEW` is added to the enum
- WHEN `npm run typecheck` is run
- THEN no unhandled switch/union errors are reported for `ExperienceStatus`

---

### Requirement: Schema Fields for Review Copy

The `Experience` Prisma model MUST include:

| Field | Type | Default | Rule |
|-------|------|---------|------|
| `isReviewCopy` | `Boolean` | `false` | `true` only on copy rows |
| `parentId` | `String?` | `null` | foreign key to original; set only on copy rows |
| `changedFields` | `String[]` | `[]` | populated at send-to-tripper time |
| `reviewLockedBy` | `String?` | `null` | admin id; cleared on discard or send |

#### Scenario: Invariant — original is never a copy

- GIVEN any Experience row where `isReviewCopy = false`
- THEN `parentId` MUST be `null`

#### Scenario: Invariant — copy always has parent

- GIVEN any Experience row where `isReviewCopy = true`
- THEN `parentId` MUST be a non-null id of an existing Experience

#### Scenario: Invariant — one active copy per original

- GIVEN an original experience X
- THEN at most one Experience row with `parentId = X.id` and status not `INACTIVE` MAY exist at any time

---

### Requirement: Email Notifications — New Transitions

The system MUST send email notifications for all new state transitions:

| Trigger | Direction | Content |
|---------|-----------|---------|
| Admin sends copy to tripper | Admin → Tripper | "Admin has suggested changes to your experience" |
| Tripper approves copy | Tripper → Admin | Notification of tripper approval |
| Tripper rejects copy | Tripper → Admin | Notification of tripper rejection |

Existing notifications (tripper submits → admin, admin approves/rejects → tripper) MUST remain unchanged.

#### Scenario: Tripper receives email when admin sends copy

- GIVEN admin has sent a review copy to the tripper
- WHEN the send-to-tripper transaction completes
- THEN the tripper's email address receives a notification email

#### Scenario: Admin receives email when tripper acts

- GIVEN the tripper approves or rejects the review copy
- WHEN the transaction completes
- THEN the admin receives an email indicating the tripper's decision

#### Scenario: Emails are locale-aware

- GIVEN both `es` and `en` email templates exist for each new notification
- WHEN an email is sent
- THEN the template rendered matches the recipient's preferred locale

---

## Schema Delta (experience-approval-flow-v2 additions)

| Change | Detail |
|--------|--------|
| `ExperienceStatus` enum | Add `PENDING_TRIPPER_REVIEW` value |
| `Experience.isReviewCopy` | Added as `Boolean @default(false)` |
| `Experience.parentId` | Added as `String?` |
| `Experience.changedFields` | Added as `String[] @default([])` |
| `Experience.reviewLockedBy` | Added as `String?` |

---

## Cross-Cutting Requirements (experience-approval-flow-v2)

### Requirement: Form Mode Prop

`NewExperienceShell` MUST accept a `mode` prop with values `tripper | adminEdit | adminReadOnly`. The `mode` prop MUST control editability of all form inputs. `adminCopyId` MUST be accepted to route autosave to the copy endpoint in `adminEdit` mode.

#### Scenario: adminReadOnly disables all inputs

- GIVEN `mode = "adminReadOnly"`
- WHEN `NewExperienceShell` renders
- THEN all form inputs are disabled regardless of the experience's status

#### Scenario: adminEdit routes autosave to copy

- GIVEN `mode = "adminEdit"` and `adminCopyId` is provided
- WHEN an autosave fires
- THEN the PATCH request targets the copy identified by `adminCopyId`

---

### Requirement: Type and Lint Compliance

After all changes, `npm run typecheck` and `npm run lint` MUST pass with zero errors. All new status values MUST be handled in every switch/conditional that covers `ExperienceStatus`.

#### Scenario: No unhandled status in switch statements

- GIVEN `PENDING_TRIPPER_REVIEW` is added to `ExperienceStatus`
- WHEN `npm run typecheck` runs
- THEN no unhandled union member errors are reported
