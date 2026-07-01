# Proposal: review-admin-middleware

**Change name:** review-admin-middleware
**Date:** 2026-06-30
**Status:** proposed
**Artifact store:** openspec
**Delivery strategy:** single-pr

---

## Problem

The `review-system` change (archived 2026-06-23) created a write path for reviews and wired admin moderation. However, the current flow has two problems:

1. **Tripper sees all reviews immediately.** `getTripperReviews()` filters by `isApproved: true AND isPublic: true`, meaning the admin must set both flags before the tripper sees anything. The admin has been controlling a field (`isPublic`) that semantically should belong to the tripper — the decision of whether a review appears on their public profile.

2. **No curation gate exists.** There is no notification to admin when a review is submitted. Reviews queue silently. The tripper has no way to know a review was approved and landed in their dashboard. The client has no visibility into the status of reviews they wrote.

---

## Goals

1. Make admin the mandatory first filter: no review reaches the tripper's dashboard until admin approves it.
2. Give trippers control over their public profile: tripper decides per-review whether to publish.
3. Close the notification gap: admin is alerted on submission; tripper is alerted on approval.
4. Clean up the legacy data source: drop the `TripRequest.customerRating` query from `getTripperReviews()` — no legacy records exist.
5. Surface pending review CTAs to clients: clients can see which completed trips still need a review.

---

## Non-Goals

- Schema changes (none required — existing `isApproved` and `isPublic` fields are repurposed)
- Tripper ability to reject an admin-approved review
- Admin ability to set `isPublic` directly
- Client visibility into approval/publish state
- Backfilling legacy ratings (no existing `TripRequest.customerRating` records)
- Editing or deleting submitted reviews

---

## Approach

### Ownership reassignment (no schema change)

| Field | Before | After |
|-------|--------|-------|
| `Review.isApproved` | Admin sets → tripper sees review AND public profile gate | Admin sets → tripper sees review in dashboard only |
| `Review.isPublic` | Admin sets → public profile gate | **Tripper sets** → public profile gate |

### New `NotificationType` enum values

```prisma
REVIEW_SUBMITTED   // fires to admin when client submits
REVIEW_APPROVED    // fires to tripper when admin approves
```

### New endpoint: `PATCH /api/tripper/reviews/[id]`

Tripper-authenticated. Accepts `{ isPublic: boolean }`. Guards:
- `Review.tripperId` must match session user id → else 403
- `Review.isApproved` must be `true` → else 403 (cannot publish unapproved review)

### Modified endpoint: `PATCH /api/admin/reviews/[id]`

Remove `isPublic` from accepted body. Only `isApproved` is writable by admin.

On `isApproved: true` transition:
- Create `Notification` for tripper (`REVIEW_APPROVED`, `TRIPPER`)
- Send `ReviewApprovedForTripper` email

### Modified: `POST /api/reviews`

Extend existing transaction to also create `Notification` records for all admin users (`REVIEW_SUBMITTED`, `ADMIN`).

### Modified: `getTripperReviews()`

- Drop `completedTrips` (legacy `customerRating`) query entirely
- Change `generalReviews` filter from `isApproved: true AND isPublic: true` → `isApproved: true`
- NPS and average rating computed from `Review` model only

### New email template: `ReviewApprovedForTripper.tsx`

Sent when admin approves a review. Contains:
- Review rating and excerpt
- Link to `/dashboard/tripper/reviews`

### Client reviews page

New `GET /api/client/reviews` (or inline server fetch) returns completed trips with `reviewToken`. Page renders:
- "Leave a review" CTA if `reviewSubmittedAt` is null
- "Review submitted" if `reviewSubmittedAt` is set

---

## Affected files

| File | Change type |
|------|-------------|
| `prisma/schema.prisma` | Modify — add `REVIEW_SUBMITTED`, `REVIEW_APPROVED` to `NotificationType` enum |
| `src/app/api/reviews/route.ts` | Modify — add admin notification to transaction |
| `src/app/api/admin/reviews/[id]/route.ts` | Modify — remove `isPublic`, add tripper notification + email on approve |
| `src/app/api/tripper/reviews/[id]/route.ts` | New — tripper publish/unpublish endpoint |
| `src/lib/db/tripper-queries.ts` | Modify — drop legacy query, change filter to `isApproved: true` only |
| `src/emails/ReviewApprovedForTripper.tsx` | New |
| `src/lib/email/index.ts` | Modify — add `sendReviewApprovedForTripper()` |
| `src/components/app/dashboard/tripper/reviews/ReviewsPageClient.tsx` | Modify — add per-review publish toggle |
| `src/app/[locale]/(secure)/dashboard/admin/(shell)/reviews/page.tsx` + `AdminReviewsPageClient.tsx` | Modify — remove `isPublic` toggle, add read-only `isPublic` indicator |
| `src/app/[locale]/(secure)/dashboard/client/reviews/page.tsx` | Modify — show completed trips with CTA |
| `src/components/app/dashboard/client/ClientReviewsPageClient.tsx` | Modify — render CTA vs submitted state |

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Admin approves → notification fires but email fails | Wrap in try/catch; notification and email are non-critical side effects, review approval persists regardless |
| Tripper publishes review, admin later un-approves → review goes dark with no warning to tripper | Acceptable — admin has final kill switch by design; no notification needed on un-approval (spec decision) |
| Client page fetches all completed trips — could be slow at scale | Paginate if needed; not a concern for current data volume |

---

## Estimated scope

~10 files touched, ~300–400 lines changed. Single PR.
