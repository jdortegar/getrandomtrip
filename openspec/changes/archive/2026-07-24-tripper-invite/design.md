# Design: Invite as Tripper (Admin-Initiated, Consent-Gated)

## Technical Approach

Thread one new hashed-token model through the two admin surfaces and the two auth entry points that already exist, mirroring the just-shipped `auth-verification-reset` flow — but with **no `userId` FK**, because the invitee frequently has no `User` yet. Five layers:

1. **Data** — one new `TripperInvite` model (`{id, email, tokenHash, expiresAt, consumedAt, createdAt}`, no FKs), shipped via `npm run db:push` (this repo has **no** migration files — `prisma/migrations/` holds only `.gitkeep`; `db:migrate` is aliased to `prisma db push`). No backfill script needed — there is no existing data to reshape.
2. **Token core** — a new module `src/lib/auth/tripperInviteTokens.ts` owns issue / peek / consume. It mirrors `verificationTokens.ts` (SHA-256 hex persisted, plaintext only in the emailed link, delete-then-create reissue) but keyed on **email**, not `userId`. TTL **7 days**. It adds a non-mutating `peekTripperInvite` (validate without consuming) that `verificationTokens.ts` did not need.
3. **Admin triggers** — two `hasRoleAccess(caller,"admin")`-gated `POST` routes (waitlist source, users source) that issue+email a fresh invite (invalidating any prior pending one). Plus an admin-status helper so both admin list GETs can decorate rows with an invite badge.
4. **Accept flow** — a dedicated `/[locale]/tripper-invite?token=` server page (NOT `/login` or `/register` with conditionals) that branches into error / existing-user-consume / new-user-register. Consumption is a **client POST**, never a GET-render side effect (defeats email-scanner link prefetch — same reasoning as `auth-verification-reset`).
5. **Grant + email** — role grant reuses `addMembershipRole` / `buildUserRoleUpdate` from `prismaUserRoles.ts` (append `TRIPPER`, preserve existing). New Resend sender `sendTripperInviteEmail` + template `src/emails/TripperInvite.tsx` with `subjects: {es, en}`.

### Judgment calls (proposal was silent or under-specified — decided here)

- **OAuth token carry-through requires a cookie.** NextAuth v4's `signIn` callback (`src/lib/auth.ts` ~L88-126) only receives `{user, account, profile}` — the `?token=` from the accept page cannot ride the Google redirect as an arg. Resolution: the register component POSTs the token to a tiny route `POST /api/tripper-invite/oauth-init` that sets a short-lived HttpOnly cookie `grt_tripper_invite` (10 min) **before** calling `signIn("google")`; the callback reads it via `cookies()`. Single-use consume + 10 min TTL make it replay-safe; the callback cannot reliably clear response cookies, so it relies on TTL + consume. **Flagged.**
- **Grant happens on a client POST, not GET render.** The accept page renders a client child that POSTs `{token}` on mount for the existing-user path — identical to `VerifyEmailClient`. Scanners don't run JS, so a prefetch can't burn the invite.
- **`peek` (non-consuming) is separate from `consume`.** The page render decision and the register/OAuth create-time role decision must validate the token *without* burning it (the token is consumed only after the account is created). `consume` is called exactly once, at the end of each successful path.
- **Badge is a lightweight text chip, not `StatusBadge`.** "Invited"/"Expired" is a transient invite state, not a first-class entity lifecycle enum. Adding an `"invite"` variant to `StatusBadge` (typed to trip/payment/role enums) is overkill. Use the design-system's manual chip shape (`rounded-[6px] border px-2 py-0.5 text-[11px]`, sky for Invited, amber for Expired) — consistent corner radius, no dot (dots signal lifecycle status on a row entity; this is an informational side-label next to a button). Justified against `design-system.md`.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|---|---|---|---|
| Invite model | New `TripperInvite {id, email, tokenHash @unique, expiresAt, consumedAt, createdAt}`, **no FK**. `@@index([email])`. | Reuse `VerificationToken` with a nullable `userId` + new enum value; FK to `WaitlistEntry`/`User`. | `VerificationToken.userId` is **non-null** with a cascade relation — a no-account invite has no user to point at. Resolving by email at accept-time also naturally handles someone self-registering between invite and click. |
| Schema delivery | Edit `schema.prisma`, `npm run db:push`. Additive standalone table → zero-downtime, no data migration, no backfill. | `prisma migrate dev` migration file. | Same call as `admin-owned-experiences` / `auth-verification-reset`: a lone migration would fracture the `db push` workflow. No existing rows to backfill. |
| Token module | New `src/lib/auth/tripperInviteTokens.ts` (`issue`/`peek`/`consume`), email-keyed. | Add email-keyed fns into `verificationTokens.ts`. | `verificationTokens.ts` is `userId`-typed end to end; forking a dedicated module avoids widening every signature to `userId | email` and keeps single-responsibility (`.claude/rules`). Same hashing/reissue mechanics, copied deliberately. |
| Reissue | On issue: `deleteMany({ where: { email, consumedAt: null } })` then `create`. | DB unique on `email`; keep old tokens valid. | Mirrors `issueVerificationToken`. Guarantees ≤1 live invite per email so an old emailed link dies on resend; consumed rows retained (audit / badge derivation). |
| Grant on existing user | `POST /api/tripper-invite/accept` (client-POST): `consume` → `addMembershipRole(roles,"TRIPPER")` + `buildUserRoleUpdate` → `set` roles → delete waitlist row for email → redirect to `/` with a "log in" message. | Grant on the admin trigger; grant on GET render. | Consent-gated: admin trigger must change nothing. Reusing the exact role helpers from `PATCH /api/admin/users/[id]` prevents role-normalization drift. |
| Grant on new user | Set roles at **create** in both paths, gated by `peek` matching the invite email, then `consume` + waitlist cleanup: credentials → `register/route.ts` sets `roles: [CLIENT, TRIPPER]`; Google → `signIn` callback sets roles in the new-user `create`. | A post-create PATCH; a separate grant endpoint. | Proposal locks "granted at account-creation time". Peek-then-consume keeps the token alive through the create and burns it once. |
| Email mismatch | Resolve strictly by **invite email**. Credentials: email field is locked to the invite email (no mismatch possible). OAuth: grant only if `invite.email === googleUser.email`, else default `CLIENT`, no consume/cleanup. | Grant to whatever account completes signup. | Prevents a silent `TRIPPER` grant to an unrelated Google account (proposal risk). |
| Accept route | Dedicated `/[locale]/tripper-invite/page.tsx` (server: `hasLocale`+`getDictionary`) → client child. | Reuse `/login` or `/register` with `?invite=` conditionals. | Locked by proposal; a bespoke page keeps the three-way branch (error / existing / new) out of the shared auth modal. |
| Locale | Waitlist source → hardcode `es` (no `WaitlistEntry.locale`, don't add one). Existing-user source → `User.locale`. | Add `WaitlistEntry.locale`. | Locked by proposal; matches the `sendExperienceSubmitted`-style `.es` fallback already in `email/index.ts`. |
| Admin badge | Batch helper `getTripperInviteStatuses(emails[])` → `Map<email, "invited"|"expired">` from rows with `consumedAt IS NULL`; attached in both admin GET routes; users-table button hidden when roles include `TRIPPER`/`ADMIN`. | Per-row query in the client. | One indexed `findMany({ where: { email: { in }, consumedAt: null } })` avoids N+1; server-derived keeps the client dumb. |

## Interfaces / Contracts

### Prisma (`prisma/schema.prisma`)
```prisma
model TripperInvite {
  id         String    @id @default(cuid())
  email      String                      // NO FK — resolved by email at accept-time
  tokenHash  String    @unique           // SHA-256 hex; consumption + peek lookup key
  expiresAt  DateTime
  consumedAt DateTime?                    // null = still pending (single-use)
  createdAt  DateTime  @default(now())

  @@index([email])                        // reissue delete + admin badge lookup
  @@map("tripper_invites")
}
```
Applied via `npm run db:push`. No relation → no `User`/`WaitlistEntry` edits.

### Token module (`src/lib/auth/tripperInviteTokens.ts`, new)
```ts
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
function hashToken(plaintext: string): string; // sha256 hex — copy of verificationTokens

/** Delete prior unconsumed invites for email, create fresh. Returns PLAINTEXT. */
export async function issueTripperInvite(email: string): Promise<string>;

export type InvitePeek =
  | { ok: true; email: string }
  | { ok: false; reason: "invalid" | "expired" | "used" };
/** Validate token WITHOUT consuming — page render + create-time role decision. */
export async function peekTripperInvite(plaintext: string): Promise<InvitePeek>;

/** Validate + mark consumed (single-use). Same result shape as peek. */
export async function consumeTripperInvite(plaintext: string): Promise<InvitePeek>;

/** Admin badge derivation, batched. */
export async function getTripperInviteStatuses(
  emails: string[],
): Promise<Map<string, "invited" | "expired">>;
```

### Shared grant helper (in the token module or `prismaUserRoles`-adjacent)
```ts
/** Append TRIPPER (preserve existing) + delete any waitlist row for email. */
export async function grantTripperAndCleanup(userId: string, email: string): Promise<void>;
// load roles → buildUserRoleUpdate(addMembershipRole(roles,"TRIPPER")) → update {roles:{set}}
// → prisma.waitlistEntry.deleteMany({ where: { email } })
```

### Admin trigger routes (new, `POST`, `hasRoleAccess(caller,"admin")` — copy the guard block from `admin/users/[id]/route.ts`)
- `POST /api/admin/waitlist/[id]/invite-tripper` → load `WaitlistEntry` by id → `token = issueTripperInvite(entry.email)` → `sendTripperInviteEmail(entry.email, token, "es")` → `200 { ok: true }`.
- `POST /api/admin/users/[id]/invite-tripper` → load `User` by id (`select: email, locale, roles`) → if roles include `TRIPPER`/`ADMIN` → `400 { error }` → else issue → `sendTripperInviteEmail(user.email, token, resolveLocale(user.locale))` → `200`.

### Accept endpoints (new, public)
- `POST /api/tripper-invite/accept` — body `{ token }`. `consumeTripperInvite(token)` → on `!ok` `400 { reason }`; on `ok`, `findUnique user by email`; if none `409 { reason:"no_account" }` (page routes new users to register instead); else `grantTripperAndCleanup` → `200 { ok:true }`.
- `POST /api/tripper-invite/oauth-init` — body `{ token }`. `peekTripperInvite` → if ok, `cookies().set("grt_tripper_invite", token, { httpOnly:true, maxAge:600, sameSite:"lax", secure:true })` → `200`. Called by the register component right before `signIn("google")`.

### `POST /api/auth/register` — delta (`src/app/api/auth/register/route.ts`)
Accept optional `inviteToken`; when present, `peek` it and require `peek.email === email`. Set roles at create, then consume + cleanup:
```ts
const invite = inviteToken ? await peekTripperInvite(inviteToken) : { ok: false };
const grantTripper = invite.ok && invite.email === email;
// user create: add `roles: grantTripper ? ["CLIENT","TRIPPER"] : ["CLIENT"]` (was default [CLIENT])
if (grantTripper) {
  await consumeTripperInvite(inviteToken);
  await prisma.waitlistEntry.deleteMany({ where: { email } });
}
// existing issueVerificationToken/sendVerificationEmail unchanged
```

### `src/lib/auth.ts` — `signIn` Google-create delta (~L97-112)
Before `prisma.user.create`, read the cookie and peek:
```ts
const inviteToken = cookies().get("grt_tripper_invite")?.value;
const invite = inviteToken ? await peekTripperInvite(inviteToken) : null;
const grantTripper = !!invite?.ok && invite.email === user.email;
// create data: roles: grantTripper ? ["CLIENT","TRIPPER"] : ["CLIENT"]  (was default)
// after create, if grantTripper: await consumeTripperInvite(inviteToken);
//                                await prisma.waitlistEntry.deleteMany({ where: { email: user.email } });
```
Credentials `authorize()` path is untouched.

### Email (`src/lib/email/index.ts` + `src/emails/TripperInvite.tsx`)
```ts
export function sendTripperInviteEmail(email: string, token: string, locale: "es"|"en"): void {
  void (async () => { /* fire-and-forget; inviteUrl = `${BASE_URL}/${locale}/tripper-invite?token=${token}` */ })();
}
```
Template mirrors `VerifyEmail.tsx`: default component `{ inviteUrl, locale }` (+ optional name) + `export const subjects = { es, en }`. Takes email/locale as **args** (no `userId` — invitee may have no `User`), unlike the other senders.

### Accept page (`src/app/[locale]/tripper-invite/page.tsx`, server → client child)
`peekTripperInvite(token)` server-side to pick the branch, then render `<TripperInviteClient>` (`src/components/auth/TripperInviteClient.tsx`):
- `!ok` → error state (`copy.reason{Invalid,Expired,Used,Missing}`), no self-service resend.
- `ok` + `User` exists by email → POST `/api/tripper-invite/accept` on mount → granted state + login CTA to `/`.
- `ok` + no `User` → registration form, email **locked** to `invite.email`; credentials submit → `/api/auth/register { …, inviteToken }`; Google button → `POST /api/tripper-invite/oauth-init` then `signIn("google", { callbackUrl: '/${locale}' })`.

### Admin UI
- `AdminWaitlistPageClient.tsx`: add an "Invite as Tripper" `TableIconButton`/text button + status chip per row; waitlist GET (`/api/admin/waitlist/route.ts`) returns `inviteStatus` via `getTripperInviteStatuses`.
- `UsersTableRow.tsx` / `UsersTable.tsx`: same button+chip, hidden when `roles` include `TRIPPER`/`ADMIN`; users GET (`/api/admin/users/route.ts`) returns `inviteStatus`.
- Types: extend `AdminWaitlistEntry` + `AdminUser` with `inviteStatus?: "invited"|"expired"|null`.

## Data Flow
```
SEND
  admin row → POST /api/admin/{waitlist|users}/[id]/invite-tripper (admin-gated)
    → issueTripperInvite(email)  [delete prior pending, create, 7d]
    → sendTripperInviteEmail(email, token, locale)   waitlist⇒es | user⇒User.locale
    → row shows "Invited" chip

ACCEPT  /[locale]/tripper-invite?token=  (server peek → client child)
  invalid/expired/used → error state
  existing User → client POST /api/tripper-invite/accept
      → consume → grantTripperAndCleanup(user.id,email) → redirect "/" + "log in"
  no User → register form (email locked, token carried)
      credentials → POST /api/auth/register {inviteToken}
          → peek==email ⇒ roles [CLIENT,TRIPPER] at create → consume + delete waitlist
      google → POST /api/tripper-invite/oauth-init (set cookie) → signIn("google")
          → signIn callback reads cookie, peek==email ⇒ roles at create → consume + delete waitlist
```

## File Changes
| File | Action | Notes |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add `TripperInvite` model (no FK, `tokenHash @unique`, `@@index([email])`). Apply via `npm run db:push`. |
| `src/lib/auth/tripperInviteTokens.ts` | Create | `issue`/`peek`/`consume`/`getTripperInviteStatuses`/`grantTripperAndCleanup` (SHA-256, 7d, delete-then-create). |
| `src/app/api/admin/waitlist/[id]/invite-tripper/route.ts` | Create | Admin-gated; issue + `sendTripperInviteEmail(…, "es")`. |
| `src/app/api/admin/users/[id]/invite-tripper/route.ts` | Create | Admin-gated; 400 if already TRIPPER/ADMIN; issue + send with `User.locale`. |
| `src/app/api/tripper-invite/accept/route.ts` | Create | Existing-user consume + grant + waitlist cleanup. |
| `src/app/api/tripper-invite/oauth-init/route.ts` | Create | Peek + set short-lived `grt_tripper_invite` cookie. |
| `src/app/api/auth/register/route.ts` | Modify | Accept `inviteToken`; peek==email ⇒ `[CLIENT,TRIPPER]` at create; consume + delete waitlist. |
| `src/lib/auth.ts` | Modify | Google-create branch: read cookie, peek==email ⇒ roles at create; consume + cleanup after. |
| `src/lib/email/index.ts` | Modify | Add `sendTripperInviteEmail(email, token, locale)` + template/subjects import. |
| `src/emails/TripperInvite.tsx` | Create | React Email template + `subjects: {es, en}`; args-based (no `userId`). |
| `src/app/[locale]/tripper-invite/page.tsx` | Create | Server shell (`hasLocale`+`getDictionary`+peek) → client child. |
| `src/components/auth/TripperInviteClient.tsx` | Create | Error / existing-consume / new-register branches; locked email; credentials + Google. |
| `src/app/[locale]/(secure)/dashboard/admin/AdminWaitlistPageClient.tsx` | Modify | Invite button + Invited/Expired chip per row. |
| `src/app/api/admin/waitlist/route.ts` | Modify | Return `inviteStatus` per entry via batch helper. |
| `src/components/app/admin/UsersTableRow.tsx` / `UsersTable.tsx` | Modify | Invite button (hidden for TRIPPER/ADMIN) + chip. |
| `src/app/api/admin/users/route.ts` | Modify | Return `inviteStatus` per user via batch helper. |
| `src/lib/admin/types.ts` | Modify | Add `inviteStatus` to `AdminWaitlistEntry` + `AdminUser`. |
| `src/lib/types/dictionary.ts` | Modify | Types for new admin + accept-page + chip copy sections. |
| `src/dictionaries/es.json` + `en.json` | Modify | All new admin/accept/email UI copy in both locales. |

## Testing Strategy
| Layer | What | Approach |
|---|---|---|
| Type | New model/module wire through; `InvitePeek` union exhaustive; new dict keys | `npm run typecheck` |
| Lint | No raw `<img>`; design-system chip/button compliance on new UI | `npm run lint` |
| Unit | `issue` deletes prior pending then creates; `peek` never mutates; `consume` returns invalid/expired/used/ok; `getTripperInviteStatuses` maps invited/expired | mock `prisma` (repo `vitest` pattern) |
| Manual — send | Invite from waitlist (es) + users row (User.locale); resend invalidates prior link; button hides for TRIPPER/ADMIN | QA ≥360px + ≥1280px |
| Manual — accept existing | Consume grants TRIPPER (roles preserved), redirect `/`, waitlist row deleted | Regression |
| Manual — accept new | Credentials + Google both grant TRIPPER at create; email-mismatched Google account stays CLIENT; expired/used → error | Two accounts |

## Migration / Rollout
1. Merge schema + code. 2. `npm run db:push` (additive standalone table, safe). No backfill. Rollback: revert commits; dropping `tripper_invites` via `db:push` destroys only pending invites (re-issuable). Already-granted `TRIPPER` roles are consent-driven and remain correct. Accepted gaps (from proposal): no rate limiting, no audit trail.

## Open Questions
- [ ] **OAuth cookie carry-through (flagged):** confirm the `grt_tripper_invite` HttpOnly cookie + `oauth-init` route over alternatives. Cookie self-expires (10 min) and consume is single-use; the `signIn` callback cannot reliably clear it. Recommend accept.
- [ ] **Accept-endpoint `409 no_account`:** the page peeks first and routes new users to the register form, so `/accept` should only ever see existing users — the `409` is a defensive guard. Confirm this is acceptable vs. folding both paths into one endpoint.
- [ ] **Badge as text chip, not `StatusBadge`:** confirm the lightweight `rounded-[6px]` sky/amber chip (no dot) over adding an `"invite"` `StatusBadge` variant.
