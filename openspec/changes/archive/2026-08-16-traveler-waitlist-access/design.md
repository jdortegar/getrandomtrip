# Design: Invited-Only Site Access

## Technical Approach

Five layers, one new column, one generalized primitive, **no new infrastructure**.

1. **Grant** — `User.siteAccessGrantedAt DateTime?` is the single gate signal. First-grant-wins
   (never overwritten), mirroring the shipped `tripperSince` idiom.
2. **Kinded invite** — `TripperInvite` becomes `AccessInvite` with a `kind` discriminator resolved
   **from the DB row at peek/consume time**, never from the token (the token is 32 opaque random
   bytes and stays that way).
3. **Session** — `hasSiteAccess: boolean` rides the `session()` callback's *existing*
   `prisma.user.findUnique` by adding one field to its `select`. Zero extra queries — verified
   against `src/lib/auth.ts:215-231`.
4. **Gate** — `GateAwareChrome` derives one `sessionGrantsAccess` boolean and gains a
   clear-on-mismatch branch that is **guarded on `status !== "loading"`**; that guard is the
   load-bearing detail of this whole change (see ADR 7).
5. **Schema delivery** — a one-shot, idempotent SQL script run **before** `db:push`, because this
   repo has no Prisma migration history at all (see ADR 1).

Token issue/hash/TTL/single-use semantics, the `/tripper-invite` URL, and the `grt_tripper_invite`
cookie name are all untouched — deliberately (ADRs 5, 6).

---

## Architecture Decisions

### ADR 1 — Schema delivery is a hand-written idempotent SQL script + `db:push`, **not** `prisma migrate dev --create-only`

**Context.** The proposal's Risks table and the phase brief both assume a Prisma migration file can
be generated and hand-edited. Verified against the repo — that premise does not hold:

| Evidence | Finding |
| --- | --- |
| `prisma/migrations/` | contains **only** `.gitkeep` — zero migration files |
| `package.json:18` | `"db:migrate": "prisma db push"` — `migrate` is *aliased away* |
| `openspec/changes/traveler-invite-required-signup/design.md` D7 | prior change explicitly chose `db:push` for the same reason |

`prisma migrate dev` against a database that has tables but an empty `_prisma_migrations` history
reports **drift** and offers to reset the database. On a production DB that is the worst possible
outcome of a change whose stated goal is "no data loss". Making `migrate` usable here first requires
baselining (`prisma migrate diff --from-empty --to-schema-datamodel` → `migrate resolve --applied`)
for the *entire* 40-model schema — a repo-wide infrastructure change, far outside this scope.

And `prisma db push` alone is **not** safe either: `db push` diffs the schema against the live DB, so
renaming `@@map("tripper_invites")` → `@@map("access_invites")` reads as *drop one table, create
another*. Pending invites die.

**Decision.** Two phases, in this order:

**Phase 1 —** `scripts/rename-tripper-invites-to-access-invites.ts` (tsx script + `db:*` npm script,
matching the repo's five existing `db:backfill-*` / `db:cleanup-*` scripts), executing this SQL via
`prisma.$executeRawUnsafe`. Every statement is idempotent, so a partial failure is re-runnable:

```sql
-- 1. The discriminator enum. Idempotent via the duplicate_object trap
--    (CREATE TYPE has no IF NOT EXISTS in PostgreSQL).
DO $$ BEGIN
  CREATE TYPE "AccessInviteKind" AS ENUM ('TRIPPER', 'SITE_ACCESS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Table rename. ALTER TABLE ... RENAME preserves every row, index and
--    constraint — it only rewrites the catalog entry. Guarded so a re-run
--    after a successful rename is a no-op.
DO $$ BEGIN
  IF to_regclass('"tripper_invites"') IS NOT NULL
     AND to_regclass('"access_invites"') IS NULL THEN
    ALTER TABLE "tripper_invites" RENAME TO "access_invites";
    -- PostgreSQL does NOT rename dependent indexes/constraints with the table.
    -- Rename them explicitly so `db push` sees a converged schema and emits
    -- no follow-up DDL.
    ALTER INDEX "tripper_invites_pkey"          RENAME TO "access_invites_pkey";
    ALTER INDEX "tripper_invites_tokenHash_key" RENAME TO "access_invites_tokenHash_key";
    ALTER INDEX "tripper_invites_email_idx"     RENAME TO "access_invites_email_idx";
  END IF;
END $$;

-- 3. Kind column. The DEFAULT backfills every pre-existing row to TRIPPER
--    in place — PostgreSQL 11+ does this without a table rewrite.
ALTER TABLE "access_invites"
  ADD COLUMN IF NOT EXISTS "kind" "AccessInviteKind" NOT NULL DEFAULT 'TRIPPER';

-- 4. The gate signal. Nullable, no backfill: nobody is grandfathered in.
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "siteAccessGrantedAt" TIMESTAMP(3);
```

**Phase 2 —** `npm run db:push`. After Phase 1 the live DB already matches the new schema, so this is
a convergence check that should report *"already in sync"*.

**The structural safety valve: never pass `--accept-data-loss`.** `prisma db push` refuses
destructive operations without that flag. So if Phase 1 was skipped, incomplete, or ran against the
wrong database, Phase 2 **fails loudly** instead of dropping `tripper_invites`. This is not a
convention — it is the mechanism that makes the whole plan safe. Encode it in the task list as an
explicit prohibition.

**Rejected.**

| Option | Why not |
| --- | --- |
| `prisma migrate dev --create-only` + hand-edit (proposal's assumption) | No migration history exists; `migrate dev` detects drift and offers a **database reset**. Requires baselining the entire schema first. |
| `db push --accept-data-loss` | Drops `tripper_invites` and every pending invite. Exactly the risk the proposal flags. |
| Keep `@@map("tripper_invites")` and rename only the Prisma model | Genuinely the zero-risk option and satisfies every success criterion. Rejected only because the proposal explicitly asks for the physical rename — **but this is the recommended fallback** if Phase 1 cannot be run against production during the deploy window. Model-only rename is a pure code change; the physical rename can follow later. |

**Consequences.** The script is one-shot; delete-after-merge is *not* required (it is idempotent) but
`sdd-tasks` should schedule Phase 1 → Phase 2 → `prisma generate` in that exact order, and no code
that references `prisma.accessInvite` can run before Phase 2.

**Rollback SQL** (inverse, same idempotent style):

```sql
ALTER TABLE "users" DROP COLUMN IF EXISTS "siteAccessGrantedAt";
ALTER TABLE "access_invites" DROP COLUMN IF EXISTS "kind";
DROP TYPE IF EXISTS "AccessInviteKind";
DO $$ BEGIN
  IF to_regclass('"access_invites"') IS NOT NULL
     AND to_regclass('"tripper_invites"') IS NULL THEN
    ALTER INDEX "access_invites_email_idx"     RENAME TO "tripper_invites_email_idx";
    ALTER INDEX "access_invites_tokenHash_key" RENAME TO "tripper_invites_tokenHash_key";
    ALTER INDEX "access_invites_pkey"          RENAME TO "tripper_invites_pkey";
    ALTER TABLE "access_invites" RENAME TO "tripper_invites";
  END IF;
END $$;
```

### ADR 2 — `kind` is read from the DB row, never carried in the token

**Context.** `issueTripperInvite` returns `randomBytes(32).toString("hex")` — an opaque, unstructured
256-bit value. Only its SHA-256 hash is persisted. There is no payload.

**Decision.** `kind` lives **only** on the `AccessInvite` row. `peekAccessInvite` / `consumeAccessInvite`
already `findUnique` that row, so returning `kind` in `InvitePeek` costs nothing.

**Rejected.** Encoding kind in the token (`sa_<hex>` / a signed JWT). Both change the token format,
invalidate every in-flight invite link, and put a client-visible claim outside the DB — the invite
would become self-describing and therefore forgeable in shape, if not in value.

**Consequence.** Tokens issued before this change resolve to `kind: "TRIPPER"` via the column
DEFAULT, with no code branch — pending invites keep working exactly as they did (success criterion 5).

### ADR 3 — Rename the module to `accessInviteTokens.ts`; `issueAccessInvite` takes `kind` as a **required** argument

**Decision.** `src/lib/auth/tripperInviteTokens.ts` → `src/lib/auth/accessInviteTokens.ts` (and its
test file alongside). Full new surface:

```ts
import type { AccessInviteKind } from "@prisma/client";   // "TRIPPER" | "SITE_ACCESS"
export type { AccessInviteKind };

export type InvitePeek =
  | { ok: true; email: string; kind: AccessInviteKind }
  | { ok: false; reason: "invalid" | "expired" | "used" };

/** Invalidates prior unconsumed invites for the email (ANY kind), then issues a new one. */
export async function issueAccessInvite(email: string, kind: AccessInviteKind): Promise<string>;

export async function peekAccessInvite(plaintext: string): Promise<InvitePeek>;
export async function consumeAccessInvite(plaintext: string): Promise<InvitePeek>;

/** Kind-agnostic: answers "is there a live invite for this email", not "of which kind". */
export async function getAccessInviteStatuses(
  emails: string[],
): Promise<Map<string, "invited" | "expired">>;

/** Unchanged — email-equality check for the OAuth-create branch. */
export function resolveOAuthInviteGrant(peek: InvitePeek | null, createdEmail: string): boolean;

/** First-grant-wins stamp. Shared by grantAccessAndCleanup and /api/travelers/submit. */
export async function stampSiteAccess(userId: string): Promise<void>;

/**
 * SITE_ACCESS → stamp only. TRIPPER → stamp + append the TRIPPER role
 * (+ tripperSince on first grant). Both kinds then clear the waitlist row.
 */
export async function grantAccessAndCleanup(
  userId: string,
  email: string,
  kind: AccessInviteKind,
): Promise<void>;
```

`kind` is **required**, not defaulted to `TRIPPER`. The Prisma `@default(TRIPPER)` exists solely to
backfill legacy rows; in TypeScript, forcing every call site to state its intent is what makes the
two admin surfaces (users table = TRIPPER, waitlist = SITE_ACCESS) impossible to confuse.

`stampSiteAccess` is extracted rather than inlined twice because it owns one non-obvious rule:

```ts
// updateMany, NOT update — `update` only accepts unique fields in `where`,
// so the `siteAccessGrantedAt: null` first-grant-wins guard is illegal there.
await prisma.user.updateMany({
  where: { id: userId, siteAccessGrantedAt: null },
  data: { siteAccessGrantedAt: new Date() },
});
```

`grantAccessAndCleanup` keeps its single `findUnique({ select: { roles: true } })` and adds
`siteAccessGrantedAt: true` to that same select when it needs the null check inline; the role/
`tripperSince` block runs **only** when `kind === "TRIPPER"`. `waitlistEntry.deleteMany` runs for
both kinds (unchanged behavior, now also correct for the waitlist-originated invite).

**Sub-decision — invite invalidation stays cross-kind.** `issueAccessInvite` keeps
`deleteMany({ where: { email, consumedAt: null } })` with **no** `kind` filter. Rationale: one live
invite per email, newest admin intent wins. Kind-scoping would let a `TRIPPER` and a `SITE_ACCESS`
token be live for the same address simultaneously, and the accept page — which routes purely on
`hasAccount` — has no way to reconcile two competing grants.

**Sub-decision — `getAccessInviteStatuses` stays kind-agnostic.** The admin chip answers "is there a
live invite", which is true of both kinds. Both the users table (`api/admin/users/route.ts:61`) and
the waitlist table (`api/admin/waitlist/route.ts:54`) consume it unchanged. **Rename only — no logic
change.**

**Complete call-site inventory** (every one must be updated in the same commit; the module rename
makes the compiler enumerate them for you):

| Old symbol | New symbol | Production call sites | Test call sites |
| --- | --- | --- | --- |
| `issueTripperInvite` | `issueAccessInvite(email, kind)` | `api/admin/users/[id]/invite-tripper/route.ts:5,52` → `"TRIPPER"`; `api/admin/waitlist/[id]/invite-tripper/route.ts:5,53` → **moves** to `.../[id]/invite/route.ts`, `"SITE_ACCESS"` | `admin/users/[id]/invite-tripper/__tests__/route.test.ts:18,27,60,82,104`; `admin/waitlist/[id]/invite-tripper/__tests__/route.test.ts:19,28,62,88,120` (**moves** with the route) |
| `peekTripperInvite` | `peekAccessInvite` | `lib/auth.ts:18,147`; `api/tripper-invite/oauth-init/route.ts:2,15`; `api/auth/register/route.ts:8,64`; `app/[locale]/tripper-invite/page.tsx:3,31` | `tripper-invite/oauth-init/__tests__/route.test.ts:4,7,23,36`; `auth/register/__tests__/route.test.ts:17,32,155,169,210`; `lib/__tests__/auth.authorize.test.ts:28` |
| `consumeTripperInvite` | `consumeAccessInvite` | `lib/auth.ts:19,168`; `api/tripper-invite/accept/route.ts:4,19`; `api/auth/register/route.ts:9,91` | `tripper-invite/accept/__tests__/route.test.ts:10,16,34,49,67`; `auth/register/__tests__/route.test.ts:18,33,191,230`; `lib/__tests__/auth.authorize.test.ts:29` |
| `grantTripperAndCleanup` | `grantAccessAndCleanup(userId, email, kind)` | `api/tripper-invite/accept/route.ts:5,36` | `tripper-invite/accept/__tests__/route.test.ts:11,17,45,63,82` |
| `getTripperInviteStatuses` | `getAccessInviteStatuses` | `api/admin/users/route.ts:5,61`; `api/admin/waitlist/route.ts:5,54` | `admin/users/__tests__/route.test.ts:25`; `admin/waitlist/__tests__/route.test.ts:22,27,66` |
| `resolveOAuthInviteGrant` | *unchanged* | `lib/auth.ts:20,149` | `lib/__tests__/auth.authorize.test.ts:30` |
| `prisma.tripperInvite.*` | `prisma.accessInvite.*` | inside the module only: lines `23, 26, 40, 67, 74, 89` | `lib/auth/__tests__/tripperInviteTokens.test.ts` → rename file to `accessInviteTokens.test.ts`, update every `prisma.tripperInvite.*` mock |

`src/lib/travelers/travelerInviteTokens.ts:147` mentions `grt_tripper_invite` in a **comment only** —
no change (see ADR 5).

### ADR 4 — `hasSiteAccess` is a derived boolean on the existing `session()` select

**Context.** The proposal claims "no extra query". Verified: `session()` already runs exactly one
`prisma.user.findUnique({ where: { id: token.id }, select: {…} })` at `src/lib/auth.ts:215-231`.

**Decision.** Add one field to that select and one derived assignment:

```ts
// src/lib/auth.ts — session() callback
select: {
  id: true, name: true, email: true, roles: true, address: true, phone: true,
  createdAt: true, locale: true, travelerType: true, interests: true,
  dislikes: true, avatarUrl: true,
  siteAccessGrantedAt: true,          // ← the only select change
},
…
session.user.hasSiteAccess = !!dbUser.siteAccessGrantedAt;   // ← the only assignment
```

Claim confirmed: **zero additional queries.**

**Expose a boolean, not the timestamp.** The session is a client-visible surface; the grant date is
an audit/admin concern, would need ISO serialization, and no consumer needs it. A future revoke UI
reads the column directly server-side.

**Load-bearing property discovered while reading the callback:** `session()` re-reads the DB on
*every* session fetch — it does **not** cache the grant in the JWT. So a user who is already signed
in when their grant lands picks up `hasSiteAccess: true` on the next session refresh, with **no
re-login required**. This is why the accept flow needs no `update()` / `signIn()` dance.

### ADR 5 — Keep the cookie name `grt_tripper_invite`; branch the OAuth grant on `peek.kind`

**Decision.** The cookie string stays `grt_tripper_invite`. It is referenced behind a new exported
constant so the *API* reads correctly even though the wire format does not:

```ts
// accessInviteTokens.ts
/** Legacy wire name, kept deliberately — see design ADR 5. Kind-agnostic. */
export const ACCESS_INVITE_COOKIE = "grt_tripper_invite";
```

**Rejected: renaming to `grt_access_invite`.** The cookie is *in-flight state* with a 600s TTL. A
rename means that during the deploy window, a user who hit `oauth-init` on the old build and returns
from Google on the new build carries a cookie nobody reads — the grant is silently dropped, the
account is created with no roles and no site access, and the token stays unconsumed but the user
never sees the accept page again. A cosmetic name is not worth a silent-failure window.

**Decision — `signIn()` OAuth-create branch** (`src/lib/auth.ts:139-173`):

```ts
const inviteToken = cookieStore.get(ACCESS_INVITE_COOKIE)?.value;
const invitePeek  = inviteToken ? await peekAccessInvite(inviteToken) : null;
const grantAccess = resolveOAuthInviteGrant(invitePeek, user.email);      // email-bound, unchanged
const grantTripper = grantAccess && invitePeek!.ok && invitePeek!.kind === "TRIPPER";

dbUser = await prisma.user.create({
  data: {
    …unchanged…,
    ...(grantAccess  ? { siteAccessGrantedAt: new Date() } : {}),
    ...(grantTripper ? { roles: ["TRAVELER", "TRIPPER"], tripperSince: new Date() } : {}),
  },
});

if (grantAccess && inviteToken) {                    // was: if (grantTripper && …)
  await consumeAccessInvite(inviteToken);
  await prisma.waitlistEntry.deleteMany({ where: { email: user.email } });
}
```

Note the consume/cleanup condition widens from `grantTripper` to `grantAccess` — otherwise a
`SITE_ACCESS` OAuth signup would leave its token live and its waitlist row orphaned.

**Discovered pre-existing gap (recommend fixing here, one field):** today's OAuth branch sets
`roles: ["TRAVELER","TRIPPER"]` but **not** `tripperSince`, while `grantTripperAndCleanup` does set
it. Two grant paths, two different results. Adding `tripperSince: new Date()` above closes it and is
directly relevant to success criterion 4. Flagged rather than assumed — `sdd-tasks` may split it out.

**No gap on the existing-account path.** The OAuth cookie only matters inside `if (provider ===
"google" && !dbUser)`. An invitee who already has an account never reaches it — they land on
`TripperInviteClient`'s `ExistingUserBranch`, which POSTs `/api/tripper-invite/accept` and gets the
grant there (ADR 6). Both branches are covered.

### ADR 6 — Keep the `/tripper-invite` route and page path; branch the accept route and the page copy on `kind`

**Decision.** `POST /api/tripper-invite/accept` and `GET /[locale]/tripper-invite?token=` keep their
paths. Only their behavior and copy become kind-aware.

**Rejected: renaming to `/access-invite`.** The URL is embedded in already-sent emails with a 7-day
TTL. Renaming breaks every live invite link unless a redirect shim is added — new surface area, for a
cosmetic gain. `/tripper-invite` is already in `GATE_EXEMPT_ROUTES`
(`GateAwareChrome.tsx:21-27`), so an invited traveler can reach it while the gate is on. Rename is a
clean follow-up once the current TTL window has drained.

**Accept route** (`src/app/api/tripper-invite/accept/route.ts`) — request/response shapes are
**unchanged** (`{ token }` → `200 {ok:true}` / `400 {reason}` / `409 {reason:"no_account"}`). The
only diff is threading `kind` through:

```ts
const result = await consumeAccessInvite(token);
…
await grantAccessAndCleanup(user.id, result.email, result.kind);   // was: (user.id, result.email)
```

**Accept page + client** must stop telling a traveler they are now a Tripper:

- `page.tsx` — `resolution = { ok: true, email: peek.email, hasAccount: !!existing, kind: peek.kind }`
- `TripperInviteClient.tsx` — `TripperInviteResolution`'s `ok` branch gains `kind: AccessInviteKind`;
  copy is selected with one line at the top of each branch:

```ts
const c = kind === "SITE_ACCESS" ? { ...copy, ...copy.siteAccess } : copy;
```

A nested `siteAccess` override object whose keys are a strict subset of the parent gives kind-aware
copy with **no** conditional at any render site and full type safety. Rejected: six flat
`…SiteAccess` sibling keys (forces a ternary at every usage) and a second client component (duplicates
the whole state machine for a copy delta).

**Invite email must also branch** — flagged as a **gap in the proposal's Affected Areas**, which does
not list `src/lib/email` or `src/emails`. Shipping without it mails every invited traveler
*"Te invitamos a ser Tripper"*. Minimal fix, consistent with the file's existing shape:

```ts
// src/emails/TripperInvite.tsx — copy becomes copy[kind][locale]; same for `subjects`
export const subjects: Record<AccessInviteKind, Record<"es"|"en", string>>;
export default function TripperInvite({ inviteUrl, locale, kind }: TripperInviteProps);

// src/lib/email/index.ts:850 — signature gains kind, passes it through to both
export function sendAccessInviteEmail(
  email: string, token: string, locale: "es"|"en", kind: AccessInviteKind,
): void;
```

Rejected: a separate `SiteAccessInvite.tsx` template. The layout, CTA and styles are identical; only
three strings differ per locale.

### ADR 7 — `GateAwareChrome`: one derived boolean, and a clear-on-mismatch effect **guarded on `status !== "loading"`**

**Context.** The current effect (`GateAwareChrome.tsx:65-71`) is grant-only — it never clears. Adding
a clear branch naively is the most dangerous edit in this change, because on first render
`useSession()` returns `data: undefined` before it resolves. An unguarded
`if (!sessionGrantsAccess) clear()` would wipe `GATE_STORAGE_KEY` on **every page load, for every
user, including admins**, before the session ever arrives.

**Decision.** Read `status` alongside `data`, derive one boolean, and branch on the three-state
status explicitly:

```ts
const { data: session, status } = useSession();
…
const role = session?.user?.role;
const sessionGrantsAccess =
  (!!role && GATE_ALLOWED_ROLES.has(role)) || !!session?.user?.hasSiteAccess;

useEffect(() => {
  if (status === "loading") return;               // ← the guard. Without it, every
                                                  //    page load clears a valid unlock.
  if (status !== "authenticated") return;         // anonymous localStorage unlock is
                                                  //    out of scope — leave it alone.
  if (sessionGrantsAccess) {
    window.localStorage.setItem(GATE_STORAGE_KEY, "1");
    setLoginModalOpen(false);
    setGateUnlocked(true);
  } else {
    window.localStorage.removeItem(GATE_STORAGE_KEY);
    setGateUnlocked(false);
  }
}, [status, sessionGrantsAccess]);
```

And the render-time denial flag (`:98-99`):

```ts
const accessDenied = status === "authenticated" && !sessionGrantsAccess;
// was: const role = session?.user?.role; const accessDenied = !!role && !GATE_ALLOWED_ROLES.has(role);
```

`GATE_ALLOWED_ROLES` is kept as an **OR**, never replaced — that is the admin-lockout mitigation from
the proposal's Risks table, and it is structural here, not a convention.

**Explicitly not changed:** the `status === "unauthenticated"` case does not clear. The proposal lists
"anonymous browsers already unlocked via localStorage" as an inherited, out-of-scope gap; clearing on
sign-out would silently change behavior for admins who unlocked anonymously and would exceed scope.

**Consequence (intended, per the proposal's Risks table):** a user who unlocked anonymously and then
signs in without a grant is locked out on that browser. Documented, not mitigated.

Everything below `useEffect` in the file — `normalChrome`, `isGateExemptRoute`, the `gateEnabled`
short-circuit, the `gateUnlocked === null` null-render — is **unchanged**.

### ADR 8 — Dropping the waitlist existing-user guard also removes the *client* invite filter (this supersedes half of `waitlist-bulk-actions` Resolved Decision #1)

**Context.** The proposal drops the server-side `400 already-member` guard so a self-registered
waitlister can be invited. But `AdminWaitlistPageClient` *also* gates client-side: the row invite
button is `disabled` on `alreadyMember` (`:353`) and `invitableSelectedIds` (`:136-138`) filters those
rows out of the bulk fan-out. **Dropping only the server guard achieves nothing** — the admin still
cannot click the button.

**Decision.** Remove the gating, keep the information.

| Surface | Before | After |
| --- | --- | --- |
| `POST .../[id]/invite` | `400` when `findExistingUserEmails` hits | guard + `findExistingUserEmails` import removed |
| Row invite button `disabled` | `invitingId === entry.id \|\| entry.alreadyMember` | `invitingId === entry.id` |
| Row button `title` | `alreadyMember ? alreadyMemberHint : …` | drop the `alreadyMember` arm |
| `invitableSelectedIds` | selection minus `alreadyMember` | **deleted** — `handleBulkInvite` uses `Array.from(selectedIds)` |
| `inviteDisabled` | `invitableSelectedIds.length === 0` | `selectedIds.size === 0` |
| `skippedCount` / invite-confirm skipped note | rendered when > 0 | **deleted** |
| `alreadyMember` chip in the status cell | rendered | **kept** — still useful information |
| `GET /api/admin/waitlist` `alreadyMember` enrichment + `findExistingUserEmails` helper | present | **kept** (feeds the chip) |

This **supersedes the invite-filter half** of `openspec/changes/waitlist-bulk-actions/design.md`
Resolved Decision #1. The other half — *row checkboxes stay enabled on every row, bulk delete never
filters* — is unaffected and still holds. Recording the supersession explicitly so `sdd-verify` does
not read it as a regression against the shipped spec.

**Route move.** `src/app/api/admin/waitlist/[id]/invite-tripper/` → `src/app/api/admin/waitlist/[id]/invite/`
(directory rename, tests move with it). Request stays `POST` with no body; responses stay
`200 {ok:true}` / `401` / `403` / `404` / `500` — the `400` is the only shape removed. Client fetch
URLs at `:88` and `:150` update.

`POST /api/admin/users/[id]/invite-tripper` — path, request and response **unchanged**; the only diff
is `issueAccessInvite(target.email, "TRIPPER")`. That table really does invite trippers.

### ADR 9 — `/api/travelers/submit` stamps the grant via the shared helper, best-effort, after a successful consume

**Decision.** Insert one call after the `!result.ok` early return (so a failed consume grants
nothing), **before** the notification block, wrapped:

```ts
// Best-effort: the roster row is already COMPLETE at this point. A DB hiccup
// on the grant must not fail the response and push the companion into
// re-submitting an already-consumed token (which resolves `used`).
try {
  await stampSiteAccess(dbUser.id);
} catch (err) {
  console.error("[travelers/submit] siteAccess stamp failed:", err);
}
```

Mirrors the best-effort idiom already used for verification tokens in `authorize()`
(`src/lib/auth.ts:105-110`). Request and response shapes are **unchanged**.

**Rejected:** calling `grantAccessAndCleanup` here. It would also append roles (wrong — a companion is
not a tripper) and delete waitlist rows (unrelated side effect). `stampSiteAccess` exists precisely so
the null-guard/`updateMany` rule is written once (ADR 3).

**Rejected:** letting the grant throw into the outer `catch`. That returns `400 {error:"invalid"}` —
a misleading response for a companion whose submission actually succeeded.

### ADR 10 — Session type: `hasSiteAccess?: boolean`, optional

**Decision.**

```ts
// src/types/next-auth.d.ts — inside declare module "next-auth" → interface Session["user"]
    hasSiteAccess?: boolean;      // alphabetically after `email`, before `image`
```

Optional (`?`), matching its neighbors `role?` / `roles?` / `phone?`. The `session()` callback only
populates it inside `if (dbUser)`; a required field would be a type-level lie when the DB read misses.
Consumers coerce: `!!session?.user?.hasSiteAccess`. No change to `interface User` (the credentials
`authorize()` return) and none to the `JWT` interface — the grant is never JWT-cached (ADR 4).

### ADR 11 — Dictionary key delta

`i18n-and-types.md` is mandatory: every key below lands in `es.json` **and** `en.json` in the same
change, plus its `src/lib/types/dictionary.ts` type. Copy itself is `sdd-apply`'s job; this is the
enumeration.

**`waitlist` (marketing gate — `dictionary.ts:2999-3002` + the inline `WaitlistDict` in `WaitlistPage.tsx:8-28`)**

| Key | Action | Note |
| --- | --- | --- |
| `adminLoginLabel` | **remove** | the two-span CTA collapses to one |
| `adminLoginAction` | **rename → `loginAction`** | "admin" is now semantically wrong — any invited user logs in here |
| `accessDeniedTitle` / `accessDeniedBody` | keep key, **rewrite copy** | meaning shifts from "your role isn't allowed" to "your account isn't invited" |

`WaitlistPage.tsx:165-174` — the `<Button variant="link">` drops one `<span>` and the now-pointless
`flex flex-col leading-tight lg:flex-row lg:gap-1.5 lg:leading-normal` classes. **The inline
`WaitlistDict` interface in that file must be updated in lockstep with `dictionary.ts` — it is a
hand-maintained duplicate, not a derived type.**

**`adminPages.waitlist` (`dictionary.ts:1468-1504`)**

| Key | Action |
| --- | --- |
| `actions.inviteTripper` | **rename → `actions.invite`** ("Invite as Traveler" / "Invitar como viajero") |
| `alreadyMemberHint` | **remove** — tooltip on a button that is no longer disabled (ADR 8) |
| `bulkActions.inviteNothingToDo` | **remove** — unreachable once the invite filter is gone |
| `bulkActions.inviteSkippedNote` | **remove** — nothing is skipped anymore |
| `alreadyMemberBadge` | **keep** — the chip survives |
| everything else | unchanged |

**`adminPages.users.invite.inviteTripper` (`dictionary.ts:3183`) — unchanged.**

**`tripperInviteAccept` (`TripperInviteAcceptDict`, `dictionary.ts:1878-1898`)** — add one nested
override object (ADR 6):

```ts
  siteAccess: {
    grantedTitle: string;
    grantedBody: string;
    registerEyebrow: string;
    registerTitle: string;
    registerSubtitle: string;
    registerSuccessBody: string;
  };
```

All existing flat keys stay as the `TRIPPER` variants. `errorTitle`, `reason*`, `loginCta`,
`emailLockedNote`, `submitLabel`, `submitting`, `loading*`, `registerErrorGeneric` and
`registerSuccessTitle` are kind-neutral and are **not** overridden.

---

## Data Flow

```
ADMIN → waitlist table → POST /api/admin/waitlist/[id]/invite        (was .../invite-tripper)
          issueAccessInvite(entry.email, "SITE_ACCESS")              [no existing-user 400]
          sendAccessInviteEmail(email, token, "es", "SITE_ACCESS")

ADMIN → users table    → POST /api/admin/users/[id]/invite-tripper   (path unchanged)
          issueAccessInvite(target.email, "TRIPPER")

INVITEE → GET /[locale]/tripper-invite?token=…      [gate-exempt · peek, never consume]
   peekAccessInvite → { ok, email, kind } ─────────────────────────┐
   prisma.user.findUnique(email) → hasAccount                      │
        ├─ hasAccount  → ExistingUserBranch                        │ copy = kind==="SITE_ACCESS"
        │     POST /api/tripper-invite/accept { token }            │   ? {...copy, ...copy.siteAccess}
        │       consumeAccessInvite → { email, kind }              │   : copy
        │       grantAccessAndCleanup(userId, email, kind) ────────┘
        │         stampSiteAccess (both kinds, first-grant-wins)
        │         + roles/tripperSince  (TRIPPER only)
        │         + waitlistEntry.deleteMany (both)
        └─ !hasAccount → NewUserBranch
              ├─ email/password → POST /api/auth/register { inviteToken }
              │     peekAccessInvite → grantAccess = peek.ok && peek.email === email
              │                        grantTripper = grantAccess && kind === "TRIPPER"
              │     create user + siteAccessGrantedAt (grantAccess) + roles (grantTripper)
              │     consumeAccessInvite + waitlist cleanup  ← now on grantAccess, was grantTripper
              │     → EMAIL VERIFICATION REQUIRED before first login (inherited)
              └─ Google → POST /api/tripper-invite/oauth-init → cookie grt_tripper_invite (600s)
                    → signIn("google") → auth.ts signIn() create branch, same two flags

COMPANION → POST /api/travelers/submit  → consumeTravelerInvite → stampSiteAccess(user.id)

ANY SESSION FETCH → auth.ts session()
    one existing findUnique, select += siteAccessGrantedAt
    session.user.hasSiteAccess = !!dbUser.siteAccessGrantedAt        ← no extra query

GateAwareChrome
    status==="loading"        → do nothing
    status==="unauthenticated"→ do nothing (anonymous unlock inherited)
    status==="authenticated"  → sessionGrantsAccess
                                  ? localStorage.set + unlock
                                  : localStorage.remove + lock (accessDenied)
```

---

## File Changes

| File | Action | Description |
| --- | --- | --- |
| `prisma/schema.prisma` | Modify | `User.siteAccessGrantedAt DateTime?`; `model TripperInvite` → `model AccessInvite` + `kind AccessInviteKind @default(TRIPPER)` + `@@map("access_invites")`; new `enum AccessInviteKind { TRIPPER SITE_ACCESS }` |
| `scripts/rename-tripper-invites-to-access-invites.ts` | **Create** | Idempotent SQL from ADR 1 via `$executeRawUnsafe`. Run **before** `db:push`, never with `--accept-data-loss` |
| `package.json` | Modify | `"db:rename-access-invites": "npx tsx scripts/rename-tripper-invites-to-access-invites.ts"` |
| `src/lib/auth/tripperInviteTokens.ts` | **Rename → `accessInviteTokens.ts`** | Full surface per ADR 3: kinded issue/peek/consume, `stampSiteAccess`, `grantAccessAndCleanup(userId, email, kind)`, `getAccessInviteStatuses`, `ACCESS_INVITE_COOKIE` |
| `src/lib/auth/__tests__/tripperInviteTokens.test.ts` | **Rename → `accessInviteTokens.test.ts`** | `prisma.accessInvite.*` mocks; new kind + stamp cases |
| `src/lib/auth.ts` | Modify | `session()` select += `siteAccessGrantedAt`, assign `hasSiteAccess`; `signIn()` OAuth branch splits `grantAccess` / `grantTripper`, widens the consume condition, (recommended) adds `tripperSince`; imports repoint to `accessInviteTokens` |
| `src/types/next-auth.d.ts` | Modify | `hasSiteAccess?: boolean` on `Session["user"]` |
| `src/components/waitlist/GateAwareChrome.tsx` | Modify | `status` from `useSession`; `sessionGrantsAccess`; guarded clear-on-mismatch effect; `accessDenied` rewrite (ADR 7) |
| `src/components/waitlist/WaitlistPage.tsx` | Modify | Inline `WaitlistDict`: `−adminLoginLabel`, `adminLoginAction → loginAction`; CTA collapses to one `<span>` |
| `src/app/api/admin/waitlist/[id]/invite-tripper/` | **Rename dir → `[id]/invite/`** | `issueAccessInvite(email, "SITE_ACCESS")`; drop the `400` guard + `findExistingUserEmails` import; `sendAccessInviteEmail(…, "SITE_ACCESS")` |
| `src/app/api/admin/waitlist/[id]/invite-tripper/__tests__/route.test.ts` | **Move + Modify** | Drop the `400` case; assert `issueAccessInvite(email, "SITE_ACCESS")` |
| `src/app/api/admin/users/[id]/invite-tripper/route.ts` | Modify | `issueAccessInvite(target.email, "TRIPPER")` + `sendAccessInviteEmail(…, "TRIPPER")`. Path/shapes unchanged |
| `src/app/api/tripper-invite/accept/route.ts` | Modify | `consumeAccessInvite`; `grantAccessAndCleanup(user.id, result.email, result.kind)`. Shapes unchanged |
| `src/app/api/tripper-invite/oauth-init/route.ts` | Modify | `peekAccessInvite`; cookie name via `ACCESS_INVITE_COOKIE` (same string) |
| `src/app/api/auth/register/route.ts` | Modify | `peekAccessInvite`; split `grantAccess`/`grantTripper`; stamp `siteAccessGrantedAt`; **consume + waitlist cleanup now gated on `grantAccess`, not `grantTripper`** |
| `src/app/api/travelers/submit/route.ts` | Modify | `stampSiteAccess(dbUser.id)` in a try/catch after a successful consume (ADR 9) |
| `src/app/[locale]/tripper-invite/page.tsx` | Modify | `peekAccessInvite`; pass `kind` into `resolution` |
| `src/components/auth/TripperInviteClient.tsx` | Modify | `TripperInviteResolution.ok` gains `kind`; one-line `siteAccess` copy override in each branch |
| `src/emails/TripperInvite.tsx` | Modify | `copy[kind][locale]`, `subjects[kind][locale]`, `kind` prop |
| `src/lib/email/index.ts` | Modify | `sendTripperInviteEmail` → `sendAccessInviteEmail(email, token, locale, kind)` (`:850-874`) |
| `src/app/[locale]/(secure)/dashboard/admin/AdminWaitlistPageClient.tsx` | Modify | Endpoint `:88`/`:150` → `/invite`; drop `invitableSelectedIds`, `skippedCount`, the `alreadyMember` `disabled`/tooltip arms and the skipped note; `inviteDisabled = selectedIds.size === 0`; rename `inviteAsTripper` → `inviteEntry`; `copy.actions.invite` |
| `src/lib/types/dictionary.ts` | Modify | Full key delta per ADR 11 |
| `src/dictionaries/es.json` + `en.json` | Modify | Same delta, **both locales**, same commit |
| `src/lib/admin/waitlistMembership.ts` | **Unchanged** | Still feeds the `alreadyMember` chip via the list route |
| `src/app/api/admin/waitlist/route.ts` | Modify | `getAccessInviteStatuses` rename only — enrichment logic untouched |
| `src/app/api/admin/users/route.ts` | Modify | `getAccessInviteStatuses` rename only |
| `src/components/auth/AuthModal.tsx` | **Unchanged** | Zero diff, asserted |

---

## Testing Strategy

| Layer | What | Approach |
| --- | --- | --- |
| Type/Lint | New/removed dict keys present in both locales; removed keys have zero remaining references; inline `WaitlistDict` matches `dictionary.ts` | `npm run typecheck`, `npm run lint` |
| Unit — tokens | `issueAccessInvite` persists `kind` and invalidates **across kinds**; `peek`/`consume` return `kind`; a row with the DEFAULT resolves `TRIPPER`; `stampSiteAccess` uses `updateMany` with the `siteAccessGrantedAt: null` guard and is a **no-op on an already-granted user**; `grantAccessAndCleanup` stamps for both kinds, appends `TRIPPER`+`tripperSince` **only** for `TRIPPER`, deletes the waitlist row for both | vitest, `vi.mock("@/lib/prisma")` |
| Unit — session | `session()` sets `hasSiteAccess: true/false` from the column; **assert `prisma.user.findUnique` is called exactly once** (the "no extra query" claim) | existing `auth` test pattern |
| Unit — signIn | OAuth create with a `SITE_ACCESS` cookie → stamp, **no** `TRIPPER` role, token consumed; with `TRIPPER` → role + stamp; email mismatch → neither, token **not** consumed | mock `next/headers` + `peekAccessInvite` |
| Integration — routes | waitlist `/invite` issues `SITE_ACCESS` and **no longer 400s** an existing user; users `invite-tripper` issues `TRIPPER`; accept forwards `result.kind`; register consumes on `SITE_ACCESS` (regression: previously only on `grantTripper`); `travelers/submit` stamps once and still returns `200` when the stamp throws | route-handler tests |
| Component — gate | **`status === "loading"` does NOT clear a set `GATE_STORAGE_KEY`** (the ADR 7 regression); authenticated `TRAVELER` + `hasSiteAccess` → unlocked; authenticated `TRAVELER` without → cleared + `accessDenied`; authenticated `admin` without a grant → still unlocked; `unauthenticated` → localStorage untouched | vitest + happy-dom, mock `useSession` across all three statuses |
| Component — admin waitlist | Row invite button is **enabled** on an `alreadyMember` row and fires; bulk invite fans out to the full selection including `alreadyMember`; the chip still renders | vitest + happy-dom, mock `fetch` |
| Manual QA | Full criteria list below; ≥360px / ≥1280px | QA |

**TDD slice order (RED → GREEN):** schema+script → tokens module → session/signIn → accept + register
+ waitlist routes → travelers/submit → types + dictionaries → gate component → admin client.

**Manual criteria that automated tests cannot cover:** pending `tripper_invites` rows survive Phase 1
(count before/after); an invited waitlister completes the full accept → verify-email → login → gated
site path; a `TRAVELER` with no grant still sees the gate.

---

## Migration / Rollout

1. `npm run db:rename-access-invites` (Phase 1 SQL — idempotent, re-runnable)
2. `npm run db:push` — **never with `--accept-data-loss`**. Expect "already in sync". Any proposed
   drop means Phase 1 did not run against this database: **abort, do not force**
3. `npm run db:generate`
4. Deploy code

Order is mandatory: no code path referencing `prisma.accessInvite` may run before step 2.

**Rollback:** revert the code commits and run the inverse SQL from ADR 1. Grants are additive — no
user data is destroyed; affected users simply return to gate-blocked.

---

## Risks

- [x] **Prisma regenerates the rename as drop+create — RESOLVED** by ADR 1's two-phase plan. The
      residual risk is *Phase 1 skipped*, mitigated structurally: `db push` cannot drop a table
      without `--accept-data-loss`, so a skipped Phase 1 fails loudly instead of silently.
- [ ] **`status === "loading"` clearing the gate unlock (High if missed).** The single highest-blast-radius
      line in this change: an unguarded clear locks out **every user on every page load**, admins
      included. Pinned by a dedicated component test. Verify this first during apply.
- [ ] **Invite email copy (Med).** The proposal's Affected Areas omits `src/lib/email` and
      `src/emails`. Without ADR 6's email change, every invited traveler is mailed *"become a
      Tripper"*. Treated as in-scope here; if the owner disagrees, it must be an explicit,
      documented deferral.
- [ ] **`consume` condition widening in `register` and `signIn` (Med).** Both currently consume only
      when `grantTripper`. Missing the widen leaves `SITE_ACCESS` tokens live after use — a
      single-use guarantee silently broken. Covered by two integration cases.
- [ ] **Email verification still gates first login (Low, inherited).** A waitlister who registers via
      the invite must verify their email before `authorize()` issues a session (`auth.ts:78-112`).
      Success criterion 1 is therefore a multi-step manual path, not a single-session flow. Not
      introduced here; `/verify-email` is already gate-exempt.
- [ ] **`tripperSince` missing on the OAuth grant path (Low, pre-existing).** Discovered while reading
      `signIn()`. One-field fix recommended in ADR 5; `sdd-tasks` may split it into its own change.
- [ ] **Email case-sensitivity (Low, inherited).** Every email match in this flow stays exact-match,
      consistent with `waitlist-bulk-actions` Resolved Decision #3. Unchanged, not fixed here.
- [ ] **Anonymous localStorage unlock (Low, inherited).** Still bypasses the gate for users who never
      sign in. Explicitly out of scope per the proposal.

---

## Downstream notes for `sdd-tasks` and `sdd-spec`

1. **ADR 1 is a hard sequencing constraint**, not a recommendation. Tasks must order Phase 1 → Phase 2
   → generate, and must carry the `--accept-data-loss` prohibition as an explicit checklist line.
2. **ADR 8 supersedes half of `waitlist-bulk-actions` Resolved Decision #1.** `sdd-spec` should amend
   the `tripper` capability spec so `sdd-verify` does not flag the removed invite filter as a
   regression. The checkbox/bulk-delete half of that decision still stands.
3. **ADR 6's email change is a scope addition** relative to the proposal's Affected Areas table.
   Needs a spec scenario: a `SITE_ACCESS` invite email must not claim a Tripper role.
4. **The `siteAccess` copy override object (ADR 6) needs spec scenarios** for both accept branches:
   existing-account grant and new-account registration, each with the right kind-specific copy.
5. `sdd-spec` should add the ADR 7 negative scenario verbatim: *given a browser with
   `GATE_STORAGE_KEY` set and a session still resolving, when the page mounts, then the key is not
   cleared and the gate is not shown.*
