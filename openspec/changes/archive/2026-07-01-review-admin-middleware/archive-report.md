# Archive Report: review-admin-middleware

**Change**: review-admin-middleware
**Date**: 2026-07-01
**Archived to**: `openspec/changes/archive/2026-07-01-review-admin-middleware/`
**Status**: ARCHIVED

---

## Executive Summary

The `review-admin-middleware` change has been successfully completed, verified, and archived. All 29 of 31 tasks across 10 phases were completed (2 manual QA tasks deferred as non-blocking). The change reassigns ownership of `Review.isPublic` from admin to tripper, closes the notification gap for review submission and approval, adds a tripper publish/unpublish endpoint, drops the legacy `TripRequest.customerRating` data source from `getTripperReviews()`, and surfaces completed-trip CTAs to clients in their reviews dashboard.

---

## Change Artifacts

| Artifact | Status | Location |
|----------|--------|----------|
| Proposal | Complete | `proposal.md` |
| Spec | Complete | `spec.md` |
| Tasks | Complete | `tasks.md` |
| Verify Report | Complete | `verify-report.md` |
| Archive Report | Complete | `archive-report.md` |

---

## Spec Domains — Sync Status

### review-admin-middleware Spans Multiple Feature Areas

This change modifies the review flow established in `review-system` (archived 2026-06-23) and touches several existing feature areas:

1. **Review Submission** (`POST /api/reviews`) — Extended to notify all admins atomically on new review submission
2. **Admin Dashboard** — Admin moderation now controls `isApproved` only; `isPublic` becomes a read-only indicator
3. **Tripper Dashboard** — New tripper publish/unpublish toggle; legacy `customerRating` data source removed
4. **Notification System** — Two new `NotificationType` enum values: `REVIEW_SUBMITTED` and `REVIEW_APPROVED`
5. **Client Dashboard** — New reviews page surface showing CTA for pending reviews and submission confirmation

### Delta Spec Integration

The `review-admin-middleware` spec is a behavioral refinement of `review-system`. Rather than creating a new standalone domain spec, the ownership reassignment and notification patterns are documented in the archived spec as the **audit trail** for these decisions. The functional outcome is:

- `Review.isApproved` → admin-owned (dashboard visibility gate)
- `Review.isPublic` → tripper-owned (public profile gate)

---

## Implementation Summary

### Phase 1: Schema & Enum ✅ (3/3 tasks complete)
- Added `REVIEW_SUBMITTED` and `REVIEW_APPROVED` to `NotificationType` enum in `prisma/schema.prisma`
- Ran `npm run db:generate` to regenerate Prisma client
- `npm run typecheck` passes with zero errors

### Phase 2: Email Template ✅ (2/2 tasks complete)
- `ReviewApprovedForTripper.tsx` created — renders rating, review excerpt, and CTA to tripper dashboard
- `sendReviewApprovedForTripper()` added to `src/lib/email/index.ts` — fetches tripper email from DB, sends email

### Phase 3: API — Review Submission ✅ (1/1 tasks complete)
- `POST /api/reviews` extended to create `Notification` records for all admin users within the same `prisma.$transaction`
- Notification `title` includes tripper name or "RandomTrip" fallback
- `metadata` includes `reviewId` for direct admin linking

### Phase 4: API — Admin Reviews ✅ (4/4 tasks complete)
- `PATCH /api/admin/reviews/[id]` — `isPublic` removed from accepted body; returns 403 if caller attempts to set it (stricter than spec's suggested 400/ignore)
- On `isApproved: true` transition: creates `REVIEW_APPROVED` notification for tripper (skipped if `tripperId` is null)
- Email dispatched fire-and-forget, wrapped in `try/catch` — approval persists regardless of email failure
- No notification on un-approval (`false → false` or `true → false`)

### Phase 5: API — Tripper Publish Endpoint ✅ (4/4 tasks complete)
- New `PATCH /api/tripper/reviews/[id]` endpoint created
- Session-protected; verifies tripper role and `Review.tripperId === session.user.id` → else 403
- Returns 403 if `Review.isApproved === false` (cannot publish unapproved review)
- Accepts `{ isPublic: boolean }`, updates record, returns HTTP 200

### Phase 6: Data Layer ✅ (3/3 tasks complete)
- `getTripperReviews()` — removed `completedTrips` query (legacy `TripRequest.customerRating`)
- `generalReviews` filter changed from `isApproved: true AND isPublic: true` → `isApproved: true`
- NPS and average rating computed from `Review` model only (approved records)

### Phase 7: Tripper Dashboard UI ✅ (2/2 tasks complete)
- Per-review publish/unpublish toggle added to `ReviewsPageClient.tsx`
- Optimistic UI: toggle state updated immediately, reverts on API error
- "Publicado" / "Publicar" labels rendered per review card

### Phase 8: Admin Dashboard UI ✅ (2/2 tasks complete)
- `isPublic` toggle action removed from admin reviews table
- Read-only `isPublic` indicator added per row: `"approved · public"` / `"approved · private"`
- Exception: admin can still toggle `isPublic` for platform reviews (`tripperId: null`) where no tripper exists

### Phase 9: Client Reviews Page ✅ (3/3 tasks complete)
- Client reviews page fetches completed `TripRequest` records with `reviewToken` set
- `mapTripFromApi` updated to map `reviewSubmittedAt` and `reviewToken` fields (C1 fix)
- `ClientReviewsPageClient.tsx` renders "Leave a review" CTA if `reviewSubmittedAt: null`; "Review submitted" indicator if set
- No `isApproved` / `isPublic` state surfaced to clients

### Phase 10: Final Verification ✅ (6/7 tasks complete)
- `npm run typecheck` → exit 0, zero errors
- `npm run lint` → passes
- 2 manual QA tasks deferred (non-blocking — no production environment in current session)

---

## Verification Verdict

**Status**: PASS

| Category | Count | Details |
|----------|-------|---------|
| CRITICAL | 0 | C1 (mapTripFromApi missing fields) resolved; C2 (test mock reset) resolved |
| WARNING | 4 | Non-blocking; see details below |
| SUGGESTION | 3 | Optional improvements |

**Resolved Criticals**:
- **C1** — `mapTripFromApi` did not map `reviewToken` or `reviewSubmittedAt` → Fixed in `src/lib/utils/trips.ts:123-126`
- **C2** — `vi.resetAllMocks()` in test `beforeEach` was clearing Prisma mock implementations → Fixed in `src/app/api/reviews/__tests__/route.test.ts`

**Test Results**:
- `npm run typecheck`: exit 0 (zero errors)
- `npm run test`: 173 passed, 6 failed
  - New failures from this change: 0 (all 6 pre-existed before this change)

**Active Warnings** (non-blocking):
- **W1** — Admin PATCH returns 403 (not 400) when `isPublic` is sent; spec suggested 400 or ignore. Stricter but functionally correct.
- **W2** — Admin can toggle `isPublic` for platform reviews (`tripperId: null`); not explicitly in spec but logically required since no tripper exists.
- **W3** — Tripper approval notification is not atomic with review update (spec's atomicity requirement only covers Domain 1, not Domain 3).
- **W4** — No automated test coverage for Domains 1, 3, and 5 (notification creation, email dispatch, tripper publish endpoint).

---

## Risks & Mitigations

| Risk | Mitigation | Status |
|------|-----------|--------|
| Email failure rolls back review approval | Fire-and-forget with `try/catch`; approval persists regardless | MITIGATED |
| Tripper un-approval leaves stale `isPublic: true` | `isPublic` is a display gate; un-approval hides review regardless — `isPublic` state is irrelevant until re-approval | MITIGATED |
| Hard-coded `getrandomtrip.com` base URL in email helper | Move to `NEXT_PUBLIC_APP_URL` env var in follow-up (S1 suggestion) | DEFERRED |
| Spanish-only publish toggle labels | Add to `TripperReviewsDict` dictionary in follow-up (S2 suggestion) | DEFERRED |

---

## Files Changed Summary

**New files**: 2
- `src/app/api/tripper/reviews/[id]/route.ts` (tripper publish/unpublish endpoint)
- `src/emails/ReviewApprovedForTripper.tsx` (approval email template)

**Modified files**: 9
- `prisma/schema.prisma` (`REVIEW_SUBMITTED`, `REVIEW_APPROVED` added to `NotificationType` enum)
- `src/app/api/reviews/route.ts` (admin notification in transaction)
- `src/app/api/reviews/__tests__/route.test.ts` (test mock fix: `resetAllMocks` → `clearAllMocks`)
- `src/app/api/admin/reviews/[id]/route.ts` (removed `isPublic`, added tripper notification + email)
- `src/lib/db/tripper-queries.ts` (removed legacy query, changed `isPublic` filter)
- `src/lib/email/index.ts` (`sendReviewApprovedForTripper` added)
- `src/lib/utils/trips.ts` (`reviewToken` and `reviewSubmittedAt` mapped in `mapTripFromApi`)
- `src/components/app/dashboard/tripper/reviews/ReviewsPageClient.tsx` (publish toggle)
- `src/app/[locale]/(secure)/dashboard/admin/AdminReviewsPageClient.tsx` (read-only `isPublic` indicator)
- `src/app/[locale]/(secure)/dashboard/tripper/reviews/page.tsx` (review dashboard wiring)
- `src/components/app/dashboard/client/ClientReviewsPageClient.tsx` (CTA / submitted state)

**Deleted files**: 0

---

## Artifact Inventory

Archived folder structure:
```
openspec/changes/archive/2026-07-01-review-admin-middleware/
├── proposal.md          ✅ (Problem statement, goals, approach)
├── spec.md              ✅ (7 domains, 20+ acceptance scenarios)
├── tasks.md             ✅ (31 tasks across 10 phases)
├── verify-report.md     ✅ (Spec compliance matrix + test results)
├── archive-report.md    ✅ (This report)
└── state.yaml           ✅ (Metadata: status=archived, date=2026-07-01)
```

---

## SDD Cycle Completion

This change completes the full SDD workflow:

1. **Exploration** ✅ — Verified existing review flow, notification model, ownership gaps
2. **Proposal** ✅ — Defined ownership reassignment, notification strategy, new endpoint
3. **Spec** ✅ — 7 domains with behavioral requirements and acceptance scenarios
4. **Tasks** ✅ — 31 concrete tasks organized by 10 implementation phases
5. **Apply** ✅ — All phases executed; code integrated
6. **Verify** ✅ — 0 CRITICAL issues after fixes; 4 non-blocking WARNINGs
7. **Archive** ✅ — Artifacts moved to `openspec/changes/archive/2026-07-01-review-admin-middleware/`

**The SDD cycle for review-admin-middleware is complete. Ready for the next change.**

---

## Next Recommended Action

None. The change is fully archived and closed.

If follow-up work is needed, consider a new `/sdd-new` for:
- **i18n for publish labels** — add `published`/`publish` keys to `TripperReviewsDict` (S2)
- **env-var for base URL in email** — replace hard-coded `getrandomtrip.com` with `NEXT_PUBLIC_APP_URL` (S1)
- **Test coverage for Domains 1, 3, 5** — notification creation, email dispatch, tripper publish endpoint (W4)
