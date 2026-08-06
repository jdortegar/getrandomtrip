# Verify Report: single-active-trip-request

**Date**: 2026-08-06
**Mode**: Strict TDD (vitest run) — enforced per orchestrator instruction
**Artifact store**: openspec

## Completeness

| Phase task group | Status |
|---|---|
| Phase 1 — Shared helper (1.1-1.5) | Done, verified against code |
| Phase 2 — Family-scoped upsert (2.1-2.4) | Done, verified against code |
| Phase 3 — Trips route cleanup (3.1-3.4) | Done, verified against code |
| Phase 4 — Payment-intent stale-amount guard (4.1-4.4) | Done, verified against code |
| Phase 5 — Historical cleanup script (5.1-5.3) | Done, verified against code |
| Phase 6.1 — typecheck + full suite | Done, re-executed and confirmed |
| Phase 6.2 — Manual QA | **Not done** — requires live dev DB/browser session, correctly out of scope for automated apply/verify |

**39/40 tasks complete** (matches apply-progress claim).

## Test Execution (re-run by verify, not trusted from report)

```
npx vitest run
Test Files  111 passed (111)
     Tests  856 passed (856)
```

```
npm run typecheck
tsc -p tsconfig.json --noEmit   → clean, no output, exit 0
```

Matches apply-progress's claimed numbers exactly. Zero regressions.

## Lint Claim — Independently Verified

Claim: `npm run lint` fails due to a pre-existing Next 16 / eslint 8.57 incompatibility, unrelated to this change.

**Verification performed**: `git stash -u` to restore the working tree to clean `HEAD` (commit `f0b39a84`, before any file from this change existed), then:
- `npm run lint` → `Invalid project directory provided, no such directory: .../lint` (same failure, `next lint` is broken as a command on Next 16.2.6)
- `npx eslint src/lib/prisma.ts` (untouched file, unrelated to this change) → `TypeError: Converting circular structure to JSON` inside `@eslint/eslintrc`, same stack trace as reported

**Conclusion: claim CONFIRMED.** The lint failure pre-dates this change and reproduces identically on clean `HEAD` against a file this change never touched. Working tree was restored (`git stash pop`) after the test; `git status` confirms all this change's files are back and no other changes were introduced.

## Spec Compliance Matrix

| Requirement | Scenario | Status | Evidence |
|---|---|---|---|
| Family Classification | Journey sub-type switch stays in family | ✅ PASS | `tripRequest.test.ts` (`tripFamilyOf` cases) + `route.test.ts` test (b) — SAVED journey row with `type: "couple"` reused when body sends `type: "solo"` |
| Family Classification | Xsed/journey independent finders | ✅ PASS | `route.test.ts` tests (c)/(d) assert distinct `where.type` shape per family |
| Family-Scoped Single-Active-Trip Upsert | Repeated journey entry without id updates same row | ✅ PASS | `route.test.ts` test (b) |
| Family-Scoped Single-Active-Trip Upsert | Journey and xsed coexist | ✅ PASS | `route.test.ts` tests (c)/(d) via `tripFamilyWhere` scoping |
| Family-Scoped Single-Active-Trip Upsert | First request for family creates | ✅ PASS | `route.test.ts` test (a) |
| Family-Scoped Single-Active-Trip Upsert | Client-supplied id updates directly | ✅ PASS | `route.test.ts` test (e) — code path returns before family resolution (route.ts:358-379) |
| Family-Scoped Single-Active-Trip Upsert | Terminal rows don't block new slot | ✅ PASS (by construction) | `findActiveTripRequest` query scoped to `NON_TERMINAL_TRIP_STATUSES`, unit-tested in `tripRequest.test.ts` |
| Persisted Expiry-Revert | GET /api/trips reverts and persists | ✅ PASS | `trips/route.test.ts` — revert called before `findMany`, invocation-order assertion |
| Persisted Expiry-Revert | Payment-intent guard reverts before payability check | ✅ PASS | `payment-intent/route.test.ts` — `revertExpiredPendingPayment` called, `effectiveStatus` drives the guard (route.ts:59-71) |
| Persisted Expiry-Revert | Non-expired left untouched | ✅ PASS | `tripRequest.test.ts` — `revertExpiredPendingPayment` "does not write... when not expired" |
| Persisted Expiry-Revert | Revert visible to other readers without their own check | ✅ PASS (by design) | Single `persistRevert` writer, no per-reader logic duplication — confirmed by code read |
| Reused PaymentIntent Amount Revalidation | Mismatch cancels+recreates | ✅ PASS | `payment-intent/route.test.ts` test (b), call-order assertion `cancelOrder < createOrder` |
| Reused PaymentIntent Amount Revalidation | Match reuses unchanged | ✅ PASS | `payment-intent/route.test.ts` test (a) — cancel/create both asserted never called |
| Reused PaymentIntent Amount Revalidation (extra, design-specified) | Cancel failure → 409, no double-charge | ✅ PASS | `payment-intent/route.test.ts` test (c) — **verified directly in route.ts:154-169**: cancel is attempted, `catch` block returns 409 immediately, never falls through to `paymentIntents.create` |
| Removal of Unused Trips-Creation Endpoint | GET still works | ✅ PASS | `trips/route.test.ts` |
| Removal of Unused Trips-Creation Endpoint | No caller of removed POST | ✅ PASS | `trips/route.test.ts` asserts `not.toHaveProperty("POST")`; repo-wide `rg` for `/api/trips` callers confirms all remaining references are `GET`-only (`lib/utils/trips.ts`, `checkout/page.tsx`, `AccountSettingsPanel.tsx`) |
| Historical Duplicate Cleanup Script | 3-row collapse to 1 | ✅ PASS | `cleanup-duplicate-trip-requests.test.ts` |
| Historical Duplicate Cleanup Script | Families cleaned independently | ✅ PASS | same file |
| Historical Duplicate Cleanup Script | Single row untouched | ✅ PASS | same file |

## High-Risk Items — Direct Code Read Verification

### 1. Family scoping correctness (src/app/api/trip-requests/route.ts)

Confirmed via direct read (lines 354-439): `tripFamilyOf(type)` classifies by `type === "xsed"` vs everything else; `findActiveTripRequest(user.id, family)` scopes the `where.type` clause via `tripFamilyWhere`. Switching sub-type (`couple` → `solo`) keeps `family = "journey"` in both cases, so the same active row is found and updated — confirmed both by code read and by test (b)/(h)/(i).

**Gap found (WARNING, not CRITICAL)**: the spec's Family Classification requirement states the family predicate "MUST be centralized in a single shared helper — no inline re-implementation elsewhere." Two spots in `trip-requests/route.ts` still inline `type === "xsed"` rather than routing through `tripFamilyOf`:
- Line 191 (`buildTripRequestCreateFields`, xsed canonical-date resolution)
- Line 445 (xsed `revalidatePath` trigger)

Both produce today's identical result to `tripFamilyOf(type) === "xsed"` and are functionally harmless — no bug. But this is a literal violation of the spec's "no inline re-implementation elsewhere" wording, and it is not new drift introduced by apply: `buildTripRequestCreateFields` is a design-confirmed "pure extraction" of pre-existing lines 291-352 (unchanged logic), and design.md's own step-7 pseudocode for the resolution order literally writes `if resulting row .type === "xsed"` rather than calling the helper. So this gap was baked into design.md itself, not an apply-phase deviation. Flagging because a strict reading of the spec requirement is not fully met by the code, even though the implementation matches the design document exactly.

### 2. Stale-intent amount guard (src/app/api/stripe/payment-intent/route.ts)

Confirmed via direct read (lines 80-172):
- Amount computation (`basePriceUsd` → `totals` → `amountUsd` → 422 guard → `amountCents`) is hoisted and runs **before** the idempotency branch (lines 80-126), exactly as design specifies.
- Idempotency branch (lines 133-172): `existing.amount === amountCents` reuses unchanged; on mismatch, `stripe.paymentIntents.cancel(existing.id)` is called and **awaited before** any fall-through to `paymentIntents.create` (line 175, outside and after the `if/else` block).
- Cancel failure path (lines 154-169): the `catch` block logs and **returns 409 immediately** — it does not fall through, does not swallow-and-recreate. This is the double-charge guard specified in design, and it is implemented exactly as specified.

Test evidence: `payment-intent/route.test.ts` test (b) asserts `cancelOrder < createOrder` via `mock.invocationCallOrder`; test (c) asserts 409 + `create` never called on cancel rejection. Both re-run and passing.

**No issues found on this requirement — highest-risk item is correctly implemented and tested.**

## TDD Compliance

| Check | Result | Details |
|---|---|---|
| TDD Evidence reported | ✅ | Full "TDD Cycle Evidence" table present in apply-progress.md |
| All tasks have tests | ✅ | 40/40 task rows map to a test file; only 6.2 (manual QA) has no automatable test, correctly so |
| RED confirmed (test files exist) | ✅ | All 6 test files verified present and readable |
| GREEN confirmed (tests pass) | ✅ | 856/856 passing on independent re-run |
| Triangulation adequate | ✅ | Every behavior has ≥2 distinct-value test cases; `isExpiredPendingPayment` covers 6 cases including the `expiresAt === now` boundary |
| Safety Net for modified files | ✅ | Pre-existing `trip-requests/__tests__/route.test.ts` GET tests (3) preserved and still passing unmodified |

**TDD Compliance**: 6/6 checks passed

### Test Layer Distribution
| Layer | Tests | Files |
|---|---|---|
| Unit (pure + mocked Prisma) | 29 | `tripRequest.test.ts` (22), cleanup script test (7) |
| Integration (mocked Prisma/Stripe) | 26 | `trip-requests/route.test.ts` (11 new POST), `trips/route.test.ts` (3), `payment-intent/route.test.ts` (9 — but see note below) |
| E2E | 0 | none (not required per design) |

**Minor reporting discrepancy (WARNING, low severity)**: apply-progress's "Files Changed" table states "Added 14 POST tests" for `trip-requests/__tests__/route.test.ts`. Direct count of the file shows 14 total `it(...)` blocks, of which **3 are the pre-existing GET tests** carried over unmodified — actual new POST-specific tests are **11**, not 14. This does not affect the 856-total pass count (which is correct) or any spec-compliance conclusion; it's a bookkeeping inaccuracy in the apply-progress narrative, worth a note for report-hygiene but not a code defect.

### Assertion Quality
No tautologies, no ghost loops (no `for`/`forEach` over query results), no assertion-without-production-call, no smoke-test-only patterns found across all 6 test files read. Mock/assertion ratios are within bounds (payment-intent test file: ~7 mocks, 25+ assertions across 7 tests). All test cases assert distinct, differentiated expected values (e.g. `amount: 20000` vs `15000`, `dryRun: true` vs `false`, `status: 200/404/409/422`).

**Assertion quality**: ✅ All assertions verify real behavior — 0 CRITICAL, 0 WARNING

## Design Coherence

Implementation matches design.md's Architecture Decisions table and Interfaces/Contracts section exactly, confirmed by direct code read of `src/lib/db/tripRequest.ts`, `trip-requests/route.ts`, `trips/route.ts`, `payment-intent/route.ts`, and `cleanup-duplicate-trip-requests.ts`. No unreported deviations found beyond the one apply-progress already disclosed (the `select` shape for `revertExpiredPendingPaymentsForUser`'s `findMany`, an implementation detail within the design's stated contract).

## Issues

### CRITICAL
None.

### WARNING
1. **Family predicate not fully centralized** (spec wording gap, not a functional bug) — two inline `type === "xsed"` checks remain in `trip-requests/route.ts` (lines 191, 445) instead of routing through `tripFamilyOf`. Functionally identical result today; baked into design.md's own pseudocode, not an apply-phase deviation. Low risk of drift since both spots are adjacent to the same file that also imports `tripFamilyOf`.
2. **Apply-progress test-count inaccuracy** — claims "14 POST tests added"; actual new POST tests are 11 (14 total `it()` blocks in the file including 3 preserved pre-existing GET tests). Does not affect pass/fail conclusions.
3. **Task 6.2 (manual QA) not run** — correctly deferred (requires live dev DB/browser session), explicitly documented in tasks.md and apply-progress.md. Should be completed by a human before merge; does not block archive of the automated portion but should gate the actual merge/deploy decision.

### SUGGESTION
1. `docs/trip-authentication-implementation.md` still documents the deleted `POST /api/trips` (per design's own "Optional" note, left as-is) — low-priority doc cleanup, no code risk.
2. Review workload: total diff (excluding openspec docs) is git-diff 541 lines + ~1088 lines of new files ≈ 1629 lines, confirming tasks.md's "High" 400-line-budget-risk forecast. This was already explicitly resolved via user-confirmed `size:exception` in apply-progress — no action needed here, noted for completeness.
3. Pre-existing repo-wide lint tooling breakage (Next 16 / eslint 8.57 / eslint-config-next incompatibility) should be tracked as its own fix separate from this change — confirmed unrelated but blocks CI-lint gating for every PR until fixed.

## Verdict

**PASS WITH WARNINGS**

Rationale: 0 CRITICAL issues. All 6 spec requirements have passing, real (non-trivial) covering tests, re-executed independently (856/856). Both explicitly flagged high-risk implementation points (family scoping, stale-intent amount guard with cancel-before-create-and-409-on-cancel-failure) were verified against actual current file content, not assumed from prior context, and match the design exactly. The lint-failure claim was independently reproduced on clean `HEAD` and confirmed pre-existing. Remaining WARNINGs are non-blocking: one is a strict-wording spec/design gap baked in from design phase (functionally harmless), one is a reporting-accuracy nit in apply-progress, and one is explicitly-deferred manual QA that requires human/live-environment execution.
