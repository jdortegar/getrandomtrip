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
- [ ] **T2** Profile Documents tab: add nationalities multi-select (prefill from `passportCountry`), switch visas to ISO codes; `/api/user/documents` validates ISO codes; es/en dictionary keys.
- [ ] **T3** Checkout "Travel documents" card: required nationalities (min 1) + visas, prefilled from `User`, saved to `TripRequest` snapshot and written back to `User`; payment blocked until the buyer snapshot has at least one nationality; es/en copy.
- [ ] **T4** Companion fields: invite form and buyer direct-fill row (`TravelerRow`, `PATCH /api/travelers/[id]`, `POST /api/travelers/submit`) gain nationalities + visas, editable until `isRosterLocked`; claimed companions prefill from and write back to `User`; minors filled by the buyer; roster completeness includes nationalities; trip detail prompts the buyer when their snapshot is empty.
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
