# Proposal: Invite Travel Friends — Post-Payment Companion Data Collection

## Intent

Checkout today collects only the buyer's own contact info (`CheckoutFormFields`) plus a
headcount (`PaxDetails: {adults, minors, rooms}`). There is no per-companion identity data
anywhere in the schema. Demanding every traveler's name, email, and ID/passport at checkout
would turn a one-person form into an N-person form and add friction exactly where conversion
matters most.

This change moves per-companion identity collection to **after payment**. Checkout stays a
single-person form regardless of party size. Once payment succeeds, the buyer either types each
companion's data directly or emails them a tokenized invite link so the companion fills it in
themselves — no account required. The same editable roster appears on the dashboard trip detail
until a hard cutoff, after which it locks server-side. Companion identity data is required before
the trip can be processed, so incomplete rows keep surfacing (in-app nudge + reminder emails)
until the cutoff.

**Why now:** the booking flow is live and collecting money, but the platform cannot actually
arrange per-traveler bookings (flights, hotels, IDs) without each companion's identity. This is a
functional gap between "trip paid" and "trip fulfillable," not a nice-to-have.

**Success looks like:** a buyer completes checkout alone, sees an "Invite your travel friends"
section on the success page, can populate every companion row (directly or by invite), invited
companions submit via a no-login landing page, the buyer is notified as each row completes, and
the roster locks automatically at the cutoff.

## Scope

### In Scope

- **Data model**: new `TripTraveler` model (FK to `TripRequest`), new `TravelerKind`
  (`ADULT` | `MINOR`) and `TravelerStatus` (`PENDING` | `INVITED` | `COMPLETE`) enums, new
  `NotificationType` enum value (e.g. `TRAVELER_SUBMITTED`). Additive only — `TripRequest.paxDetails`
  stays as-is (headcount source of truth for the row cap).
- **Success page section** (`CheckoutResultSuccess.tsx`): "Invite your travel friends" section
  after the trip-summary card — deadline banner with "X of Y submitted" progress, one row per
  companion (hard-capped at `paxDetails.adults + paxDetails.minors − 1`). Adult rows:
  name/email/ID-passport + status pill + resend-invite button. Minor rows: name/DOB/ID-passport,
  no email/invite (guardian fills directly).
- **Dashboard trip-detail section** (`dashboard/trips/[id]/page.tsx`): same roster, editable
  before cutoff (edit-only; no add/remove — count fixed by paid pax), fully locked after cutoff
  (inputs disabled + lock banner + support link).
- **Companion invite landing** `/invite/[token]`: no-login server page that *peeks* the token
  (never consumes on render), shows buyer's first name + "invited you to join her randomtrip"
  (destination NOT revealed), name/email/ID-passport fields, **required consent checkbox**,
  submit. Mirrors the `tripper-invite` server-peek → client-form → POST-to-consume structure.
- **Invite token lifecycle**: SHA-256(randomBytes(32)) hash-in-DB pattern (same idiom as
  `tripperInviteTokens.ts`), stored **inline on `TripTraveler`** — see Approach for the decision.
- **Email**: new `CompanionInvite` template (`src/emails/`) + `sendCompanionInviteEmail()` in
  `src/lib/email/index.ts`, following the `TripperInvite` bilingual `{es, en}` + `subjects` pattern.
- **Reminder + cutoff scheduled job**: `netlify/functions/traveler-reminder.ts` +
  `src/app/api/internal/traveler-reminder/route.ts`, `CRON_SECRET`-guarded, two-pass idempotent
  shape mirroring `destination-reveal` (Pass 1: reminder emails for incomplete rows before cutoff;
  Pass 2: server-side lock at cutoff). Cutoff = `TripRequest.startDate − N days`.
- **Buyer notification**: in-app `Notification` (+ email) fired when a companion row flips to
  `COMPLETE`.
- **API routes**: create/update traveler rows (success page + dashboard), submit-from-token
  (companion landing), resend-invite action. Both the `trip-summary` and `/api/trips/[id]`
  responses extended with traveler data via one shared serializer.
- **i18n + types**: new `inviteTravelers` dictionary section (interface + `MarketingDictionary`
  field + ES/EN keys), new domain types in `src/types/traveler.ts`.

### Out of Scope / Follow-up

- **"Create a free account" wiring**: the landing page shows the optional link, but full
  account-creation-from-invite plumbing (pre-filling signup with submitted identity, linking the
  new `User` back to the `TripTraveler`) is deferred. Account creation is never required to submit;
  the link can point at the existing signup flow for v1.
- **Analytics / funnel instrumentation** (invite-sent, invite-opened, completion-rate events):
  deferred. No event tracking wired in this change.
- **Reminder cadence tuning** (multiple escalating reminders, per-companion snooze): v1 sends a
  single reminder pass on the established `destination-reveal` cadence. Multi-stage nudge schedules
  are a follow-up.
- **Editing party size post-checkout**: explicitly not supported — footnote directs changes through
  support. No add/remove-row UI.
- **Minor-specific validation beyond "all three fields present"** (e.g. DOB-implies-minor
  cross-check against `paxDetails.minors`): basic required-field validation only for v1.
- **Backfill of existing paid trips**: the model is additive; historical trips without traveler
  rows are not retroactively populated. Defensive handling for missing/malformed `paxDetails` is in
  scope, backfill is not.

## Capabilities

### New Capabilities

- `companion-travelers`: the `TripTraveler` roster model, its lifecycle
  (`PENDING → INVITED → COMPLETE`), the edit/lock cutoff rules, and the read serializer shared by
  success page and dashboard.
- `companion-invite`: tokenized no-login invite (issue/peek/consume), the invite + reminder emails,
  and the `/invite/[token]` landing submission flow.

### Modified Capabilities

- Checkout success page and dashboard trip detail (add the roster section).
- `transactional-email` catalogue (add companion invite + reminder emails).
- In-app notifications (add `TRAVELER_SUBMITTED`).

## Approach

Follow every existing precedent the exploration mapped rather than inventing infrastructure:

1. **Token pattern** — reuse the `tripperInviteTokens.ts` idiom (`randomBytes(32)` plaintext in the
   URL, only the SHA-256 hash persisted, `peek` for render decisions, `consume` on submit), just
   persisted on the traveler row (see token-storage decision below).
2. **Email** — one `sendCompanionInviteEmail()` / `sendTravelerReminderEmail()` function per type in
   `src/lib/email/index.ts`, fire-and-forget, template mirrors `TripperInvite.tsx`.
3. **No-login landing** — `/invite/[token]` server page peeks (never consumes on render), passes a
   discriminated-union `resolution` + buyer first name into a client form that POSTs to a
   `submit-from-token` route, exactly like `tripper-invite`.
4. **Scheduled job** — `traveler-reminder` Netlify function → `CRON_SECRET`-guarded internal route
   with named, testable `runPass1`/`runPass2` functions, using `status`/`invitedAt` fields as
   idempotency stamps (the `destinationAssignmentNotifiedAt` analogue).
5. **One shared serializer** for traveler rows, consumed by both `trip-summary` and
   `/api/trips/[id]` responses, to prevent shape drift (flagged as a risk).

### Decision: Token storage — inline on `TripTraveler` (RECOMMENDED)

**Recommendation: store the invite token inline on the `TripTraveler` row**
(`inviteTokenHash @unique`, `inviteTokenExpiresAt`, `invitedAt`, `submittedAt`, `consentAt`) rather
than a separate `TripTravelerInvite` token table.

**Reasoning:**

- **The cardinality is 1:1, unlike the existing token tables.** `TripperInvite` and
  `VerificationToken` use dedicated tables precisely because they have **no persistent owner row** —
  a tripper invite resolves by email at accept time (no `TripperInvite`→`User` FK), and a
  verification token is a transient artifact. Here, the `TripTraveler` row is a **first-class,
  persistent entity** that exists whether or not an invite is ever sent (the buyer can type a
  companion's data directly and never send an invite). The token is one optional lifecycle attribute
  of that row, not an independent object. A companion always has exactly one row and at most one live
  invite.

- **We don't lose replay safety.** The value a separate table buys is the "invalidate prior
  unconsumed rows" pattern (`$transaction` delete-then-create). With a stable owner row, we get that
  **for free by rotating in place**: resending overwrites `inviteTokenHash` and bumps `invitedAt`,
  which instantly invalidates the previous token (old hash no longer matches). No transaction dance,
  no orphan rows.

- **Simpler reads, no join.** Both the success page and dashboard render the roster on every load; a
  separate table adds a join to every read for zero functional gain at 1:1 cardinality.

- **Matches the literal request** in the design handoff, which lists `inviteToken`/`invitedAt` as
  fields directly on the traveler record.

**Override signal (flagged for review):** choose a separate `TripTravelerInvite` table instead **if**
the product needs an **audit trail of every invite ever sent** (history, resends log), **multiple
concurrent recipients per companion**, or **delegated/forwarded invites**. None of these are in the
confirmed v1 scope, so this is YAGNI today — but it is a one-way-ish door on the data model, so the
user should confirm before spec. If any of those requirements are real, flip to the table and the
spec/design phases adjust accordingly.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | New `TripTraveler` model + FK, `TravelerKind`/`TravelerStatus` enums, `TRAVELER_SUBMITTED` notification type |
| `src/lib/auth/companionInviteTokens.ts` | New | Issue/peek/consume, forked from `tripperInviteTokens.ts`, token fields on `TripTraveler` |
| `src/emails/CompanionInvite.tsx`, `TravelerReminder.tsx` | New | Bilingual templates + `subjects` |
| `src/lib/email/index.ts` | Modified | `sendCompanionInviteEmail()`, `sendTravelerReminderEmail()`, buyer-completion notice |
| `src/app/[locale]/(secure)/checkout/CheckoutResultSuccess.tsx` | Modified | "Invite your travel friends" section |
| `src/app/api/stripe/trip-summary/route.ts` | Modified | Extend payload with `paxDetails` + traveler rows (shared serializer) |
| `src/app/[locale]/(secure)/dashboard/trips/[id]/page.tsx` | Modified | Editable/lockable Travelers section |
| `src/app/api/trips/[id]/route.ts` | Modified | Extend payload with traveler rows (shared serializer) |
| `src/app/[locale]/invite/[token]/page.tsx` + client | New | No-login peek → form landing, mirrors `tripper-invite` |
| `src/app/api/travelers/*` | New | Create/update rows, submit-from-token, resend-invite |
| `netlify/functions/traveler-reminder.ts`, `src/app/api/internal/traveler-reminder/route.ts` | New | Reminder + cutoff two-pass job |
| `src/lib/types/dictionary.ts`, `src/dictionaries/{es,en}.json` | Modified | New `inviteTravelers` section (both locales) |
| `src/types/traveler.ts` | New | Domain types |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Malformed/missing `paxDetails` breaks the row-cap math | Med | Defensive cap: treat missing `adults`/`minors` as 0, clamp `cap` at ≥0; skip section if cap is 0 |
| Response-shape drift between `trip-summary` and `/api/trips/[id]` | Med | One shared traveler serializer consumed by both routes |
| Client-only lock can be bypassed | Med | Cutoff enforced **server-side** in write routes + Pass 2 lock, not just disabled inputs |
| Companion submits after cutoff via stale token | Low | `submit-from-token` re-checks cutoff + token validity server-side before write |
| Reminder job double-sends | Low | Idempotency stamps (`invitedAt`/`status`) + threshold query, mirroring `destination-reveal` passes |
| Token-storage decision reversed later | Low | Flagged for user override before spec; inline is additive and reversible pre-launch |

## Open Questions (for review)

1. **Token storage** — inline on `TripTraveler` (recommended) vs. separate `TripTravelerInvite`
   table. Confirm or override before spec (see Decision above).
2. **Cutoff offset `N`** — how many days before `startDate` does the roster lock? Design handoff
   says "Complete by" but no concrete N. Assume a placeholder for spec/design; confirm value.

## Success Criteria

- [ ] Buyer completes checkout as a one-person form regardless of party size.
- [ ] Success page shows exactly `adults + minors − 1` companion rows, correctly split adult/minor.
- [ ] Buyer can populate a row directly OR send/resend an invite that flips status to Invited.
- [ ] Companion submits via `/invite/[token]` with no account and required consent; row → Complete.
- [ ] Destination is never revealed on the invite landing page.
- [ ] Roster is editable pre-cutoff (no add/remove) and fully locked server-side post-cutoff.
- [ ] Buyer is notified when each companion completes.
- [ ] Reminder job nudges incomplete rows and locks the roster at cutoff, idempotently.
- [ ] All new UI copy exists in both `es` and `en`; `npm run typecheck` passes.
