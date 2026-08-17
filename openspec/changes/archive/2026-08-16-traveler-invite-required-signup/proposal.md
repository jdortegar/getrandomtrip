# Proposal: Traveler Invite — Required Signup Before Submission

## Intent

`openspec/changes/archive/2026-07-29-invite-travel-friends/` shipped a companion-invite flow
whose spec explicitly guarantees **no-login submission**: "Requirement: Companion Invite Landing —
No-Login Submission … An optional 'create a free account' link MAY be shown but MUST NOT be
required to submit," with the scenario "Account creation optional". `POST /api/travelers/submit`
is therefore public and token-gated only, and account-creation-from-invite was listed as
Out of Scope / follow-up.

**This change reverses that requirement.** Account creation (or login) becomes MANDATORY before a
companion can submit their traveler details.

**Why now:**

1. **Growth / CRM (primary)** — every companion on every paid trip is a qualified, already-warm
   lead. Today they hand us identity data and leave with no account, no relationship, no way to
   re-market. The invite link is the highest-intent acquisition surface the product has and it is
   currently a dead end.
2. **Identity liability / fraud prevention (secondary)** — ID/passport data submitted anonymously
   against a link is attributable to nobody. Binding each `TripTraveler` row to a real `User`
   gives us an accountable claimant per travel document.

**Success looks like:** a companion opens `/[locale]/invite/[token]`, sees the same personalized
"{buyer} invited you…" context, signs up or logs in through the existing `AuthModal`, then — on
the same page — supplies only ID/passport + consent, and lands on their own dashboard with the
trip already visible in "My Trips".

## Scope

### In Scope

- **Schema**: add `TripTraveler.userId String?` (nullable) + relation to `User`. Nullable is
  mandatory: minor rows never authenticate, and historical rows predate this change.
- **Invite landing becomes a two-step, session-driven state machine**
  (`/[locale]/invite/[token]` + `TravelerInviteClient.tsx`):
  - **Step 1 (no session)** — personalized greeting/context renders as today, but the ONLY
    interactive element is a "Sign up to continue" CTA that opens `AuthModal`. No anonymous
    submit path survives; the identity form is not rendered at all.
  - **Step 2 (session present)** — collects **only** `idDocument` + the required consent checkbox.
    Full name and email are no longer asked here; they are derived server-side from the account.
- **`POST /api/travelers/submit` becomes session-gated** — `getServerSession` required, `401` with
  no session. Payload narrows to `{ token, idDocument, consent }`. `fullName`/`email` are derived
  from `session.user.name` / `session.user.email`, never from the client. On success, sets
  `TripTraveler.userId = session.user.id` alongside the existing `consumeTravelerInvite` writes
  (`status → COMPLETE`, `submittedAt`, `consentAt`).
- **Success UX**: reuse the existing success card (`landingSuccessTitle` / `landingSuccessBody`)
  for ~1–2s, then `router.push` to `/{locale}/dashboard`.
- **"My Trips" shows companion trips**: `GET /api/trip-requests` currently queries
  `where: { userId: user.id }` (buyer-only, `src/app/api/trip-requests/route.ts:150`). Widen to an
  OR — buyer-owned trips UNION trips having a `TripTraveler` row with matching `userId`.
- **Bundled bugfix — dashboard roster Save regression** (see dedicated section below).
- **i18n**: new/updated `inviteTravelers` keys for the signup wall (CTA, wall explainer, step-2
  heading) in both `es` and `en`.

### Out of Scope

- **`AuthModal.tsx` changes — ZERO.** Confirmed with the user: despite the original phrasing, the
  ID/passport field does NOT move inside `AuthModal`. It stays generic auth (Name+Email+Password
  register, Email+Password login, Google OAuth) and is reused untouched with
  `allowRegister: true`, `defaultMode="register"`.
- **Companion permission narrowing.** v1 reuses the exact same trip card and trip-detail page
  (`dashboard/trips/[id]/page.tsx`) with full buyer-level permissions for companions. A companion
  will see and be able to act on the trip exactly like the buyer. **Accepted scope cut, flagged as
  a known follow-up — not a blocker for this change.**
- **Email verification gating.** Companions proceed to step 2 with an unverified account; this path
  deliberately does not gate on `EMAIL_NOT_VERIFIED`.
- **Any change to token semantics** — expiry, cutoff lock, resend/rotation, `consumeTravelerInvite`,
  and the reminder cron all stay exactly as archived.
- **Minor rows.** Unaffected. Minors never traverse `/invite/[token]` (no email/invite action on
  minor rows in `TravelerRow.tsx`); the buyer fills them directly on both surfaces.
- **Backfill.** Existing `COMPLETE` rows keep `userId = null`; no retroactive linking.
- **Analytics on the new signup funnel.** Deferred.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `companion-invite`: the "No-Login Submission" requirement is **reversed** — authentication is now
  required; submit is session-gated; identity fields are derived server-side. Delta spec must
  supersede the archived "Account creation optional" scenario.
- `companion-travelers`: `TripTraveler` gains an owning `userId` link set at submit time.
- Dashboard trip list (`GET /api/trip-requests`): buyer-only ownership widened to
  buyer-OR-companion.
- Dashboard trip detail roster: gains the global-Save wiring it is missing (bugfix below).

## Approach

Thirteen decisions were resolved in a live interview and are implemented as-is — this proposal
records them, it does not re-open them.

| # | Decision |
|---|---|
| 1 | Motivation: growth/CRM primary, identity-liability/fraud secondary (see Intent). |
| 2 | Wall shape: **modal-first, no anonymous bypass**. Personalized context stays; the only control is "Sign up to continue" → `AuthModal`. |
| 3 | Both **login and register** satisfy the wall (companions may already have accounts): `allowRegister: true`, `defaultMode="register"`. |
| 4 | Schema: `TripTraveler.userId String?` + `User` relation, nullable, set at final submit. |
| 5 | **Two-step page, not a modal redesign.** `AuthModal.tsx` = zero changes. ID/passport + consent live in step 2 of the same page. Name/email never re-asked once authed. |
| 6 | `POST /api/travelers/submit` requires `getServerSession` (401 otherwise); payload `{ token, idDocument, consent }`; `fullName`/`email` derived server-side; sets `userId`. |
| 7 | Success: existing success card ~1–2s → `router.push` to `/${locale}/dashboard`. |
| 8 | `GET /api/trip-requests` → OR query (buyer-owned ∪ `TripTraveler.userId` match). Same card, same detail page, buyer-level permissions — explicit v1 cut. |
| 9 | **Email verification skipped here.** The page's "do I have a session?" gate for step 2 must not additionally require `emailVerified`; an `EMAIL_NOT_VERIFIED` result from `AuthModal`'s `signIn` is treated as authenticated-enough to proceed. `AuthModal`'s own panel swap for that error is fine to show inside the modal. |
| 10 | **No Google-OAuth token carry-through needed** — see note below. |
| 11 | Token semantics unchanged: **token = WHICH row** (trip + companion slot), **session = WHO is claiming it**; joined at submit. `consumeTravelerInvite`, expiry, cutoff-lock, resend/rotation all preserved. |
| 12 | Dashboard roster Save regression fixed in this change (see below). |
| 13 | Minors entirely unaffected. |

### Why this is simpler than `tripper-invite`

The tripper invite flow needs the `grt_tripper_invite` cookie carried through NextAuth's
`signIn`/`jwt` callbacks in `src/lib/auth.ts` because the invite must be redeemed *inside* the auth
transaction. **Nothing invite-token-related runs in NextAuth callbacks here.**
`handleGoogleSignIn` in `AuthModal.tsx` already passes `callbackUrl: window.location.href`, so
completing OAuth returns the browser to the same `/invite/[token]` URL with a live session, and the
page's own state machine (session exists → render step 2) resumes. No cookie, no callback hook, no
`src/lib/auth.ts` change.

## Included Bugfix (separate concern, deliberately bundled) — #12

**This is not part of the signup wall.** It is an independent, currently-shipped regression that
touches the same file the wall work touches, so it is fixed here rather than left broken.

A later change in the same working session replaced per-field blur-autosave and the minor row's
per-row Save button with a **single global Save** pattern:
`TravelerRowHandle` / `TravelerRosterSectionHandle` exposed via `forwardRef` +
`useImperativeHandle` (`src/components/app/travelers/TravelerRow.tsx:103`,
`TravelerRosterSection.tsx:31-43`), driven by a Save button in
`CheckoutResultSuccess.tsx` (`rosterRef` at :75, `saveAll()` at :81) next to "Go to my trips".

That wiring was **never applied to `dashboard/trips/[id]/page.tsx`**, which renders the same
`<TravelerRosterSection>` (line 380) with **no `ref` and no Save button**. Result: editing any
traveler row — adult **or** minor — on the buyer's dashboard trip-detail page is currently a no-op;
nothing ever calls `saveAll()`, so edits are silently discarded.

**Fix**: wire the identical `rosterRef` + Save button pattern into the dashboard page so both
surfaces behave identically.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | `TripTraveler.userId String?` + `User` relation + index; `User.tripTravelers[]` back-relation. Apply with `npm run db:push` (repo has no migration files). |
| `src/app/api/travelers/submit/route.ts` | Modified | Session-gated; narrowed payload; server-derived `fullName`/`email`; sets `userId`. |
| `src/lib/travelers/travelerInviteTokens.ts` | Modified | `consumeTravelerInvite` accepts/persists `userId`; peek/expiry/cutoff logic untouched. |
| `src/components/travelers/TravelerInviteClient.tsx` | Modified | Two-step state machine: wall CTA + `AuthModal` → ID/consent step → success card → redirect. |
| `src/app/[locale]/invite/[token]/page.tsx` | Modified | Pass session state into the client; keep server peek (never consume). |
| `src/app/api/trip-requests/route.ts` | Modified | `where` at :150 becomes buyer-OR-companion. |
| `src/app/[locale]/(secure)/dashboard/trips/[id]/page.tsx` | Modified | Add `rosterRef` + Save button (bugfix #12). |
| `src/components/auth/AuthModal.tsx` | **Unchanged** | Explicitly zero changes. |
| `src/lib/auth.ts` | **Unchanged** | No NextAuth callback work needed (decision #10). |
| `src/lib/types/dictionary.ts`, `src/dictionaries/{es,en}.json` | Modified | Signup-wall + step-2 copy, both locales. |
| `src/types/traveler.ts` | Modified | `TravelerDTO` may expose `userId` / `claimed` for UI state. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| **Conversion drop** — a hard wall on a post-payment obligation may stall companions and leave rosters incomplete at cutoff | High | Accepted tradeoff (growth is the point). Existing reminder cron + buyer-visible "X of Y submitted" already surface incomplete rows; buyer can always fill the row directly, which bypasses the wall entirely. |
| Companion gets **buyer-level access** to the trip detail page | Med | Explicitly accepted for v1 and logged as a follow-up. No sensitive buyer-only data (payment records) is rendered on that page today — verify during spec. |
| Companion signs up with a **different email** than the invited one | Med | Token, not email, resolves the row; the session-derived email overwrites `TripTraveler.email`. Decide in spec whether to warn or silently accept (recommendation: accept, since the token proves the slot). |
| Unverified accounts accumulate via this path (decision #9) | Med | Intentional. Row still completes; standard verification nudges apply outside this flow. |
| `emailVerified` accidentally gating step 2 | Med | Call it out in spec + a test: the page's session check must NOT read `emailVerified`. |
| OAuth round-trip loses in-progress step-2 input | Low | The wall precedes step 2 — nothing typed yet when OAuth redirects. |
| OR-query on `trip-requests` degrades list performance | Low | Index `TripTraveler.userId`; the relation filter is a single indexed lookup. |
| Bundling bugfix #12 inflates the PR diff (`single-pr` delivery) | Low | Fix is ~15 lines in one file, mirroring an existing pattern; keep it as its own commit inside the PR. |

## Rollback Plan

1. Revert the feature commits on `develop`.
2. `TripTraveler.userId` is additive and nullable — it may be left in place harmlessly; if dropped,
   `npm run db:push` removes only the link column, destroying no traveler identity data.
3. Reverting restores the public `POST /api/travelers/submit` and the one-step landing form.
   In-flight invite tokens keep working across the revert in both directions, because token
   issue/peek/consume semantics are untouched (decision #11).
4. The `trip-requests` OR-query revert simply hides companion trips again; no data change.
5. Bugfix #12 is independently revertible (single commit, single file).

## Dependencies

- Existing `AuthModal` + NextAuth credentials/Google providers (used as-is, not modified).
- `npm run db:push` for the additive nullable column.
- No new env vars, no new third-party service.

## Success Criteria

- [ ] `/invite/[token]` with no session renders the personalized greeting and a signup CTA only —
      no identity fields, no submit path.
- [ ] Both register and login through `AuthModal` unlock step 2; Google OAuth returns to the same
      invite URL and lands on step 2.
- [ ] `AuthModal.tsx` and `src/lib/auth.ts` have **zero** diff in this change.
- [ ] Step 2 asks for ID/passport + consent only — never name or email.
- [ ] `POST /api/travelers/submit` returns 401 without a session and ignores any client-supplied
      `fullName`/`email`.
- [ ] A completed row has `userId` set, `status = COMPLETE`, `submittedAt` and `consentAt` stamped.
- [ ] An unverified-email account still completes step 2 successfully.
- [ ] After submit, the success card shows briefly and the companion lands on `/{locale}/dashboard`
      with the trip visible in "My Trips".
- [ ] Token expiry, cutoff lock, and resend/rotation behave exactly as before.
- [ ] Minor rows and the buyer's direct-fill path are unchanged.
- [ ] **Bugfix**: editing and saving adult and minor rows works on
      `dashboard/trips/[id]/page.tsx`, identically to the checkout success page.
- [ ] All new copy exists in `es` and `en`; `npm run typecheck` and `npm run lint` pass.
