# Delta Spec: tripper-image-editor-modal

## Change: `tripper-image-editor-modal`

Fixes the geometry mismatch between the tripper hero editor preview and the public render container by baking crops server-side against a fixed target ratio, and gives avatars their first crop capability via the same generic modal. See `proposal.md` for the decision record this spec formalizes. No existing `openspec/specs/` domain covers image-editing or hero-geometry behavior — all requirements below are additions or explicit behavior changes to `TripperHero.tsx` rendering.

---

# tripper-image-editor Specification

## Purpose

Defines the generic crop/zoom editing capability, its two Phase 1 integrations (tripper hero, avatar), the server-side baking contract that removes per-consumer transform math, and the guarantee that unrelated upload surfaces are untouched.

## ADDED Requirements

### Requirement: Generic Image Editor Modal Upload

The system MUST provide a reusable modal that accepts an image via drag-and-drop or a file picker before any crop interaction begins.

#### Scenario: Drag-and-drop selects a file
- GIVEN the editor modal is open with no image loaded
- WHEN a user drags an image file onto the drop zone and releases it
- THEN the image loads into the crop view

#### Scenario: File picker selects a file
- GIVEN the editor modal is open with no image loaded
- WHEN a user clicks the upload control and chooses a file via the OS file dialog
- THEN the image loads into the crop view

### Requirement: Mask-Constrained Pan and Zoom

The editor MUST render a live mask over the loaded image and MUST let the user pan and zoom the image against that mask. The mask shape MUST be configurable per call site as either rectangular with an explicit target aspect ratio, or circular.

#### Scenario: Rectangular mask enforces an aspect ratio
- GIVEN the modal is opened with a rectangular mask configured for a fixed ratio
- WHEN the user pans and zooms the loaded image
- THEN the crop selection is constrained to that exact ratio at every zoom level

#### Scenario: Circular mask for avatar
- GIVEN the modal is opened with a circular mask
- WHEN the user pans and zooms the loaded image
- THEN the crop selection is constrained to a 1:1 circular region

### Requirement: Single-POST Save With No Orphaned Uploads

Saving MUST send the original file and the crop rectangle together in one request. No file upload MUST occur before the user confirms Save, and canceling the editor at any point MUST leave no uploaded blob in storage.

#### Scenario: Save sends one request
- GIVEN a user has framed a crop in the modal
- WHEN the user clicks Save
- THEN exactly one upload request is sent, carrying both the original file and the crop rectangle

#### Scenario: Cancel leaves no trace
- GIVEN a user has loaded and framed an image but not clicked Save
- WHEN the user closes or cancels the modal
- THEN no file has been uploaded to storage

### Requirement: Avatar Cropping

Avatar upload MUST open the image editor modal with a circular 1:1 mask instead of storing the picked file unmodified. The cropped avatar MUST render correctly at every avatar display size used across the app.

#### Scenario: Avatar is cropped before save
- GIVEN a user uploads a new avatar image
- WHEN they frame it in the circular mask and save
- THEN the stored avatar reflects the framed crop, not the original uncropped image

#### Scenario: Cropped avatar renders at all sizes
- GIVEN a tripper has saved a cropped avatar
- WHEN that avatar is displayed anywhere in the app (nav, profile, cards)
- THEN it renders without additional clipping or distortion at each size

### Requirement: Server-Side Crop Baking With Original Retention

On save, the server MUST produce a final image cropped and resized to the target ratio from the original file and crop rectangle, and MUST persist the original file separately from the baked result. Reopening the editor for an already-edited image MUST re-crop from the retained original, not from the baked derivative.

#### Scenario: Server bakes the final image
- GIVEN a save request with an original file and a crop rectangle
- WHEN the server processes the request
- THEN it returns/stores a final image already cropped to the target ratio, with no client-side crop math required to render it

#### Scenario: Re-edit uses the original, not the derivative
- GIVEN a tripper previously saved a cropped hero image
- WHEN they reopen the editor to adjust the crop
- THEN the modal loads the original retained file, and the resulting quality is not degraded by a prior crop/resize pass

### Requirement: One-Time Non-Destructive Hero Backfill

Existing trippers with a stored hero focal point MUST receive an automated, one-time bake of their 16:9 crop derived from that focal point at zoom level 1. The backfill MUST NOT irrecoverably overwrite the pre-backfill state.

#### Scenario: Existing tripper is backfilled without visual regression
- GIVEN a tripper with a previously set hero focal point and no manual re-edit after rollout
- WHEN the backfill runs
- THEN their public hero shows a 16:9 crop derived from that focal point, with no broken or blank image

#### Scenario: Pre-backfill state remains recoverable
- GIVEN the backfill has run for a tripper
- WHEN an operator needs to recover the pre-backfill state (e.g., to investigate a bad crop)
- THEN the original pre-backfill reference is still retrievable, not destroyed by the backfill write

### Requirement: Non-Regression on Deferred Upload Surfaces

Every upload surface not listed as in-scope for this change (blog cover hero, blog gallery, experience hero, experience per-activity images, experience per-itinerary-day images, XSED drop hero, XSED gallery, XSED section images) MUST continue to accept an uploaded file as-is, with no crop/zoom step introduced and no behavior change.

#### Scenario: Deferred surface behaves unchanged
- GIVEN any of the deferred upload surfaces listed above
- WHEN a user uploads an image through that surface
- THEN the image is stored and displayed exactly as it was before this change, with no editor modal presented

### Requirement: Dual-Locale Modal Copy

Every user-visible string introduced by the image editor modal (labels, drag-and-drop hint, error/validation messages, Save/Cancel actions) MUST exist in both `src/dictionaries/es.json` and `src/dictionaries/en.json` with matching keys, and MUST NOT be hardcoded in a component.

#### Scenario: New copy present in both locales
- GIVEN the editor modal renders in either locale
- WHEN `npm run typecheck` runs
- THEN no missing dictionary key errors are reported for either locale

## MODIFIED Requirements

### Requirement: Tripper Hero Fixed-Ratio Rendering

The public tripper hero container and the tripper settings hero preview MUST both render the hero image at a fixed 16:9 aspect ratio on every breakpoint. The public hero MUST render the server-baked image with plain `object-cover` and MUST NOT apply any client-side `objectPosition` calculation.
(Previously: the public hero used a viewport-relative `min-h-[70vh]` box and the settings preview used a different fixed-height box, so the same stored focal-point percentages produced different crops in each place.)

#### Scenario: Public hero is 16:9 at every breakpoint
- GIVEN a tripper profile page with a hero image set
- WHEN the page renders at 360px, 768px, and 1280px viewport widths
- THEN the hero container maintains a 16:9 ratio at each width, with no `objectPosition` styling applied

#### Scenario: Settings preview matches the public crop
- GIVEN a tripper has framed and saved a hero crop in the settings editor
- WHEN they view both the settings preview and the public profile page
- THEN both show the same 16:9-framed region of the image, pixel-for-pixel equivalent

## Out of Scope

- The 8 deferred upload surfaces listed under Non-Regression above, and their identical viewport-relative-ratio defects (e.g. `BlogPostHero.tsx`, XSED drop hero) — deferred to later phases.
- Image CDN/storage migration, non-image media, and any change to `Experience.heroImage`.
- Removal of the duplicated dead-code `ImageUploadInput.tsx` components.
- Exact schema field names, API payload shape, and endpoint design for the crop-rect contract — owned by `sdd-design`.
