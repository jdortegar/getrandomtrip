# Tasks: Single Active Trip Request

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | ~1750 (5 files touched/created + 5 new test files + package.json) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|---|---|---|---|
| 1 | Shared helper `src/lib/db/tripRequest.ts` + tests | PR 1 | ~400 lines. Base: main/tracker. Blocks 2-5. |
| 2 | Family-scoped upsert in `trip-requests/route.ts` + tests | PR 2 | ~390 lines. Imports `tripFamilyOf`/`findActiveTripRequest` from Unit 1 — author in parallel with PR 1, but base/rebase onto PR 1 before review. |
| 3 | `trips/route.ts`: delete `POST`, wire bulk revert + tests | PR 3 | ~325 lines. Base: PR 1 (needs `revertExpiredPendingPaymentsForUser`). Deletion sub-part is independent but lands in the same file. |
| 4 | `payment-intent/route.ts`: revert wiring + stale-intent amount guard + tests | PR 4 | ~400 lines. Base: PR 1 (needs `revertExpiredPendingPayment`). |
| 5 | Cleanup script + tests + `package.json` entry | PR 5 | ~265 lines. Base: PR 1 (reuses predicates); sequence after PR 2 so "active row" is defined identically before scripting cleanup. |

## Phase 1: Foundation — Shared Helper (PR 1)

- [x] 1.1 RED: `src/lib/db/__tests__/tripRequest.test.ts` — `tripFamilyOf` cases (xsed/journey/`"family"`/empty/undefined).
- [x] 1.2 RED: same file — `isExpiredPendingPayment` cases (expired, not-yet, `expiresAt: null`, no payment, wrong status, `expiresAt === now`).
- [x] 1.3 GREEN: `src/lib/db/tripRequest.ts` — `tripFamilyOf`, `tripFamilyWhere`, `isExpiredPendingPayment`, `NON_TERMINAL_TRIP_STATUSES`.
- [x] 1.4 RED: mocked-Prisma tests — `findActiveTripRequest` where/orderBy shape; `revertExpiredPendingPayment` write-once + returns effective status; `revertExpiredPendingPaymentsForUser` skip-when-empty.
- [x] 1.5 GREEN: implement `findActiveTripRequest`, internal `persistRevert`, `revertExpiredPendingPayment`, `revertExpiredPendingPaymentsForUser`.

## Phase 2: Family-Scoped Upsert (PR 2)

- [x] 2.1 RED: `src/app/api/trip-requests/__tests__/route.test.ts` — matrix (a)-(i) per design Testing Strategy (create/update branching, cross-family, stale-id, tripperId preservation, `"family"` regression).
- [x] 2.2 GREEN: extract `buildTripRequestCreateFields` from existing create block (route.ts:291-352).
- [x] 2.3 GREEN: replace create/update branch with 7-step resolution (design "resolution order"), using Unit 1's `tripFamilyOf`/`findActiveTripRequest`.
- [x] 2.4 GREEN: preserve xsed `revalidatePath` calls on both create and reused-row paths.

## Phase 3: Trips Route Cleanup (PR 3)

- [x] 3.1 RED: `src/app/api/trips/__tests__/route.test.ts` — `import * as trips` has no `POST`; revert runs before `findMany`.
- [x] 3.2 GREEN: add `revertExpiredPendingPaymentsForUser(user.id)` before the `where`/query in `GET`.
- [x] 3.3 GREEN: delete `POST` (lines 109-224) and the now-unused `@/lib/helpers/transport` import block.
- [x] 3.4 Verify: repo-wide search confirms no remaining import/call of the removed `POST`. Only `docs/trip-authentication-implementation.md` still mentions it (stale doc, not a caller) — left as-is per design's "Optional" note; flagged in apply-progress risks.

## Phase 4: Payment-Intent Stale-Amount Guard (PR 4)

- [x] 4.1 RED: `src/app/api/stripe/payment-intent/__tests__/route.test.ts` — expiry-revert case (200 for expired `PENDING_PAYMENT`, 409 for `CONFIRMED`).
- [x] 4.2 GREEN: call `revertExpiredPendingPayment(trip)`; guard reads `effectiveStatus`.
- [x] 4.3 RED: amount-guard matrix (a)-(e) — match reuses intent; mismatch cancels+creates with new id; cancel-failure → 409; null-secret fallthrough; unpriceable → 422 pre-idempotency.
- [x] 4.4 GREEN: hoist amount computation (L96-138) above the idempotency branch; add `existing.amount === amountCents` compare, cancel-and-recreate on mismatch.

## Phase 5: Historical Cleanup Script (PR 5)

- [x] 5.1 RED: `scripts/__tests__/cleanup-duplicate-trip-requests.test.ts` — 3+2 rows collapse per family; single-row untouched; terminal rows excluded; dry-run performs no writes.
- [x] 5.2 GREEN: `scripts/cleanup-duplicate-trip-requests.ts` following `backfill-email-verified.ts` pattern; import `tripFamilyOf`/`NON_TERMINAL_TRIP_STATUSES` from Unit 1; dry-run default, `--apply` to write.
- [x] 5.3 Register `"db:cleanup-duplicate-trips"` in `package.json`.

## Phase 6: Wrap-up

- [x] 6.1 `npm run typecheck` clean across all five units; full `vitest run` suite green (111 files / 856 tests). `npm run lint` blocked by a pre-existing repo issue (Next.js 16 `next lint` removed the command; direct `eslint` run also fails with a circular-JSON error in `eslint-config-next`/`eslint.config.mjs` even on untouched files) — not introduced by this change, flagged for the user/verify phase.
- [x] 6.2 Manual QA: two-tab journey dedup, journey+xsed coexistence, 24h-expired dashboard revert, dry-run then `--apply` against a DB copy. PASSED — verified against live dev DB/browser session.
