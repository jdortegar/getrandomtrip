# Design: Single Active Trip Request

## Technical Approach

One new module — `src/lib/db/tripRequest.ts` — owns every predicate this change introduces (family classification, the non-terminal status set, the active-row finder, the expiry test and its persisted revert). Three route files consume it; nothing re-expresses a rule inline. This mirrors the existing `src/lib/travelers/travelerAccess.ts` convention ("a permissions check written twice is a permissions check that will drift") and lives next to `src/lib/db/payment.ts`, which already owns the `Payment.expiresAt` write.

Layering:

1. **Pure predicates** (`tripFamilyOf`, `isExpiredPendingPayment`) — no Prisma, unit-testable with zero mocks. This is where RED/GREEN tests carry their weight.
2. **Thin DB wrappers** (`findActiveTripRequest`, `revertExpiredPendingPayment`, `revertExpiredPendingPaymentsForUser`) — every one funnels through a pure predicate and a single shared `persistRevert` write.
3. **Routes** — call the wrappers; contain no expiry or family logic.

The cleanup script imports the *same* predicates so production data converges on exactly the invariant the runtime enforces.

One extra piece of work rides along, and it is **not optional**: enforcing a single active row means a `TripRequest` can now be reconfigured while it still carries a live Stripe PaymentIntent. That makes a latent bug in `POST /api/stripe/payment-intent` reachable, so this change also adds a **stale-intent amount guard** to that route (see the dedicated section below).

### Naming gotcha (locked)

`TripRequest.type` already has the value `"family"` (`schema.prisma:101`). Calling the product-family concept `family` in code would collide head-on with `type === "family"`. The concept is therefore named **`TripFamily = "journey" | "xsed"`** everywhere — never bare `family`.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|---|---|---|---|
| Helper location | New `src/lib/db/tripRequest.ts` | `src/lib/helpers/trip-request-*.ts`; inline in each route | `src/lib/db/` is where Prisma-owning domain modules live (`payment.ts`, `tripper-queries.ts`); `src/lib/helpers/` is pure-function territory. The module writes to Prisma, so `db/`. |
| Expiry helper shape | **One pure predicate + two DB entry points** sharing one `persistRevert` writer | A single `revertExpiredPendingPayment(tripId)` for both callers | The two callers hold different shapes: payment-intent has already loaded the row *with* `include: { payment: true }` (a single-id helper would refetch it); `GET /api/trips` needs an unbounded, paginated, status-filtered set (a per-id helper would be N+1). The *duplication the proposal forbids* is the expiry rule and the write — both are single-sourced (`isExpiredPendingPayment` + `persistRevert`). |
| Revert timing on `GET /api/trips` | **Before** the `findMany`/`count`, scoped to `userId` (owned rows only, not `tripAccessWhere`) | After the read, patching statuses in the response object | The route paginates and accepts `?status=PENDING_PAYMENT,...`. Reverting after the read would return a page whose statuses contradict the filter and whose `total` is stale. Reverting first makes the query the single source of truth. Scoping to owned rows (not companion-linked) keeps a read by a companion from writing to another buyer's trip; the buyer's own `GET` fixes it. |
| Revert timing on payment-intent | Immediately after the ownership check, **before** `PAYABLE_STATUSES` (route.ts:55) | After the guard | The whole point is that an expired `PENDING_PAYMENT` is still payable. It already passes today's guard, so the revert's real job here is to normalize the row (and let the `trip.status !== "PENDING_PAYMENT"` re-flip at L65 re-stamp it) rather than to open a gate. Placing it before the guard keeps one ordering rule for both callers: *normalize, then decide*. |
| Stale-intent amount guard (**in scope** — see dedicated section) | Hoist the amount computation above the idempotency branch and compare `amountCents` against `existing.amount`; on mismatch cancel the stale intent and create a fresh one | Ship the reuse and defer the guard to a follow-up; compare against `trip.payment.amount` (the DB row) instead of Stripe's value | Family-scoped reuse lets a row keep a live PaymentIntent while its configuration is rewritten, so the pre-existing "return the existing intent without re-checking the amount" branch becomes reachable and can charge the old price for the new trip. Comparing against the **DB** `Payment.amount` would be circular (it is whatever we wrote on the previous attempt) and float-fragile; `existing.amount` is Stripe's integer-cent record of what the user would actually be charged. |
| Bulk revert query | `findMany({ select: { id } })` → `updateMany({ where: { id: { in }, status: PENDING_PAYMENT } })` | Single `updateMany` with a nested `payment: { is: { expiresAt: { lt: now } } }` relation filter | Prisma relation filters inside `updateMany` are version-sensitive and compile to an opaque subquery. Two explicit queries are guaranteed to work on Prisma 7, return an auditable id list, and the `status` re-check in the `updateMany` `where` makes the write a compare-and-swap against a concurrent webhook flipping the row to `CONFIRMED`. The extra read is one indexed query and runs on every `GET /api/trips`; the write only fires when `ids.length > 0` (proposal risk #5). |
| Family upsert ordering | `findFirst(..., orderBy: { updatedAt: "desc" })` | `createdAt: "desc"`; unordered | Must match the cleanup script's "keep newest by `updatedAt`" rule (proposal decision #7), or runtime and cleanup would pick different survivors while duplicates still exist. |
| Stale-id fallback needs `type` | If the client id is stale/unowned **and** the body carries no `type`, return **404**, do not guess a family | Guessing `journey`; today's implicit 500 | `checkout/page.tsx:599` posts partial bodies (`{ id, pax, paxDetails }`) with no `type`. Binding such a body to a family-resolved row could write pax into the *wrong* trip. 404 is a strict improvement over the current uncaught `P2025` → 500. |
| Data builder for the fallback update | Reuse the **create-shaped** field set for the family-fallback `update`, not `buildTripRequestPartialUpdate` | Always use the partial builder | A no-id body is a full configuration. The partial builder skips xsed canonical-date resolution (`xsedCanonicalDates()` / `Experience.tripDate`) and `experienceId`, so a reused xsed row would keep stale dates. Extracting the existing create block into `buildTripRequestCreateFields(body, ...)` and feeding it to both `update` and `create` keeps one code path. |
| Tripper attribution on reuse | Set `tripperId` on the fallback update **only when the existing row's `tripperId` is null** | Always overwrite; never set | Preserves the standing rule "updates do not change attribution" (route.ts:252) while still letting a first-time `?tripper=slug` arrival attribute a row that was created without one. |
| No DB constraint | Per proposal decision #6 — application-level only | Partial unique index | Locked by the proposal. |

## Interfaces / Contracts

### `src/lib/db/tripRequest.ts` (new)

```ts
export const NON_TERMINAL_TRIP_STATUSES = [
  TripRequestStatus.DRAFT,
  TripRequestStatus.SAVED,
  TripRequestStatus.PENDING_PAYMENT,
] as const;

export type TripFamily = "journey" | "xsed";

/** Single source of the family boundary. Never inline `type === "xsed"`. */
export function tripFamilyOf(type: string | null | undefined): TripFamily;
/** Prisma `where.type` clause for a family. */
export function tripFamilyWhere(family: TripFamily): Prisma.StringFilter | string;
//   xsed → "xsed"   |   journey → { not: "xsed" }

export type ExpiryCandidate = {
  id: string;
  status: TripRequestStatus;
  payment?: { expiresAt: Date | null } | null;
};

/** PURE. True only when PENDING_PAYMENT and Payment.expiresAt is strictly in the past. */
export function isExpiredPendingPayment(trip: ExpiryCandidate, now?: Date): boolean;

/** Single-row path (payment-intent — trip already loaded with `include: { payment: true }`).
 *  Returns the EFFECTIVE status after any persisted revert. */
export function revertExpiredPendingPayment(
  trip: ExpiryCandidate, now?: Date,
): Promise<TripRequestStatus>;

/** List path (GET /api/trips). Owned rows only. Returns rows reverted. */
export function revertExpiredPendingPaymentsForUser(
  userId: string, now?: Date,
): Promise<number>;

/** Family-scoped active-row finder. */
export function findActiveTripRequest(
  userId: string, family: TripFamily,
): Promise<{ id: string; status: TripRequestStatus; tripperId: string | null } | null>;
```

Internal (not exported): `persistRevert(ids: string[])` →
`updateMany({ where: { id: { in: ids }, status: PENDING_PAYMENT }, data: { status: SAVED } })`, no-ops on an empty list. Both public revert functions call it — the only place that writes `SAVED`.

### `POST /api/trip-requests` — resolution order (replaces route.ts:265-367)

```
1. clientId = body.id
2. if clientId → owned = findFirst({ id: clientId, userId })          // ownership check preserved
     if owned  → PARTIAL UPDATE path (today's buildTripRequestPartialUpdate) → 200. DONE.
     else      → fall through (stale id)
3. family resolution:
     if !body.type → 404 { error: "Trip request not found" }          // stale id + partial body
     family = tripFamilyOf(body.type)
4. required-field validation (type, level, originCountry, originCity) → 400
5. fields = await buildTripRequestCreateFields(body, paxDetailsValue) // xsed dates + experienceId
6. active = await findActiveTripRequest(user.id, family)
     active → update({ where: { id: active.id }, data: {
                 ...fields,
                 tripperId: active.tripperId ?? resolvedTripperId,    // never clobber
               }})  → 200
     else   → create({ data: { userId: user.id, ...fields } })        → 201
7. if resulting row .type === "xsed" → revalidatePath(...) on all four xsed paths
     (today this fires on create only; a reused xsed row can change experienceId, so soldCount moves)
```

`buildTripRequestCreateFields` is a **pure extraction** of the existing lines 291-352 into a named async function — no behavior change to the field values themselves.

### `GET /api/trips` — delta (route.ts, after the user lookup at L38)

```ts
await revertExpiredPendingPaymentsForUser(user.id);   // before `where` is built and queried
```

### `POST /api/stripe/payment-intent` — delta (route.ts, between L53 and L55)

```ts
const effectiveStatus = await revertExpiredPendingPayment(trip);
// then the existing guard reads `effectiveStatus`, not `trip.status`:
if (!PAYABLE_STATUSES.includes(effectiveStatus as ...)) → 409
if (effectiveStatus !== "PENDING_PAYMENT") → update to PENDING_PAYMENT   // L65-70, unchanged shape
```

`trip` already carries `payment` via `include` (L44) — no extra query.

### `POST /api/stripe/payment-intent` — stale-intent amount guard (in scope)

**The bug.** Today the idempotency branch (route.ts:72-94) returns the existing PaymentIntent whenever `payment.status === "PENDING"`, `stripePaymentIntentId` is set, and Stripe reports `requires_payment_method | requires_confirmation | requires_action`. It never re-checks the amount. Before this change that was mostly harmless, because a `PENDING_PAYMENT` row's configuration was effectively frozen. Family-scoped reuse breaks that assumption: a user can rewrite an active row's configuration (different `pax`, `nights`, `level`, addons, filters) while its intent is still live — and then be charged the **old** amount for the **new** trip. Fixing it here is mandatory, not a follow-up.

**The fix — two mechanical moves.**

*Move 1 — hoist the amount computation.* Relocate the block currently at **L96-138** (`basePriceUsd` via `getPricePerPerson` → `addonsRaw` → `filters` → `logistics` → `calculatePaymentTotals` → `amountUsd` → the `!amountUsd || amountUsd <= 0` → 422 guard → `amountCents`) so it runs **immediately after** the `PENDING_PAYMENT` flip at L65-70 and **before** the idempotency branch. It is a pure computation over the already-loaded `trip` object plus two pure imports — no DB, no Stripe, no ordering dependency on anything below it — so hoisting is behavior-preserving for the fresh-intent path. Do **not** duplicate the computation into the branch: one `amountCents` serves both the comparison and the `paymentIntents.create` call at L141.

*Move 2 — compare, cancel, fall through.* Inside the idempotency branch, after `existing` is retrieved and its status is confirmed to be one of the three `requires_*` values:

```ts
// existing.amount is Stripe's integer-cent record of what the user would be
// charged. Compare against the freshly computed amountCents, NOT against
// trip.payment.amount (that is just whatever we wrote last attempt — circular,
// and a float in USD).
if (existing.amount === amountCents) {
  if (existing.client_secret) {
    return NextResponse.json({
      clientSecret: existing.client_secret,
      paymentIntentId: existing.id,
    });
  }
  // secret unavailable → fall through and create a fresh intent (today's behavior)
} else {
  // Configuration changed since this intent was created. Void it so the user
  // cannot complete a checkout for the stale price, then fall through to
  // create a fresh intent at the new amount.
  try {
    await stripe.paymentIntents.cancel(existing.id);
  } catch (cancelError) {
    // The intent moved on between retrieve and cancel (most likely it just
    // succeeded). Do NOT swallow-and-recreate — that is the double-charge path.
    console.error("Stale PaymentIntent cancel failed:", cancelError);
    return NextResponse.json(
      { error: "Payment already in progress, please retry" },
      { status: 409 },
    );
  }
}
```

Falling through reaches the existing `paymentIntents.create` (L141) with the new `amountCents`, and then `upsertPaymentForTripCheckout` (L159) — which upserts on the unique `tripRequestId` — overwrites `stripePaymentIntentId`, `amount`, and `expiresAt` on the same `Payment` row and resets it to `PENDING`. The DB converges with no extra work.

**Deliberate deviations from the surrounding file.**

| Point | Choice | Why |
|---|---|---|
| Cancel failure handling | Return **409**, do not fall through | The existing cancel at L173 uses `.catch(() => {})` because there the intent is provably unpaid and being abandoned. Here the retrieve said `requires_*` but the cancel failed, which most plausibly means the intent **succeeded** in between. Swallowing that and creating a second intent is a double-charge. 409 is safe and retryable — the webhook will have flipped the trip to `CONFIRMED` by the next attempt. |
| 422 guard moves earlier | Accepted behavior change | A trip whose amount can no longer be computed now 422s instead of returning a stale intent. That is strictly more correct: if we cannot price the current configuration, we cannot certify that the existing intent matches it. |
| Comparison operand | `existing.amount` (Stripe, integer cents) | Integer equality — no float tolerance needed. `amountCents` is already `Math.round(amountUsd * 100)`. |

### `POST /api/trips` — deletion

Re-confirmed during design with a repo-wide `rg "/api/trips"`: every caller is either `GET /api/trips` (`checkout/page.tsx:306`, `lib/utils/trips.ts:155,185`, `AccountSettingsPanel.tsx:181`) or the separate `/api/trips/[id]` route. No import, re-export, or test references `POST` from `src/app/api/trips/route.ts`. Only `docs/trip-authentication-implementation.md` mentions it — stale documentation, not a caller.

Delete lines **109-224** verbatim. Imports that become unused and must go with it: `normalizeJourneyFilterValue`, `normalizeMaxTravelTimeKey`, `normalizeTransportId` (the whole `@/lib/helpers/transport` import block, L8-12). Everything else at the top of the file is still used by `GET` — keep `NextRequest`/`NextResponse`, `getServerSession`, `TripRequestStatus` (type-only, L52), `authOptions`, `prisma`, `attachPaymentsToTrips`, `tripAccessWhere`/`tripRoleFor`, and the `DEFAULT_LIMIT`/`MAX_LIMIT` constants. `npm run lint` catches any miss.

### `scripts/cleanup-duplicate-trip-requests.ts` (new)

Follows `scripts/backfill-email-verified.ts` exactly: `import "dotenv/config"`, own `PrismaClient` + `PrismaPg` adapter, an **exported** async function taking an injectable minimal client so it is unit-testable without a database, and an `isMainModule` guard. Registered in `package.json` as `"db:cleanup-duplicate-trips": "npx tsx scripts/cleanup-duplicate-trip-requests.ts"` — matching the `db:backfill-*` precedent.

```ts
export async function cleanupDuplicateTripRequests(
  client = prisma,
  dryRun: boolean = !process.argv.includes("--apply"),   // DRY-RUN IS THE DEFAULT
): Promise<{ dryRun: boolean; groups: number; kept: string[]; cancelled: string[] }>;
```

Logic — one read, grouping in memory (the split is a JS predicate, not expressible as a single Prisma `groupBy` key):

1. `findMany({ where: { status: { in: NON_TERMINAL_TRIP_STATUSES } }, select: { id, userId, type, status, updatedAt }, orderBy: { updatedAt: "desc" } })`
2. Bucket by `` `${userId}::${tripFamilyOf(type)}` `` — **the same imported predicate the runtime uses**.
3. For each bucket with `length > 1`: head is the survivor (list is already `updatedAt desc`); the tail is the cancel set.
4. Log per group: `userId`, family, kept id, cancelled ids + their statuses.
5. Log the full cancelled-id list as one line — this **is** the backup the proposal's rollback plan requires (paste-able into a manual restore).
6. `dryRun` → return before writing, log `DRY RUN — no rows written. Re-run with --apply.`
7. Otherwise `updateMany({ where: { id: { in: cancelled }, status: { in: NON_TERMINAL_TRIP_STATUSES } }, data: { status: "CANCELLED" } })` — the status re-check guards against a row that reached `CONFIRMED` between the read and the write.

Idempotent: a second run finds ≤1 non-terminal row per bucket and cancels nothing. Gotcha to record in the script header: `updatedAt` is `@updatedAt`, so the write itself re-stamps the cancelled rows — the survivor selection **must** be computed from the pre-write snapshot (step 1), which it is.

## Data Flow

```
/journey (no tripRequestId)          xsed booking                 checkout partial
        │                                  │                             │
        └──────── POST /api/trip-requests ─┴─────────────────────────────┘
                      │
                      ├─ owned client id?  ── yes ─→ partial update (unchanged)
                      └─ no ─→ tripFamilyOf(type) ─→ findActiveTripRequest(userId, family)
                                                        ├─ hit  → update  (200)
                                                        └─ miss → create  (201)

GET /api/trips ──→ revertExpiredPendingPaymentsForUser(userId) ──→ findMany/count
POST /api/stripe/payment-intent ──→ revertExpiredPendingPayment(trip) ──→ payable guard

                    both ──→ isExpiredPendingPayment (pure) ──→ persistRevert (single writer)

scripts/cleanup-duplicate-trip-requests.ts ──→ tripFamilyOf + NON_TERMINAL_TRIP_STATUSES (same module)
```

## File Changes

| File | Action | Notes |
|---|---|---|
| `src/lib/db/tripRequest.ts` | Create | Family predicate, non-terminal set, active-row finder, expiry predicate + two revert entry points. |
| `src/lib/db/__tests__/tripRequest.test.ts` | Create | RED/GREEN for the pure predicates + mocked-Prisma tests for the reverts and the finder. |
| `src/app/api/trip-requests/route.ts` | Modify | Extract `buildTripRequestCreateFields`; replace the `if (id) … else create` branch with the 7-step resolution above. |
| `src/app/api/trip-requests/__tests__/route.test.ts` | Create | Upsert branching matrix (see Testing). |
| `src/app/api/trips/route.ts` | Modify | Add the bulk revert before the read; **delete** `POST` (L109-224) + the now-unused `@/lib/helpers/transport` import. |
| `src/app/api/trips/__tests__/route.test.ts` | Create | Asserts `POST` is no longer exported; asserts the revert runs before `findMany`. |
| `src/app/api/stripe/payment-intent/route.ts` | Modify | Call the single-row revert; guard reads `effectiveStatus`. **Plus** the stale-intent amount guard: hoist L96-138 above the idempotency branch, add the `existing.amount === amountCents` comparison + cancel-and-recreate. |
| `src/app/api/stripe/payment-intent/__tests__/route.test.ts` | Create | Expiry revert + the amount-guard matrix (see Testing). |
| `scripts/cleanup-duplicate-trip-requests.ts` | Create | One-off, dry-run by default, `--apply` to write. |
| `scripts/__tests__/cleanup-duplicate-trip-requests.test.ts` | Create | Grouping/survivor logic against an injected fake client. |
| `package.json` | Modify | `"db:cleanup-duplicate-trips"` script entry. |
| `prisma/schema.prisma` | **No change** | Explicitly no migration (proposal decision #4/#6). |
| `docs/trip-authentication-implementation.md` | Optional | Documents the deleted `POST /api/trips` (L134, L266, L403-404, L472). Stale either way; sdd-tasks may drop the section. |

## Testing Strategy

Strict TDD is active (`vitest run`, happy-dom, `globals: true`). Route tests follow the established `vi.mock("@/lib/prisma")` + dynamic `await import("../route")` pattern from `src/app/api/trips/[id]/__tests__/route.test.ts`.

| Layer | What | Approach |
|---|---|---|
| Unit (no mocks) | `tripFamilyOf`: `"xsed"`→xsed; `"family"`, `"couple"`, `"solo"`, `""`, `undefined`→journey. `isExpiredPendingPayment`: expired / not-yet-expired / `expiresAt: null` / no payment row / status ≠ `PENDING_PAYMENT` (all false but the first). Boundary: `expiresAt === now` is **not** expired. | Inject a fixed `now`; never `Date.now()` in a test. |
| Unit (mocked Prisma) | `revertExpiredPendingPayment` writes exactly once when expired and **not at all** otherwise, and returns the effective status. `revertExpiredPendingPaymentsForUser` skips `updateMany` when `findMany` is empty. `findActiveTripRequest` passes `type: { not: "xsed" }` for journey and `orderBy: { updatedAt: "desc" }`. | Assert on the `where`/`data` objects, not just call counts. |
| Integration — upsert matrix | (a) no id + no existing row → `create`, 201; (b) no id + existing journey row → `update` that row, 201→**200**, `create` never called; (c) no id, journey body, only an xsed row exists → `create` (families independent); (d) same, inverted; (e) valid owned id → partial update, `findActiveTripRequest` never called; (f) stale id + full body → falls through to family resolution; (g) stale id + partial body (no `type`) → 404; (h) reuse preserves a non-null `tripperId`; (i) `type: "family"` classifies as **journey**, not a separate slot. | Mocked Prisma route tests. (i) is the regression test for the naming collision. |
| Integration — routes | `GET /api/trips` calls the revert before `findMany`; `payment-intent` returns 200 for an expired `PENDING_PAYMENT` and 409 for `CONFIRMED`. `import * as trips from "../route"` → `expect(trips).not.toHaveProperty("POST")`. | Mocked Prisma + mocked `@/lib/stripe`. |
| Integration — stale-intent amount guard | (a) `existing.amount === amountCents` → returns the existing `clientSecret`, `paymentIntents.cancel` and `paymentIntents.create` both **never** called; (b) `existing.amount !== amountCents` → `cancel(existing.id)` called exactly once **then** `create` called once with the new `amountCents`, and the response carries the NEW `paymentIntentId`; (c) `cancel` rejects → **409**, `create` never called (the double-charge regression test); (d) amounts match but `client_secret` is null → falls through to `create` (today's behavior preserved); (e) an unpriceable trip (`amountUsd <= 0`) with a live matching intent → **422**, `retrieve`-then-return no longer happens (documented behavior change). | Mock `@/lib/stripe` with `paymentIntents.{retrieve,create,cancel}` as `vi.fn()`; assert on call order via `mock.invocationCallOrder` for (b). |
| Unit — cleanup script | Injected fake client: 3 journey + 2 xsed rows for one user → keeps the newest of each, cancels 3. Single-row buckets untouched. Terminal-status rows never selected. Dry-run returns the plan and calls **no** `updateMany`. | Same injectable-client pattern as `backfillEmailVerified`. |
| Manual | Two-tab journey (no `tripRequestId`) → one row. Journey draft + xsed booking coexist. 24h-expired `PENDING_PAYMENT` → `SAVED` on dashboard load. Dry-run then `--apply` against a DB copy. | Plus `npm run typecheck` + `npm run lint`. |

## Migration / Rollout

No Prisma migration. Order: (1) merge code — the runtime invariant starts holding for all new writes; (2) run `npm run db:cleanup-duplicate-trips` (dry run) and eyeball the cancelled-id list; (3) re-run with `--apply`. Steps 2-3 can lag step 1 safely — pre-existing duplicates stay visible but stop multiplying.

Rollback: revert the commits. Rows the cleanup set to `CANCELLED` and rows the helper flipped to `SAVED` are **not** auto-restored — the dry-run log's id list is the restore input (`updateMany` back to `SAVED`; the original `DRAFT`/`PENDING_PAYMENT` distinction is logged per row).

## Resolved In Scope

- [x] **Live-checkout reuse / stale-amount charge — RESOLVED, fixed in this change.** Decision #1 puts `PENDING_PAYMENT` in the non-terminal set, so a second tab starting a fresh journey reuses a row that may hold an *unexpired* Stripe PaymentIntent and overwrites its configuration. Combined with the amount-blind idempotency branch at `payment-intent/route.ts:72-94`, the user could pay the old price for the new trip. **Decision: fix it here, not in a follow-up.** The stale-intent amount guard (hoisted amount computation + `existing.amount === amountCents` comparison + cancel-and-recreate, with a 409 on cancel failure) is specified in *Interfaces / Contracts* and covered by test matrix rows (a)-(e). The rejected alternative — excluding unexpired `PENDING_PAYMENT` rows from `findActiveTripRequest` — was dropped because it leaves a second active row that never self-heals, directly violating proposal decision #1.

## Open Questions

- [ ] `docs/trip-authentication-implementation.md` still documents `POST /api/trips`. Update in this change or leave the doc stale?
- [ ] Script name: `db:cleanup-duplicate-trips` matches the `db:*` precedent but this is a one-off, not a backfill. Accept, or prefix `db:oneoff-`?
