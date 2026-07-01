# Spec: review-admin-middleware

**Change name:** review-admin-middleware
**Date:** 2026-06-30
**Status:** spec
**Artifact store:** openspec

---

## Scope

This spec describes the behavioral requirements for the review-admin-middleware change: what the system MUST do after the change is applied. It does not prescribe implementation details.

This change modifies the review flow established in `review-system` (archived 2026-06-23). No schema changes are required — existing `isApproved` and `isPublic` fields on `Review` are repurposed with new ownership semantics.

---

## Ownership Model

| Field | Owner | Meaning |
|-------|-------|---------|
| `Review.isApproved` | Admin | Review is forwarded to the tripper's dashboard |
| `Review.isPublic` | Tripper | Review is visible on the tripper's public profile |

A review in state `isApproved: false` is invisible to the tripper. A review in state `isApproved: true, isPublic: false` is visible to the tripper in their dashboard but not on their public profile. A review in state `isApproved: true, isPublic: true` is visible everywhere.

---

## Domain 1 — Admin Notification on Review Submission

### Requirements

1. When a `Review` record is created via `POST /api/reviews`, an in-app `Notification` record MUST be created for each user with the `ADMIN` role.
2. The notification MUST use `NotificationType.REVIEW_SUBMITTED` and `NotificationAudience.ADMIN`.
3. The notification `title` MUST identify the tripper name (or "RandomTrip" if `tripperId` is null).
4. The notification `metadata` MUST include the `reviewId` to enable direct linking from the admin dashboard.
5. The review creation and notification creation MUST occur in the same `prisma.$transaction`.

### Acceptance Scenarios

**Scenario 1.1 — Admin notified on new review**
- Given: a client submits a valid review via `POST /api/reviews`
- Then: a `Notification` record is created for every admin user with `type: REVIEW_SUBMITTED`, `audience: ADMIN`, `isRead: false`

**Scenario 1.2 — Notification includes tripper name**
- Given: the review is linked to a tripper (`tripperId` is set)
- Then: the notification `title` includes the tripper's name

**Scenario 1.3 — Notification for RandomTrip**
- Given: the review has `tripperId: null` (RandomTrip)
- Then: the notification `title` identifies the review as "RandomTrip" or equivalent

**Scenario 1.4 — Notification created atomically with review**
- Given: `POST /api/reviews` with a valid payload
- Then: review + notification(s) are created or both rolled back — no half-states

---

## Domain 2 — Admin Review Moderation (isApproved only)

### Requirements

1. `PATCH /api/admin/reviews/[id]` MUST accept `{ isApproved: boolean }` in its request body.
2. `PATCH /api/admin/reviews/[id]` MUST NOT accept or apply `isPublic` changes. `isPublic` is tripper-owned and MUST NOT be writable by the admin API.
3. Setting `isApproved: true` forwards the review to the tripper's dashboard (triggers Domain 3 notifications).
4. Setting `isApproved: false` (un-approval) hides the review from the tripper's dashboard and removes it from the tripper's public profile if `isPublic` was `true`.
5. The admin reviews list at `/dashboard/admin/reviews` MUST display `isPublic` as a read-only indicator per row.

### Acceptance Scenarios

**Scenario 2.1 — Admin approves review**
- Given: a `Review` with `isApproved: false`
- When: `PATCH /api/admin/reviews/[id]` with `{ isApproved: true }`
- Then: `Review.isApproved` becomes `true`; HTTP 200

**Scenario 2.2 — Admin cannot set isPublic**
- Given: `PATCH /api/admin/reviews/[id]` with `{ isPublic: true }`
- Then: the `isPublic` field is NOT updated on the `Review` record (field ignored or HTTP 400)

**Scenario 2.3 — Admin un-approves review**
- Given: a `Review` with `isApproved: true, isPublic: true`
- When: `PATCH /api/admin/reviews/[id]` with `{ isApproved: false }`
- Then: `Review.isApproved` becomes `false`; review disappears from tripper dashboard and public profile

**Scenario 2.4 — isPublic readable in admin list**
- Given: a `Review` with `isApproved: true, isPublic: true`
- When: admin views the reviews list
- Then: the row shows a read-only indicator that the review has been published by the tripper

---

## Domain 3 — Tripper Notification on Approval

### Requirements

1. When `Review.isApproved` transitions from `false` to `true`, an in-app `Notification` record MUST be created for the tripper (`Review.tripperId`).
2. An email (`ReviewApprovedForTripper`) MUST be sent to the tripper's email address at the same time.
3. The notification MUST use `NotificationType.REVIEW_APPROVED` and `NotificationAudience.TRIPPER`.
4. If `Review.tripperId` is null (RandomTrip), no tripper notification or email is sent.
5. When `Review.isApproved` transitions from `true` to `false` (un-approval), no notification is sent to the tripper.

### Acceptance Scenarios

**Scenario 3.1 — Tripper notified on approval**
- Given: a `Review` with `tripperId = "t1"`, `isApproved: false`
- When: admin sets `isApproved: true`
- Then: a `Notification` record is created for user "t1" with `type: REVIEW_APPROVED`; an email is dispatched to that tripper

**Scenario 3.2 — No notification for RandomTrip review**
- Given: a `Review` with `tripperId: null`
- When: admin sets `isApproved: true`
- Then: no `Notification` record is created; no email is dispatched

**Scenario 3.3 — No notification on un-approval**
- Given: a `Review` with `isApproved: true`
- When: admin sets `isApproved: false`
- Then: no `Notification` is created for the tripper

---

## Domain 4 — Tripper Dashboard Visibility

### Requirements

1. `GET /api/tripper/reviews` MUST return `Review` records filtered by `tripperId = current tripper` AND `isApproved: true`.
2. Reviews with `isApproved: false` MUST NOT appear in the tripper's dashboard, regardless of `isPublic`.
3. Reviews with `isApproved: true` MUST appear in the tripper's dashboard regardless of `isPublic`.
4. The legacy `TripRequest.customerRating` / `customerFeedback` query MUST be removed from `getTripperReviews()`. The `Review` model is the sole data source.
5. NPS and average rating metrics MUST be computed exclusively from `Review` records where `isApproved: true`.

### Acceptance Scenarios

**Scenario 4.1 — Unapproved review invisible to tripper**
- Given: a `Review` with `tripperId = "t1"`, `isApproved: false`
- When: tripper "t1" calls `GET /api/tripper/reviews`
- Then: that review is NOT in the response

**Scenario 4.2 — Approved review visible regardless of isPublic**
- Given: a `Review` with `tripperId = "t1"`, `isApproved: true`, `isPublic: false`
- When: tripper "t1" calls `GET /api/tripper/reviews`
- Then: that review IS in the response

**Scenario 4.3 — Legacy query removed**
- Given: the change is applied
- Then: `getTripperReviews()` makes no query to `TripRequest` for `customerRating` or `customerFeedback` data

**Scenario 4.4 — NPS from Review model only**
- Given: tripper "t1" has two `Review` records with `isApproved: true` (ratings 5 and 3) and one with `isApproved: false` (rating 5)
- When: tripper calls `GET /api/tripper/reviews`
- Then: NPS and average rating are computed from the two approved records only

---

## Domain 5 — Tripper Publish / Unpublish

### Requirements

1. A new `PATCH /api/tripper/reviews/[id]` endpoint MUST exist.
2. The endpoint MUST accept `{ isPublic: boolean }` in the request body.
3. The endpoint MUST be session-protected. Only a tripper whose `id` matches `Review.tripperId` may update the record.
4. On success the endpoint MUST update `Review.isPublic` and return HTTP 200.
5. If the review does not belong to the requesting tripper, the endpoint MUST return HTTP 403.
6. If `Review.isApproved` is `false`, the endpoint MUST return HTTP 403 — tripper cannot publish an unapproved review.
7. The tripper reviews dashboard MUST render a per-review publish/unpublish toggle that calls this endpoint.

### Acceptance Scenarios

**Scenario 5.1 — Tripper publishes a review**
- Given: a `Review` with `tripperId = "t1"`, `isApproved: true`, `isPublic: false`
- When: tripper "t1" sends `PATCH /api/tripper/reviews/[id]` with `{ isPublic: true }`
- Then: `Review.isPublic` becomes `true`; HTTP 200

**Scenario 5.2 — Tripper unpublishes a review**
- Given: a `Review` with `isApproved: true`, `isPublic: true`
- When: tripper "t1" sends `{ isPublic: false }`
- Then: `Review.isPublic` becomes `false`; review removed from public profile

**Scenario 5.3 — Cannot publish another tripper's review**
- Given: a `Review` with `tripperId = "t2"`
- When: tripper "t1" sends `PATCH /api/tripper/reviews/[review-id]` with `{ isPublic: true }`
- Then: HTTP 403

**Scenario 5.4 — Cannot publish unapproved review**
- Given: a `Review` with `isApproved: false`
- When: tripper calls `PATCH /api/tripper/reviews/[id]` with `{ isPublic: true }`
- Then: HTTP 403

**Scenario 5.5 — Per-review toggle in dashboard UI**
- Given: the tripper reviews dashboard renders a review with `isApproved: true`
- Then: a publish/unpublish toggle is visible on that review card

---

## Domain 6 — Public Profile (unchanged gate)

### Requirements

1. The tripper public profile MUST continue to display only reviews where `isApproved: true AND isPublic: true`.
2. `getApprovedReviewsForTripper()` MUST remain unchanged — it already queries `isApproved: true AND isPublic: true`.

### Acceptance Scenarios

**Scenario 6.1 — Approved but unpublished review not on public profile**
- Given: a `Review` with `isApproved: true`, `isPublic: false`
- When: a visitor views the tripper's public profile
- Then: that review does NOT appear

**Scenario 6.2 — Published review on public profile**
- Given: a `Review` with `isApproved: true`, `isPublic: true`
- When: a visitor views the tripper's public profile
- Then: that review appears

---

## Domain 7 — Client Reviews Page

### Requirements

1. The client reviews page (`/dashboard/client/reviews`) MUST fetch all `TripRequest` records for the current client where `status = COMPLETED` and `reviewToken` is set.
2. For each such trip, if `reviewSubmittedAt` is null, the UI MUST render a "Leave a review" CTA that links to `/${locale}/review/${reviewToken}`.
3. For each such trip, if `reviewSubmittedAt` is set, the UI MUST render a "Review submitted" indicator with no status details (pending/approved state is not surfaced to the client).
4. The client reviews page MUST NOT expose `isApproved` or `isPublic` state to the client.

### Acceptance Scenarios

**Scenario 7.1 — Completed trip with no review shows CTA**
- Given: client has a `TripRequest` with `status: COMPLETED`, `reviewToken` set, `reviewSubmittedAt: null`
- When: client visits `/dashboard/client/reviews`
- Then: a "Leave a review" CTA is rendered linking to `/${locale}/review/${reviewToken}`

**Scenario 7.2 — Submitted review shows confirmation**
- Given: client has a `TripRequest` with `status: COMPLETED`, `reviewSubmittedAt` set
- When: client visits `/dashboard/client/reviews`
- Then: a "Review submitted" indicator is rendered; no review form or status label is shown

**Scenario 7.3 — Approval status not exposed to client**
- Given: a review with `isApproved: false` or `isApproved: true`
- When: client views their reviews page
- Then: no mention of "pending", "approved", or "published" state is shown

---

## Schema Delta

**No schema changes required.**

The following existing fields are repurposed with new ownership:

| Field | Previous owner | New owner |
|-------|---------------|-----------|
| `Review.isApproved` | Admin (forward to tripper + public) | Admin (forward to tripper only) |
| `Review.isPublic` | Admin (public gate) | Tripper (public gate) |

The following enum values MUST be added to `NotificationType` in `prisma/schema.prisma`:

```
REVIEW_SUBMITTED   // new review received — targets admin
REVIEW_APPROVED    // review forwarded to tripper — targets tripper
```

---

## Out of Scope

- Editing or deleting submitted reviews
- Tripper rejecting an admin-approved review (tripper can only publish/unpublish)
- Admin setting `isPublic` directly
- Rate limiting on `POST /api/reviews` (existing token + `@unique` guard is sufficient)
- Backfilling legacy `TripRequest.customerRating` data (no existing records)
- Client visibility into review approval state
