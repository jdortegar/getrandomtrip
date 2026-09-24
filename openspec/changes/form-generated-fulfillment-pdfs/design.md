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
5. Expiry revokes pending adoption under locks, not outstanding PUTs. Deletion atomically cancels scope: draft previews plus unfinished publications, excluding retained publications; attachment generations plus pending replacements, preserving/unlinking draft; trip/account all owned-trip candidate exact keys and known uploaded-document keys. Uploader/tripper relations do not define ownership.
6. Retain compact deletion tombstones; sweep registered exact keys in bounded batches, immediately then authenticated hourly scheduling with capped backoff and alerts without PII, including after absence. SDK retries mean even successful `set`, function termination or `writeSettledAt` cannot prove all PUTs settled. Guarantee eventual cleanup after writes quiesce/storage recovers; ongoing tombstone retention/sweep cost is explicit. Never reset email stamps.

## Files, Verification and Rollout

Targets: `prisma/schema.prisma`; `src/lib/{types,trip-documents,storage}/`; `src/app/api/`; `netlify/functions/`; `src/components/app/admin/trip-fulfillment/`; dictionaries; `assets/pdf/`; `next.config.js`; package manifests.

Bundle licensed static Barlow TTFs ([formats](https://react-pdf.org/docs/v4/fonts))/rasterized local logo; local QR PNGs, clickable links, wrapping A4/fixed page numbering; 4 MiB before storage. Derive editor states from link/publishedRevision; warn on dirty close/Escape/unload.

Strict TDD: parsers/snapshots, isolation, races/ambiguous outcomes/late writes, bytes, cleanup, compatibility and component flows. Ten bilingual PDFs/long-content/QR visual QA; 360/1280 layouts; typecheck/tests/lint/build. Verify DB target before additive schema, no backfill. Auto-chain tested slices; Netlify preview gates release. Issue-link exception approved; size ceiling unchanged.

## Generated-file Cleanup Amendment (2026-09-24)

Decision3139 narrows generated-file cleanup to the durable exact-key candidate ledger: every generated PUT must have a committed unique candidate receipt first. Generated keys therefore never require provider prefix enumeration. Existing uploaded documents retain their known-key cleanup path; this is not a claim to discover historical unregistered orphans.

- Candidate rows and deletion tombstones survive parent deletion without cascading foreign keys. Scope cancellation selects registered identities under the existing ordered locks, excluding retained publications where required.
- Deleted/absent exact keys remain scheduled permanently: SDK retries may materialize a late PUT after a successful deletion. Neither absence nor successful upload completion retires the tombstone.
- The worker selects bounded due jobs fairly by nextAttemptAt and stable ID, advances every processed job to a future attempt (including absent/success cases), and applies capped retry backoff on failures. Repeated runs must not starve later jobs; lease/concurrency handling must preserve rescheduling and never lose ownership identity.
- Existing schema fields support this policy; no SDK cursor or schema expansion is required. The blocked prefix executor in stash `8bdd8a36` is superseded for generated-file delivery and must not be restored. Pure prefix planning history remains historical, not an execution dependency.
- Implement private preview/publication services before scheduling the worker. Storage adapters use raw validated receipt keys, never URLs, and never perform exception-driven deletion after ambiguous PUT/adoption outcomes.

## Browser-memory Preview Amendment (2026-09-24, user approved)

Preview now means server rendering returned directly to the browser, with no storage PUT, preview candidate, or server-memory cache. Only explicit Attach persists bytes. Existing stored-preview paths remain compatible during rollout.

- The existing draft previewId/revision/SHA-256/size fields bind the server-rendered bytes; previewKey is null. This server-owned, locked DB record is authoritative, so a client-supplied PDF cannot be accepted merely on its own digest assertion.
- A server-generated UUIDv7 carries immutable issue time and cryptographic randomness (RFC9562 section5.7); transient identities reject future timestamps and expire at one hour. No schema, credential, secret or package change is needed. Updating draft.updatedAt cannot extend expiry.
- Attach authenticates before bounded raw-PDF body reading, verifies exact bytes against the current live locked identity/revision/digest/size and expiry, and registers the publication candidate before PUT. Finalization rechecks binding/expiry. Retained matching publication receipts are reconciled first so successful retries remain idempotent after expiry or later replacement.
- Browser retains the reviewed Blob across ambiguous attach retries; Attach never rerenders. Editing, changing draft, explicit new preview, or deletion invalidates old identities. Existing immutable publication, replacement confirmation, safe DTOs, email isolation and durable exact-key cleanup remain unchanged.
- Legacy preview blobs remain scheduled for retirement using existing exact-key receipts. No claim that existing Netlify authorization failure is repaired: it can still block explicit Attach.
