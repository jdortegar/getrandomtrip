# Proposal: Single Active Trip Request

## Intent

`POST /api/trip-requests` only updates when the body carries an `id` (sourced from the `tripRequestId` query param, `src/lib/helpers/journey.ts:154-158`); otherwise it always `create`s (`src/app/api/trip-requests/route.ts:265-358`). A fresh `/journey` entry — new tab, shared link, or `handleClearAll` in `JourneyMainContent.tsx:528` — has no `id`, so every abandoned configuration leaves a new row. Nothing in `prisma/schema.prisma:94-165` prevents it. Users accumulate `DRAFT`/`SAVED`/`PENDING_PAYMENT` rows that all surface in the traveler dashboard.

This just got worse: `src/app/api/stripe/payment-intent/route.ts:65-70` now flips trips to `PENDING_PAYMENT` before creating the intent, so abandoned Stripe checkouts strand rows in a state that previously never persisted.

Goal: at most **one** non-terminal `TripRequest` per user per product family, and no permanently stuck `PENDING_PAYMENT`.

## Decision Log

All decisions below were resolved in a live grill-me session and are **final** for this change.

| # | Decision |
|---|----------|
| 1 | One active (`DRAFT`/`SAVED`/`PENDING_PAYMENT`) trip per user **per family**: journey (`type !== "xsed"`) and xsed (`type === "xsed"`) are independent slots and must not overwrite each other. Journey sub-type switches (couple → solo) reuse the same row. |
| 2 | Enforcement is server-side in `POST /api/trip-requests`: `findFirst` on `userId` + family + non-terminal status, then `update`; `create` only when none exists. Client-supplied `id` is still honored when it resolves to a row owned by the user (preserve current ownership check), but is **not** the source of truth. |
| 3 | Expired `PENDING_PAYMENT` reverts to `SAVED`, not `CANCELLED` — the configuration is still valid and resumable. Same row, so no new slot is consumed. |
| 4 | No new column. Expiry derives from the existing `Payment.expiresAt` (24h, set in `upsertPaymentForTripCheckout`, used at `payment-intent/route.ts:166`) via the 1:1 `Payment.tripRequestId @unique` relation (`schema.prisma:288`). |
| 5 | Lazy check-on-read **but persisted**: the first touchpoint that detects an expired `PENDING_PAYMENT` issues a real `tripRequest.update` to `SAVED`. Touchpoints: `GET /api/trips` and the payable-status guard in `POST /api/stripe/payment-intent` (`route.ts:55-63`). Logic lives in **one shared helper** (e.g. `src/lib/db/tripRequest.ts`) — no duplication. Follows the existing lazy-expiry pattern of `verificationTokens.ts` / `tripperInviteTokens.ts`. |
| 6 | **No** partial unique index / DB constraint. Application-level `findFirst` + `update`/`create` is accepted; the near-simultaneous double-submit race is accepted risk. |
| 7 | Historical cleanup is a **one-off script** (`npx tsx`), not a scheduled function: per `userId` + family with >1 non-terminal row, keep the newest by `updatedAt` and set the rest to `CANCELLED`. The repo's `netlify/functions/*` + `/api/internal/*` cron pattern is deliberately not used. |
| 8 | Backend only. No traveler-dashboard UI work. |
| 9 | Delete the unused `POST` handler in `src/app/api/trips/route.ts` as part of this change (added after the proposal's verification pass surfaced it — see In Scope). |

## Scope

### In Scope

- Family-scoped upsert in `POST /api/trip-requests`
- Shared expiry helper reverting expired `PENDING_PAYMENT` → `SAVED`, called from `GET /api/trips` and `POST /api/stripe/payment-intent`
- One-off cleanup script for pre-existing duplicate non-terminal rows
- Delete the unused `POST` handler in `src/app/api/trips/route.ts` (lines ~110-224) — dead code with an ownership-check gap and references to non-existent Prisma fields, discovered during this proposal's verification pass. Confirm no other route file re-exports or imports this handler before deleting; keep the `GET` handler in the same file untouched.
- Vitest coverage for all three behaviors (RED/GREEN — strict TDD is active)

### Out of Scope

- Any traveler-dashboard UI: resume-checkout CTA, filtering `CANCELLED`, badge changes (deliberately a later change)
- New Prisma column or migration for `expiresAt` on `TripRequest`
- Cron / scheduled function for expiry or cleanup
- DB-level unique constraints
- Admin dashboard changes

## Capabilities

### New Capabilities

- None

### Modified Capabilities

- None at spec-file level (`openspec/specs/` has no trip-request capability today) — this change writes its own delta spec.

## Approach

Introduce a single helper module owning both rules: family classification (`isXsedFamily(type)`), the non-terminal status set, `findActiveTripRequest(userId, family)`, and `revertIfPaymentExpired(trip)`. `POST /api/trip-requests` calls the finder before branching to create. Both read touchpoints call the expiry revert, which persists on detection so every other reader (admin dashboard included) sees the corrected status without needing its own check. Cleanup script reuses the same family/status predicates so production data converges on the same invariant the runtime now enforces.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/db/tripRequest.ts` (or similar) | New | Family predicate, active-trip finder, expiry revert |
| `src/app/api/trip-requests/route.ts` | Modified | Family-scoped upsert before `create` |
| `src/app/api/trips/route.ts` | Modified | Call expiry revert on `GET`; **delete** the unused `POST` handler |
| `src/app/api/stripe/payment-intent/route.ts` | Modified | Call expiry revert before payable guard |
| `scripts/` (one-off) | New | Historical duplicate cleanup |
| `prisma/schema.prisma` | Unchanged | Explicitly no migration |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Double-submit race creates two rows (no DB constraint — decision #6) | Low | Accepted; cleanup script can be re-run if observed |
| Deleting `POST /api/trips` breaks an unknown caller | Low | `rg` over the repo found only `GET` fetches (`checkout/page.tsx:306`, `lib/utils/trips.ts:155,185`, `AccountSettingsPanel.tsx:181`) and no import/re-export of the handler; re-confirm at apply time |
| Cleanup script cancels a row a user still considers active | Low | Keep newest `updatedAt`; dry-run mode + row count report before write |
| Family boundary drifts if a new `type` is added | Low | Centralize the predicate in the shared helper, never inline |
| Expiry revert on `GET /api/trips` adds writes to a read path | Low | Only writes when an expired row is actually found |

## Rollback Plan

Revert the change commits — no schema migration to undo. Data effects are recoverable in principle but not automatically: rows the cleanup script set to `CANCELLED` and rows the expiry helper flipped `PENDING_PAYMENT` → `SAVED` stay as-is after revert. Run the cleanup script with a dry-run/backup of affected ids first so a manual restore is possible.

## Dependencies

- Requires the already-landed `PENDING_PAYMENT` transition in `src/app/api/stripe/payment-intent/route.ts:65-70`
- Vitest + happy-dom (strict TDD active) — spec/design/tasks must plan RED/GREEN tests for the family-scoped upsert, the expiry revert, and ideally the cleanup script

## Success Criteria

- [ ] Repeated `/journey` entries without `tripRequestId` update one row instead of creating new ones
- [ ] An in-progress journey draft and an xsed booking coexist as two separate rows
- [ ] A `PENDING_PAYMENT` trip whose `Payment.expiresAt` has passed is persisted back to `SAVED` on the next `GET /api/trips` or payment-intent request
- [ ] Cleanup script leaves exactly one non-terminal row per user per family
- [ ] `POST /api/trips` no longer exists; `GET /api/trips` still works
- [ ] No Prisma migration in the diff
- [ ] `npm run typecheck`, `npm run lint`, and the vitest suite pass
