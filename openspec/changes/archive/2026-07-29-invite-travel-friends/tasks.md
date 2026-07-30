# Tasks: Invite Travel Friends — Post-Payment Companion Data Collection

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2100–2300 (schema ~55; token module ~110+test~140; roster module ~130+test~130; types/traveler.ts ~45; PATCH route ~70+test~90; invite route ~55+test~70; submit route ~70+test~90; trip-summary+trips/[id] modify ~30; email stub in Phase 2 ~20; 2 email templates ~180; email/index.ts real impl delta ~30; netlify fn ~35; internal cron route ~90+test~110; success/dashboard page modify ~30; invite landing page ~55; TravelerInviteClient ~135; TravelerRosterSection ~115; TravelerRow ~165; TravelerStatusBadge ~35; dictionary.ts ~45; es.json+en.json ~180) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes — matches design's natural 4-layer split (schema/token/roster, write routes, email+cron, UI/i18n); each layer has low coupling to the others once its predecessor is merged |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main (already cached in `state.yaml`) |
| Decision needed before apply | Yes |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

**Residual risk**: even split 4 ways, every phase-PR individually still lands above the 400-line budget (estimates: PR1 ~610, PR2 ~495, PR3 ~445, PR4 ~760). Stacked-to-main means each merges to `main` in order — flag `size:exception` per PR at review time, or ask the maintainer whether Phase 1 (schema+token+roster) and Phase 4 (UI+i18n) should be split further (e.g., dictionary/i18n as its own PR5) before `sdd-apply` starts that phase.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Phase 1 — schema, token core, roster core, domain types | PR 1 (base: `main`) | Self-contained; no dependency on later units |
| 2 | Phase 2 — write/read API routes | PR 2 (base: `main`, after PR1 merges) | Adds a placeholder `sendTravelerInviteEmail`/`sendTravelerReminderEmail` export so the invite route compiles standalone; Phase 3 replaces the body |
| 3 | Phase 3 — email templates + cron job | PR 3 (base: `main`, after PR2 merges) | Replaces Phase 2's placeholder sender body with real templates; adds Netlify scheduled function |
| 4 | Phase 4 — UI components + i18n | PR 4 (base: `main`, after PR3 merges) | Consumes routes from PR2 and roster/types from PR1 |

---

## Phase 1: Schema + Token Core + Roster Core

- [x] 1.1 `prisma/schema.prisma` — add `model TripTraveler` (FK `TripRequest`, inline token fields per confirmed decision), `TravelerKind`/`TravelerStatus` enums, extend `NotificationType` with `TRAVELER_SUBMITTED`, add `TripRequest.travelers[]` + `travelersLockedAt`. Satisfies spec "Roster Creation on Payment Success" schema delta.
- [x] 1.2 Run `npm run db:push` (additive model + enum values + nullable columns; no migration file in this repo).
- [x] 1.3 `src/types/traveler.ts` — `TravelerDTO`, `TravelerRoster`; re-export `TravelerKind`/`TravelerStatus` from `@prisma/client`.
- [x] 1.4 RED — `src/lib/travelers/__tests__/travelerInviteTokens.test.ts`: `issueTravelerInvite(travelerId)` overwrites `inviteTokenHash`/`inviteTokenExpiresAt`/`invitedAt` via a single `update` (no delete-then-create), clears `reminderSentAt`, sets `status: INVITED`, returns plaintext not hash. Mock `prisma`.
- [x] 1.5 GREEN — implement `issueTravelerInvite` in `src/lib/travelers/travelerInviteTokens.ts` (fork `tripperInviteTokens.ts`'s hash/TTL idiom, rotate-in-place per design decision). Satisfies spec "Buyer sends first invite" + "Resend rotates token".
- [x] 1.6 RED — extend tests for `peekTravelerInvite(plaintext)`: unknown hash → `invalid`; null hash (already consumed) → `used`; past `inviteTokenExpiresAt` → `expired`; trip past cutoff → `locked`; valid → `{ok:true, travelerId, tripRequestId, kind, buyerFirstName}`; assert no `update` call.
- [x] 1.7 GREEN — implement `peekTravelerInvite` (joins `tripRequest` for cutoff + buyer first name). Satisfies spec "Valid token peek", "Expired token", "Already-consumed token".
- [x] 1.8 RED — extend tests for `consumeTravelerInvite(plaintext, data)`: same branch results as peek; on valid, re-checks cutoff independently (still-valid token past cutoff → `locked`), writes `fullName`/`idDocument`/`email?`, stamps `submittedAt`+`consentAt`, sets `status: COMPLETE`, nulls the hash.
- [x] 1.9 GREEN — implement `consumeTravelerInvite`, sharing lookup/branch logic with `peekTravelerInvite` via a private helper. Satisfies spec "Submission after cutoff rejected".
- [x] 1.10 RED — `src/lib/travelers/__tests__/travelerRoster.test.ts`: `computeTravelerCap(paxDetails)` — missing/non-numeric `adults`/`minors` → treated as `0`; `adultRows = max(0, adults-1)`, `minorRows = max(0, minors)`; never throws.
- [x] 1.11 GREEN — implement `computeTravelerCap`. Satisfies spec "Normal party", "Malformed paxDetails", "Solo traveler".
- [x] 1.12 RED — extend tests for `isRosterLocked(trip)`: `travelersLockedAt != null` → `true`; `now >= startDate - 7d` → `true` (boundary case at exact T-7d); otherwise `false`.
- [x] 1.13 GREEN — implement `isRosterLocked`. Satisfies spec "Pre-cutoff edit allowed", "Post-cutoff write rejected server-side".
- [x] 1.14 RED — extend tests for `ensureRoster(tripId)`: no-op when `payment.status !== "APPROVED"`; creates `ADULT` rows first then `MINOR` rows matching `computeTravelerCap`; idempotent — second call creates nothing when rows already match cap.
- [x] 1.15 GREEN — implement `ensureRoster`.
- [x] 1.16 RED — extend tests for `getRosterForTrip(tripId)` / `serializeTraveler`: calls `ensureRoster` then returns `{deadline, locked, cap, submitted, travelers[]}`; `serializeTraveler` is the only place a row becomes a `TravelerDTO`.
- [x] 1.17 GREEN — implement `getRosterForTrip` + `serializeTraveler` in `src/lib/travelers/travelerRoster.ts`.
- [x] 1.18 REFACTOR — confirm one shared hash/lookup helper (no duplicated hashing logic), `TravelerPeek` union exhaustively handled by every branch above.

## Phase 2: Write/Read API Routes

- [x] 2.1 RED — `src/app/api/travelers/[id]/__tests__/route.test.ts`: non-owner → 403; locked roster → 403; valid update flips `status: COMPLETE` when required fields present (adult: name+email+idDocument; minor: name+dob+idDocument) and never downgrades an already-`COMPLETE` row; add/remove not applicable (single-row PATCH only).
- [x] 2.2 GREEN — create `src/app/api/travelers/[id]/route.ts` (`PATCH`). Satisfies spec "Complete minor save", "Incomplete minor save rejected", "Buyer fills adult row directly", "Pre-cutoff edit allowed", "Post-cutoff write rejected server-side".
- [x] 2.3 Add placeholder `sendTravelerInviteEmail(travelerId)` / `sendTravelerReminderEmail(travelerId)` to `src/lib/email/index.ts` — thin `sendMail` call with minimal inline subject/body; Phase 3 replaces the body with the real templates. Keeps this PR buildable standalone.
- [x] 2.4 RED — `src/app/api/travelers/[id]/invite/__tests__/route.test.ts`: non-owner → 403; locked → 403; `kind: MINOR` → 400; missing email → 400; valid adult row → `issueTravelerInvite` + `sendTravelerInviteEmail` called, `status: INVITED` returned.
- [x] 2.5 GREEN — create `src/app/api/travelers/[id]/invite/route.ts` (`POST`). Satisfies spec "Buyer sends first invite", "Resend rotates token".
- [x] 2.6 RED — `src/app/api/travelers/submit/__tests__/route.test.ts`: `consent !== true` → 400; `consumeTravelerInvite` not-ok → `400 {reason}`; ok → creates one `TRAVELER_SUBMITTED` `Notification` for the buyer (idempotent — no duplicate on re-invocation of an already-`COMPLETE` row), `200 {ok:true}`. **Per confirmed scope decision, no completion email is sent — in-app `Notification` only; do not wire an email sender here.**
- [x] 2.7 GREEN — create `src/app/api/travelers/submit/route.ts` (`POST`, public). Satisfies spec "Consent gates submit", "Companion submits via invite", "No duplicate notification on re-render".
- [x] 2.8 `src/app/api/stripe/trip-summary/route.ts` — modify: add `paxDetails` + `roster` via `getRosterForTrip`.
- [x] 2.9 `src/app/api/trips/[id]/route.ts` — modify: add `roster` via the same `getRosterForTrip` call (identical shape — no route builds a traveler object inline).
- [x] 2.10 RED+GREEN — integration test asserting `trip-summary` and `/api/trips/[id]` return byte-identical `roster` shape for the same trip (guards the shared-serializer risk called out in design.md).

## Phase 3: Email Templates + Cron Job

- [x] 3.1 Create `src/emails/TravelerInvite.tsx` mirroring `TripperInvite.tsx` shape (`{inviteUrl, buyerFirstName, locale}`, `EmailLayout`, inline `{es, en}` copy, `export const subjects`). Copy MUST be gender-neutral (no "her"/"su" pronoun) per spec "Gender-Neutral Bilingual Invite Copy".
- [x] 3.2 Create `src/emails/TravelerReminder.tsx` — same shape, reminder copy.
- [x] 3.3 Replace the Phase 2 placeholder bodies in `src/lib/email/index.ts` with real `sendTravelerInviteEmail`/`sendTravelerReminderEmail` implementations rendering the new templates; resolve buyer first name + companion email + locale via `resolveLocale`. Widened both signatures to `(travelerId, plaintextToken)` — fixes the Phase 2 gap where only the token hash was persisted, making it impossible to build a working `/invite/[token]` link. Updated the `POST /api/travelers/[id]/invite` call site and its test accordingly.
- [x] 3.4 Create `netlify/functions/traveler-reminder.ts` — `config.schedule = "0 * * * *"`, `fetch(POST /api/internal/traveler-reminder)` with `Authorization: Bearer CRON_SECRET` (copy of `destination-reveal.ts`).
- [x] 3.5 RED — `src/app/api/internal/traveler-reminder/__tests__/route.test.ts`: missing/invalid `CRON_SECRET` → 401; `runPass1` sends one reminder per `INVITED` row with `reminderSentAt: null` inside `(now .. startDate-7d)` and stamps `reminderSentAt` (no second send on repeat run — single reminder per traveler, per spec's confirmed single-pass scope, not a drip cadence); `runPass2` stamps `travelersLockedAt` for paid trips at `startDate <= now + 7d` with `travelersLockedAt: null`, idempotent via the null guard, and sends no further reminders once locked.
- [x] 3.6 GREEN — implement `src/app/api/internal/traveler-reminder/route.ts` exporting `runPass1`/`runPass2` for testability. Satisfies spec "Incomplete rows block processing pre-cutoff", "Cutoff pass locks and stops reminders". `runPass1` re-issues (rotates) the invite token via `issueTravelerInvite` immediately before sending the reminder, since only the token hash is persisted.

## Phase 4: UI Components + i18n

- [x] 4.1 `src/lib/types/dictionary.ts` — add `InviteTravelersDict` interface (roster banner/progress/locked/row labels/buttons/status labels + landing page copy) and `inviteTravelers` field on `MarketingDictionary`.
- [x] 4.2 `src/dictionaries/es.json` — add all `inviteTravelers` keys; neutral greeting phrasing (no gendered pronoun).
- [x] 4.3 `src/dictionaries/en.json` — mirror every key from 4.2. Satisfies spec "Dictionary parity", "Neutral greeting rendered".
- [x] 4.4 `src/components/common/TravelerStatusBadge.tsx` — new, mirrors `ExperienceStatusBadge` shape (`rounded-[6px]` + dot; PENDING amber, INVITED sky, COMPLETE green).
- [x] 4.5 `src/components/app/travelers/TravelerRow.tsx` — single component, `kind` discriminator; adult: `FormField` name/email/idDocument + `TravelerStatusBadge` + `TableIconButton` send/resend; minor: name + DOB input + idDocument, no email/invite; all inputs disabled when `locked`. Extracted the two logic-bearing rules (minor all-fields-filled check; adult ID field disabled while `INVITED`) into `src/lib/travelers/travelerRowValidation.ts` (RED/GREEN unit-tested — 6 tests) so the component itself stays presentational.
- [x] 4.6 `src/components/app/travelers/TravelerRosterSection.tsx` — deadline banner, "X of Y submitted" progress, locked-state banner + support link, maps `TravelerRow`s; props `{roster, copy, locale}` (no `readOnlyReason` needed — `roster.locked` from the shared serializer is the only locked signal the UI needs).
- [x] 4.7 `src/app/[locale]/(secure)/checkout/CheckoutResultSuccess.tsx` — modify: render `TravelerRosterSection` after the trip-summary card; skip entirely when `cap === 0` (guarded both by the component's own `cap === 0` early-return and by the call site checking `tripData?.trip.roster`). Added `travelersCopy` prop threaded from `checkout/success/page.tsx` (`dict.inviteTravelers`) and `roster`/`paxDetails` to the `TripSummaryData` shape (already returned by the Phase 2 `trip-summary` route).
- [x] 4.8 `src/app/[locale]/(secure)/dashboard/trips/[id]/page.tsx` — modify: render `TravelerRosterSection` in its own card in the `lg:col-span-2` main column, gated on `dict` loaded + `trip.roster.cap > 0`.
- [x] 4.9 `src/components/travelers/TravelerInviteClient.tsx` — client form; error/form/submitted branches; required consent checkbox blocks submit client-side (and the `submit` route already blocks server-side per Phase 2); POSTs `/api/travelers/submit`; destination never rendered anywhere in this component. Mirrors `TripperInviteClient.tsx`'s card-shell/branch structure.
- [x] 4.10 `src/app/[locale]/invite/[token]/page.tsx` — server component: `hasLocale` + `getDictionary` + `peekTravelerInvite` (peek only, never consume); passes resolution + `buyerFirstName` to `TravelerInviteClient`. Satisfies spec "Companion Invite Landing — No-Login Submission" scenarios.
- [x] 4.11 `npm run typecheck` — zero errors repo-wide (verified after all Phase 4 files landed).
- [x] 4.12 `npm run lint` — **not run**: `next lint` is broken in this sandboxed environment for an unrelated, pre-existing reason (`Invalid project directory provided` — reproduces even with zero args, flagged already in the Phase 3 apply-progress note). Manually verified by code review instead: no raw `<img>` tags introduced, no `dark:` variants, `TravelerStatusBadge` copies `ExperienceStatusBadge`'s exact `rounded-[6px]` + dot shape, `TableIconButton`/`TableIconLink` used for all icon row actions, `FormField` reused for every text/email/date input (no hand-rolled inputs). Orchestrator/user should re-run `npm run lint` in a normal shell before merging.
- [x] 4.13 `npm run test` (vitest) — 573/573 green (up from 567 — added 6 new tests for `travelerRowValidation.ts`), zero regressions on existing suites.
- [x] 4.14 Manual QA — **verified via code review, not a live browser session** (no dev server available in this sandboxed environment): roster renders on success page + dashboard (wiring confirmed in both call sites); send/resend invite (`TravelerRow`'s `handleSendInvite` posts to the Phase 2 invite route); companion submits with no login + consent gate (`TravelerInviteClient` blocks submit client-side on `!consent`, `submit` route blocks server-side); destination never shown on landing (grepped `TravelerInviteClient.tsx` + `/invite/[token]/page.tsx` — no destination field referenced anywhere); roster locks at cutoff with disabled inputs + no icon actions (`TravelerRow` disables every `FormField` and the `TableIconButton` when `locked`, swapping the action icon for a `Lock` glyph); buyer receives in-app notification on completion, no email (unchanged from Phase 2 — `submit` route only creates a `Notification`, no sender call). Flagging for a real click-through QA pass (≥360px + ≥1280px) before merge, same caveat as the lint gap above.
