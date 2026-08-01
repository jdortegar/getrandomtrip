# Design: Traveler Invite — Required Signup Before Submission

## Technical Approach

Five layers, no new infrastructure. (1) One nullable FK on `TripTraveler` binds a completed row to a
`User`. (2) `POST /api/travelers/submit` flips from public-token-gated to **session + token gated**;
the token still answers *which row*, the session now answers *who claims it*. (3)
`TravelerInviteClient.tsx` becomes a **session-driven state machine** whose only source of truth is
`useSession().status` — a locally mounted, unmodified `AuthModal` is the wall. (4) A **narrow,
token-gated exception** in `authorize()` lets an unverified account get a session *only* while a live
traveler invite accompanies the login attempt. (5) Read surfaces widen from buyer-only to
buyer-OR-companion behind one shared predicate. Token issue/peek/expiry/cutoff/reminder semantics are
untouched.

## Architecture Decisions

| # | Decision | Choice | Rejected | Rationale |
|---|---|---|---|---|
| 1 | Wall trigger | Local `<AuthModal allowRegister defaultMode="register" dict={{auth}} />` mounted inside `TravelerInviteClient` | Reuse the layout's `GlobalAuthModal` via `useUserStore.openAuth()` | `GlobalAuthModal` hardcodes `defaultMode="login"`; using it would force a change there. A local instance needs zero changes anywhere. Both instances coexist — only one is ever `isOpen`. |
| 2 | Step gate | `const { status } = useSession()` → `status === "authenticated"` renders step 2 | A `hasAuthed` flag set by `AuthModal.onClose` | `onClose` also fires on Escape / backdrop / X (`handleClose`), so it does **not** imply success. Only `status` is truthful, and it survives the Google full-page return. |
| 3 | `emailVerified` | Never read **by the page**; the only reference is the token-gated exception inside `authorize()` (D8) | Any `session.user.emailVerified` check in the UI | Per decision #9. The page stays purely session-driven; the verification problem is solved once, upstream, where it is actually enforced. |
| 8 | Unverified-signup bypass carrier | **Short-lived httpOnly cookie `grt_traveler_invite`**, minted by a new `POST /api/travelers/invite-auth-init` after a server-side `peekTravelerInvite`, read by `authorize()` | An extra `travelerInviteToken` field on the `signIn("credentials", …)` call | `AuthModal` hardcodes its `signIn` payloads (`AuthModal.tsx:160-165` and `:185-190`) and exposes no passthrough — the credential-field route **cannot** be done without an `AuthModal` diff, which decision #5 forbids. The cookie needs zero `AuthModal` changes and is an exact clone of the shipped `grt_tripper_invite` idiom (`api/tripper-invite/oauth-init/route.ts` → `auth.ts:114`). If the credential field is preferred later, it costs an additive `extraCredentials?: Record<string,string>` prop on `AuthModal`. |
| 9 | Bypass match rule | Possession of a **live, unconsumed** token is the whole grant — **no email equality check** | Mirror `resolveOAuthInviteGrant`'s `peek.email === user.email` rule | The tripper cookie gates a **role elevation** (`TRIPPER`), so it must bind to the invited email. This cookie grants only "issue a session to a user who already holds a valid token" — strictly less than what the token already authorizes at submit. Requiring an email match would also contradict the accepted decision that a companion may sign up with a different email (Risk C). |
| 10 | Trip authorization predicate | One exported `tripAccessWhere(userId)` in a new `src/lib/travelers/travelerAccess.ts`, consumed by **both** the list and the detail route | Hand-written OR in the list + an in-memory `.some()` check in the detail route | Two hand-written implementations of the same rule are exactly how a permissions check drifts. One Prisma predicate, one place to change when companion permissions are later narrowed. |
| 4 | Server session read on `page.tsx` | **None.** Page keeps server `peekTravelerInvite` only; session stays client-side | `getServerSession` in the page, passed as a prop | A server snapshot is stale the instant credentials `signIn` succeeds without navigation. One source of truth (`useSession`) beats two that can disagree. |
| 5 | Identity source at submit | `getServerSession` → `session.user.id` → `prisma.user.findUnique({ where: { id } })` for `name`/`email` | Trust `session.user.name`/`email` directly | `session.user.name` is typed `string \| null \| undefined` while `User.name` is non-null `String`; the DB read removes the null-handling ambiguity and matches the existing pattern in `trip-requests`/`trips/[id]`. Cost: one indexed PK lookup. |
| 6 | List discriminator | Add `role: "buyer" \| "companion"` to each item in `GET /api/trip-requests` (**recommended, not mandatory**) | Return the union untagged | Free to compute (the OR is already resolved), forward-compatible with the deferred permission narrowing, and no UI change needed in v1. |
| 7 | Schema delivery | `npm run db:push` | A migration file | This repo has **no** migration files (`prisma/migrations/` holds only `.gitkeep`; `db:migrate` is aliased to push). Additive nullable column — zero-downtime, no backfill. |

## Sequencing: `signIn` → `useSession` (the load-bearing detail)

NextAuth v4's `signIn(provider, { redirect: false })` **awaits an internal
`__NEXTAUTH._getSession({ event: "storage" })` before it resolves**. So by the time
`AuthModal.handleAuthSuccess()` runs, the `SessionProvider` context has already been refreshed;
`status` flips to `authenticated` on the next render — the same commit that `onClose()` triggers.
The invite page therefore needs **no** coordination with the modal: it just renders off `status`.
Add one effect for hygiene: `if (status === "authenticated") setAuthOpen(false)` — this closes the
modal on the login path *and* on the Google return, without ever treating "closed" as "authed".

```
status: unauthenticated ──[CTA: POST invite-auth-init → sets cookie]──▶ AuthModal open
   ├─ login OK ──────────▶ signIn resolves (session already refetched) ─▶ status=authenticated ─▶ step 2
   ├─ register ─────────▶ POST /api/auth/register (emailVerified=null) ─▶ signIn ─▶ authorize()
   │                        cookie live ⇒ session issued ─▶ status=authenticated ─▶ step 2
   │                        no cookie   ⇒ throw EMAIL_NOT_VERIFIED (unchanged everywhere else)
   └─ Google ────────────▶ full redirect, callbackUrl = window.location.href ─▶ remount, status=authenticated
```

**Google OAuth needs no new route or cookie** — `AuthModal.handleGoogleSignIn` already passes
`callbackUrl: window.location.href`, which is the `/invite/[token]` URL. `/invite` is already
gate-exempt in `GateAwareChrome` (`GATE_EXEMPT_ROUTES`). Google accounts get `emailVerified` stamped
at create (`auth.ts:130`), so the exception never applies to them.

## The unverified-signup exception (Risk A resolution)

Registering by email/password creates the user with `emailVerified = null`
(`api/auth/register/route.ts:71-87`), and `authorize()` **throws before returning a user**
(`src/lib/auth.ts:69-82`) — no JWT cookie, so `useSession()` would stay `unauthenticated` forever and
the wall would be a dead end. Resolution: a scoped exception, not a loosening.

**How the token reaches `authorize()`** — `AuthModal` is zero-diff, so the token cannot ride the
`signIn` payload (D8). Instead it rides a cookie, exactly as `grt_tripper_invite` does for OAuth:

1. `TravelerInviteClient`'s "Sign up to continue" handler `await fetch("/api/travelers/invite-auth-init", { method: "POST", body: { token } })` **then** opens the modal. A failed/rejected init still opens the modal — the exception simply won't apply (fail-closed).
2. The route `peekTravelerInvite(token)`s server-side; on `!ok` it returns `400 { reason }` and sets **no** cookie. On `ok` it sets `grt_traveler_invite` — `httpOnly`, `secure`, `sameSite: "lax"`, `maxAge: 600` — mirroring `api/tripper-invite/oauth-init/route.ts:22-27`.
3. `authorize()` reads it inside — and only inside — the `!user.emailVerified` branch.

**Both entry paths are identical by construction**: `AuthModal`'s register branch and login branch
call the same `signIn("credentials", …)`, which hits the same `authorize()`. The cookie is minted
when the modal *opens*, so it is already live for whichever branch the companion ends up using, and
the 10-minute TTL comfortably covers filling either form.

```ts
// src/lib/auth.ts — inside authorize(), replacing only the `if (!user.emailVerified)` body
if (!user.emailVerified) {
  // Narrow, token-gated exception: a companion holding a LIVE, unconsumed
  // traveler invite may take a session while still unverified, so the invite
  // wall is not a dead end. Everything else about this branch is unchanged.
  const inviteCookie = (await cookies()).get(TRAVELER_INVITE_COOKIE)?.value;
  if (await hasLiveTravelerInviteGrant(inviteCookie)) {
    return { id: user.id, email: user.email, name: user.name, image: user.avatarUrl || undefined };
  }
  try { … issueVerificationToken + sendVerificationEmail … } catch { … }   // unchanged
  throw new Error("EMAIL_NOT_VERIFIED");                                   // unchanged
}
```

**Sub-decision — no resend on the bypass path**: the early `return` skips the existing best-effort
`issueVerificationToken`/`sendVerificationEmail`. On the register path `register/route.ts:95-96`
already sent one seconds earlier; re-sending would double-mail every companion. Unverified accounts
accumulating via this path is intentional (proposal decision #9) and standard verification nudges
apply outside this flow. `emailVerified` stays `null` — the exception grants a **session**, never
verification.

**Why this stays narrow** — the bypass is unreachable without all of: the cookie (mintable only by
our own route, only after a server-side peek), a token that still `peek`s `ok` (not consumed → not
`COMPLETE`, not expired, roster not locked), and a `!emailVerified` credentials login. No other
login path ever carries the cookie, so default `EMAIL_NOT_VERIFIED` behaviour is bit-for-bit
unchanged. This is the one place this change is *harder* than the `tripper-invite` precedent, whose
cookie only had to survive the Google redirect inside the `signIn` callback; here it must be read one
layer deeper, inside `authorize()`, which runs in the same App-Router request scope and can therefore
read `cookies()` the same way `auth.ts:114` already does.

## Data Flow

```
GET /[locale]/invite/[token]   (server) peekTravelerInvite → resolution + dict.auth  [never consumes]
   └─ TravelerInviteClient
        !resolution.ok            → ErrorCard                                   (unchanged)
        ok + unauthenticated      → greeting + "Sign up to continue"
                                     → POST /api/travelers/invite-auth-init { token }  [peek → cookie]
                                     → AuthModal (register default; no identity form rendered)
        ok + authenticated        → idDocument + consent only                   (no name/email inputs)
        submit → POST /api/travelers/submit { token, idDocument, consent }
             401 no session · 400 !consent · 400 { reason } from consume
             getServerSession → user = findUnique(id) → consumeTravelerInvite(token, {
                 fullName: user.name, email: user.email, idDocument, userId: user.id })
             → status COMPLETE, submittedAt, consentAt, userId  → TRAVELER_SUBMITTED notif to buyer
        success card (~1.5s) → router.push(`/${locale}/dashboard`)
GET /api/trip-requests  → findMany({ where: tripAccessWhere(user.id) })  (+ role tag per item)
GET /api/trips/[id]     → findUnique(include) → canAccessTrip(id, user.id) ? 200 : 403
DELETE /api/trips/[id]  → unchanged: buyer-only (trip.userId === user.id)
                          ↑ both reads share ONE predicate: src/lib/travelers/travelerAccess.ts
```

## Interfaces / Contracts

```prisma
model TripTraveler {
  userId String?                                                  // nullable: minors + historical rows
  user   User?  @relation(fields: [userId], references: [id], onDelete: SetNull)
  @@index([userId])
}
model User { tripTravelers TripTraveler[] }                       // back-relation
```
`onDelete: SetNull` (not `Cascade`): deleting a companion's account must never delete the buyer's
roster row — it only unlinks the claim.

```ts
// travelerInviteTokens.ts — only the `data` shape changes; peek/expiry/cutoff untouched
export async function consumeTravelerInvite(
  plaintext: string,
  data: { fullName: string; idDocument: string; email?: string; userId?: string },
): Promise<TravelerPeek>;
// …update({ data: { …, ...(data.userId !== undefined && { userId: data.userId }) } })
```
`userId` optional, spread-guarded — keeps every existing call site compiling and lets the buyer-fill
path stay `userId`-free.

```ts
// POST /api/travelers/submit — request
{ token: string; idDocument: string; consent: true }
// responses: 401 {error:"unauthorized"} | 400 {error:"consent_required"|"invalid"} | 400 {reason} | 200 {ok:true}
```
Any client-supplied `fullName`/`email` is **ignored** (not merely unvalidated) — destructure only the
three fields above.

```ts
// src/lib/travelers/travelerAccess.ts (new) — the single authorization predicate
/** Buyer-owned ∪ companion-linked. The ONLY definition of "may read this trip". */
export function tripAccessWhere(userId: string): Prisma.TripRequestWhereInput {
  return { OR: [{ userId }, { travelers: { some: { userId } } }] };
}
export async function canAccessTrip(tripId: string, userId: string): Promise<boolean> {
  return (await prisma.tripRequest.count({
    where: { id: tripId, ...tripAccessWhere(userId) },
  })) > 0;
}
export function tripRoleFor(trip: { userId: string }, userId: string): "buyer" | "companion" {
  return trip.userId === userId ? "buyer" : "companion";   // buyer wins if a buyer invited themselves
}
```
The detail route pays one extra indexed `count` rather than re-expressing the rule in memory —
deliberate: a permissions check written twice is a permissions check that will drift. `DELETE` is
**not** widened; it keeps its own `trip.userId === user.id` buyer-only guard.

```ts
// src/lib/travelers/travelerInviteTokens.ts (additions)
export const TRAVELER_INVITE_COOKIE = "grt_traveler_invite";
/** True only for a live, unconsumed invite. No email match — see decision #9. */
export async function hasLiveTravelerInviteGrant(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  return (await peekTravelerInvite(cookieValue)).ok;
}
```
`auth.ts` keeps the `cookies()` read (matching its existing style at :114) and passes the raw value
in, so the helper unit-tests without mocking `next/headers`.

```ts
// POST /api/travelers/invite-auth-init — request/response
{ token: string }  →  200 { ok: true } + Set-Cookie grt_traveler_invite   |   400 { reason }
```

## File Changes

| File | Action | Description |
|---|---|---|
| `prisma/schema.prisma` | Modify | `TripTraveler.userId String?` + `user` relation (`SetNull`) + `@@index([userId])`; `User.tripTravelers[]`. Apply with `npm run db:push` — **no migration file**. |
| `src/lib/travelers/travelerInviteTokens.ts` | Modify | `consumeTravelerInvite` data param gains optional `userId`, spread into the update. **+** `TRAVELER_INVITE_COOKIE` and `hasLiveTravelerInviteGrant()`. `issue`/`peek`/expiry/cutoff untouched. |
| `src/lib/auth.ts` | **Modify** | **Narrow, token-gated exception only — does not change default unverified-login behaviour.** Inside `authorize()`'s existing `!user.emailVerified` branch: if `grt_traveler_invite` resolves to a live invite, return the user instead of throwing (and skip the resend). No other line changes; `signIn`/`jwt`/`session` callbacks untouched. |
| `src/lib/travelers/travelerAccess.ts` | **Create** | `tripAccessWhere` / `canAccessTrip` / `tripRoleFor` — the single buyer-OR-companion predicate shared by both read routes. |
| `src/app/api/travelers/invite-auth-init/route.ts` | **Create** | `POST { token }` → `peekTravelerInvite` → on ok set the 10-min httpOnly `grt_traveler_invite` cookie; on `!ok` 400 and **no** cookie. Clone of `api/tripper-invite/oauth-init/route.ts`. |
| `src/app/api/travelers/submit/route.ts` | Modify | `getServerSession` → 401; payload narrowed to `{token,idDocument,consent}`; identity from DB user; passes `userId`. Notification block unchanged. |
| `src/app/api/trip-requests/route.ts` | Modify | `where` at :150 → `tripAccessWhere(user.id)`; add `role: tripRoleFor(...)` per item. |
| `src/app/api/trips/[id]/route.ts` | **Modify (added after proposal)** | `GET` guard at :54 → `canAccessTrip(params.id, user.id)`, so companions can open the trip detail page (v1 buyer-level access, narrowing deferred). `DELETE` guard **unchanged**, buyer-only. |
| `src/components/travelers/TravelerInviteClient.tsx` | Modify | Session state machine; CTA calls `invite-auth-init` then opens the local `AuthModal`; step-2 form (idDocument + consent only); success → `router.push`. Drop `fullName`/`email` inputs and the "create account" footer. |
| `src/app/[locale]/invite/[token]/page.tsx` | Modify | Only: pass `authCopy={{ auth: dict.auth }}` to the client (AuthModal's `dict` is `Pick<Dictionary,"auth">`). Keep server peek; **do not** add `getServerSession`. |
| `src/app/[locale]/(secure)/dashboard/trips/[id]/page.tsx` | Modify | Bugfix: `useRef<TravelerRosterSectionHandle>` + `savingTravelers` state + `handleSaveTravelers()` + Save `Button`, mirroring `CheckoutResultSuccess.tsx:75-85,273-287`. Gate on `roster.cap > 0 && !roster.locked`. |
| `src/lib/types/dictionary.ts` | Modify | `InviteTravelersDict`: **+** `landingSignupExplainer`, `landingSignupCta`, `landingStep2Heading`, `landingRedirecting`, `landingSessionExpiredError`, `savingAction`; **−** `landingCreateAccountPrompt`, `landingCreateAccountLink` (now dead). |
| `src/dictionaries/es.json` + `en.json` | Modify | Same key delta, **both locales** (mandatory per `i18n-and-types.md`). Reuse the already-dead `saveAction` key for the dashboard Save button. |
| `src/types/traveler.ts` | Modify (optional) | `TravelerDTO += claimed: boolean` (`userId !== null`) if the roster ever needs to show "claimed". Skip if unused — do not add dead fields. |
| `src/components/auth/AuthModal.tsx` | **Unchanged** | Zero diff, asserted — the cookie carrier (D8) exists precisely to keep it that way. |

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Type/Lint | New dict keys in both locales; removed keys have no remaining references | `npm run typecheck`, `npm run lint` |
| Unit | `consumeTravelerInvite` persists `userId` when given and omits it when not; still rejects used/expired/locked before writing. `hasLiveTravelerInviteGrant`: `false` for undefined/invalid/expired/consumed/locked, `true` only for a live peek. `tripAccessWhere`/`tripRoleFor` shape | mock `prisma` (repo vitest pattern) |
| Unit (security) | **`authorize()` bypass is narrow**: unverified + live cookie → returns a user; unverified + **no** cookie → still throws `EMAIL_NOT_VERIFIED`; unverified + expired/consumed/locked cookie → still throws; verified user → cookie is irrelevant, unchanged path | mock `next/headers` `cookies()` + `peekTravelerInvite` |
| Integration | `invite-auth-init` sets the cookie only on `ok` (assert `HttpOnly`/`Max-Age=600`/`SameSite=Lax`/`Secure`, mirroring the `oauth-init` test). submit → 401 no session; 400 no consent; ignores client `fullName`/`email`; writes `userId`+`COMPLETE`. `trip-requests` returns both sets with correct `role`. `trips/[id]` **GET** 200 for companion / 403 for a stranger; **DELETE** still 403 for a companion | route-handler tests |
| Manual | Fresh register on the invite page lands on step 2 **without** leaving the page; login path unlocks step 2 without reload; Google returns to the same invite URL authenticated; a normal (non-invite) unverified login still shows the not-verified panel; expired/used/locked still hit ErrorCard **before** the wall; dashboard roster Save persists adult **and** minor rows; ≥360px / ≥1280px | QA |

## Migration / Rollout

`npm run db:push` after merge — additive nullable column + index only. No backfill; existing
`COMPLETE` rows keep `userId = null` and remain valid. Rollback = revert commits; the column may be
left in place harmlessly.

## Risks

- [x] **Risk A — unverified registration produced no session. RESOLVED** by the token-gated
      `authorize()` exception above (user-approved). The proposal's criterion *"an unverified-email
      account still completes step 2 successfully"* is now reachable on the plain email/password
      path, not only via Google. Residual risk is **scope creep of the bypass**, mitigated
      structurally: the grant requires a cookie only our own peek-guarded route can mint, and the
      dedicated security-unit row above pins the three negative cases.
- [x] **Risk B — `GET /api/trips/[id]` 403'd companions. RESOLVED** by routing both read endpoints
      through `tripAccessWhere`/`canAccessTrip` (user-approved). Residual risk is **predicate
      drift**, mitigated by there being exactly one exported definition; `DELETE` intentionally
      stays buyer-only.
- [ ] Risk C — a companion who signs up with a **different email** than the invited one overwrites
      `TripTraveler.email` with the account email. Accepted (the token proves the slot), and now
      load-bearing: decision #9 relies on *not* requiring an email match for the bypass.
- [ ] Risk D — a buyer who invites themselves matches the OR twice. Prisma dedupes rows, and
      `tripRoleFor` checks buyer first, so the tag resolves to `"buyer"`. No action needed.
- [ ] Risk E (Med) — `cookies()` is read one layer deeper than the shipped precedent (inside
      `authorize()` rather than the `signIn` callback). Both run in the same App-Router request
      scope, so this is expected to work, but it is the one genuinely new mechanism here — verify
      it first during apply, before the UI work depends on it.

## Downstream note for `sdd-spec`

`spec.md` was written **before** Risk A was resolved and therefore does not cover the `authorize()`
exception. It needs a follow-up amendment with a dedicated scenario pair:

- **Given** an unverified account **and** a valid, unconsumed traveler-invite token accompanies the
  login attempt, **when** the companion logs in or completes registration from `/invite/[token]`,
  **then** a session is issued and step 2 renders.
- **Given** an unverified account **and** no token, or an expired/consumed/locked one, **when** the
  user logs in, **then** `EMAIL_NOT_VERIFIED` is thrown exactly as today.

The `GET /api/trips/[id]` widening (Risk B) likewise needs a companion-access scenario plus a
`DELETE`-still-forbidden counter-scenario.
