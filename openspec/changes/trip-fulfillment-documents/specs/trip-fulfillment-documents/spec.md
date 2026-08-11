# trip-fulfillment-documents Specification

## Purpose

New capability (no prior spec exists). Per-`TripRequest` labeled, country-tagged document attachments: admin CRUD, traveler read-only, `REVEALED`-gated, served exclusively through a new authenticated route. Applies to every experience-based trip type — never gated on `type === "xsed"`.

## Requirements

### Requirement: TripDocument Model — Presence Is Confirmation

The system MUST persist documents as a `TripDocument` row per `TripRequest`: a free-text `label`, a `country` value representing the document's destination country — validated server-side against the existing country catalog used elsewhere in the app for destination selection (exact constant/source left to `sdd-design`; NOT a closed traveler-market list) — a stored file reference, MIME type, and a timestamp. The system MUST NOT introduce a separate confirmed/status field — the existence of the `TripDocument` row itself is the confirmation signal.

(Country scope corrected 2026-08-10: "country" is the destination country of the document, not a closed traveler-market list. The full existing destination country catalog applies, since valid journey/XSED destinations — e.g. Brazil, Colombia — fall outside any narrower market subset.)

#### Scenario: Uploading a document requires no separate confirm step
- GIVEN an admin uploads a document for a trip
- WHEN the `TripDocument` row is created
- THEN the document is immediately considered confirmed with no additional status field to set

#### Scenario: Country outside the destination country catalog is rejected
- GIVEN an admin submits a `country` value not present in the app's existing destination country catalog
- WHEN the create request is processed
- THEN the API MUST return `422` and no `TripDocument` row is created

#### Scenario: A destination country outside any narrow market subset is accepted
- GIVEN an admin submits a `country` value that is a valid destination in the app's country catalog but would not appear on a closed 5-market shortlist (e.g. Brazil or Colombia)
- WHEN the create request is processed
- THEN the API MUST accept it and create the `TripDocument` row

### Requirement: Documents Are Per-Trip, Itinerary Is Per-Experience

`TripDocument` rows MUST be scoped to a single `TripRequest` and MUST NOT be shared across trips, even when two trips share the same assigned `Experience`. Itinerary/inclusions/exclusions remain owned by the `Experience` and are identical for every `TripRequest` assigned to it.

#### Scenario: Documents never leak across trips sharing an experience
- GIVEN trip A and trip B are both assigned the same `Experience`
- AND a document is uploaded to trip A
- WHEN trip B's documents are read
- THEN the document uploaded to trip A does not appear

#### Scenario: Itinerary is identical across trips on the same experience
- GIVEN trip A and trip B share the same assigned `Experience`
- WHEN each trip's itinerary is read
- THEN both return the same experience-owned itinerary content

### Requirement: Admin Document Management, Admin-Role Authorized

Admin document create/list/remove endpoints MUST authorize via `hasRoleAccess(caller, "admin")` over `User.roles[]` — never `role === "ADMIN"`. Admins MUST be able to manage documents at any `TripRequest` status, including pre-`REVEALED`. Remove/manage authorization MUST be admin-role-based generally; there MUST be no uploader-ownership check anywhere in this path.

#### Scenario: Admin manages documents before reveal
- GIVEN a trip is `CONFIRMED` (not yet `REVEALED`)
- WHEN an admin adds a document
- THEN the upload succeeds with no `REVEALED` restriction

#### Scenario: Admin B removes admin A's upload
- GIVEN admin A uploaded a document to a trip
- WHEN admin B calls the remove endpoint for that document
- THEN the document is removed successfully — regression proof that upload-ownership-keyed authorization is NOT present

#### Scenario: Non-admin authenticated caller is rejected
- GIVEN a caller without the admin role
- WHEN they call any admin document management endpoint
- THEN the API MUST return `403`

### Requirement: Authenticated Document Read Route

Document reads MUST go through a new authenticated route authorized by `canAccessTrip(tripId, userId)` (buyer OR linked companion) OR `hasRoleAccess(caller, "admin")` as a separate condition — `canAccessTrip` MUST NOT be widened. No session MUST yield `401`. An authenticated caller who is neither buyer, companion, nor admin MUST yield `403`. For non-admin callers, the route MUST also enforce the fulfillment-visibility gate — `status ∈ {REVEALED, COMPLETED, CANCELLED}` — regardless of whether the trip passed through `REVEALED` before reaching its current status; admins are exempt.

(Previously: the gate was `status ∈ {REVEALED, COMPLETED}` only. Widened 2026-08-10 by founder decision: a traveler may need an already-issued voucher for a refund/cancellation dispute, and a cancelled trip has no future "surprise" left to protect regardless of prior reveal state.)

#### Scenario: Companion reads their own trip's documents
- GIVEN a companion traveler is linked to trip X
- WHEN they request trip X's documents
- THEN they receive the same result as the buyer

#### Scenario: Companion on trip X cannot read trip Y's documents
- GIVEN a user is a linked companion on trip X only
- WHEN they request trip Y's documents
- THEN the API MUST return `403`, even though they are a companion elsewhere

#### Scenario: Pre-reveal buyer is denied at the API
- GIVEN a buyer's trip is `CONFIRMED` (not yet `REVEALED`, not `CANCELLED`)
- WHEN the buyer requests that trip's documents directly via this route
- THEN the API MUST return `403`

#### Scenario: Admin reads pre-reveal documents
- GIVEN a trip is `CONFIRMED`
- WHEN an admin requests that trip's documents
- THEN the request succeeds, exempt from the fulfillment-visibility gate

#### Scenario: Revealed-then-cancelled trip still shows documents
- GIVEN a trip was `REVEALED` and is now `CANCELLED`
- WHEN the traveler requests that trip's documents
- THEN they are still visible

#### Scenario: Cancelled trip shows documents even if never revealed
- GIVEN a trip moved directly from `CONFIRMED` to `CANCELLED` without ever passing through `REVEALED`
- AND an admin had already uploaded a document to it
- WHEN the traveler requests that trip's documents
- THEN they are visible, because the gate is satisfied by the current `CANCELLED` status alone, independent of reveal history

#### Scenario: Unauthenticated request
- GIVEN no active session
- WHEN the document route is called
- THEN the API MUST return `401`

**Edge case note (non-blocking, for `sdd-design`/`sdd-tasks`):** a trip that is cancelled from `DRAFT` or `SAVED` (before any admin document ever existed) trivially has nothing to show — the gate being satisfied is moot if `TripDocument` rows are empty. This is not a spec gap: the "Admin Document Management" requirement already permits admins to attach documents at any status, so a pre-`CONFIRMED` trip could in principle be cancelled while already holding documents. No additional scenario is required; flagging only so downstream phases don't treat an empty-but-visible document list on an early-cancelled trip as a bug.

### Requirement: No Blob Key/URL Leakage

No admin or traveler API response MUST include a document's raw blob key or a `/api/upload/[...path]` URL. Clients MUST only ever receive a reference to the new authenticated route.

#### Scenario: Response contains no blob path
- GIVEN any admin or traveler API response listing documents
- WHEN the response body is inspected
- THEN it contains no raw blob storage key or `/api/upload/[...path]` URL

### Requirement: PDF and Image Upload Support

`POST /api/upload` MUST accept `application/pdf` in addition to its existing image MIME types for this feature, and MUST skip `optimizeImage` for non-image uploads.

#### Scenario: PDF upload succeeds unmodified
- GIVEN an admin uploads a PDF voucher
- WHEN the upload completes
- THEN the file is stored without image optimization applied

#### Scenario: Unsupported file type still rejected
- GIVEN a file type outside images and PDF
- WHEN it is uploaded
- THEN the API rejects it with the existing MIME-type error response

### Requirement: Uniform Across Experience Types

Document and itinerary behavior defined in this capability MUST NOT be conditioned on `Experience.type` or `TripRequest.type` equal to `"xsed"`; it applies identically to every experience-based trip type.

#### Scenario: Non-XSED journey trip gets the same treatment
- GIVEN a `REVEALED` journey-family trip (`type !== "xsed"`)
- WHEN its documents and itinerary are read
- THEN the same gating and access rules apply as for an XSED trip
