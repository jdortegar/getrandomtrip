# Tasks: review-admin-middleware

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 300–400 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |

---

## Phase 1: Schema & Enum

- [ ] 1.1 `prisma/schema.prisma` — Add `REVIEW_SUBMITTED` and `REVIEW_APPROVED` to `NotificationType` enum. Satisfies Scenarios 1.1, 3.1.
- [ ] 1.2 Run `npm run db:generate` to regenerate Prisma client with new enum values.
- [ ] 1.3 Run `npm run typecheck` — must pass with no errors. Satisfies Schema Delta.

---

## Phase 2: Email Template

- [ ] 2.1 `src/emails/ReviewApprovedForTripper.tsx` — New email component. Props: `tripperName: string`, `reviewerName: string`, `rating: number`, `excerpt: string`, `dashboardUrl: string`. Render rating, excerpt, and CTA link to tripper reviews dashboard. Satisfies Scenario 3.1.
- [ ] 2.2 `src/lib/email/index.ts` — Add `sendReviewApprovedForTripper(tripperId: string, reviewId: string): Promise<void>`. Fetches tripper email + name from DB, sends `ReviewApprovedForTripper` email. Satisfies Scenario 3.1.

---

## Phase 3: API — Review Submission (admin notification)

- [ ] 3.1 `src/app/api/reviews/route.ts` — Extend the existing `prisma.$transaction` in `POST` handler to also create a `Notification` record for every user with `ADMIN` role. Fields: `type: REVIEW_SUBMITTED`, `audience: ADMIN`, `isRead: false`, `title` includes tripper name or "RandomTrip". Include `reviewId` in `metadata`. Satisfies Scenarios 1.1, 1.2, 1.3, 1.4.

---

## Phase 4: API — Admin Reviews (isPublic removed, tripper notification)

- [ ] 4.1 `src/app/api/admin/reviews/[id]/route.ts` — Remove `isPublic` from the accepted PATCH body. If `isPublic` is present in the request, ignore it (or return 400 — consistent with existing validation pattern). Satisfies Scenario 2.2.
- [ ] 4.2 Same file — On `isApproved` transitioning from `false` to `true`: create `Notification` for the tripper (`type: REVIEW_APPROVED`, `audience: TRIPPER`). Guard: skip if `Review.tripperId` is null. Satisfies Scenarios 3.1, 3.2.
- [ ] 4.3 Same file — On `isApproved: true` transition: call `sendReviewApprovedForTripper()`. Wrap in `try/catch` — email failure MUST NOT roll back the approval. Satisfies Scenario 3.1.
- [ ] 4.4 Same file — On `isApproved: false` transition (un-approval): do NOT create any notification. Satisfies Scenario 3.3.

---

## Phase 5: API — Tripper Publish Endpoint (new)

- [ ] 5.1 `src/app/api/tripper/reviews/[id]/route.ts` — Create `PATCH` handler. Require session; resolve user via `getServerSession`. Verify `hasRoleAccess(user, "tripper")`. Satisfies Scenario 5.3 (auth guard).
- [ ] 5.2 Same file — Fetch `Review` by `id`. Return 404 if not found. Return 403 if `Review.tripperId !== session.user.id`. Satisfies Scenario 5.3.
- [ ] 5.3 Same file — Return 403 if `Review.isApproved === false`. Satisfies Scenario 5.4.
- [ ] 5.4 Same file — Validate body: `isPublic` must be boolean. Update `Review.isPublic` and return HTTP 200. Satisfies Scenarios 5.1, 5.2.

---

## Phase 6: Data Layer — getTripperReviews()

- [ ] 6.1 `src/lib/db/tripper-queries.ts` — Remove the `completedTrips` query (legacy `TripRequest.customerRating`). Satisfies Scenario 4.3.
- [ ] 6.2 Same file — Change `generalReviews` filter from `{ tripperId, isApproved: true, isPublic: true }` to `{ tripperId, isApproved: true }`. Satisfies Scenarios 4.1, 4.2.
- [ ] 6.3 Same file — Recalculate NPS and average rating from `generalReviews` (Review model, `isApproved: true`) only, removing any NPS computation from legacy `completedTrips`. Satisfies Scenario 4.4.

---

## Phase 7: Tripper Dashboard UI

- [ ] 7.1 `src/components/app/dashboard/tripper/reviews/ReviewsPageClient.tsx` — Add per-review publish/unpublish toggle. On toggle: call `PATCH /api/tripper/reviews/[id]` with `{ isPublic: boolean }`. Optimistic UI: update toggle state immediately, revert on error. Satisfies Scenario 5.5.
- [ ] 7.2 Same file — Show appropriate label on each review card: "Published" if `isPublic: true`, "Not published" / "Publish" CTA if `isPublic: false`. Satisfies Scenario 5.5.

---

## Phase 8: Admin Dashboard UI

- [ ] 8.1 `src/components/app/dashboard/tripper/reviews/AdminReviewsPageClient.tsx` (or equivalent) — Remove the `isPublic` toggle/action from the admin reviews table. Satisfies Scenario 2.2.
- [ ] 8.2 Same file — Add a read-only `isPublic` indicator column/badge per row (e.g. "Published by tripper" / "Not published"). Satisfies Scenario 2.4.

---

## Phase 9: Client Reviews Page

- [ ] 9.1 `src/app/api/client/reviews/route.ts` — New `GET` handler (or extend existing client data fetch). Returns `TripRequest` records for the current client where `status: COMPLETED` and `reviewToken` is set. Include `reviewSubmittedAt` and `reviewToken` in response. Satisfies Scenarios 7.1, 7.2.
- [ ] 9.2 `src/app/[locale]/(secure)/dashboard/client/reviews/page.tsx` — Fetch completed trips with token. Pass to client component. Satisfies Scenarios 7.1, 7.2.
- [ ] 9.3 `src/components/app/dashboard/client/ClientReviewsPageClient.tsx` — For each trip: render "Leave a review" CTA (link to `/[locale]/review/[token]`) if `reviewSubmittedAt` is null; render "Review submitted" indicator if set. No status labels (pending/approved). Satisfies Scenarios 7.1, 7.2, 7.3.

---

## Phase 10: Final Verification

- [ ] 10.1 Run `npm run typecheck` — zero errors.
- [ ] 10.2 Run `npm run lint` — zero errors.
- [ ] 10.3 Manual QA: submit a review → verify admin in-app notification appears.
- [ ] 10.4 Manual QA: admin approves → verify tripper notification appears in tripper dashboard.
- [ ] 10.5 Manual QA: tripper publishes review → verify it appears on public profile.
- [ ] 10.6 Manual QA: admin un-approves → verify review disappears from tripper dashboard and public profile.
- [ ] 10.7 Manual QA: client reviews page shows CTA for completed trips without review; "submitted" for reviewed trips.
