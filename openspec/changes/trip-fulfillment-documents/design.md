# Design: Trip Fulfillment & Documents

Executes `proposal.md` + the three spec deltas. Product decisions are settled upstream; this document fixes the technical shape only. Two spec/proposal statements are **corrected** below on verified-code grounds (ADR-1, ADR-3) — both preserve the stated *intent*.

**Revision 2026-08-10 — both previously-open product forks are now CLOSED by the founder.** They are folded into ADR-5 and ADR-6 as final decisions; the "Open Questions" section is empty by design.

| Fork | Founder decision | Lands in |
|---|---|---|
| Documents after `CANCELLED` | **Visible.** The gate set widens to `{REVEALED, COMPLETED, CANCELLED}`. A traveler may need an already-issued voucher for a refund or cancellation dispute, and a cancelled trip has no future surprise left to protect. | ADR-6 |
| Semantics of `country` | **Destination country, not operating market.** Validated against the full `AMERICAN_COUNTRIES` catalog (24 entries), not a 5-market subset — Brasil and Colombia are real destinations. | ADR-5 |

## Technical Approach

Five vertical slices, each independently shippable, ordered by dependency:

1. **Pure helpers + the case-mismatch fix** — no schema, no UI. All RED-first units.
2. **Persistence + access layer** — `TripDocument`, a private blob store, the admin write routes, the authenticated stream route.
3. **Admin fulfillment page** — replaces `TripRequestModal`.
4. **XSED authoring** — itinerary/inclusions/exclusions.
5. **Traveler surface + the server-side fulfillment-visibility gate** (`REVEALED`/`COMPLETED`/`CANCELLED` — see ADR-6).

No `prisma/migrations/` directory exists — this repo uses `prisma db push` (`npm run db:migrate` is aliased to it). The schema edit ships with `npm run db:push && npm run db:generate`.

## Architecture Decisions

### ADR-1: Documents upload through a dedicated server-side multipart admin route — NOT through `POST /api/upload`

| Option | Tradeoff | Decision |
|---|---|---|
| Two-step: client `POST /api/upload` → gets `{url}` → `POST` document row with that url | Serializes the document blob URL **to the client**, and `GET /api/upload/[...path]` is unauthenticated → voucher PII becomes world-readable to anyone holding the URL | **Rejected** |
| `POST /api/admin/trip-documents` accepts `multipart/form-data` and writes the blob server-side | Key never leaves the server; one round-trip; own MIME allowlist | **Chosen** |

Resolved Decision #1 states the control is that "document blob keys/URLs are **never serialized into any API response**". A two-step upload violates that in the upload response itself, so in-scope item 5's phrasing ("extend `POST /api/upload`") cannot be the document path. The spec's literal PDF requirement is still honoured: `POST /api/upload` **does** gain `application/pdf` in `ALLOWED_MIME_TYPES` (a one-line change; `optimizeImage` already no-ops on non-`COMPRESSIBLE_MIME` input, so no bypass logic is needed) for other features — but the document flow does not call it.

### ADR-2: Private `trip-documents` blob store, opaque keys, direct server-side delete

Key shape `{tripRequestId}/{randomUUID}` — no user id, no original filename, no extension (`mimeType` lives on the row). Written to a **new** Netlify Blobs store named `trip-documents` via `src/lib/storage/tripDocumentStore.ts`, which is a ~12-line duplicate of the `getBlobStore` helper already copy-pasted in both upload routes. Duplication is accepted deliberately: Resolved Decision #1 says `src/app/api/upload/[...path]/route.ts` is **not modified**, and extracting a shared helper would mean editing it.

Delete order: `prisma.tripDocument.delete()` **first**, then best-effort `store.delete(storageKey)` inside `try/catch`. Guarantees no dangling row (the proposal's stated preference); worst case is an orphan blob in a store nothing can read. The handler **never** calls `DELETE /api/upload/[...path]` — that is what would re-apply the `key.startsWith(session.user.id + "/")` ownership check and silently defeat Resolved Decision #2.

`uploadedById` is nullable audit metadata and is **never read as an authorization input**.

### ADR-3: Type-filter normalization is per-token canonicalization, NOT blanket uppercasing

The `experience` spec delta's parenthetical — "normalize … to the same case in which `Experience.type` values are stored (uppercase)" — is **factually wrong** and blanket `.toUpperCase()` would introduce a worse regression than the bug it fixes. Verified: `Experience.type` stores journey traveler types **lowercase** (`type: ["couple"]`, `src/app/api/tripper/experiences/route.ts:95`, and every fixture) and only the `"XSED"` sentinel uppercase (`src/app/api/admin/xsed/route.ts:122`). Uppercasing would break `?type=couple`.

```ts
// src/lib/experiences/experienceTypeFilter.ts
export const XSED_EXPERIENCE_TYPE = "XSED";
export const TRAVELER_EXPERIENCE_TYPES = ["couple","family","group","solo","honeymoon","paws"] as const;

/** Maps a caller-supplied `type` filter to the exact casing stored on `Experience.type`.
 *  Unknown tokens pass through trimmed — never silently mangled. */
export function canonicalizeExperienceTypeFilter(raw: string): string;
```

Applied at exactly one boundary: `src/app/api/admin/experiences/route.ts:53`. `buildAssignableExperiencesQuery` keeps forwarding `trip.type` verbatim — it is relocated, not changed.

### ADR-4: Document MIME allowlist is PDF + JPEG + PNG only

The admin prototype's own file-zone caption is *"PDF, JPG or PNG · up to 10 MB"*. Excluding `image/svg+xml` (which the general upload route does allow) is a security win, not a limitation: the stream route serves documents `inline` for the View action, and inline SVG executes script in our origin. Allowlist lives in `src/lib/upload/documentMimeTypes.ts`, separate from `POST /api/upload`'s broader set.

### ADR-5 (FINAL, revised): `country` is a **destination** ISO alpha-2 code validated against the full `AMERICAN_COUNTRIES` catalog

The founder settled the semantic question: the tag describes **where the document is used**, not which market sold the drop. A Colombian hotel voucher or a Brazilian transfer voucher must be attachable, so the closed 5-market list is wrong and is dropped.

| Option | Tradeoff | Decision |
|---|---|---|
| Prisma enum | Adding a country needs a schema change + `db push`; 24 values in the schema | Rejected |
| Free text | Spec still requires `422` for off-catalog values | Rejected |
| `OPERATING_MARKET_CODES` (AR/CL/PE/MX/UY) | Hard-blocks legitimate destinations with a `422`; wrong semantics | **Rejected — superseded** |
| `String` column + validator derived from `AMERICAN_COUNTRIES` | One source of truth already in the repo; adding a country is a catalog edit, no migration, no constant to sync | **Chosen** |

`src/lib/markets/operatingMarkets.ts` is **not created**. `AMERICAN_COUNTRIES` (`src/lib/data/shared/countries.ts`, 24 countries: AR BR CL CO MX PE UY VE EC BO PY US CA CR PA GT HN SV NI CU DO HT JM TT) is the source of truth, and the helper is a thin **derivation** of it — there is no second list to keep in sync:

```ts
// src/lib/trips/destinationCountries.ts
/** Derived, never hand-written — order matches the catalog for stable <select> options. */
export const DESTINATION_COUNTRY_CODES: string[] = AMERICAN_COUNTRIES.map((c) => c.code);
/** True iff `value` is a code present in AMERICAN_COUNTRIES. Delegates to getCountryByCode. */
export function isDestinationCountryCode(value: unknown): value is string;
```

`country` stays a plain `string` at the type level: `AMERICAN_COUNTRIES` is annotated `Country[]`, so `code` widens to `string` and no literal union is derivable without duplicating the codes — which is exactly the duplication this ADR removes. Runtime validity is the predicate's job, and the `422` contract is unchanged.

Precedent for the picker already exists: `CheckoutContactCard.tsx:306` maps `AMERICAN_COUNTRIES` straight into a `FormSelectField` with `value={c.code}`. The admin form does the same, differing only in label source (below).

**Drift-guard mechanism, re-verified for 24 entries.** The old guard checked a hand-written list against the catalog. That guard is now *structurally unnecessary* — the codes are derived, so list-vs-catalog drift is impossible by construction. The guard is therefore **repointed at the real remaining drift risk**: label coverage. A single unit test asserts every code in `DESTINATION_COUNTRY_CODES` has a non-empty key in both `es.json` and `en.json` `common.countries`, and that neither locale carries an extra key. It is one `forEach` over 24 codes, still cheap, and it now fails loudly the day someone appends a 25th country to the catalog without adding copy — a failure mode the 5-entry version could not catch.

Display labels do **not** come from `AMERICAN_COUNTRIES.name` (Spanish only: "México", "Perú", "Estados Unidos", "Canadá") and **not** from `aliases` (a matching affordance, present on only 9 of 24 entries, not a display field). They come from a new **`common.countries`** dictionary section keyed by ISO code, 24 entries per locale — see the i18n Plan. `common.markets` from the previous revision is not created; `common` already exists at `src/lib/types/dictionary.ts:1841` and `src/dictionaries/*.json:35`, so this is an additive field on a real section, correctly scoped for 24 entries rather than 5.

### ADR-6 (FINAL, revised): fulfillment visibility is one shared pure predicate over `{REVEALED, COMPLETED, CANCELLED}`, consumed by API handlers only

```ts
// src/lib/trips/fulfillmentVisibility.ts
/** Founder decision 2026-08-10: CANCELLED is INCLUDED. An already-issued voucher is
 *  evidence a traveler may need for a refund/cancellation dispute, and a cancelled trip
 *  has no future surprise left to protect. */
export const FULFILLMENT_VISIBLE_STATUSES = new Set(["REVEALED", "COMPLETED", "CANCELLED"]);
/** Admins are exempt (they author pre-reveal). Everyone else is status-gated. */
export function isFulfillmentVisible(status: string, isAdmin: boolean): boolean;
```

The signature is unchanged — the widening is entirely inside the status set, so the admin-exemption logic is untouched. Hidden statuses are exactly the four pre-reveal ones: `DRAFT`, `SAVED`, `PENDING_PAYMENT`, `CONFIRMED`. Note this is *not* a monotonic "reveal is a one-way door" rule: `CANCELLED` is reachable from pre-reveal statuses too, so a trip cancelled while `PENDING_PAYMENT` will expose its (empty) document list and its shared experience itinerary. Accepted: pre-reveal trips have no documents by construction, and the itinerary is shared-per-drop reference content, not the surprise — the destination reveal is gated separately by the existing reveal pipeline.

`GET /api/trips/[id]` calls it with `isAdmin: false` **unconditionally** — that endpoint stays buyer/companion-only (no admin bypass added), so a companion cannot see pre-reveal content just by being authorized on the trip. This call site is unchanged by the widening; it inherits the new status set automatically because the set lives in the helper, not at the call site. The stream route passes the caller's real admin state. The client page keeps no gating logic; it renders whatever the API sends plus a pre-reveal notice keyed off `trip.status`, which is always returned.

### ADR-7: XSED gets parallel thin steps + one extracted primitive — the tripper components are not adapted

Open Question #1 is closed with **parallel implementation**, not an adapter and not generification. Evidence from reading the files:

- `ItineraryStep`/`InclusionsStep` read their own intro copy through positional indexes into the *tripper* tab tree (`copy.contentTabs[2]?.substeps[1]?.description`, `copy.contentTabs[3]?.substeps[2]?.description`). An adapter would have to fabricate a fake `contentTabs` array with matching indexes to keep those lookups alive — strictly worse than ~80 lines of parallel JSX.
- `ItineraryStep` requires `imageState: ExperienceImageState` from `NewExperienceShell` (a deferred-upload contract). XSED steps upload immediately and inline (`XsedGalleryStep`, `XsedSectionsStep`, `XsedIdentityStep` all `POST /api/upload` with `feature=xsed`). Adapting means inventing a shim for a contract XSED does not have.
- Generifying = editing the live tripper authoring flow, which is exactly the scope creep the proposal's risk table says to avoid.

New `XsedItineraryStep` / `XsedInclusionsStep` follow the established local XSED contract (`copy: AdminXsedDict["form"]["fields"][…]`, `form: XsedDropDraft`, `onChange(patch: Partial<XsedDropDraft>)`) exactly like `XsedActivitiesStep`. The one genuinely shared piece — `InclusionsStep`'s private `ChipList` — is promoted to `src/components/ui/ChipListInput.tsx` per `component-patterns.md`, and the tripper `InclusionsStep` is refactored to consume it with identical markup (zero visual delta).

**Sub-question answered: XSED itinerary days get no per-day image.** The traveler details page renders only `day.title` / `day.description` (lines 121–143) and never `day.image`; XSED already has a gallery and per-section photos; and day images would drag in the `imageState` contract above. `ItineraryDayEntry.image` stays in the type for shape parity with tripper experiences and is written as `null`.

### ADR-8: Bug-fix landing site and modal removal

`buildAssignableExperiencesQuery` moves verbatim (plus its test) to `src/lib/admin/assignableExperiences.ts` — it is pure and must survive the modal's deletion. `src/components/app/admin/TripRequestModal.tsx` is **deleted** in the same slice as the new page, as the last commit of that slice (per the rollback plan), not left as dead code. Its sub-components `TripRequestDetails`, `TripStatusTimeline`, `StatusBadge` are reused **unchanged**.

## Data Flow

```
ADMIN AUTHORING
  AddTripDocumentForm ──multipart──► POST /api/admin/trip-documents
    (label, country, file)              │ requireAdmin (hasRoleAccess roles[])
                                        │ isDestinationCountryCode → 422
                                        │ isAllowedDocumentMime → 415
                                        ├─► trip-documents store.set({tripId}/{uuid})
                                        └─► prisma.tripDocument.create({ storageKey })
                                              └─► 201 { document: TripDocumentDTO }  (href only, no key)

READ (both surfaces, ONE route)
  Admin page ─┐
              ├──► GET /api/trips/[id]/documents/[documentId][?download=1]
  Traveler ───┘        │ session? ──no──► 401
                       │ canAccessTrip(id,uid) OR hasRoleAccess(admin) ──no──► 403
                       │ isFulfillmentVisible(trip.status, isAdmin) ──no──► 403
                       │ doc.tripRequestId === id ──no──► 404
                       └─► stream blob (private, no-store, nosniff, Content-Disposition)

TRAVELER LIST
  details/page.tsx ──► GET /api/trips/[id]
                         │ canAccessTrip only (no admin bypass)
                         └─► isFulfillmentVisible(status, false)
                               REVEALED | COMPLETED | CANCELLED → include
                               DRAFT | SAVED | PENDING_PAYMENT | CONFIRMED
                                 → OMIT itinerary/inclusions/exclusions/documents
```

## Prisma Schema Addition

```prisma
model TripDocument {
  id            String @id @default(cuid())
  tripRequestId String
  /// Free-text admin label, e.g. "Hotel Confirmation". No fixed categories by design.
  label         String
  /// Destination country. ISO 3166-1 alpha-2, validated app-side against the full
  /// AMERICAN_COUNTRIES catalog via isDestinationCountryCode (not a DB enum).
  country       String
  /// Opaque key in the private `trip-documents` blob store. MUST NEVER be serialized to a client.
  storageKey    String @unique
  /// application/pdf | image/jpeg | image/png
  mimeType      String
  /// Display + download filename only; never used to build storageKey.
  originalFilename String
  /// Stored blob size in bytes.
  sizeBytes     Int
  /// Audit metadata ONLY — MUST NOT be read as an authorization input (see ADR-2).
  uploadedById  String?
  createdAt     DateTime @default(now())

  tripRequest TripRequest @relation(fields: [tripRequestId], references: [id], onDelete: Cascade)
  uploadedBy  User?       @relation("TripDocumentsUploaded", fields: [uploadedById], references: [id], onDelete: SetNull)

  @@index([tripRequestId, createdAt])
  @@map("trip_documents")
}
```

Deliberately **no** `status`/`confirmed` column — row presence is the confirmation. `onDelete: Cascade` on the trip (blobs orphan; accepted, private store). `SetNull` on the uploader so deactivating an admin never deletes a traveler's voucher. Back-relations: `tripDocuments TripDocument[]` on `TripRequest`, `tripDocumentsUploaded TripDocument[] @relation("TripDocumentsUploaded")` on `User`.

## Interfaces / Contracts

```ts
// src/types/tripDocument.ts — the ONLY shape any client ever receives
export interface TripDocumentDTO {
  id: string;
  label: string;
  /** Destination country, ISO 3166-1 alpha-2, guaranteed present in AMERICAN_COUNTRIES. */
  country: string;
  mimeType: string;
  originalFilename: string;
  sizeBytes: number;
  createdAt: string;              // ISO
  /** Authenticated stream route. Never a blob key or /api/upload URL. */
  href: string;                   // /api/trips/{tripRequestId}/documents/{id}
  downloadHref: string;           // `${href}?download=1`
}
```

`toTripDocumentDTO(row)` (`src/lib/trips/tripDocumentDto.ts`) is the single mapper; its unit test asserts the output has **no** `storageKey`, `fileUrl`, or `/api/upload` substring — that test *is* the "No Blob Key/URL Leakage" requirement.

### `POST /api/admin/trip-documents` — `multipart/form-data`

| Field | Rule |
|---|---|
| `tripRequestId` | required, existing `TripRequest` |
| `label` | required, trimmed, 1–120 chars |
| `country` | required, `isDestinationCountryCode` (full `AMERICAN_COUNTRIES` catalog) |
| `file` | required, ≤ 10 MB, `isAllowedDocumentMime` |

`201 { document: TripDocumentDTO }` · `400 {error:"invalid_request",field}` · `401` · `403` · `404 {error:"trip_not_found"}` · `413 {error:"file_too_large"}` · `415 {error:"unsupported_file_type"}` · `422 {error:"invalid_country"}` · `503 {error:"storage_unavailable"}`

### `DELETE /api/admin/trip-documents/[documentId]`

`204` (no body) · `401` · `403` · `404`. Admin-role only; **no** uploader check. Row deleted, then blob best-effort.

### `GET /api/trips/[id]/documents/[documentId]?download=1`

`200` binary. Headers: `Content-Type: {mimeType}`, `Content-Disposition: {inline|attachment}; filename="{originalFilename}"`, `Cache-Control: private, no-store` (stricter than the image route's `max-age=86400` — this is PII), `X-Content-Type-Options: nosniff`. · `401` no session · `403` not buyer/companion/admin, **or** non-admin failing `isFulfillmentVisible` (i.e. `DRAFT`/`SAVED`/`PENDING_PAYMENT`/`CONFIRMED`; `CANCELLED` now passes) · `404` unknown doc or doc not on this trip.

### `GET /api/admin/trip-requests/[id]` (new handler in the existing file)

`200 { tripRequest: AdminTripRequest, experienceItinerary: { title, itinerary, inclusions, exclusions } | null, documents: TripDocumentDTO[] }` · `401` · `403` · `404`. Single fetch for the whole admin page. Never status-gated (admins author pre-reveal). Reuses `attachAdminTripRequestRelations`.

### `GET /api/trips/[id]` (modified)

`200 { trip: { ...trip, roster, documents? } }`. The call is `isFulfillmentVisible(trip.status, false)` — `isAdmin` hardcoded `false`, unchanged by this revision. When it returns false (`DRAFT`, `SAVED`, `PENDING_PAYMENT`, `CONFIRMED`), the handler **deletes** `experience.itinerary`, `experience.inclusions`, `experience.exclusions` and omits `documents` entirely. `REVEALED`, `COMPLETED` and `CANCELLED` all include the full payload. `status`, `experience.id/title/heroImage/destination*` are always returned so the client can render the pre-reveal notice.

### `PUT`/`POST /api/admin/xsed[/[id]]` (modified)

Whitelist gains `itinerary`, `inclusions`, `exclusions`, all via the existing `safeJsonParse`. `XsedDropDraft` gains `itinerary: ItineraryDayEntry[]`, `inclusions: string[]`, `exclusions: string[]`; `EMPTY_XSED_DRAFT` seeds `[{ title:"", description:"", image:null }]`, `[]`, `[]`.

## File Changes

| File | Action | Slice |
|---|---|---|
| `src/lib/experiences/experienceTypeFilter.ts` (+`__tests__`) | Create | 1 |
| `src/app/api/admin/experiences/route.ts` | Modify — canonicalize `type` at line 53 | 1 |
| `src/lib/admin/assignableExperiences.ts` (+`__tests__`) | Create — relocated verbatim | 1 |
| `src/lib/trips/destinationCountries.ts` (+`__tests__`) | Create — derived from `AMERICAN_COUNTRIES`; replaces the dropped `src/lib/markets/operatingMarkets.ts` | 1 |
| `src/lib/upload/documentMimeTypes.ts` (+`__tests__`) | Create | 1 |
| `src/lib/trips/fulfillmentVisibility.ts` (+`__tests__`) | Create | 1 |
| `prisma/schema.prisma` | Modify — `TripDocument` + 2 back-relations | 2 |
| `src/types/tripDocument.ts` | Create | 2 |
| `src/lib/trips/tripDocumentDto.ts` (+`__tests__`) | Create | 2 |
| `src/lib/storage/tripDocumentStore.ts` (+`__tests__`) | Create — store + `buildTripDocumentKey` | 2 |
| `src/lib/admin/requireAdmin.ts` | Create — extracted `requireAdmin` shape, used by new routes only | 2 |
| `src/app/api/admin/trip-documents/route.ts` (+`__tests__`) | Create — `POST` | 2 |
| `src/app/api/admin/trip-documents/[documentId]/route.ts` (+`__tests__`) | Create — `DELETE` | 2 |
| `src/app/api/trips/[id]/documents/[documentId]/route.ts` (+`__tests__`) | Create — authenticated stream | 2 |
| `src/app/api/upload/route.ts` | Modify — `+application/pdf` in `ALLOWED_MIME_TYPES` | 2 |
| `src/app/api/admin/trip-requests/[id]/route.ts` | Modify — add `GET` | 3 |
| `…/dashboard/admin/trip-requests/[id]/page.tsx` | Create — server page (locale + dict) | 3 |
| `…/dashboard/admin/trip-requests/[id]/AdminTripFulfillmentPageClient.tsx` | Create — fetch + draft state | 3 |
| `src/components/app/admin/trip-fulfillment/TripFulfillmentHeader.tsx` | Create — badges, back link, `mailto:` | 3 |
| `…/trip-fulfillment/TripManagePanel.tsx` | Create — experience select + derived destination + status | 3 |
| `…/trip-fulfillment/TripItineraryReference.tsx` | Create — Section 2, read-only + reference note | 3 |
| `…/trip-fulfillment/TripDocumentsTable.tsx` | Create — Document/Country/Uploaded/Actions | 3 |
| `…/trip-fulfillment/AddTripDocumentForm.tsx` | Create — Label + Country select + drop zone | 3 |
| `…/trip-fulfillment/TripDangerZone.tsx` | Create — carried from modal | 3 |
| `…/trip-fulfillment/TripFulfillmentSaveBar.tsx` | Create — page-level Save/Discard | 3 |
| `src/components/app/admin/TripRequestModal.tsx` | **Delete** — last commit of slice 3 | 3 |
| `src/components/app/admin/__tests__/TripRequestModal.assignableExperiencesQuery.test.ts` | **Delete** — relocated in slice 1 | 3 |
| `…/dashboard/admin/AdminTripRequestsPageClient.tsx` | Modify — drop modal, pass `locale` | 3 |
| `src/components/app/admin/TripRequestsTable.tsx` / `TripRequestsTableRow.tsx` | Modify — `TableIconLink` to the page, drop `onEdit`/`selectedId` | 3 |
| `src/types/xsed.ts` | Modify — 3 new draft fields | 4 |
| `src/components/ui/ChipListInput.tsx` | Create — promoted from `InclusionsStep` | 4 |
| `…/tripper/experiences/steps/InclusionsStep.tsx` | Modify — consume `ChipListInput` | 4 |
| `…/admin/xsed/steps/XsedItineraryStep.tsx`, `XsedInclusionsStep.tsx` | Create | 4 |
| `…/admin/xsed/XsedDropShell.tsx` | Modify — step map entries | 4 |
| `src/app/api/admin/xsed/route.ts`, `…/[id]/route.ts` | Modify — whitelist 3 fields | 4 |
| `…/dashboard/admin/xsed/[id]/edit/page.tsx` | Modify — map 3 fields into draft | 4 |
| `src/app/api/trips/[id]/route.ts` (+`__tests__`) | Modify — gate + `documents` | 5 |
| `…/dashboard/trips/[id]/details/page.tsx` | Modify — Documents section + pre-reveal notice | 5 |
| `src/components/app/dashboard/traveler/TripDocumentsSection.tsx` | Create | 5 |
| `src/lib/types/dictionary.ts` | Modify — `AdminTripFulfillmentDict`, `common.countries`, `TripItineraryDict` +7 keys, `AdminXsedDict.form.fields.itinerary` | 1–5 |
| `src/dictionaries/es.json`, `src/dictionaries/en.json` | Modify — every key above, both locales | 1–5 |

## i18n Plan

The prototypes are English-only mockups; every string ships in **both** locales per `.claude/rules/i18n-and-types.md`.

- **New section `adminTripFulfillment`** — page eyebrow/title, `itineraryReferenceBadge` (`"Reference only · shared by every traveler on {experience}"`, interpolated via `interpolateTemplate`), `itineraryReferenceBody` (edit-it-in-the-Experience-Editor copy), `documentsTitle`, `documentsNote` (the "no separate confirmed flag" copy), `documentsColumns.{document,country,uploaded,actions}`, `addDocument.{title,label,labelPlaceholder,country,countryPlaceholder,file,fileHint}` where `fileHint` = "PDF, JPG or PNG · up to 10 MB", `documentsEmpty`, `remove`/`removeConfirm`, `view`, `download`, `save`/`discard`, plus error keys mapping 1:1 to the route's error codes.
- **`adminTripEditModal` is kept under its current name** even though the modal is gone — the list page, KPI strip and filter bar all consume its `tripStatus` labels. Renaming is mechanical churn outside this change's value; recorded as accepted debt.
- **`common.countries`** — `Record<string, string>` keyed by ISO alpha-2, **all 24 catalog codes** (`AR BR CL CO MX PE UY VE EC BO PY US CA CR PA GT HN SV NI CU DO HT JM TT`), in both locales. Shared by the admin `<select>`, the admin documents table and the traveler documents list so the label map exists exactly once. `es` values track `AMERICAN_COUNTRIES.name` ("Brasil", "México", "Estados Unidos"); `en` values are the English exonyms ("Brazil", "Mexico", "United States"). Typed as `common: { …; countries: Record<string, string> }` — an index signature, not 24 required literal keys, because the coverage contract is enforced by the drift-guard test (ADR-5), which can assert *both* directions (no missing key, no orphan key) where a literal-key interface could only assert one. Replaces the `common.markets` proposed in the previous revision, which was scoped assuming 5 entries.
- **`tripItinerary`** gains `documentsTitle`, `documentsNote` ("These are yours alone…"), `documentsEmpty`, `preRevealTitle`, `preRevealDescription`, `view`, `download`, plus **`documentsCancelledNote`** — required by the ADR-6 widening: a `CANCELLED` trip now renders its documents, and showing vouchers with no explanation next to a cancelled trip reads as a bug. Copy states the documents are retained for reference and refund purposes and that the trip is no longer active. Rendered when `trip.status === "CANCELLED"`, in place of `documentsNote`.
- **`adminXsed.form.fields.itinerary`** is new (`dayLabel`, `titleLabel`, `titlePlaceholder`, `descLabel`, `descPlaceholder`, `addDay`, `removeDay`); `inclusions`/`exclusions` labels already exist and gain `addInclusion`/`addExclusion` placeholders. Two new `contentTabs[content].substeps` entries in both JSONs.

View/Download wire to `doc.href` / `doc.downloadHref` through `<Button asChild>` (never a raw styled `<a>`, per `design-system.md`); the prototype's `href="#"` placeholders have no analogue in the build. Table actions use `TableIconLink`/`TableIconButton`; the Add-a-Document form uses `FormField` + `FormSelectField` to match its sibling steps, not the dashboard-table `Select`.

## Testing Strategy

Strict TDD: every row below is RED before GREEN.

| Layer | What | Where |
|---|---|---|
| Unit (pure) | `canonicalizeExperienceTypeFilter` — `xsed`→`XSED`, `couple`→`couple`, `COUPLE`→`couple`, unknown passthrough | `src/lib/experiences/__tests__/` |
| Unit (pure) | `isDestinationCountryCode` — accepts `AR`/`BR`/`CO`/`TT`, rejects `ZZ`, `""`, `ar` (case-sensitive, matching `getCountryByCode`), `null`, numbers | `src/lib/trips/__tests__/` |
| Unit (drift guard) | every code in `DESTINATION_COUNTRY_CODES` (24) has a non-empty `common.countries` label in **both** `es.json` and `en.json`, and neither locale has an orphan key | `src/lib/trips/__tests__/` |
| Unit (pure) | `isAllowedDocumentMime` — pdf/jpeg/png yes, `image/svg+xml` **no** | `src/lib/upload/__tests__/` |
| Unit (pure) | `isFulfillmentVisible` full matrix, 7 statuses × `isAdmin` (14 cases). Non-admin `true` for `REVEALED`/`COMPLETED`/**`CANCELLED`**, `false` for `DRAFT`/`SAVED`/`PENDING_PAYMENT`/`CONFIRMED`; admin `true` for all 7. Plus an explicit assertion that `FULFILLMENT_VISIBLE_STATUSES.size === 3` and contains `CANCELLED` — a named guard so a future narrowing fails loudly instead of silently revoking post-cancellation voucher access | `src/lib/trips/__tests__/` |
| Unit (pure) | `toTripDocumentDTO` — output contains no `storageKey`/`fileUrl`/`/api/upload` | `src/lib/trips/__tests__/` |
| Unit (pure) | `buildTripDocumentKey` — no user id, no original filename, no extension | `src/lib/storage/__tests__/` |
| Unit (pure) | `buildAssignableExperiencesQuery` — relocated test, unchanged assertions | `src/lib/admin/__tests__/` |
| Route | `POST /api/admin/trip-documents`: 401/403/404/413/415/422/201. The `422` case asserts an off-catalog code (`ZZ`); a companion case asserts `country: "CO"` (Colombia — **valid**, and the exact input the old 5-market list would have wrongly rejected) returns `201` | mocked `next-auth` + `prisma` + store, per `admin/trip-requests/[id]/__tests__` pattern |
| Route | `DELETE`: **admin B removes admin A's upload → 204** (the regression proof); blob-delete failure still returns 204 with no row left | ditto |
| Route | Stream route: 401 no session; 403 stranger; 403 companion-on-other-trip; 403 pre-`REVEALED` buyer (`CONFIRMED`); **200 buyer on `CANCELLED`** (the refund-dispute case); 200 companion on `REVEALED`; 200 admin on `CONFIRMED`; 404 doc/trip mismatch; `Content-Disposition` inline vs attachment | ditto |
| Route | `GET /api/trips/[id]`: `CONFIRMED` omits itinerary+documents; `REVEALED`, `COMPLETED` and **`CANCELLED`** include; companion parity | ditto |
| Route | `GET /api/admin/experiences?type=xsed` matches `["XSED"]`; `?type=couple` still matches `["couple"]` (no-regression) | existing route test file |
| Route | `PUT /api/admin/xsed/[id]` round-trips itinerary/inclusions/exclusions | existing route test file |
| Manual QA | Feature-parity checklist derived from `TripRequestModal.tsx` before deletion; ≥360px and ≥1280px; empty states | — |

## Migration / Rollout

Additive only. `prisma/schema.prisma` edit → `npm run db:push && npm run db:generate`; no existing column changes, no backfill, no feature flag. Rollback = drop `trip_documents` plus revert by slice (each slice is independently revertible; the modal deletion is intentionally the last commit of slice 3). The `trip-documents` Netlify Blobs store is created lazily on first `set`, so no infra step is required.

**Review workload**: ~40 files across 5 slices — well over the 400-line budget for a single PR. Chained PRs along the five slice boundaries are the intended shape; `sdd-tasks` should forecast accordingly.

## Open Questions

**None.** Both product forks raised by the previous revision were resolved by the founder on 2026-08-10 and are now FINAL decisions in this document, not questions:

- [x] **Documents after `CANCELLED` → VISIBLE.** Closed in **ADR-6**. `FULFILLMENT_VISIBLE_STATUSES` = `{REVEALED, COMPLETED, CANCELLED}`. Rationale: an already-issued voucher is evidence a traveler may need for a refund or cancellation dispute, and a cancelled trip has no future surprise left to protect. Only the non-admin status set changed; the admin-exemption logic and the hardcoded `isAdmin: false` at the `GET /api/trips/[id]` call site are untouched.
- [x] **`country` semantics → DESTINATION country, full catalog.** Closed in **ADR-5**. `OPERATING_MARKET_CODES` and `src/lib/markets/operatingMarkets.ts` are dropped; validation is `isDestinationCountryCode` against all 24 `AMERICAN_COUNTRIES` entries, the admin `<select>` is sourced from the same catalog, and labels move from `common.markets` (5-entry scoped) to `common.countries` (24 entries, both locales). The drift guard is repointed from list-vs-catalog (now impossible by construction) to label coverage in both locales.

## Spec Alignment — verified against the corrected spec files

`sdd-spec`'s parallel corrections landed mid-revision and were re-read directly. Both now match this design; the design's job here is to name the exact constant/source the spec deliberately deferred.

| Spec location | Corrected spec text | This design fixes |
|---|---|---|
| `specs/trip-fulfillment-documents/spec.md:11` | "a `country` value representing the document's **destination country** — validated server-side against the existing country catalog used elsewhere in the app for destination selection (exact constant/source left to `sdd-design`; NOT a closed traveler-market list)" | that catalog is `AMERICAN_COUNTRIES` (`src/lib/data/shared/countries.ts`, 24 entries), reached through `isDestinationCountryCode` (ADR-5) |
| `specs/trip-fulfillment-documents/spec.md:25-28` | new scenario: Brazil/Colombia MUST be accepted | covered by the `country: "CO"` → `201` route test |
| `specs/trip-request-lifecycle/spec.md:7` | "unless the trip's `status ∈ {REVEALED, COMPLETED, CANCELLED}` — **regardless of whether the trip passed through `REVEALED`** before reaching its current status" | `FULFILLMENT_VISIBLE_STATUSES` is a flat 3-member set read against current status only, with no reveal-history input — history-independence is structural, not a separate check (ADR-6) |
| `specs/trip-fulfillment-documents/spec.md:91-99`, `trip-request-lifecycle/spec.md:27-34` | both `CANCELLED` paths (revealed-then-cancelled, and cancelled-without-ever-revealed) MUST show documents | one predicate satisfies both; the `CANCELLED` route tests cover them |

**One residual staleness, flagged not papered over:** `proposal.md` §"Resolved Decisions" item 4 (line 170) still reads *"options are Argentina, Chile, Perú, México, Uruguay — the platform's operating markets … a closed list of markets"*. It is superseded — `state.yaml` `resolved_decisions[6]` records the supersession explicitly (`supersedes_open_questions: [3, 4]`) and the spec text no longer asserts it — but the proposal body was not rewritten. `sdd-tasks` and `sdd-verify` MUST treat spec + this design as authority on `country`; a 5-market assertion sourced from `proposal.md` line 170 is stale text, not a design defect.
