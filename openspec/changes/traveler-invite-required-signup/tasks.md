# Tasks: Traveler Invite — Required Signup Before Submission

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~750–850 (schema ~4; travelerAccess.ts ~20+test~40; travelerInviteTokens.ts delta ~25+test~50; auth.ts delta ~15+new security-test file~80; invite-auth-init route ~35+test~50; submit route delta ~30+test delta~60; trip-requests route delta ~15+test delta~40; trips/[id] route delta ~10+test~50; TravelerInviteClient.tsx rewrite ~140; invite/[token]/page.tsx ~5; dashboard/trips/[id]/page.tsx ~45; dictionary.ts ~10; es.json+en.json ~50) |
| 400-line budget risk | High |
| Chained PRs recommended | No — `delivery_strategy` is locked to `single-pr` per user decision; flagging size honestly instead of proposing a split |
| Delivery strategy | single-pr (locked) |
| Chain strategy | size-exception |
| Decision needed before apply | Yes — **CONFIRMED by user, `size:exception` approved** |

Decision needed before apply: Yes (confirmed — size:exception approved)
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

**Note**: this estimate (~750–850 lines) is roughly double the 400-line soft budget. Per locked `single-pr` strategy this shipped as ONE PR under an explicit `size:exception`, confirmed by the user.

### Suggested Work Units (informational only — not used; single-pr locked)

| Unit | Goal | Notes |
|------|------|-------|
| 1 | Phase 1–2: schema, `travelerAccess.ts`, `travelerInviteTokens.ts` delta, `authorize()` bypass, `invite-auth-init` | Security-sensitive core |
| 2 | Phase 3–6: submit route, trip-requests/trips[id] wiring, UI state machine, dashboard bugfix, i18n | Depends on Unit 1 |

---

## Phase 1: Schema + Shared Modules (Foundation)

- [x] 1.1 `prisma/schema.prisma` — add `TripTraveler.userId String?` + `user User? @relation(fields:[userId], references:[id], onDelete: SetNull)` + `@@index([userId])`; add `User.tripTravelers TripTraveler[]` back-relation.
- [x] 1.2 Run `npm run db:push` — additive nullable column + index, no migration file (confirmed repo convention: `prisma/migrations/` holds only `.gitkeep`).
- [x] 1.3 RED — `src/lib/travelers/__tests__/travelerAccess.test.ts`: `tripAccessWhere(userId)` shape; `canAccessTrip` true for buyer, true for linked companion, false for stranger; `tripRoleFor` returns `"buyer"` when `trip.userId === userId` else `"companion"`.
- [x] 1.4 GREEN — create `src/lib/travelers/travelerAccess.ts`: `tripAccessWhere`, `canAccessTrip`, `tripRoleFor` per design's Interfaces section. Satisfies spec "Companion Trip Access — Shared Predicate".
- [x] 1.5 RED — extend `travelerInviteTokens.test.ts`: `consumeTravelerInvite` persists `userId` when given, omits it (spread-guarded) when not; still rejects used/expired/locked before writing, unchanged from today.
- [x] 1.6 GREEN — widen `consumeTravelerInvite(plaintext, data)` param to accept optional `userId`, spread into `update`. Satisfies spec "TripTraveler Owner Link".
- [x] 1.7 RED — extend tests: `hasLiveTravelerInviteGrant(cookieValue)` → `false` for undefined/invalid/expired/consumed/locked; `true` only for a live unconsumed peek.
- [x] 1.8 GREEN — add `TRAVELER_INVITE_COOKIE = "grt_traveler_invite"` const + `hasLiveTravelerInviteGrant()` to `src/lib/travelers/travelerInviteTokens.ts` (wraps `peekTravelerInvite`, no `cookies()` import — unit-testable without mocking `next/headers`).

## Phase 2: Token-Gated Unverified-Email Bypass (Security-Sensitive — sequenced after Phase 1)

- [x] 2.1 RED — new `src/lib/__tests__/auth.authorize.test.ts` (mock `next/headers` `cookies()` + `hasLiveTravelerInviteGrant`): unverified + live invite cookie → `authorize()` returns a user object, no throw; unverified + **no** cookie → throws `EMAIL_NOT_VERIFIED` unchanged; unverified + expired/consumed/locked cookie → throws `EMAIL_NOT_VERIFIED` unchanged; verified user → cookie present or absent, path unaffected, unchanged. Satisfies spec "Token-Gated Unverified-Email Session Bypass" all 4 scenarios.
- [x] 2.2 GREEN — in `src/lib/auth.ts`, inside `authorize()`'s existing `if (!user.emailVerified)` branch only: read `TRAVELER_INVITE_COOKIE` via `(await cookies()).get(...)`, call `hasLiveTravelerInviteGrant`; on true, `return { id, email, name, image }` immediately (skip the existing verification-email resend — see design's "no resend on bypass path"). No other lines in `authorize()` change.
- [x] 2.3 Run existing `auth.ts` test suite (if any pre-existing unverified-login tests) — confirm zero regressions on the untouched throw path. (Ran `src/lib/auth/__tests__/*` — 28/28 pass, no regressions.)
- [x] 2.4 RED+GREEN — create `src/app/api/travelers/invite-auth-init/route.ts` (clone `api/tripper-invite/oauth-init/route.ts`): `POST { token }` → `peekTravelerInvite` → `!ok` returns `400 { reason }`, **no** cookie set; `ok` sets `grt_traveler_invite` cookie (`httpOnly`, `secure`, `sameSite: "lax"`, `maxAge: 600`) and returns `200 { ok: true }`.
- [x] 2.5 Test — `invite-auth-init` route: asserts `Set-Cookie` header attributes (`HttpOnly`/`Max-Age=600`/`SameSite=Lax`/`Secure`) present only on the `ok` branch, mirroring the `oauth-init` test pattern.

## Phase 3: Session-Gated Submission + Trip Access Wiring

- [x] 3.1 RED — `src/app/api/travelers/submit/__tests__/route.test.ts`: no session → `401`, no row modified; consent `!== true` → `400`; authenticated with spoofed `fullName`/`email` in payload → persisted row uses `session.user.id`-derived DB identity, not the payload; success sets `TripTraveler.userId`.
- [x] 3.2 GREEN — `src/app/api/travelers/submit/route.ts`: add `getServerSession` gate (401 on none); narrow destructure to `{ token, idDocument, consent }` only; `prisma.user.findUnique({ where: { id: session.user.id } })` for `name`/`email`; pass `userId: user.id` into `consumeTravelerInvite`. Satisfies spec "Session-Gated Submission Endpoint" all scenarios.
- [x] 3.3 RED — extend `trip-requests` route test: `tripAccessWhere(user.id)` returns union of buyer-owned + companion-linked trips; each item carries `role: "buyer" | "companion"`. (New file: `src/app/api/trip-requests/__tests__/route.test.ts` — no prior test existed.)
- [x] 3.4 GREEN — `src/app/api/trip-requests/route.ts` — replace `where: { userId: user.id }` with `tripAccessWhere(user.id)`; map `role: tripRoleFor(trip, user.id)` per item.
- [x] 3.5 RED — `src/app/api/trips/[id]/__tests__/route.test.ts` (extended): `GET` — companion linked via `TripTraveler.userId` → `200` with full trip; unrelated user → `403` unchanged; `DELETE` — companion → `403` unchanged (explicit regression guard per spec's "Companion still cannot delete the trip").
- [x] 3.6 GREEN — `src/app/api/trips/[id]/route.ts`: `GET` guard replaces `trip.userId !== user.id` with `!(await canAccessTrip(params.id, user.id))`; `DELETE` guard **left untouched** (`trip.userId !== user.id`).

## Phase 4: Invite Landing UI — State Machine

- [x] 4.1 `src/components/travelers/TravelerInviteClient.tsx` — rewritten as session-driven state machine off `useSession().status`: no session → greeting (no destination) + "Sign up to continue" CTA; CTA handler `await fetch("/api/travelers/invite-auth-init", { method: "POST", body: { token } })` (fail-open — modal opens regardless of init result) **then** opens a locally mounted `<AuthModal allowRegister defaultMode="register" dict={{auth: authCopy}} />`; session present → idDocument + required consent checkbox only, no name/email inputs.
- [x] 4.2 Added `useEffect`: `if (status === "authenticated") setAuthOpen(false)` — closes the modal on both the credentials-login path and the Google full-page-return remount, without treating `onClose` as success.
- [x] 4.3 Submit handler — `POST /api/travelers/submit { token, idDocument, consent }`; on success renders existing success copy (`landingSuccessTitle`/`landingSuccessBody`) + `landingRedirecting`, then `router.push(`/${locale}/dashboard`)` after ~1.5s. `401` mid-flow shows `landingSessionExpiredError`. Error/locked/expired/used states keep the existing `ErrorCard` unchanged.
- [x] 4.4 `src/app/[locale]/invite/[token]/page.tsx` — added `authCopy={{ auth: dict.auth }}` prop to the client component; kept server-side `peekTravelerInvite` only; did **not** add `getServerSession`.

## Phase 5: Dashboard Save Regression Bugfix

- [x] 5.1 `src/app/[locale]/(secure)/dashboard/trips/[id]/page.tsx` — added `useRef<TravelerRosterSectionHandle>`, `savingTravelers` state, `handleSaveTravelers()` calling `rosterRef.current.saveAll()`, and a Save `Button`, mirroring `CheckoutResultSuccess.tsx:75-85,273-287`; gated visibility on `roster.cap > 0 && !roster.locked` (outer block already gates `cap > 0`; button additionally gates `!locked`). Satisfies spec "Dashboard Save now persists adult and minor edits".
- [ ] 5.2 Manual/integration check: editing an adult row's `idPassport` and a minor row's `dateOfBirth` on the dashboard page and clicking Save persists both, matching the checkout-success-page behavior — **pending manual QA in a running browser session** (not executable from this environment; code path mirrors the already-working `CheckoutResultSuccess.tsx` pattern exactly).

## Phase 6: i18n

- [x] 6.1 `src/lib/types/dictionary.ts` — `InviteTravelersDict`: added `landingSignupExplainer`, `landingSignupCta`, `landingStep2Heading`, `landingRedirecting`, `landingSessionExpiredError`, `savingAction`; removed `landingCreateAccountPrompt`, `landingCreateAccountLink`.
- [x] 6.2 `src/dictionaries/es.json` — applied the same key delta under `inviteTravelers`; reused the already-dead `saveAction` key for the dashboard Save button (Phase 5.1).
- [x] 6.3 `src/dictionaries/en.json` — mirrored the exact key delta from 6.2, both new and removed keys.
- [x] 6.4 `npm run typecheck` — zero errors, no dangling references to the two removed keys.

## Phase 7: Verification

- [x] 7.1 `npm run test` — full vitest suite green: 709/709 passing across 97 files, zero regressions on `travelerInviteTokens`, `auth.authorize` (new), `submit`, `trip-requests` (new), `trips/[id]`, `invite-auth-init` (new), `travelerAccess` (new) suites.
- [x] 7.2 `npm run typecheck` — zero errors repo-wide.
- [~] 7.3 `npm run lint` — **blocked by a pre-existing environment issue**, not caused by this change: `next lint` fails immediately (`Invalid project directory provided, no such directory: .../lint`), and direct `npx eslint` on any file (including untouched files) throws `TypeError: Converting circular structure to JSON` inside `@eslint/eslintrc`'s config validator — confirmed pre-existing by running it against an untouched file (`src/components/Navbar.tsx`), which fails identically. Manually verified via `rg` that no changed file introduces a raw `<img>` tag or a `dark:` variant.
- [ ] 7.4 Manual QA (per design's Testing Strategy row): fresh register on `/invite/[token]` lands step 2 without leaving the page; login path unlocks step 2 without reload; Google OAuth round-trip returns authenticated to the same invite URL; a normal (non-invite) unverified login elsewhere in the app still shows the not-verified panel; expired/used/locked tokens still hit `ErrorCard` before the wall; dashboard roster Save persists both adult and minor rows; responsive check at ≥360px and ≥1280px — **pending, requires a running browser session**.
