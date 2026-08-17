# Tasks: Trip Fulfillment & Documents

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2000–2500 across ~42 files (refines design's "~40 files" estimate) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 (one per slice, in dependency order) |
| Delivery strategy | `single-pr` — user explicitly chose to ship as one PR (`size:exception`) rather than chain, despite the High risk flag |
| Chain strategy | n/a — single PR |

Decision needed before apply: Resolved — shipped as one PR by explicit user instruction (`size:exception`).

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Pure helpers + case-mismatch bug fix (no schema, no I/O) | PR 1 | Base: main (or tracker branch). ~300–400 lines incl. dict + tests. Independent. |
| 2 | `TripDocument` schema + storage + auth'd routes | PR 2 | Base: PR 1. ~700–900 lines (schema, DTO, store, 3 new routes + tests). Depends on Unit 1's helpers. |
| 3 | Admin fulfillment page, replaces `TripRequestModal` | PR 3 | Base: PR 2. ~700–800 lines (8 new components + page + deletions). Depends on Unit 2's routes + Unit 1's fix. |
| 4 | XSED itinerary/inclusions/exclusions authoring | PR 4 | Base: PR 2 (or PR 1 if run independently of 3). ~300–400 lines. Independent of Unit 3. |
| 5 | Traveler surface + server-side visibility gate | PR 5 | Base: PR 2 (needs `isFulfillmentVisible`) and PR 4 (itinerary content to show). Last — consumes 1–4. |

## Phase 1: Pure Helpers + Case-Mismatch Fix

- [x] 1.1 RED: test `canonicalizeExperienceTypeFilter` (xsed→XSED, couple→couple, COUPLE→couple, passthrough) — `src/lib/experiences/__tests__/experienceTypeFilter.test.ts`
- [x] 1.2 GREEN: implement `src/lib/experiences/experienceTypeFilter.ts`
- [x] 1.3 RED: relocate `buildAssignableExperiencesQuery` test, unchanged assertions — `src/lib/admin/__tests__/assignableExperiences.test.ts`
- [x] 1.4 GREEN: create `src/lib/admin/assignableExperiences.ts` (moved verbatim from `TripRequestModal.tsx`)
- [x] 1.5 RED: test `isDestinationCountryCode` (AR/BR/CO/TT accept; ZZ/""/ar/null/number reject) — `src/lib/trips/__tests__/destinationCountries.test.ts`
- [x] 1.6 GREEN: implement `src/lib/trips/destinationCountries.ts` (`DESTINATION_COUNTRY_CODES` derived from `AMERICAN_COUNTRIES`, `isDestinationCountryCode`)
- [x] 1.7 Add `common.countries` (24 ISO codes) to `dictionary.ts`, `es.json`, `en.json`
- [x] 1.8 RED: drift-guard test — every code has a label in both locales, no orphan keys — same test dir as 1.5
- [x] 1.9 GREEN: fix any dict gaps surfaced by 1.8
- [x] 1.10 RED: test `isAllowedDocumentMime` (pdf/jpeg/png yes, svg no) — `src/lib/upload/__tests__/documentMimeTypes.test.ts`
- [x] 1.11 GREEN: implement `src/lib/upload/documentMimeTypes.ts`
- [x] 1.12 RED: test `isFulfillmentVisible` — 7 statuses × isAdmin (14 cases) + `FULFILLMENT_VISIBLE_STATUSES.size === 3` guard — `src/lib/trips/__tests__/fulfillmentVisibility.test.ts`
- [x] 1.13 GREEN: implement `src/lib/trips/fulfillmentVisibility.ts`
- [x] 1.14 RED: add `type=xsed`→`["XSED"]` case + `type=couple` no-regression case to existing `GET /api/admin/experiences` route test
- [x] 1.15 GREEN: wire `canonicalizeExperienceTypeFilter` into `src/app/api/admin/experiences/route.ts:53`

## Phase 2: Persistence + Access Layer

- [x] 2.1 Modify `prisma/schema.prisma`: add `TripDocument` model + `TripRequest.tripDocuments` + `User.tripDocumentsUploaded` relations
- [x] 2.2 Run `npm run db:migrate` (aliased to `prisma db push`) + `npm run db:generate` — no `prisma/migrations/` dir in this repo
- [x] 2.3 RED: test `toTripDocumentDTO` output has no `storageKey`/`fileUrl`/`/api/upload` substring — `src/lib/trips/__tests__/tripDocumentDto.test.ts`
- [x] 2.4 GREEN: create `src/types/tripDocument.ts` + `src/lib/trips/tripDocumentDto.ts`
- [x] 2.5 RED: test `buildTripDocumentKey` (no userId, no filename, no extension) — `src/lib/storage/__tests__/tripDocumentStore.test.ts`
- [x] 2.6 GREEN: implement `src/lib/storage/tripDocumentStore.ts` (private `trip-documents` blob store)
- [x] 2.7 Create `src/lib/admin/requireAdmin.ts` (extracted `hasRoleAccess(caller,"admin")` shape)
- [x] 2.8 RED: tests for `POST /api/admin/trip-documents` (401/403/404/413/415/422/201, incl. `country:"CO"`→201)
- [x] 2.9 GREEN: implement `src/app/api/admin/trip-documents/route.ts` POST
- [x] 2.10 RED: tests for `DELETE /api/admin/trip-documents/[documentId]` (admin B removes admin A's doc→204; blob-delete failure still 204, no dangling row; 401/403/404)
- [x] 2.11 GREEN: implement DELETE route — row deleted first, blob best-effort in `try/catch`, no uploader check
- [x] 2.12 RED: tests for `GET /api/trips/[id]/documents/[documentId]` stream route (401; 403 stranger/companion-elsewhere/pre-REVEALED buyer; 200 buyer-CANCELLED/companion-REVEALED/admin-CONFIRMED; 404 mismatch; inline vs attachment headers)
- [x] 2.13 GREEN: implement stream route (`canAccessTrip` OR `hasRoleAccess(admin)`, `isFulfillmentVisible`, stream blob w/ `private, no-store`, `nosniff`)
- [x] 2.14 Modify `src/app/api/upload/route.ts`: add `application/pdf` to `ALLOWED_MIME_TYPES`

## Phase 3: Admin Fulfillment Page

- [x] 3.1 RED: test new `GET /api/admin/trip-requests/[id]` handler (200 shape incl. `experienceItinerary`+`documents`; 401/403/404; never status-gated)
- [x] 3.2 GREEN: implement handler, reusing `attachAdminTripRequestRelations`
- [x] 3.3 Add `adminTripFulfillment` dict section (`dictionary.ts`, `es.json`, `en.json`)
- [x] 3.4 Feature-parity checklist from `TripRequestModal.tsx` verified by construction: status select (7-state enum), fixed experience-assignment dropdown, core trip details (`TripRequestDetails`), status timeline (`TripStatusTimeline`), danger-zone delete (`TripDangerZone`), and the new `mailto:` affordance are all present on the new page — plus the new itinerary reference and document management sections the modal never had
- [x] 3.5 Create `.../trip-fulfillment/TripFulfillmentHeader.tsx`
- [x] 3.6 Create `.../trip-fulfillment/TripManagePanel.tsx` (fixed assignment dropdown, status select)
- [x] 3.7 Create `.../trip-fulfillment/TripItineraryReference.tsx` (read-only Section 2)
- [x] 3.8 Create `.../trip-fulfillment/TripDocumentsTable.tsx` (view/download via `doc.href`/`downloadHref`)
- [x] 3.9 Create `.../trip-fulfillment/AddTripDocumentForm.tsx` (label, country select from full catalog, PDF/JPG/PNG ≤10MB)
- [x] 3.10 Create `.../trip-fulfillment/TripDangerZone.tsx`
- [x] 3.11 Create `.../trip-fulfillment/TripFulfillmentSaveBar.tsx`
- [x] 3.12 Create `AdminTripFulfillmentPageClient.tsx` composing 3.5–3.11
- [x] 3.13 Create server `page.tsx` at `/dashboard/admin/trip-requests/[id]`
- [x] 3.14 Modify `AdminTripRequestsPageClient.tsx`: drop modal state, pass `locale`
- [x] 3.15 Modify `TripRequestsTable.tsx`/`TripRequestsTableRow.tsx`: row action → `TableIconLink` to new page
- [x] 3.16 Manual QA against 3.4 checklist + new itinerary/document sections — NOT performed (requires a live browser session; out of reach of this apply run). Flagged as a risk for `sdd-verify`/human QA.
- [x] 3.17 Delete `TripRequestModal.tsx` + relocated test file — last commit-equivalent step of this slice

## Phase 4: XSED Itinerary/Inclusions/Exclusions Authoring

- [x] 4.1 Modify `src/types/xsed.ts`: add `itinerary`/`inclusions`/`exclusions` to `XsedDropDraft`, seed `EMPTY_XSED_DRAFT`
- [x] 4.2 Create `src/components/ui/ChipListInput.tsx` (promoted from `InclusionsStep`'s private `ChipList`)
- [x] 4.3 Modify tripper `InclusionsStep.tsx` to consume `ChipListInput` (zero visual delta)
- [x] 4.4 Add `adminXsed.form.fields.itinerary` + inclusions/exclusions placeholders + 2 `contentTabs` substeps (both locales)
- [x] 4.5 Create `XsedItineraryStep.tsx` (title/description only, no per-day image; local XSED contract)
- [x] 4.6 Create `XsedInclusionsStep.tsx` (uses `ChipListInput`)
- [x] 4.7 Modify `XsedDropShell.tsx`: add step map entries
- [x] 4.8 RED: extend `PUT /api/admin/xsed/[id]` route test — itinerary/inclusions/exclusions round-trip
- [x] 4.9 GREEN: whitelist the 3 fields in `src/app/api/admin/xsed/route.ts` + `[id]/route.ts`
- [x] 4.10 Modify `.../xsed/[id]/edit/page.tsx`: map the 3 fields into the draft

## Phase 5: Traveler Surface + Visibility Gate

- [x] 5.1 RED: test `GET /api/trips/[id]` — `CONFIRMED` omits itinerary/inclusions/exclusions/documents; `REVEALED`/`COMPLETED`/`CANCELLED` include; companion parity
- [x] 5.2 GREEN: modify `src/app/api/trips/[id]/route.ts` to call `isFulfillmentVisible(status, false)` and gate the payload
- [x] 5.3 Add `tripItinerary` dict keys incl. `documentsCancelledNote` (both locales)
- [x] 5.4 Create `TripDocumentsSection.tsx` (view/download via `<Button asChild>`, cancelled-note branch, empty state)
- [x] 5.5 Modify `.../dashboard/trips/[id]/details/page.tsx`: render section + pre-reveal notice keyed off `trip.status`
- [x] 5.6 Manual QA: ≥360px/≥1280px, empty states, buyer vs companion parity on `REVEALED` — NOT performed (requires a live browser session; out of reach of this apply run). Flagged as a risk for `sdd-verify`/human QA.
