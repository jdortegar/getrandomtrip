# Design: Form-generated Fulfillment PDFs

## Technical Approach

Separate private authoring from published `TripDocument` reads. Uploads, publication model/DTO, traveler gates and emails remain unchanged.

## Architecture Decisions

| Option | Tradeoff | Decision |
|---|---|---|
| Published-row / separate drafts | Fewer tables / prevents premature fulfillment | Separate drafts |
| Browser/Python / Node React-pdf | Runtime complexity / direct output | Server-only v4 `renderToBuffer` ([API](https://react-pdf.org/docs/v4/node)) |
| Overwrite / immutable generations | Less storage / protects captured references | Immutable publications |
| Best-effort / durable outbox | Simpler / recoverable races | Candidate receipts/tombstones |
| Separate route / fullscreen dialog | Navigation / preserves unsaved trip state | Radix editor |

## Persistence and Snapshots

`TripDocumentDraft`: id, tripRequestId (cascade), template, templateVersion=1, locale, label, country, data JSON, revision=1, previewId/key/revision/size/hash, publishedPreviewId/revision, documentId (unique, nullable, SetNull), createdAt/updatedAt. Template/version immutable; publication/preview metadata server-owned.

`TripDocumentCleanupJob`: id, targets JSON (exact keys/prefixes), purpose, owner/trip/draft/document IDs, preview/revision identity, disposition (`pending|retained|delete`), expiresAt, nextAttemptAt, attempts, lastError, createdAt; no cascading FK.

Creation snapshots buyer locale (`en`, otherwise `es`), name/roster, pax, dates/origin and assigned experience destination/itinerary/provider facts. Normalize legacy/current shapes and HTML to bounded text; multiple provider candidates require selection. Never refresh saved snapshots or infer reservations/payment/supplier claims.

## Interfaces and Validation

Template-discriminated interfaces reject unknown structure. Metadata: label/country/locale. Optional voucher fields: issueDate, reservationReference, paymentWording, supplierConfirmation; holder optional except hotel generation. Providers: name/address/contact/locationUrl/providerUrl. Repeatables preserve stable IDs/order.

| Template | Data; required for generation |
|---|---|
| `xsed-roadmap` | origin, destination, departureDate/time, drivingDuration, stops[{title, directions, date?, time?}], mapUrl; required: first five and one stop |
| `experience-roadmap` | startDate/endDate, origin, destination, duration, heading, activities[{title, description, date?, time?}], mapUrl; required: scalars except mapUrl and one activity |
| `hotel-voucher` | holder, guests, checkInDate/checkOutDate, checkInTime/checkOutTime, property, inclusions[], instructions; required: holder, guests, dates, property name/address |
| `activity-voucher` | participants, provider, date/time, program[], inclusions[], recommendations; required: participants, provider name/address, date/time, program |
| `dinner-voucher` | guests, restaurant, date/time, service, menuItems[], conditions; required: guests, restaurant name/address, date/time, service |

Incomplete strings save. Generation validates real ISO dates, HH:mm destination-local wall times without timezone conversion, ordered ranges, required entries, country catalog and 1–120-character label. Optional credential-free HTTPS links are never fetched. Limits: 128 KiB requests, 4,000-character fields, 50-item arrays; field-path errors.

Endpoints: `/api/admin/trip-requests/[id]/document-drafts` GET/POST; `/:draftId` GET/PATCH/DELETE; item `/render` POST, `/preview` GET, `/attach` POST. Collection includes source candidates; creation accepts template/optional candidate index. Require `requireAdmin`, trip matching, Node/no-store; DTOs omit keys; error codes/paths: 400/401/403/404/409/413/422/503.

## Publication and Cleanup Lifecycle

1. Register each fresh-key candidate before PUT; keep blob I/O outside transactions. Preview: `generated/{trip}/drafts/{draft}/{uuid}`; publication: `generated/{trip}/documents/{document}/{uuid}`.
2. Mutations/deletions lock owner → trips → drafts → documents → outbox, sorting IDs within groups. Authorize/check live ownership first; recognize matching retained publication retries before revision/replacement checks; deleted attachments are not successes.
3. PATCH/DELETE/render require revision. Saves increment revision/invalidate preview. New publication requires current revision/previewId, explicit replaceDocumentId when linked, and byte/hash verification without rerendering; finalization rechecks revision, preview/link and pending disposition.
4. Atomically adopt preview or switch stable document/draft publication markers with retained receipt. Retained publications survive supersession. Ambiguous transaction results require rereading disposition, never exception-driven deletion; unavailable reconciliation remains retryable.
5. Expiry revokes pending adoption under locks, not outstanding PUTs. Deletion atomically cancels scope: draft previews plus unfinished publications, excluding retained publications; attachment generations plus pending replacements, preserving/unlinking draft; trip/account all owned-trip candidates/prefixes and legacy keys. Uploader/tripper relations do not define ownership.
6. Retain compact deletion tombstones; sweep exact keys/prefixes in bounded batches, immediately then authenticated hourly scheduling with capped backoff and alerts without PII, including after absence. SDK retries mean even successful `set`, function termination or `writeSettledAt` cannot prove all PUTs settled. Guarantee eventual cleanup after writes quiesce/storage recovers; ongoing tombstone retention/sweep cost is explicit. Never reset email stamps.

## Files, Verification and Rollout

Targets: `prisma/schema.prisma`; `src/lib/{types,trip-documents,storage}/`; `src/app/api/`; `netlify/functions/`; `src/components/app/admin/trip-fulfillment/`; dictionaries; `assets/pdf/`; `next.config.js`; package manifests.

Bundle licensed static Barlow TTFs ([formats](https://react-pdf.org/docs/v4/fonts))/rasterized local logo; local QR PNGs, clickable links, wrapping A4/fixed page numbering; 4 MiB before storage. Derive editor states from link/publishedRevision; warn on dirty close/Escape/unload.

Strict TDD: parsers/snapshots, isolation, races/ambiguous outcomes/late writes, bytes, cleanup, compatibility and component flows. Ten bilingual PDFs/long-content/QR visual QA; 360/1280 layouts; typecheck/tests/lint/build. Verify DB target before additive schema, no backfill. Auto-chain tested slices; Netlify preview gates release. Issue-link exception approved; size ceiling unchanged.
