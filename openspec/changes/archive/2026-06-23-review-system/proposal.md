# Proposal: review-system

**Change name:** review-system
**Date:** 2026-06-23
**Status:** proposed
**Artifact store:** openspec
**Delivery strategy:** single-pr

---

## Problem

The `Review` model exists in the database but has no write path. Customers complete trips and receive a `TripCompleted` email with a CTA that links to `/dashboard` — not a review form. As a result, zero structured reviews are being collected.

Meanwhile, `TripRequest.customerRating` / `customerFeedback` was used as a stopgap but has no moderation, no tripper attribution, and no public display path. The admin review moderation UI (`/dashboard/admin/reviews/`) is fully built but reads from a model no one can write to.

---

## Goals

1. Enable customers to submit reviews via a token-based email link — no login required.
2. Wire the existing admin moderation UI to real review data.
3. Display approved tripper reviews on the tripper public profile.
4. Display approved RandomTrip reviews on the homepage testimonials.
5. Remove dead code from the inline review form (Fix #5 PATCH endpoint).

---

## Non-Goals

- Backfilling legacy `customerRating` / `customerFeedback` data from `TripRequest` into `Review` records. Legacy ratings stay on `TripRequest` as-is.
- Editing submitted reviews.
- Replying to reviews.
- Rate limiting / CAPTCHA on the public review endpoint (token uniqueness + DB `@unique` guard is sufficient for v1).

---

## Approach

### 1. Schema changes

Three additions to `prisma/schema.prisma`:

**TripRequest model:**
```
reviewToken       String?   @unique
reviewSubmittedAt DateTime?
```

**Review model:**
```
tripRequestId  String?  @unique
tripperId      String?
tripRequest    TripRequest? @relation(fields: [tripRequestId], references: [id])
tripper        User?        @relation("TripperReviews", fields: [tripperId], references: [id])
```

The `@unique` on `Review.tripRequestId` is the DB-level guard against duplicate submissions regardless of token state.

### 2. Token generation

Location: `src/app/api/admin/trip-requests/[id]/route.ts`

On the status transition to `COMPLETED`:
1. Generate `reviewToken = crypto.randomUUID()`
2. Persist it synchronously to `TripRequest.reviewToken` via `prisma.tripRequest.update()`
3. Only then call `sendTripCompleted(tripRequestId, userId, reviewToken)`

This eliminates the race condition where a fire-and-forget email goes out before the token is persisted.

### 3. Email update

`src/emails/TripCompleted.tsx` — add `reviewToken: string` prop, change CTA href from `/${locale}/dashboard` to `/${locale}/review/${reviewToken}`.

`src/lib/email/index.ts` — `sendTripCompleted()` receives `reviewToken` as a third parameter and passes it to the email component.

### 4. Public review page

**Route:** `src/app/[locale]/review/[token]/page.tsx`

Server component that:
- Looks up `TripRequest` by `reviewToken`
- If not found → render 404/invalid token state
- If `reviewSubmittedAt` is set → render inline success state (already reviewed)
- If found + not submitted → render `<ReviewFormClient>` with trip summary

`ReviewFormClient` — client component with:
- Star rating input (1–5, required)
- Title field (optional, max 100 chars)
- Content textarea (required, max 1000 chars)
- Submit → `POST /api/reviews` with `{ token, rating, title, content }`
- On success → replace form with inline success state (no redirect)

### 5. POST /api/reviews

**Public endpoint** — no session required, token-based auth.

Logic:
1. Validate `token` exists in request body
2. Look up `TripRequest` by `reviewToken`
3. If not found → 404
4. If `reviewSubmittedAt` is set → 409 (already submitted)
5. Validate `rating` (int 1–5), `content` (non-empty)
6. `prisma.$transaction`:
   - Create `Review` record with `tripRequestId`, `tripperId` (from TripRequest), `userId` (from TripRequest), `rating`, `title`, `content`, `isApproved: false`, `isPublic: false`
   - Update `TripRequest.reviewSubmittedAt = new Date()`
7. Return `{ success: true }`

### 6. Tripper public profile

`src/lib/db/tripper-queries.ts` — new `getApprovedReviewsForTripper(tripperId: string)` query that fetches `Review` records where `tripperId = tripperId AND isApproved = true AND isPublic = true`.

`src/lib/helpers/Tripper.ts` — `getAllTestimonialsForTripper()` refactored to async, augments or replaces hardcoded testimonials with DB-backed approved reviews.

`src/app/[locale]/trippers/[tripper]/page.tsx` — already `force-dynamic`, awaits the async helper.

### 7. Tripper reviews dashboard

`src/lib/db/tripper-queries.ts` — update `getTripperReviews()` to actually use the Review model results (currently fetched but discarded). Filter by `tripperId`.

`src/app/[locale]/(secure)/dashboard/tripper/reviews/page.tsx` — wire up the Review model data alongside or replacing the legacy `customerRating` stats.

### 8. Admin reviews UI

`AdminReviewsPageClient.tsx` — minor: surface `tripRequestId` and tripper name in the table. Core approve/hide actions already work.

### 9. Dead code removal

`src/app/api/trips/[id]/route.ts` — remove `PATCH` handler (wrote to `customerRating`, dead since inline form was removed).

### 10. i18n

New `reviewForm` section in both `src/dictionaries/es.json` and `src/dictionaries/en.json`.

New `ReviewFormDict` interface in `src/lib/types/dictionary.ts`.

Keys needed: `pageTitle`, `pageSubtitle`, `ratingLabel`, `titleLabel`, `titlePlaceholder`, `contentLabel`, `contentPlaceholder`, `submitButton`, `successTitle`, `successMessage`, `errorInvalidToken`, `errorAlreadySubmitted`, `errorGeneric`.

---

## Token invalidation strategy

**B + C** (as decided in exploration):
- `reviewSubmittedAt DateTime?` on `TripRequest` — audit trail, idempotent check on page load
- `Review.tripRequestId @unique` — DB-level guard, prevents duplicate Review records regardless of token state

Token (`reviewToken`) is NOT deleted after submission. It remains for audit/support purposes but the `reviewSubmittedAt` field gates re-submission at the application level.

---

## Affected files

| File | Change type |
|------|-------------|
| `prisma/schema.prisma` | Modify — 4 new fields across 2 models |
| `src/app/[locale]/review/[token]/page.tsx` | New |
| `src/app/[locale]/review/[token]/ReviewFormClient.tsx` | New |
| `src/app/api/reviews/route.ts` | New |
| `src/app/api/admin/trip-requests/[id]/route.ts` | Modify — token generation on COMPLETED |
| `src/emails/TripCompleted.tsx` | Modify — `reviewToken` prop + CTA href |
| `src/lib/email/index.ts` | Modify — pass `reviewToken` to email |
| `src/lib/db/tripper-queries.ts` | Modify — new query + fix `getTripperReviews()` |
| `src/lib/helpers/Tripper.ts` | Modify — `getAllTestimonialsForTripper()` async refactor |
| `src/app/[locale]/trippers/[tripper]/page.tsx` | Modify — await async helper |
| `src/app/[locale]/(secure)/dashboard/tripper/reviews/page.tsx` | Modify — wire Review model |
| `src/app/api/trips/[id]/route.ts` | Modify — remove PATCH handler |
| `src/dictionaries/es.json` | Modify — add reviewForm section |
| `src/dictionaries/en.json` | Modify — add reviewForm section |
| `src/lib/types/dictionary.ts` | Modify — add ReviewFormDict |

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Token persisted after email fires → broken review link | Generate + persist token synchronously before `sendTripCompleted` call |
| Spam on public POST endpoint | Token uniqueness + `@unique` DB guard; each token is single-use |
| `getAllTestimonialsForTripper()` sync → async breaks call site | Single call site in the tripper profile page; already `force-dynamic` |
| Legacy `customerRating` data disappears from tripper dashboard | Dual-source query: Review model + TripRequest.customerRating legacy fallback |

---

## Estimated scope

~12–15 files touched, ~400–600 lines changed. On the boundary for a single PR; recommend keeping as single-pr given tight cohesion (schema migration must be atomic with token generation logic).
