# Trip Document Authoring Specification

## Purpose

Author private, editable fulfillment documents for individual trips before publication.

## Requirements

### Requirement: Five Template Forms

Admins MUST create multiple instances of any template on any trip; repeatable sections MUST support adding, removing and reordering.

| Template | Editable content |
|---|---|
| XSED roadmap | Origin/destination, departure date/time, driving duration, ordered stops with local dates/times, directions, map links |
| Experience roadmap | Travel dates, origin/destination, duration, heading, ordered suggested activities with local dates/times, map links |
| Hotel voucher | Issue date, reservation holder/reference, guests, check-in/out dates/times, property/contact details, inclusions, instructions |
| Activity voucher | Issue date, reservation holder/reference, participants, provider, local date/time, program, inclusions, recommendations |
| Dinner voucher | Issue date, reservation holder/reference, guests, restaurant, local date/time, service, menu items, conditions |

#### Scenario: Independent repeatable instances
- GIVEN a trip with one hotel draft
- WHEN an admin creates another and reorders its inclusions
- THEN both persist independently and reopening preserves the new order

### Requirement: Snapshot Prefills and Language

Known trip/provider facts MUST prefill editable snapshots. Draft locale MUST default to buyer language and support English/Spanish. Standard copy MUST be translated; custom text MUST remain unchanged. References, payment wording and supplier confirmations MUST remain admin-controlled, never inferred from traveler payment.

#### Scenario: Source data changes after creation
- GIVEN a saved draft with custom text and buyer-default locale
- WHEN trip/provider information changes and the admin reopens it
- THEN saved content remains unchanged, shared itinerary remains untouched, and locale stays editable

#### Scenario: Paid trip without supplier confirmation
- GIVEN a paid trip without an entered supplier confirmation
- WHEN its voucher is created
- THEN no payment or supplier-confirmation claim is invented

### Requirement: Draft Persistence and Validation

Incomplete drafts MUST save template/version, locale, metadata, validated partial form data and revision separately from published documents. Preview MUST require complete template-specific fields, valid dates/order, destination-catalog country and safe links. Invalid content MUST produce actionable errors without losing edits.

#### Scenario: Save incomplete, then complete
- GIVEN required information is missing or hotel checkout precedes check-in
- WHEN an admin saves, reopens and requests preview
- THEN incomplete content survives, preview is rejected until corrected, and no attachment exists

### Requirement: Optimistic Draft Edits

Writes MUST reject stale revisions without overwriting newer edits; saved changes MUST invalidate previous preview eligibility.

#### Scenario: Concurrent admin edits
- GIVEN two admins opened the same revision
- WHEN one saves before the other
- THEN the second receives a conflict and the first's content remains intact

### Requirement: Private Admin Access

Draft CRUD/render/preview/publication MUST require existing admin-role authorization at any trip status, not uploader ownership. Trip/draft mismatches MUST be rejected. APIs MUST expose only authenticated document URLs, never storage keys/public-upload paths. Drafts MUST never appear in traveler responses or email attachment queries.

#### Scenario: Access isolation
- GIVEN a private draft on trip A
- WHEN an anonymous caller, non-admin, or mismatched trip-B route requests it
- THEN access is denied and no draft data or preview bytes leak

### Requirement: Independent Accessible Editor

Generate document MUST sit beside upload and open a dedicated editor, side-by-side at 1280 px and stacked at 360 px. Save draft/preview/attach MUST be independent of trip Save changes. The editor MUST distinguish drafts, attachments and unpublished edits, warn before discarding unsaved changes, and provide keyboard-accessible, localized controls/errors with AA contrast.

#### Scenario: Navigate away with edits
- GIVEN unsaved document changes and unsaved trip changes
- WHEN the admin leaves the editor or saves only the draft
- THEN discarding requires warning and draft saving does not save trip changes
