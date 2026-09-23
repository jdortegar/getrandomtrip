# Design: Form-generated Fulfillment PDFs

## Technical Approach

Separate private authoring from existing published `TripDocument` reads/emails. Implement the three capability specs with typed forms, server rendering, revision-controlled publication and durable cleanup.

## Architecture Decisions

| Option | Tradeoff | Decision |
|---|---|---|
| Drafts on published rows / separate drafts | Fewer tables / prevents premature fulfillment | Separate drafts |
| Browser/Python rendering / Node React-pdf | Runtime complexity / direct Node output | Server-only v4 `renderToBuffer` ([API](https://react-pdf.org/docs/v4/node)) |
| Overwrite blobs / immutable generations | Less storage / protects captured email/download references | Immutable published generations |
| Best-effort cleanup / durable outbox | Simpler / retries survive cascades | Transactional cleanup jobs |
| Separate route / fullscreen dialog | Navigation / preserves unsaved trip state | Dedicated Radix editor dialog |

## Persistence and Data Flow

`TripDocumentDraft`: id, tripRequestId (cascade), template, templateVersion=1, locale, label, country, data JSON, revision=1, previewId/key/revision/size/hash, publishedPreviewId/revision, documentId (unique, nullable, SetNull), createdAt/updatedAt. Template/version are immutable; blank metadata/content can save. Preview/publication metadata stays server-owned.

`TripDocumentCleanupJob`: id, targets JSON (exact keys/prefixes), attempts, lastError, createdAt; no cascading FK. Existing publication model/DTO remain unchanged.

Form → save snapshot → validated revision → render → private preview → explicit publish → existing document routes/emails.

Creation snapshots buyer locale (`en`, otherwise `es`), name/roster, pax, trip dates/origin and assigned experience destination/itinerary/provider facts. Normalize known legacy/current JSON shapes and convert authored HTML to bounded plain text. Multiple provider candidates require selection; do not guess reservations. Never reread sources into saved drafts or derive supplier/payment claims.

## Interfaces and Validation

Manual interfaces use a template-discriminated union; parsers reject unknown structure. Common metadata: label, country, locale. Optional voucher fields: holder, issueDate, reservationReference, paymentWording, supplierConfirmation. Providers contain name, address, contact, locationUrl, providerUrl. Repeatables have stable IDs and preserve array order.

| Template | Data; required for generation |
|---|---|
| `xsed-roadmap` | origin, destination, departureDate/time, drivingDuration, stops[{title, directions, date?, time?}], mapUrl; required: first five and one stop |
| `experience-roadmap` | startDate/endDate, origin, destination, duration, heading, activities[{title, description, date?, time?}], mapUrl; required: scalars except mapUrl and one activity |
| `hotel-voucher` | holder, guests, checkInDate/checkOutDate, checkInTime/checkOutTime, property, inclusions[], instructions; required: holder, guests, dates, property name/address |
| `activity-voucher` | participants, provider, date/time, program[], inclusions[], recommendations; required: participants, provider name/address, date/time, program |
| `dinner-voucher` | guests, restaurant, date/time, service, menuItems[], conditions; required: guests, restaurant name/address, date/time, service |

Drafts accept incomplete strings. Generation validates real ISO calendar dates, HH:mm times, ordered date ranges, nonempty required entries, existing country catalog and label length 1–120. Dates/times represent destination-local wall time, without timezone conversion. Links are optional HTTPS URLs without credentials; never fetch them. Bound requests to 128 KiB, text fields to 4,000 characters, arrays to 50 items; report field-path errors.

All endpoints under `/api/admin/trip-requests/[id]/document-drafts`: collection GET/POST; `/:draftId` GET/PATCH/DELETE; item `/render` POST, `/preview` GET, `/attach` POST. Collection GET includes creation-source candidates; POST accepts template and optional candidate index. Require `requireAdmin`, trip matching, Node runtime and no-store. DTOs omit keys; errors use codes/field paths (400/401/403/404/409/413/422/503).

PATCH/DELETE require expected revision. Render requires revision; attach requires revision, previewId and explicit replaceDocumentId when linked. Saves increment revision/invalidate preview. Serialize mutation finalization with a draft-row lock; recheck revision, preview identity and link after blob I/O. Duplicate publication returns the existing document; stale/conflicting requests return 409. Derive draft/attached/unpublished-edit states from link and publishedRevision; warn on dirty close, Escape and unload.

Render stores fresh preview bytes under `generated/{trip}/drafts/{draft}/{uuid}`. Publication copies verified preview bytes/hash to `generated/{trip}/documents/{document}/{uuid}`, then transactionally switches the stable document row and draft publication marker. Losing/failed candidates enqueue cleanup; never mutate published bytes or email stamps.

Deletion atomically enqueues cleanup: draft deletes preview prefix only; attachment unlinks surviving draft and deletes every published generation; both trip-delete routes and admin-account deletion enqueue complete trip prefixes plus legacy upload keys. Drain immediately and retry hourly via authenticated internal worker; log failures without PII.

## Files, Tests and Rollout

| Area | Changes |
|---|---|
| `prisma/schema.prisma` | Draft/outbox models |
| `src/lib/{types,trip-documents,storage}/` | DTOs, parsers, snapshots, publication, cleanup, five templates/shared A4 renderer |
| `src/app/api/`, `netlify/functions/` | Thin endpoints, deletion hooks, cleanup worker |
| `src/components/app/admin/trip-fulfillment/`, dictionaries | Editor, repeatables, states, unsaved warnings, localized copy |
| `assets/pdf/`, `next.config.js`, package manifests | Licensed static Barlow TTFs/logo, tracing, PDF/QR dependencies |

Bundle static fonts ([supported formats](https://react-pdf.org/docs/v4/fonts)); locally rasterize existing SVG logo once. Use local QR PNGs, clickable links, wrapping A4 content and fixed page numbering; enforce 4 MiB before storage.

Strict TDD: parsers/snapshots, authorization/isolation, concurrent edits/publication, byte equality, failures/cleanup, unchanged downloads/emails; component flows and ten PDF fixtures, long-content/QR visual QA, 360/1280 layouts. Run typecheck/tests/lint/build. Additive schema only after database-target verification; no backfill. Auto-chain independently tested slices into feature branch; Netlify preview smoke test gates release. Issues-disabled PR gate remains external. No unresolved product decisions.
