# Traveler nationalities and visas

## Objective

Admins see every traveler's nationalities and visas on a trip, so they can pick a destination the whole group can enter.

## Problem

- The admin has no view of nationality or visa data. `User.passportCountry` and `User.approvedVisas` exist (`prisma/schema.prisma:86-94`) but only the user sees them (`AccountSettingsDocumentsTab.tsx`, `/api/user/documents`).
- A trip has several travelers. The buyer is not a `TripTraveler` row (`adultRows = adults - 1`, `travelerPolicy.ts:68`), and roster rows exist only after payment is `APPROVED` (`ensureRoster`, `travelerRoster.ts:40`).
- `User` holds a single passport, so dual citizens cannot express a second nationality.
- `VISA_COUNTRIES` is a hardcoded English-name list, and stored `approvedVisas` values are English names (not localized, not comparable to `DESTINATION_COUNTRY_CODES`).

## Why

A destination is only valid when every traveler can enter it. Dual citizenship (common for Argentine customers) and held visas change that answer completely.

## Decisions (grill-me, 2026-10-09)

- **Not in the sign-up modal.** Google SSO from login mode creates accounts without the register fields, and the data is only needed for booked trips.
- **Per-trip snapshot.** Buyer: `TripRequest.buyerNationalities String[]` + `buyerVisas String[]`. Companions: `TripTraveler.nationalities String[]` + `visas String[]`. Admin always reads from the trip, never from the live `User`.
- **Profile as prefill.** New `User.nationalities String[]` in the Documents tab. Existing passport fields stay as the "main passport" (no destructive migration); `nationalities` is prefilled from `passportCountry` when empty. Checkout and claimed companion invites prefill from and write back to `User`. Trips never snapshot passport numbers.
- **Multiple nationalities** (passports the traveler can travel with); minimum one.
- **ISO 3166-1 alpha-2 codes** for nationalities and visas. Labels from `Intl.DisplayNames(locale, { type: "region" })`, full world list. Existing `approvedVisas` names are converted with `src/lib/geo/countryNameToCode.ts`; `VISA_COUNTRIES` is removed.
- **Visas are codes only**, no expiry. Field label: "Visas that will be valid on your travel dates". Empty list means "none".
- **Timing.** Buyer data is required before payment (new checkout "Travel documents" card). Companion data is required before matching; existing invite reminders chase it.
- **Manual eligibility.** No rules engine. Admin trip view shows a per-traveler table.
- **Soft gate.** Setting `actualDestination` / `experienceId` with missing traveler documents shows a warning and asks for confirmation; the server does not block.
- **Editing.** Editable on trip detail and the companion invite form until `isRosterLocked`. Trips paid before release show a "Complete your travel documents" prompt; no backfill script.

## Scope

Delivery strategy: `ask-on-risk`. Forecast is above the ~400 authored-line heuristic, so the chain strategy is asked before the first commit.

- [x] **T1** Schema + shared country helpers: migration adding `User.nationalities`, `TripRequest.buyerNationalities/buyerVisas`, `TripTraveler.nationalities/visas` (all `String[] @default([])`); one-off conversion of `User.approvedVisas` names to ISO codes; shared `CountryMultiSelect` (ISO codes, `Intl.DisplayNames` labels) replacing `VISA_COUNTRIES`; types in `src/types/`.
- [x] **T2** Profile Documents tab: add nationalities multi-select (prefill from `passportCountry`), switch visas to ISO codes; `/api/user/documents` validates ISO codes; es/en dictionary keys.
- [x] **T3** Checkout "Travel documents" card: required nationalities (min 1) + visas, prefilled from `User`, saved to `TripRequest` snapshot and written back to `User`; payment blocked until the buyer snapshot has at least one nationality; es/en copy.
- [x] **T4** (T4a + T4b) Companion fields: invite form and buyer direct-fill row (`TravelerRow`, `PATCH /api/travelers/[id]`, `POST /api/travelers/submit`) gain nationalities + visas, editable until `isRosterLocked`; claimed companions prefill from and write back to `User`; minors filled by the buyer; roster completeness includes nationalities; trip detail prompts the buyer when their snapshot is empty.
- [ ] **T5** Admin view: per-traveler table (buyer + companions) of nationalities and visas in the admin trip page; "N of M travelers missing documents" badge; confirmation dialog before setting destination/experience while incomplete; es/en copy.

## Acceptance criteria

- A dual-citizen buyer can save two nationalities at checkout and cannot pay with zero.
- A companion who claims an invite sees their profile values prefilled; their edits reach both the trip row and their profile.
- Admin sees buyer and companion nationalities/visas with localized country names, and a warning when any traveler is missing nationalities.
- After `isRosterLocked`, the fields are read-only.
- Existing English-name `approvedVisas` render as the correct countries after migration.

## Checks

- `npm run typecheck`, `npm run lint`, affected Vitest suites per task.
- Manual QA: checkout, invite claim, trip detail, admin trip view at ≥360px and ≥1280px.

## Progress

- 2026-10-09: design agreed via grill-me; no code written.
- 2026-10-11: implementation authorized. Branch `feat/traveler-nationality-visas` from `origin/develop`. Commits only with explicit user approval each time (user rule overrides ODD auto work-unit commits).
- T1 route: delegated writer (writer trigger: 6+ non-trivial files — schema, migration, country helpers, component, script, tests). `AccountSettingsDocumentsTab` wiring and `VISA_COUNTRIES` removal moved to T2.
- 2026-10-11 T1 done (uncommitted, awaiting user commit approval). Evidence: RED = 3 test files failed on missing modules; GREEN = vitest 3 files / 47 tests pass (parent re-ran), `db:generate` ok, `typecheck` clean, `lint` clean. 9 files, +760 lines.
  - Deviations: `CountryMultiSelect` wraps existing `MultiSelectInput`; remove-chip aria label is hardcoded Spanish in `RemovableTag` (follow-up: optional remove-label prop); `minSelected` left to callers via `error`; `src/types/documents.ts` change deferred to T2; conversion uses `resolveCountryCode` (`countryNameToCode.ts`). `XK` excluded.
  - Notes for T2: `MultiSelectInput` hides selected values not in options (unconverted visa names invisible until script runs) and its search is accent-sensitive ("Mexico" ≠ "México").
- 2026-10-11 existing-helper audit (user request before T1 commit):
  - Fixed: `resolveCountryCode` mapped "Vietnam" → retired `VD` (AA–ZZ scan + hand blocklist). Index now iterates `ISO_COUNTRY_CODES` (single source); `NON_COUNTRY_CODES` removed. RED `maps Vietnam to VN` → GREEN; geo/trips/shared/scripts 22 files / 236 tests pass, typecheck + lint clean.
  - Existing `VISA_COUNTRIES` (55 names) all resolve except "Schengena" (a zone, not a country) — open product decision.
  - Reuse later: `CountryFlag` (`countryCode` prop) for chips/admin table (T2/T5).
  - Pre-existing duplication, out of scope: two name→code resolvers (`resolveCountryCode` vs `flags.ts getCountryCode` / `country-to-iso`); `getWelcomeCountryName` (`welcome.ts`) ≈ `countryLabel`; empty dead file `src/components/CountrySelector.tsx`; journey `CountrySelector` is a Mapbox single-select (different purpose).
- 2026-10-11 decision (user): keep Schengen as special visa code `SCHENGEN` (visas only, never nationalities; label from es/en dictionaries, added in T2). Existing "Schengena" converts to it. Route: delegated writer (countryOptions, CountryMultiSelect `extraOptions`, conversion script + tests).
- 2026-10-11 SCHENGEN done (uncommitted): `VISA_ZONE_CODES`, `isVisaCode`, `normalizeVisaCodes`; `CountryMultiSelect` `extraOptions` (`CountryOption` = `{ value, label }`); script maps Schengen spellings incl. "Schengena". RED 28 failing → GREEN; parent re-ran geo/ui/scripts: 32 files / 301 tests pass; typecheck + lint clean (writer). T1 ready for commit approval.
- 2026-10-11 T1 committed `32869a24` (user-approved). RDD assess: medium, review_due (slice_budget_reached). User granted review; lineage `review-d111bf3769db8640`, single `review-reliability` lens running.
- T2 route: delegated writer (Documents tab, documents API, types, dictionaries, MultiSelectInput/RemovableTag i18n + accent-insensitive search, shared visa resolver moved from script into `src/lib/geo`).
- 2026-10-11 T1 review `review-d111bf3769db8640`: APPROVED + acknowledged (`review-acknowledged/v1`); reviewed boundary → `32869a24`. Advisory (non-blocking): R3-hidden-unknown-values (`CountryMultiSelect.tsx:103-119`, covered by T2 read-time conversion); R3-invalid-locale-throws (`countryOptions.ts:105-108`, follow-up: guard locale in sort).
- 2026-10-11 T2 done (uncommitted, awaiting user commit approval). Writer interrupted once by machine sleep and resumed. RED: 6 files / 21 tests failing; GREEN: parent re-ran 41 files / 378 tests pass; writer: typecheck + lint clean. +299/−233 tracked plus 5 new files.
  - `src/lib/geo/visaCodes.ts` (resolveVisaCode, toVisaCodes, resolveNationalityCode) shared by script + API. Documents GET converts legacy visa names on read (no write-back) and prefills nationalities from `passportCountry`; PATCH validates codes (400 `{ error, invalid }`). Tab uses `CountryMultiSelect` for nationalities + visas (SCHENGEN extra option), `VISA_COUNTRIES` removed. `RemovableTag` `removeLabel`; `MultiSelectInput` accent-insensitive search + remove label.
  - Known behaviors: unresolved legacy visas disappear on save (all 55 old options resolve, so near-zero real impact); clearing all nationalities re-shows the `passportCountry` prefill (DB keeps the empty list).
- 2026-10-13 T2 committed `b2fe564b` (user-approved). RDD: medium, due; user granted; review `review-ba371803c7bc31e7` APPROVED + acknowledged; boundary → `b2fe564b`. Advisory (non-blocking, same as the known behaviors above): R3-cleared-nationalities-reappear (`documents/route.ts:59`), R3-legacy-visas-silently-dropped (`documents/route.ts:60`), R3-literal-combining-range suggestion (`visaCodes.ts:13`, use `̀-ͯ` escape).
- T3 route: delegated writer (checkout card, checkout page, new `PATCH /api/trips/[id]/buyer-documents`, possible Stripe server gate, dictionaries).
- 2026-10-13 T3 done (uncommitted, awaiting user commit approval). RED: missing modules + 6 page tests failing on behavior; GREEN: parent re-ran 23 files / 227 tests; writer: typecheck + lint clean.
  - `CheckoutTravelDocumentsCard`, `PATCH /api/trips/[id]/buyer-documents` (owner only, ISO validation, 409 once checkout locked using the trip-requests editable rule also in the write `where`, one transaction writes trip snapshot + `User.nationalities/approvedVisas`). Checkout `onBeforeConfirm` blocks with no nationality and saves before `/api/user/update`. Prefill: trip snapshot, else `/api/user/documents`.
  - Server gate NOT added: payment intent is created on page load and the card is charged client-side by `stripe.confirmPayment` right after `onBeforeConfirm`; no server step exists between card fill and charge. Admin soft warning (T5) covers bypass.
  - Parent inline fix: `omitBuyerOnlyFields` now strips `buyerNationalities`/`buyerVisas` for companions (privacy; RED → GREEN with new `companionTripView.test.ts`).
  - Note: checkout write-back replaces `User.approvedVisas` (no merge).
- 2026-10-13 T3 committed `393342dd` (user-approved). RDD: medium, due; user DECLINED review for this candidate (`declined_this_candidate`, target matched). Off-path tier medium → writer self-verification + parent re-run (done). Next assess base: `393342dd`.
- T4 split (planning): **T4a** companion fields (invite form + buyer direct-fill rows + APIs + serialization + user write-back on claim); **T4b** buyer editing on trip detail until `isRosterLocked` (fix: `buyer-documents` currently 409s after payment, contradicting the agreed edit window) + "Complete your travel documents" prompt.
  - Assumption (parent default, reversible): nationality REQUIRED on companion invite submit; OPTIONAL on buyer direct-fill PATCH (keeps partial saves from `f4a57507`); `isTravelerRosterComplete`/reminders UNCHANGED; new `hasTravelDocuments` helper feeds admin warning (T5). Reason: adding it to completeness would make legacy locked rows permanently incomplete and change reminder/checkout-success behavior.
- 2026-10-13 T4a done (uncommitted, awaiting user commit approval). RED: 9 files / 44 tests failing; GREEN: parent re-ran 21 files / 324 tests; writer: typecheck + lint exit 0. ~+940/−34 + new `TravelerDocumentsFields.tsx`.
  - DTO + `serializeTraveler` expose lists; `serializeTravelerForCompanion` omits them for others' rows. `hasTravelDocuments`, `parseTravelerDocumentCodes` in `travelerPolicy.ts`; completeness unchanged.
  - PATCH `/api/travelers/[id]`: optional lists, populated lists frozen after cutoff (403 `locked`), CAS covers them. Submit: ≥1 nationality required (400 `nationalities_required`, token not consumed); consume writes row + claiming `User` in one transaction. Invite page prefills from profile (server; client fallback for email/password sign-in).
  - Follow-ups: validation logic now in 3 places (`/api/user/documents`, `buyer-documents`, `travelerPolicy`) → consolidate; `CheckoutTravelDocumentsCard` could reuse `TravelerDocumentsFields`; locked complete rows keep empty visas read-only.
- 2026-10-13 T4a committed `e854ab03` (user-approved). RDD: medium, due; user DECLINED review (`declined_this_candidate`, target matched). Next assess base `e854ab03`. T4b route: delegated writer.
- 2026-10-13 T4b done (uncommitted). RED: route 2/22, section missing module, page 4/6; GREEN: parent re-ran 20 files / 207 tests; writer: typecheck + lint exit 0. +222/−67 + 3 new files (457).
  - `buyer-documents` editable: checkout-editable OR (payment APPROVED, status CONFIRMED/REVEALED, `!isRosterLocked`, `!isTripEnded`); race safety: write `where` repeats status/payment/owner and every `isRosterLocked` input (time cutoff can't be a SQL filter).
  - `BuyerTravelDocumentsSection` on trip detail (buyer only, payment APPROVED; read-only on `roster.locked` or non CONFIRMED/REVEALED); prompt when no nationality. `CheckoutTravelDocumentsCard` now reuses `TravelerDocumentsFields` (`profileCopy` prop deprecated; follow-up remove from checkout page).
  - OPEN product question: buyer is fully read-only after lock even with empty docs, while companion rows allow filling EMPTY fields after cutoff → legacy locked trips can't be completed by the buyer.
- 2026-10-13 decision (user): buyer follows the COMPANION lock rule — after lock, EMPTY buyer lists stay fillable, populated lists freeze. Commit pre-approved once verified. Writer resumed.
- 2026-10-13 T4b companion-rule change done: after lock, empty buyer lists fillable, populated frozen (unchanged re-save OK; omitted list = unchanged); write `where` adds `{ buyerX: { equals: current } }` per written list; route now uses shared `parseTravelerDocumentCodes` (one duplicate removed). RED route 4/32 + section/page 4/18 → GREEN; parent re-ran 20 files / 221 tests; writer typecheck + lint exit 0. Frozen-list error stays 409 here (companion route uses 403 `locked`).
