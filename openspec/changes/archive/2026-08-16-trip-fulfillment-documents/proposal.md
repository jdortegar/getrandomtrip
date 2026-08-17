# Proposal: Trip Fulfillment & Documents

**Source of truth:** `openspec/specs/08-trip-fulfillment-and-documents.md` (gap analysis, audited 2026-08-10). Every product/UX decision there — especially §1 "Decided content model" — is FINAL. This proposal formalizes §7 sequencing items 1–4 only.

**Approved prototypes** — **retrieved and read directly on 2026-08-10** (see Resolved Decisions #3). Both are internally consistent with the §1 content model and with every Resolved Decision below; **no redesign is needed** and they are the literal visual/content contract for `sdd-design`:
- Admin trip fulfillment page — https://claude.ai/code/artifact/88e71b8d-eac8-4070-a803-f5cd8f8668a7
- Traveler trip details / Documents section — https://claude.ai/code/artifact/fd0b7b47-116e-45ed-8432-cde07eefe7ef

## Intent

A traveler who has paid for a trip receives a correctly-timed destination reveal and nothing else: no hotel voucher, no dinner reservation, no day-by-day itinerary. The concept does not exist in the schema, the admin authoring tools, the upload system, or the traveler UI. This change makes trip fulfillment content authorable by an admin and visible to the traveler at reveal time, for **all** experience-based trips (XSED and main curated journeys alike — never gate on `type === "xsed"`).

## Scope

### In Scope

| # | Deliverable |
|---|---|
| 1 | **Bug fix (prerequisite)**: admin experience-assignment dropdown returns zero results for XSED trips. Case mismatch confirmed: `buildAssignableExperiencesQuery` (`src/components/app/admin/TripRequestModal.tsx:50-58`) forwards `trip.type` verbatim (`"xsed"`, lowercase per `TripRequest.type`), and `GET /api/admin/experiences` applies `where.type = { has: filterType }` (`route.ts:53`) against `Experience.type` values stored uppercase (`["XSED"]`). Prisma `has` is exact-match → always empty. |
| 2 | **New admin surface**: dedicated page `/dashboard/admin/trip-requests/[id]` replacing the `TripRequestModal` popup. Must carry over status change (7-state enum), experience assignment (now fixed), core trip details, status timeline, delete/danger zone — PLUS a read-only reference view of the assigned experience's itinerary, PLUS per-trip document management (add / list / view / remove; free-text label + country tag chosen from a fixed market select, per Resolved Decisions #4). Page-level Save/Discard bar replaces the modal footer. Fold in the `mailto:` affordance (source doc §5, LOW). |
| 3 | **XSED admin authoring gains itinerary / inclusions / exclusions**: add the fields to `XsedDropDraft` (`src/types/xsed.ts`), the `XsedDropShell` step map, and the `PUT /api/admin/xsed/[id]` field whitelist (`route.ts:117-163` — currently omits all three). Reuse the tripper-experience components (`ItineraryStep.tsx`, `InclusionsStep.tsx`, `ActivitiesListStep.tsx`) — but see Open Questions #1: they are **not** drop-in reusable. |
| 4 | **Extended traveler surface**: add a Documents section (view/download only) to `src/app/[locale]/(secure)/dashboard/trips/[id]/details/page.tsx` alongside its existing itinerary/inclusions/exclusions rendering (which already reads the right fields and only ever shows its empty state because the data is never authored). Gate itinerary + documents behind `REVEALED` using the same predicate as the reveal page (`status === "REVEALED" \|\| status === "COMPLETED"`, `trips/[id]/page.tsx:222`). Full es/en dictionary coverage — the prototypes are English-only. |
| 5 | **Cross-cutting**: extend `POST /api/upload` to accept PDFs (`ALLOWED_MIME_TYPES`, `src/app/api/upload/route.ts:185-192` is images-only) while keeping image support; PDFs must bypass `optimizeImage`. Plus the schema migration in Dependencies. |
| 6 | **New authenticated document-serving route** (Resolved Decisions #1): documents are read through a dedicated authenticated endpoint authorized by `canAccessTrip` (buyer + companions) OR admin — **not** through the existing unauthenticated `/api/upload/[...path]` blob URL. Both admin and traveler surfaces link to this route; the raw blob key/URL is never rendered to a client. |

### Out of Scope

- Booking-capacity enforcement (`maxSpots`) — source doc §5 HIGH, independent, tracked separately.
- Completion automation / `REVEALED → COMPLETED` reminders — §5 MEDIUM, independent.
- Admin drop-level trip filter / "who booked this drop" view — §5 MEDIUM, nice-to-have.
- Multi-country drop assignment automation — deliberately manual per the interview.
- Synthetic/FOMO-inflated sold-count — §5 LOW, unrelated.
- Slug form-level uniqueness validation — §5 LOW, unrelated.
- Any change to the reveal cron/mechanism — confirmed working (§4), do not touch.
- Bulk / shared document upload, fixed voucher categories, a separate "confirmed" status field — all explicitly rejected in §1.

## Capabilities

### New Capabilities
- `trip-fulfillment-documents`: per-`TripRequest` labeled, country-tagged document attachments — admin CRUD, traveler read-only, `REVEALED`-gated; PDF-capable upload pipeline; served exclusively through a new **authenticated, per-trip-authorized** route (buyer + companions + any admin).

### Modified Capabilities
- `trip-request-lifecycle`: the `REVEALED` gate now governs fulfillment content visibility (itinerary + documents), enforced **server-side** in `GET /api/trips/[id]`, not only in the UI.
- `experience`: XSED admin authoring writes `itinerary` / `inclusions` / `exclusions`; experience-type filtering normalizes case so admin assignment works.
- `admin-dashboard-overview`: trip-request editing moves from modal to a dedicated route.

## Approach

1. Fix the case mismatch first (normalize at the filter boundary, one canonical direction — design phase decides which side) so the new page's assignment control does not inherit the defect.
2. Add the `TripDocument` persistence layer, the admin document API (admin-role-authorized writes/deletes, per Resolved Decisions #2), and the authenticated document read route (`canAccessTrip` OR admin, per Resolved Decisions #1) — the read route lands with the persistence layer, before either UI consumes it. Then build the admin page around it, reusing the existing modal's sub-components (`TripRequestDetails`, `TripStatusTimeline`, `StatusBadge`) rather than re-implementing.
3. Wire itinerary/inclusions/exclusions into the XSED drop form (adapting, not copying, the tripper step components).
4. Extend the traveler page last — it is the consumer of both (1)–(3).

Content model is fixed: itinerary is **shared per experience/drop** and read-only on both new surfaces; documents are **individual per `TripRequest`**, never shared, arbitrary free-text label + country tag, file-present = confirmed.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `prisma/schema.prisma` | New | `TripDocument` model + relation on `TripRequest` (see Dependencies) |
| `src/app/[locale]/(secure)/dashboard/admin/trip-requests/[id]/page.tsx` | New | Dedicated admin fulfillment page |
| `src/components/app/admin/TripRequestModal.tsx` | Removed | Superseded by the page; keep/relocate `buildAssignableExperiencesQuery` + its tests |
| `src/app/[locale]/(secure)/dashboard/admin/trip-requests/page.tsx` | Modified | Row action navigates instead of opening a modal |
| `src/app/api/admin/experiences/route.ts` | Modified | Case-normalized `type` filter |
| `src/app/api/admin/trip-documents/**` | New | Admin document CRUD |
| `src/app/api/upload/route.ts` | Modified | Allow PDF MIME; skip `optimizeImage` for non-images |
| `src/app/api/trips/[id]/documents/**` (exact path/shape TBD by `sdd-design`) | New | **Authenticated** document read route: `canAccessTrip(tripId, userId)` OR admin, then stream the blob server-side (Resolved Decisions #1) |
| `src/app/api/upload/[...path]/route.ts` | **Unchanged (deliberate)** | Its unauthenticated `GET` and uploader-keyed `DELETE` are NOT modified. Document blobs are never reachable through it because their keys/URLs are never sent to a client — the new route is the only read path (Resolved Decisions #1–#2) |
| `src/types/xsed.ts`, `src/components/app/dashboard/admin/xsed/**` | Modified | Itinerary/inclusions/exclusions fields |
| `src/app/api/admin/xsed/[id]/route.ts` | Modified | Whitelist the three new fields |
| `src/app/api/trips/[id]/route.ts` | Modified | Server-side `REVEALED` gate + documents payload |
| `src/app/[locale]/(secure)/dashboard/trips/[id]/details/page.tsx` | Modified | Documents section + gating |
| `src/dictionaries/{es,en}.json`, `src/lib/types/dictionary.ts` | Modified | New copy sections (both locales, mandatory) |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Voucher PDFs contain traveler PII and blob GET is unauthenticated (`/api/upload/[...path]` has **no** session check) — the `REVEALED` gate would be UI-only and bypassable by URL | High | **Resolved by decision, not deferred**: documents are served only through the new authenticated route (Resolved Decisions #1). Residual risk is **leaking the blob key** — no admin or traveler response may include the raw blob path/URL, and `sdd-spec` must assert this at the API-contract level |
| Blob keys are guessable-adjacent (`{userId}/{feature}/{filename}`), so any accidental exposure of a document key is a permanent unauthenticated read | Medium | Design phase should prefer opaque stored filenames and must keep the key server-side only; do not treat "hard to guess" as the control — the authenticated route is the control |
| Case-normalizing the `type` filter breaks other callers of `GET /api/admin/experiences` (admin catalog browsing shares the route) | Medium | Normalize at one boundary only; cover both callers with tests |
| Deleting `TripRequestModal` regresses admin flows not covered by the prototype | Medium | Feature-parity checklist derived from the modal source before removal |
| Tripper step components are more coupled than the source doc assumed → scope creep into the tripper flow | Medium | Prefer prop-contract adaptation at the XSED call site over refactoring shared tripper components |
| The traveler details page renders itinerary for **any** status today, so adding the `REVEALED` gate is a **behavior change**, not just new UI — and since the page is a client component (`ssr: false`) consuming `/api/trips/[id]`, a UI-only gate would be cosmetic | Medium | Enforce the gate server-side in `GET /api/trips/[id]` (and in the document route per Resolved Decisions #1); `sdd-spec` asserts it at the API contract, and the success criteria verify it against the API response, not the rendered page |
| Blob orphaning: deleting a `TripDocument` row without deleting the blob (or vice versa) | Low | Delete row + blob in one handler; tolerate blob-delete failure without leaving a dangling row |

## Rollback Plan

- Items 1, 3, 5 are additive and independently revertible by commit.
- Item 2: keep `TripRequestModal.tsx` in git history and land its removal as the **last** commit of that slice, so reverting one commit restores the modal path.
- Item 4: the Documents section and the `REVEALED` gate are additive to an existing page — revert the commit and the page returns to today's ungated itinerary rendering.
- Schema: `TripDocument` is a new table with no changes to existing columns → `prisma migrate` down / a drop-table migration is non-destructive to existing data.

## Dependencies

- **Schema migration required (design phase must specify precisely — this proposal deliberately does not fix the shape)**: no document-related field exists anywhere on `TripRequest` or `Payment`. A new Prisma model is needed, approximately `TripDocument { id, tripRequestId FK, label, country, fileUrl, mimeType, createdAt }`, with cascade behavior, indexing, and whether an uploader/`createdBy` audit column is warranted all left to `sdd-design`.
- PDF support in `POST /api/upload` blocks item 2's document upload.
- Item 1 blocks item 2's assignment control. Item 3 blocks item 4 having any itinerary content to show for XSED drops.
- Item 6 (authenticated document read route) blocks both item 2's admin "view" action and item 4's traveler view/download — neither surface may fall back to a blob URL while the route is missing.
- `canAccessTrip` (`src/lib/travelers/travelerAccess.ts`) and the `requireAdmin` + `hasRoleAccess(caller, "admin")` pattern already exist; item 6 composes them and must not re-express either rule inline.

## Success Criteria

- [ ] An admin can assign or reassign an experience to an XSED trip from the UI (non-empty dropdown).
- [ ] `/dashboard/admin/trip-requests/[id]` covers 100% of the removed modal's actions, and the modal is gone.
- [ ] An admin can attach a PDF and an image voucher with a free-text label + country tag, see them listed, and remove one.
- [ ] An XSED drop's itinerary, inclusions, and exclusions can be authored in the admin drop form and persist through `PUT /api/admin/xsed/[id]`.
- [ ] A traveler on a `REVEALED` trip sees the day-by-day itinerary, inclusions/exclusions, and their own documents with working view/download.
- [ ] A traveler on a pre-`REVEALED` trip sees neither — verified against the API response, not just the rendered page.
- [ ] A **companion** traveler on a `REVEALED` trip can list and open that trip's documents with the same result as the buyer.
- [ ] An unauthenticated request, and an authenticated request from a user who is neither buyer, companion, nor admin, both fail (`401` / `403`) against the document read route — verified at the API, not the UI.
- [ ] No admin or traveler API response exposes the raw blob key or a `/api/upload/[...path]` URL for a document.
- [ ] Admin B can remove a document uploaded by admin A (regression test for the ownership-keyed authorization defect this change refuses to inherit).
- [ ] All new user-visible copy exists in both `src/dictionaries/es.json` and `en.json`; `npm run typecheck` and `npm run lint` pass.

## Resolved Decisions

Signed off by the product owner on 2026-08-10. These close former Open Questions #2 (document blob access control) and #3 (companion visibility) as **FINAL**. `sdd-spec`, `sdd-design`, and `sdd-tasks` must treat them as settled input and must not reopen them.

### 1. Documents are served by a NEW authenticated route, authorized `canAccessTrip` (buyer + companions) OR admin — FINAL

Document reads do **not** go through the existing public blob URL pattern. A new authenticated API route owns document access and streams the file server-side. Authorization is **identical to the existing guard on `GET /api/trips/[id]`** — `canAccessTrip(tripId, userId)` from `src/lib/travelers/travelerAccess.ts:21` (`{ OR: [{ userId }, { travelers: { some: { userId } } }] }`) — **plus** an admin bypass.

This settles both former questions in one rule: the access boundary for documents is **the trip**, not the buyer. If you can open the trip, you can open its documents. Companion travelers therefore **do** see the documents — "personal to the traveler" in source doc §1 means *per-`TripRequest`, never shared across trips*, not *buyer-only within a trip*. This is consistent with the prior documented decision that companions hold buyer-level read access (`traveler-invite-required-signup`, design §"v1 buyer-level access, narrowing deferred").

Consequences, all intentional:

- Three authorization outcomes on the document read route: buyer → allow, linked companion → allow, any admin → allow, everyone else → `403`, no session → `401`.
- The admin check is a **separate** condition, not folded into `canAccessTrip` — that predicate is documented as "the ONLY definition of *may read this trip*" for buyer ∪ companion and must not be widened. Follow the established `requireAdmin` shape (`prisma.user.findUnique({ select: { id, roles } })` + `hasRoleAccess(caller, "admin")`, e.g. `src/app/api/admin/xsed/[id]/route.ts:19-38`) — admin is a membership in `User.roles[]`, so **never** compare `role === "ADMIN"`.
- The `REVEALED` gate must be enforced **inside this route too**, not only in `GET /api/trips/[id]`. A pre-`REVEALED` buyer hitting the document route directly gets nothing. Admins are exempt from the `REVEALED` gate (they author the content before reveal).
- `src/app/api/upload/[...path]/route.ts` is **not modified**. Its unauthenticated `GET` stays as-is for existing image use cases; this decision explicitly **supersedes relying on it for this feature's file type**. The control that makes this safe is that document blob keys/URLs are never serialized into any API response or rendered into any client component — not obscurity of the key.

Rejected: (a) relaxing the blob route's ownership rule for admins — it would leave the unauthenticated `GET` as the traveler read path, so the `REVEALED` gate stays bypassable by URL and PII stays world-readable; (b) buyer-only document visibility — it would fork documents away from every other read on the trip and leave companions on a trip they can otherwise fully open unable to see their own voucher.

### 2. Document remove/manage authorization is admin-role-based, NOT upload-ownership — FINAL

The existing `DELETE /api/upload/[...path]` authorizes with a prefix check on the blob key against the caller's own user id — `key.startsWith(session.user.id + "/")` at `src/app/api/upload/[...path]/route.ts:99`. Because uploads are keyed under the **uploading** user's id, a second admin cannot remove a colleague's upload. **This defect must NOT be carried into the new document-management feature.**

The new route's delete/remove authorization is **admin role, generally**: any admin can manage any trip's documents, regardless of which admin uploaded the file. There is no uploader-ownership check anywhere in the document management path.

Consequences, all intentional:

- Document deletion is performed by the new admin document route (which owns both the `TripDocument` row and the blob removal), **not** by the client calling `DELETE /api/upload/[...path]`. That blob route's ownership rule is left untouched and simply unused by this feature — which also means the handler must delete the blob using the server-side store directly, not by proxying a request that would re-apply the ownership check.
- If `sdd-design` adds an uploader/`createdBy` audit column (still open per Dependencies), it is **audit metadata only** and must never be read as an authorization input.
- Fixing `DELETE /api/upload/[...path]` itself for existing image features is **out of scope** here — this change routes around the defect rather than inheriting or repairing it.

Rejected: keying document authorization to the uploading admin. It breaks the core operational requirement that any admin can service any trip.

### 3. Prototypes retrieved and verified — NO contradiction with the content model — FINAL (closes former Open Question #0)

Both artifact URLs were fetched and their HTML structure and copy read directly on 2026-08-10. **Retrieval: successful for both.** The prototypes are internally consistent with source doc §1 and with Resolved Decisions #1–#2; several of this change's decisions appear in the prototypes as *verbatim explanatory copy*, which is the strongest available confirmation that design and product agree.

Evidence — **admin page** (`88e71b8d`):

- Status dropdown covering Draft / Saved / Pending Payment / Confirmed / Revealed / Completed / Cancelled; destination-experience dropdown; trip facts; a danger-zone cancel action → matches in-scope item 2's feature-parity list.
- A **"Section 2 — Itinerary"** panel explicitly labeled *"Reference only · shared by every traveler on Drop #9"*, with body copy *"This schedule is defined once on the experience and applies to everyone booked on this drop. Edit it from the Experience Editor, not here."* → confirms **itinerary is shared per experience/drop and read-only on the admin surface**, exactly as decided.
- A **"Section 3 — Fulfillment Documents"** table (columns: Document / Country / Uploaded / Actions) carrying the note *"No separate 'confirmed' flag — uploading a document here is what marks it confirmed. Vouchers become visible to the traveler once this trip is Revealed."* → confirms **both** the rejected-separate-status-field decision **and** the `REVEALED` visibility gate, verbatim.
- The **"Add a Document"** form contains exactly three inputs: a free-text **Label**, a **Country/Market select**, and a drag-and-drop file zone captioned *"PDF, JPG or PNG · up to 10 MB"* → confirms arbitrary free-text labels, the country tag, and **PDF + image** support (in-scope item 5).

Evidence — **traveler page** (`fd0b7b47`):

- A **"Your itinerary"** section rendered day-by-day → matches the existing details-page rendering the change is extending.
- A **"Your documents"** section carrying the note *"These are yours alone. Other travelers on this same trip have their own room and reservations — nothing here is shared."* → confirms **documents are individual per `TripRequest`, never shared across trips**, verbatim. Note this copy speaks about *other trips / other bookings*, and does **not** contradict Resolved Decisions #1: companions **linked to this same `TripRequest`** still read this trip's documents, because the access boundary is the trip.
- Five sample document cards (Hotel Confirmation, Dinner Reservation, Winery Experience Voucher, Private Transfer Voucher, Travel Insurance Policy), each with **View + Download** actions → confirms the traveler surface is read-only and needs both affordances, both of which must resolve through the authenticated route of Resolved Decisions #1, never a blob URL.

Consequences: `sdd-design` **inherits** this verification and must **not** re-fetch the URLs as a gate. It should treat both prototypes as the visual/content reference. Two carry-overs remain design's responsibility: (a) the prototypes are **English-only**, so every string above needs es/en dictionary keys (in-scope item 4); (b) the prototype `View`/`Download` actions must be wired to the authenticated document route, not to a raw file URL.

### 4. The document country tag is a select over a fixed list, not free text — FINAL, superseded by Resolved Decision #6 (closes former Open Question #3)

**Superseded.** The admin prototype's Add-a-Document form showed a **Country `select`** whose sample options were **Argentina, Chile, Perú, México, Uruguay** — read at proposal time as "the platform's operating markets." Design surfaced this as a genuine product fork (operating market vs. destination country), and the founder resolved it: **the field means the document's destination country**, not the traveler's operating market. A closed 5-market list would incorrectly block real destinations already in the app's broader catalog (Brazil, Colombia, etc.). The field is validated server-side against the existing `AMERICAN_COUNTRIES` destination catalog (`src/lib/data/shared/countries.ts`, ~24 countries) — see `design.md`'s Resolved Decision #6 for the exact implementation (`DESTINATION_COUNTRY_CODES` derived from that catalog, `common.countries` dictionary section, bilingual-label drift guard). It remains a closed, server-validated `select`, not free text — only the source list changed.

## Open Questions (raised by file-level verification; not resolved by the source doc)

1. **The tripper step components are NOT drop-in reusable** (contradicts source doc §7 item 3's "largely wiring"). `ItineraryStep`/`InclusionsStep` take `copy: TripperExperiencesDict["form"]`, `form: ExperienceFormDraft`, and `onChange(key, value)`; `XsedDropShell` supplies `AdminXsedDict["form"]`, `XsedDropDraft`, and `onChange(patch: Partial<XsedDropDraft>)`. `ItineraryStep` additionally requires `imageState: ExperienceImageState` from `NewExperienceShell` (deferred-upload contract) which the XSED shell has no equivalent for, and both read copy via brittle positional indexes (`copy.contentTabs[2].substeps[1]`). **Decision needed:** generify the components behind a neutral prop contract vs. write thin XSED adapters. Also: does the XSED itinerary need per-day images at all?
**Open count: 1** (#1 only).

#1 stays open deliberately: it is an implementation-detail scope note for `sdd-design`/`sdd-tasks` (generify the shared step components vs. write thin XSED adapters, and whether XSED itinerary days need images), not a product decision. No product question remains open on this change.

### Closed / reclassified

| Was | Subject | Outcome |
|---|---|---|
| #0 | Prototype HTML never fetched or verified | **Closed** → Resolved Decisions #3. Both URLs retrieved and read 2026-08-10; no contradiction with the content model; prototypes are the visual contract for `sdd-design`, which must not re-gate on fetching them |
| #2 (orig) | Document blob access control | **Closed** → Resolved Decisions #1 |
| #3 (orig) | Companion document visibility | **Closed** → Resolved Decisions #1 |
| #4 (orig, later renumbered #2) | Traveler details page has no status gate today | **Reclassified, not a question** — it is a verified fact with its answer already fixed: the page is a client component (`ssr: false`) fetching `/api/trips/[id]`, so the `REVEALED` gate is a **behavior change enforced server-side in the API**, per in-scope item 4 and Resolved Decisions #1. Carried as a scope/risk note; `sdd-spec` must assert the API-level gate |
| #5 (orig, later renumbered #3) | Country tag input type | **Closed** → Resolved Decisions #4 (fixed market select, per admin prototype) |
