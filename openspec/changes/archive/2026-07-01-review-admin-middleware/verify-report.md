# Verification Report: review-admin-middleware

**Change**: review-admin-middleware
**Date**: 2026-07-01 (re-verify run)
**Mode**: openspec
**Verdict**: FAIL
**Typecheck**: 0 errors
**Test Results**: 173 passed, 8 failed (2 residual NEW failures from this change; 6 pre-existing)

> **Re-verify note (2026-07-01):** C1 is fully resolved. C2 is partially resolved — 3/5 previously-failing tests now pass; 2 remain (see updated C2 below). Overall test count improved from 170/11 → 173/8.

---

## Task Completeness

| Phase | Tasks | Complete |
|-------|-------|----------|
| Phase 1: Schema & Enum | 3 | 3/3 |
| Phase 2: Email Template | 2 | 2/2 |
| Phase 3: API — Review Submission (admin notification) | 1 | 1/1 |
| Phase 4: API — Admin Reviews (isPublic removed, tripper notification) | 4 | 4/4 |
| Phase 5: API — Tripper Publish Endpoint (new) | 4 | 4/4 |
| Phase 6: Data Layer — getTripperReviews() | 3 | 3/3 |
| Phase 7: Tripper Dashboard UI | 2 | 2/2 |
| Phase 8: Admin Dashboard UI | 2 | 2/2 |
| Phase 9: Client Reviews Page | 3 | 3/3 ✅ |
| Phase 10: Final Verification | 7 | 6/7 ⚠️ |
| **Total** | **31** | **29/31** |

---

## Spec Compliance Matrix

### Domain 1 — Admin Notification on Review Submission

| Scenario | Status | Evidence |
|----------|--------|----------|
| 1.1 — Admin notified on new review | COMPLIANT | `route.ts:127-138` — `tx.notification.createMany` creates a record for every admin with `type: REVIEW_SUBMITTED`, `audience: ADMIN`, `isRead: false` |
| 1.2 — Notification includes tripper name | COMPLIANT | `route.ts:95-97` — `notificationTitle = "Nueva reseña para ${tripper.name}"` when tripper found |
| 1.3 — Notification for RandomTrip | COMPLIANT | `route.ts:97` — falls back to `"Nueva reseña (RandomTrip)"` when `effectiveTripperId` is null |
| 1.4 — Notification created atomically with review | COMPLIANT | `route.ts:106-139` — review creation + TripRequest update + notification all inside `prisma.$transaction` |

No automated test coverage for Domain 1 scenarios — existing tests fail before reaching the notification path due to residual mock issue (see C2).

### Domain 2 — Admin Review Moderation (isApproved only)

| Scenario | Status | Evidence |
|----------|--------|----------|
| 2.1 — Admin approves review | COMPLIANT | `admin/reviews/[id]/route.ts:60-73` — `isApproved` accepted and applied via `prisma.review.update` |
| 2.2 — Admin cannot set isPublic (tripper reviews) | COMPLIANT* | `route.ts:53-58` — returns HTTP 403 if `isPublic` is boolean and `existing.tripperId !== null`. Spec says "ignored or HTTP 400"; 403 is stricter but acceptable. See WARNING W1. |
| 2.3 — Admin un-approves review | COMPLIANT | `route.ts:60-73` — `isApproved: false` applied; `getTripperReviews` filters `isApproved: true`, so review disappears from tripper dashboard |
| 2.4 — isPublic readable in admin list | COMPLIANT | `AdminReviewsPageClient.tsx:138-142` — renders `"approved · public"` or `"approved · private"` as a read-only badge in the status column |

Note: Admin UI also conditionally exposes an `isPublic` action button for platform reviews (`tripperName === null`, line 173). This is logically consistent with the ownership model (no tripper exists to own it) but deviates from the literal spec text in Requirement 2. See WARNING W2.

### Domain 3 — Tripper Notification on Approval

| Scenario | Status | Evidence |
|----------|--------|----------|
| 3.1 — Tripper notified on approval | COMPLIANT | `route.ts:76-93` — `wasJustApproved` guard; creates `REVIEW_APPROVED` notification and calls `sendReviewApprovedForTripper` fire-and-forget |
| 3.2 — No notification for RandomTrip review | COMPLIANT | `route.ts:77` — guard `review.tripperId` is truthy; skips entire block if null |
| 3.3 — No notification on un-approval | COMPLIANT | `route.ts:76` — `wasJustApproved = !existing.isApproved && body.isApproved`; only fires when transition is `false → true` |

No automated test coverage for Domain 3 scenarios.

### Domain 4 — Tripper Dashboard Visibility

| Scenario | Status | Evidence |
|----------|--------|----------|
| 4.1 — Unapproved review invisible to tripper | COMPLIANT | `tripper-queries.ts:723-727` — `where: { tripperId, isApproved: true }` |
| 4.2 — Approved review visible regardless of isPublic | COMPLIANT | Same filter — `isPublic` is NOT in the where clause; all approved reviews returned |
| 4.3 — Legacy query removed | COMPLIANT | `getTripperReviews` (line 721–785) makes no reference to `TripRequest`, `customerRating`, or `customerFeedback` |
| 4.4 — NPS from Review model only | COMPLIANT | `tripper-queries.ts:736-743` — NPS computed from `reviews` array (filtered `isApproved: true`); no secondary data source |

### Domain 5 — Tripper Publish / Unpublish

| Scenario | Status | Evidence |
|----------|--------|----------|
| 5.1 — Tripper publishes a review | COMPLIANT | `tripper/reviews/[id]/route.ts:61-65` — updates `isPublic: body.isPublic`, returns HTTP 200 |
| 5.2 — Tripper unpublishes a review | COMPLIANT | Same endpoint handles `{ isPublic: false }` |
| 5.3 — Cannot publish another tripper's review | COMPLIANT | `route.ts:50-52` — `review.tripperId !== user.id` → HTTP 403 |
| 5.4 — Cannot publish unapproved review | COMPLIANT | `route.ts:54-59` — `!review.isApproved` → HTTP 403 |
| 5.5 — Per-review toggle in dashboard UI | COMPLIANT | `ReviewsPageClient.tsx:63-93` — `togglePublish` with optimistic update; `PATCH /api/tripper/reviews/${review.id}` called |

### Domain 6 — Public Profile (unchanged gate)

| Scenario | Status | Evidence |
|----------|--------|----------|
| 6.1 — Approved but unpublished review not on public profile | COMPLIANT | `getApprovedReviewsForTripper()` unchanged — queries `isApproved: true AND isPublic: true` |
| 6.2 — Published review on public profile | COMPLIANT | Same query gates on both flags |

No code was modified in the public profile path; compliance is inherited from the review-system baseline.

### Domain 7 — Client Reviews Page

| Scenario | Status | Evidence |
|----------|--------|----------|
| 7.1 — Completed trip with no review shows CTA | COMPLIANT ✅ | **C1 fixed** — `mapTripFromApi` now maps `reviewToken` at `trips.ts:126`; `ClientReviewsPageClient.tsx:43-44` filter `t.reviewToken` now correctly evaluates as truthy when set |
| 7.2 — Submitted review shows confirmation | COMPLIANT ✅ | **C1 fixed** — `mapTripFromApi` now maps `reviewSubmittedAt` at `trips.ts:123-125`; `t.reviewSubmittedAt` check now works correctly |
| 7.3 — Approval status not exposed to client | COMPLIANT | No `isApproved`, `isPublic`, or status labels rendered; only "Enviada" (submitted) indicator |

---

## CRITICAL (blocks merge)

### ~~C1 — `mapTripFromApi` does not map `reviewToken` or `reviewSubmittedAt`~~ — RESOLVED ✅

**Fixed in:** `src/lib/utils/trips.ts:123-126`

```ts
reviewSubmittedAt: trip.reviewSubmittedAt
  ? toIsoDate(trip.reviewSubmittedAt)
  : null,
reviewToken: (trip.reviewToken as string | null | undefined) ?? null,
```

Both fields are now returned by `mapTripFromApi`. Domain 7 scenarios 7.1 and 7.2 are functionally restored.

---

### C2 — 2 residual test failures in reviews route test suite (PARTIAL FIX)

**Impact:** 2 of 5 previously-failing tests still fail with HTTP 500 (Scenarios 4.1 and 4.10). The mock fix was correct but incomplete.

**Progress:** 3 of 5 tests fixed. Tests for `isApproved=false/isPublic=false`, `tripperId from TripRequest`, and `tripperId=null for Randomtrip` now pass because the spy assertion fires before the crash point. Two tests that assert HTTP 200 still fail.

**Root cause (residual):** `vi.resetAllMocks()` in `beforeEach` resets all mock implementations, including the `mockResolvedValue([])` default set on `prisma.user.findMany` in the module-level `vi.mock()` factory. After each reset, `prisma.user.findMany` returns `undefined` rather than `[]`. At `route.ts:127`, `admins.length` throws `TypeError: Cannot read properties of undefined (reading 'length')`, causing the route to return HTTP 500.

```
FAIL src/app/api/reviews/__tests__/route.test.ts
  × returns 200 and creates review with correct data (Scenario 4.1)
    → expected 500 to be 200 (admins is undefined after vi.resetAllMocks())
  × works without auth header (Scenario 4.10 — public endpoint)
    → expected 500 to be 200 (same root cause)
```

**Fix:** Change `vi.resetAllMocks()` to `vi.clearAllMocks()` in `beforeEach`, OR add explicit mock setup in each happy-path test:

```ts
// Option A — in beforeEach:
beforeEach(() => {
  vi.clearAllMocks(); // clears call history but preserves implementations
});

// Option B — in each happy-path test:
(prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
```

**Affected files:** `src/app/api/reviews/__tests__/route.test.ts`
**Spec references:** Scenarios 4.1, 4.10

---

## WARNING (should fix before merge)

### W1 — Admin PATCH returns 403 for isPublic on tripper reviews; spec suggests 400 or ignore

The spec states (Domain 2, Requirement 2): "MUST NOT accept or apply `isPublic` changes … (field ignored or HTTP 400)."

The implementation returns HTTP 403 ("isPublic is controlled by the tripper for tripper reviews"). While semantically correct (the caller is forbidden from changing it), the spec's suggested codes were 400 or silent ignore. This is a stricter enforcement and carries no functional risk, but it is a spec deviation.

**Affected file:** `src/app/api/admin/reviews/[id]/route.ts:53-58`

---

### W2 — Admin can set isPublic for platform reviews, which is not explicitly specified

The spec's ownership table assigns `isPublic` to the tripper for all reviews. However, for platform reviews (`tripperId: null`), there is no tripper, so admin control of `isPublic` is the only viable path.

The implementation correctly implements this (admin can toggle `isPublic` only when `tripperId === null`), and the admin UI exposes the button conditionally (`tripperName === null && review.isApproved`). This is a reasonable extension of the spec that was likely implied by the ownership model but not written explicitly.

**Affected files:** `src/app/api/admin/reviews/[id]/route.ts:65-67`, `AdminReviewsPageClient.tsx:173-187`

---

### W3 — Tripper approval notification is not atomic with the review update

The review `isApproved` update (`prisma.review.update`) and the subsequent tripper `Notification` creation (`prisma.notification.create`) are separate database operations. If the notification insert fails after the update succeeds, the review is approved but the tripper receives no in-app notification (though email will still fire asynchronously).

The spec's atomicity requirement (Domain 1, Requirement 5) applies only to review creation + admin notifications. Domain 3 has no atomicity requirement. This is therefore compliant, but the notification failure is only logged (`console.error`) and not surfaced to the admin.

**Affected file:** `src/app/api/admin/reviews/[id]/route.ts:75-94`

---

### W4 — No test coverage for Domain 1, 3, and 5 scenarios

There are no automated tests for:
- Admin notification creation on review submission (Domain 1)
- Tripper notification + email on approval (Domain 3)
- Tripper publish/unpublish endpoint (Domain 5, only covered by manual QA)

This limits regression protection for the core business logic of this change.

---

## SUGGESTION (optional improvements)

### S1 — Hard-coded base URL in email function

`sendReviewApprovedForTripper` at `src/lib/email/index.ts:554` hard-codes `https://getrandomtrip.com` as `BASE_URL`. This will break in staging or preview environments. Consider moving this to an env variable (`NEXT_PUBLIC_APP_URL` or `BASE_URL`).

### S2 — Toggle label is Spanish-only

`ReviewsPageClient.tsx:274` renders `"Publicado"` / `"Publicar"` as hard-coded Spanish strings. The component receives a `locale` prop but doesn't use it for these labels. Consider adding the publish/unpublish keys to the `TripperReviewsDict` dictionary type.

### S3 — Task 9.1 not implemented as specified

Task 9.1 requires a dedicated `GET /api/client/reviews` endpoint. The implementation instead reuses the existing `GET /api/trips` endpoint (which already returns all TripRequest fields). This works correctly with C1 fixed but diverges from the task plan. Consider adding the endpoint for API clarity, or update the task as "extended existing GET /api/trips".

---

## Build and Test Evidence

```
npm run typecheck  → exit 0, 0 errors
npm run test       → 173 passed, 8 failed

  Pre-existing failures (6 — unchanged from baseline):
  - 2 failures: src/lib/xsed/__tests__/notifications.test.ts
    (timezone field mismatch — pre-existing)
  - 4 failures: src/app/api/admin/xsed/__tests__/route.test.ts
    (prisma.experience.count not mocked — pre-existing)

  Failures introduced by this change (2 — reduced from 5):
  - src/app/api/reviews/__tests__/route.test.ts
    × "returns 200 and creates review..." (Scenario 4.1) → 500
      (vi.resetAllMocks() clears prisma.user.findMany default → admins is undefined)
    × "works without auth header..." (Scenario 4.10) → 500
      (same root cause)

  Resolved failures (3 — previously failing, now passing):
  ✓ "creates review with isApproved=false and isPublic=false" (Scenario 4.1)
  ✓ "sets tripperId from TripRequest on the Review" (Scenario 4.8)
  ✓ "sets tripperId=null for Randomtrip" (Scenario 4.9)
```
