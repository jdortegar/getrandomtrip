# Tasks: Invite as Tripper (Admin-Initiated, Consent-Gated)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~900–1100 (schema ~12, token module ~90 + test ~120, 2 admin trigger routes ~75 + tests ~90, email sender delta ~20 + template ~45, 2 accept routes ~55 + tests ~70, register delta ~15 + test delta ~30, auth.ts delta ~15, accept page ~25 + client component ~110, admin waitlist client delta ~40 + route delta ~10, users table/row delta ~30 + users page-client delta ~25 (extra file, see Risks) + route delta ~10, types.ts delta ~3, dictionary.ts ~40, es.json+en.json ~90) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes, normally — 6 low-coupling layers (schema/token core, email, accept API, register/OAuth hooks, admin UI, i18n) could each ship independently |
| Delivery strategy | single-pr (locked by orchestrator) |
| Chain strategy | size-exception |
| Decision needed before apply | Yes |

Single PR per the locked `single-pr` delivery strategy. Estimate is ~2-2.5x the 400-line budget — record `size:exception` on the PR rather than splitting, per the `single-pr` rule. Do not propose chained/stacked PRs for this change unless the orchestrator overrides before `sdd-apply`.

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: size-exception
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Everything below (Phases 1–9) | PR 1 (single) | `size:exception` recorded — estimate (~900–1100 lines) is well over the 400-line budget |

---

## Phase 1: Schema

- [x] 1.1 `prisma/schema.prisma` — add `model TripperInvite { id, email, tokenHash @unique, expiresAt, consumedAt, createdAt, @@index([email]), @@map("tripper_invites") }`, no FKs. Satisfies spec "TripperInvite Model and Token Lifecycle".
- [x] 1.2 Run `npm run db:push` (additive standalone table, no migration files in this repo, no backfill needed). Ran against the configured remote Neon Postgres (`DATABASE_URL`); `prisma db push` + `prisma generate` both succeeded.

## Phase 2: Token Core — TDD (`src/lib/auth/tripperInviteTokens.ts`)

- [x] 2.1 RED — `src/lib/auth/__tests__/tripperInviteTokens.test.ts`: `issueTripperInvite(email)` deletes prior `{email, consumedAt: null}` rows then creates one with `expiresAt` 7d out; returns plaintext, not the hash. Mock `prisma`.
- [x] 2.2 GREEN — implement `issueTripperInvite` (SHA-256 hash, `$transaction([deleteMany, create])`). Satisfies spec "First invite" + "Resend invalidates prior pending token".
- [x] 2.3 RED — extend tests for `peekTripperInvite(plaintext)`: unknown hash → `{ok:false,reason:"invalid"}`; past `expiresAt` → `"expired"`; non-null `consumedAt` → `"used"`; valid → `{ok:true,email}`; assert **no** `update` call (non-mutating).
- [x] 2.4 GREEN — implement `peekTripperInvite` to pass 2.3.
- [x] 2.5 RED — extend tests for `consumeTripperInvite(plaintext)`: same branch results as peek, but on valid marks `consumedAt` via `update`.
- [x] 2.6 GREEN — implement `consumeTripperInvite`, sharing the hash+lookup+branch logic with `peekTripperInvite` via a private helper. Satisfies spec "Accept Page Token Resolution" (all 3 error scenarios).
- [x] 2.7 RED — extend tests for `getTripperInviteStatuses(emails[])`: batched `findMany({where:{email:{in:emails},consumedAt:null}})`; maps `expiresAt` future → `"invited"`, past → `"expired"`; emails with no row are absent from the returned `Map`.
- [x] 2.8 GREEN — implement `getTripperInviteStatuses`. Satisfies spec "Admin UI Invite Status and Button Gating" (Invited/Expired badge scenarios).
- [x] 2.9 RED — extend tests (or new `grantTripperAndCleanup.test.ts`) for `grantTripperAndCleanup(userId, email)`: loads current `roles`, calls `addMembershipRole`+`buildUserRoleUpdate` (from `prismaUserRoles.ts`) to append `TRIPPER` idempotently (no duplicate if already present), then `prisma.waitlistEntry.deleteMany({where:{email}})`; assert deleteMany is a no-op (doesn't throw) when no row matches.
- [x] 2.10 GREEN — implement `grantTripperAndCleanup`, reusing existing `prismaUserRoles.ts` helpers (do not reimplement role merge logic). Satisfies spec "Accept Flow — Existing User" (both scenarios), "Waitlist Cleanup on Acceptance" (both scenarios).
- [x] 2.11 REFACTOR — confirm one shared private `hashToken`/validate helper (no duplicated hashing), `TTL_MS = 7 * 24h`, and the `InvitePeek` union is exhaustively handled by every caller added in later phases. Also added `resolveOAuthInviteGrant` pure helper (task 6.3) here, with its own RED/GREEN cycle.

## Phase 3: Admin Trigger Endpoints

- [x] 3.1 RED — `src/app/api/admin/waitlist/[id]/invite-tripper/__tests__/route.test.ts`: non-admin caller → 403, no `TripperInvite` created; admin + valid waitlist id → `issueTripperInvite` + `sendTripperInviteEmail(email, token, "es")` called, `200 {ok:true}`; target `WaitlistEntry` row itself is not modified.
- [x] 3.2 GREEN — create `src/app/api/admin/waitlist/[id]/invite-tripper/route.ts`: copy the `hasRoleAccess(caller,"admin")` guard block from `src/app/api/admin/users/[id]/route.ts`; load `WaitlistEntry` by id; issue + send in `es`. Satisfies spec "Admin Trigger Endpoints" (non-admin, waitlist-locale, no-alteration scenarios).
- [x] 3.3 RED — `src/app/api/admin/users/[id]/invite-tripper/__tests__/route.test.ts`: non-admin → 403; target user `roles` include `TRIPPER` or `ADMIN` → `400`; valid `CLIENT`-only target with `locale:"en"` → issue + send with `"en"`; target `roles` unaltered.
- [x] 3.4 GREEN — create `src/app/api/admin/users/[id]/invite-tripper/route.ts`: same admin guard; load `User` by id (`select: email, locale, roles`); `400` if roles include `TRIPPER`/`ADMIN`; else issue + send with `user.locale ?? "es"`. Satisfies spec "Admin Trigger Endpoints" (user-locale, non-alteration scenarios).

## Phase 4: Email Template + Dispatcher

- [x] 4.1 Create `src/emails/TripperInvite.tsx` mirroring `src/emails/VerifyEmail.tsx` shape (default component `{inviteUrl, locale}`, `EmailLayout`, `BASE_URL`) + `export const subjects = {es, en}`.
- [x] 4.2 `src/lib/email/index.ts` — add `sendTripperInviteEmail(email, token, locale)`: fire-and-forget, builds `inviteUrl = ${BASE_URL}/${locale}/tripper-invite?token=${token}`, calls `sendMail` with the `TripperInvite` element, imports `subjects`. Satisfies spec "Invite Email Template and Localization" (locale-render scenario).

## Phase 5: Accept API Endpoints

- [x] 5.1 RED — `src/app/api/tripper-invite/accept/__tests__/route.test.ts`: `consumeTripperInvite` not-ok → `400 {reason}`; ok + no matching `User` by email → `409 {reason:"no_account"}`; ok + existing `User` → `grantTripperAndCleanup` called with `(user.id, email)`, `200 {ok:true}`.
- [x] 5.2 GREEN — create `src/app/api/tripper-invite/accept/route.ts` per design's `POST {token}` contract.
- [x] 5.3 RED — `src/app/api/tripper-invite/oauth-init/__tests__/route.test.ts`: `peekTripperInvite` not-ok → `400`; ok → response sets `grt_tripper_invite` cookie (`httpOnly`, `maxAge:600`, `sameSite:"lax"`, `secure:true`), `200 {ok:true}`.
- [x] 5.4 GREEN — create `src/app/api/tripper-invite/oauth-init/route.ts` per design's `POST {token}` contract.

## Phase 6: Registration + OAuth Grant Hooks

- [x] 6.1 RED — extend `src/app/api/auth/register/__tests__/route.test.ts`: no `inviteToken` → `roles` behavior unchanged (regression); `inviteToken` peeks ok with `email` match → created user has `roles:[CLIENT,TRIPPER]`, `consumeTripperInvite` + `waitlistEntry.deleteMany({where:{email}})` called; `inviteToken` peeks ok but email mismatch → `roles:[CLIENT]` only, no consume/cleanup call. Satisfies spec "Accept Flow — New User" (credentials scenario) + "Registration without a token is unaffected".
- [x] 6.2 GREEN — `src/app/api/auth/register/route.ts`: accept optional `inviteToken` in body; `peekTripperInvite` when present; if `peek.ok && peek.email === email`, create with `roles:["CLIENT","TRIPPER"]` then `consumeTripperInvite` + waitlist cleanup after create succeeds; else unchanged `[CLIENT]` default path.
- [x] 6.3 RED — add a focused unit test for the Google-create role decision (extract the branch into a small pure helper, e.g. `resolveOAuthInviteGrant(peekResult, createdEmail)`, if `src/lib/auth.ts`'s `signIn` callback isn't independently testable without excess NextAuth/cookie mocking — follow this repo's Extract-Before-Mock convention): cookie absent → no grant; peek ok + email match → grant; peek ok + email mismatch → no grant, no consume.
- [x] 6.4 GREEN — `src/lib/auth.ts` Google-create branch (~L97-112): read `cookies().get("grt_tripper_invite")`, `peekTripperInvite` if present, set `roles:["CLIENT","TRIPPER"]` at create when `peek.ok && peek.email === user.email`, then `consumeTripperInvite` + waitlist cleanup after create. Credentials `authorize()` path untouched. Satisfies spec "Accept Flow — New User" (OAuth scenario) + "OAuth email mismatch is not granted".

## Phase 7: Accept Page + Client Component

- [x] 7.1 Create `src/app/[locale]/tripper-invite/page.tsx` — server shell: `hasLocale()` + `await getDictionary(locale)` + server-side `peekTripperInvite(token)` to pick the branch; renders `<TripperInviteClient>`.
- [x] 7.2 Create `src/components/auth/TripperInviteClient.tsx` (`"use client"`) — three branches: `!ok` → error state (`reasonInvalid/Expired/Used/Missing`, no self-service resend); `ok` + existing user → client `POST /api/tripper-invite/accept` on mount → granted state + login CTA to `/`; `ok` + no user → registration form with email **locked** to `invite.email`, credentials submit → `/api/auth/register {..., inviteToken}`, Google button → `POST /api/tripper-invite/oauth-init` then `signIn("google")`. Reuse `FormField`/`Button` primitives per component-patterns.md. Satisfies spec "Invalid or missing token", "Expired token", "Already-consumed token" scenarios.

## Phase 8: Admin UI

- [x] 8.1 `src/lib/admin/types.ts` — add `inviteStatus?: "invited" | "expired" | null` to `AdminWaitlistEntry`.
- [x] 8.2 `src/components/app/admin/UsersTableRow.tsx` — add `inviteStatus?: "invited" | "expired" | null` to the **locally-defined** `AdminUser` interface (design.md's File Changes table incorrectly points this at `src/lib/admin/types.ts` — `AdminUser` actually lives here; corrected per direct file read, see engram note).
- [x] 8.3 `src/app/api/admin/waitlist/route.ts` — batch `getTripperInviteStatuses(entries.map(e=>e.email))`, attach `inviteStatus` per entry in the GET response.
- [x] 8.4 `src/app/[locale]/(secure)/dashboard/admin/AdminWaitlistPageClient.tsx` — add an "Invite as Tripper" text action + status chip per row (sky "Invited/expired" chip, `rounded-[6px] border px-2 py-0.5 text-[11px]`, no dot, per design's accepted judgment call); wire its own `fetch(POST /api/admin/waitlist/[id]/invite-tripper)` inline (same pattern as the existing `removeEntry`), refresh row status on success.
- [x] 8.5 `src/app/api/admin/users/route.ts` — batch `getTripperInviteStatuses`, attach `inviteStatus` per user in the GET response.
- [x] 8.6 `src/components/app/admin/UsersTable.tsx` + `UsersTableRow.tsx` — add an `onInvite` callback prop (mirrors existing `onEdit`/`onDelete` lift-up pattern) + status chip; hide the invite action entirely when `user.roles` includes `TRIPPER` or `ADMIN`.
- [x] 8.7 `src/app/[locale]/(secure)/dashboard/admin/AdminUsersPageClient.tsx` — **extra file, not listed in design.md's File Changes table** (see engram note): add `onInvite` handler doing `fetch(POST /api/admin/users/[id]/invite-tripper)` + local per-row invite-state update, threaded into `<UsersTable onInvite={...}>`. This file must change because `UsersTableRow.tsx`'s existing `onEdit`/`onDelete` actions are dumb callbacks lifted to this page-client — the invite action needs the same wiring, it cannot live in the row component alone.

## Phase 9: Dictionary, Types & Final Verification

- [x] 9.1 `src/lib/types/dictionary.ts` — extend `AdminPagesDict.waitlist.actions` with `inviteTripper`, `resend`, and add `invited`/`expired` chip-label keys; extend `adminUsers` with the same invite action + chip-label keys. Add `TripperInviteAcceptDict` (page copy: locked-email note, `reasonInvalid/Expired/Used/Missing`, granted/login-CTA copy, registration form labels) and wire it onto `MarketingDictionary`. Add `tripperInviteEmail` copy keys used by the template's `subjects`/body text mapping if not passed as raw strings. (Email template keeps its own inline `es`/`en` copy map like `VerifyEmail.tsx` — not dictionary-sourced, matching existing convention — so no separate `tripperInviteEmail` dict keys were needed.)
- [x] 9.2 `src/dictionaries/es.json` — add every key from 9.1.
- [x] 9.3 `src/dictionaries/en.json` — mirror every key from 9.2 in English. Satisfies spec "Invite Email Template and Localization" (dictionary parity scenario).
- [x] 9.4 `npm run typecheck` — zero errors repo-wide. Confirmed clean.
- [ ] 9.5 `npm run lint` — BLOCKED (environment): `next lint` fails with `Invalid project directory provided, no such directory: .../lint` and raw `npx eslint` fails with `TypeError: Converting circular structure to JSON` in `@eslint/eslintrc` — reproduced on an untouched pre-existing file (`src/lib/utils.ts`), confirming this is a pre-existing sandbox/tooling issue (Next 16 + eslint 8.57 config incompatibility), not caused by this change. Manually verified by hand: no raw `<img>` tags, no `dark:` variants, and chip/button styles in new/changed files match design-system.md (`rounded-[6px] border px-2 py-0.5 text-[11px]` sky/amber chips, no dot).
- [x] 9.6 `npm run test` (`vitest run`) — all new/extended suites from Phases 2–3, 5–6 green, zero regressions on existing suites (esp. `register/route.test.ts` baseline cases). Full suite: 72 files / 488 tests passed.
- [ ] 9.7 Manual QA — BLOCKED (environment): no browser available in this sandbox. Send: invite from Waiting List row (es) + Users row (`User.locale`); resend invalidates prior link; button hidden for `TRIPPER`/`ADMIN` rows. QA ≥360px + ≥1280px.
- [ ] 9.8 Manual QA — BLOCKED (environment): no browser available. Accept existing user: consume grants `TRIPPER` (roles preserved), redirects to `/` with login message, waitlist row deleted if present.
- [ ] 9.9 Manual QA — BLOCKED (environment): no browser available. Accept new user: credentials + Google both grant `TRIPPER` at create; email-mismatched Google account stays `CLIENT`; expired/used token → error state, no self-service resend.
