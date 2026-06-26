# Spec: review-system

**Change name:** review-system
**Date:** 2026-06-23
**Status:** spec
**Artifact store:** openspec

---

## Scope

This spec describes the behavioral requirements for the review-system change: what the system MUST do after the change is applied. It does not prescribe implementation details.

---

## Domain 1 — Token Generation

### Requirements

1. When an admin transitions a TripRequest to status `COMPLETED`, a unique `reviewToken` MUST be generated and persisted on that TripRequest record before any email is sent.
2. The `reviewToken` MUST be globally unique across all TripRequest records (`@unique` constraint).
3. If a `COMPLETED` transition is triggered on a TripRequest that already has a `reviewToken`, the existing token MUST NOT be overwritten.
4. The `reviewToken` is never deleted after review submission. It persists for audit purposes.

### Acceptance Scenarios

**Scenario 1.1 — Token generated on COMPLETED transition**
- Given: a TripRequest in status `CONFIRMED` with no `reviewToken`
- When: an admin transitions the TripRequest to `COMPLETED`
- Then: a `reviewToken` (non-empty, UUID format) is set on the TripRequest record AND the record is persisted before the email fires

**Scenario 1.2 — Token not overwritten on re-transition**
- Given: a TripRequest in status `COMPLETED` with an existing `reviewToken = "abc-123"`
- When: the COMPLETED transition logic is triggered again (e.g. retry or re-save)
- Then: the `reviewToken` remains `"abc-123"` — it is not replaced

**Scenario 1.3 — Token uniqueness**
- Given: multiple TripRequests are transitioned to COMPLETED
- Then: each TripRequest receives a distinct `reviewToken`; no two share the same value

---

## Domain 2 — Email CTA

### Requirements

1. The TripCompleted email MUST include a CTA link that points to `/${locale}/review/${reviewToken}`.
2. The email MUST NOT link to `/${locale}/dashboard` or any other path as its review CTA.
3. The `reviewToken` MUST be passed into the email component at send time (not constructed inside the email).

### Acceptance Scenarios

**Scenario 2.1 — CTA links to review page**
- Given: a TripRequest is transitioned to COMPLETED with `reviewToken = "xyz-789"` and `locale = "es"`
- When: the TripCompleted email is sent
- Then: the email CTA href is `/es/review/xyz-789`

**Scenario 2.2 — CTA does not link to dashboard**
- Given: any TripCompleted email
- Then: no CTA in that email links to `/${locale}/dashboard`

---

## Domain 3 — Public Review Page (`/[locale]/review/[token]`)

### Requirements

1. The page MUST be accessible without an authenticated session (no login required).
2. Given a valid token where `reviewSubmittedAt` is null: the page MUST render the review form together with a summary of the trip.
3. Given a valid token where `reviewSubmittedAt` is set: the page MUST render an inline success state and MUST NOT render the form.
4. Given an invalid or non-existent token: the page MUST render an error state with the `errorInvalidToken` copy.
5. The review form MUST include:
   - Star rating input: 1–5 stars, required, no half-stars
   - Title field: optional, maximum 100 characters
   - Content textarea: required, maximum 1000 characters
6. On successful form submission: the form MUST be replaced by an inline success state. No redirect occurs.
7. The locale for all copy MUST be derived from the `[locale]` path segment and normalized with `hasLocale()` before use.

### Acceptance Scenarios

**Scenario 3.1 — Valid token, no prior submission**
- Given: `GET /es/review/valid-token-abc` where `TripRequest.reviewSubmittedAt` is null
- Then: HTTP 200, page renders the review form and a trip summary (destination, dates, or equivalent available fields)

**Scenario 3.2 — Valid token, already submitted**
- Given: `GET /es/review/valid-token-abc` where `TripRequest.reviewSubmittedAt` is set
- Then: HTTP 200, page renders the inline success state; no form is present in the DOM

**Scenario 3.3 — Invalid token**
- Given: `GET /es/review/does-not-exist`
- Then: HTTP 200 (page renders), error state using `errorInvalidToken` copy is shown; no form is present

**Scenario 3.4 — Rating field is required**
- Given: the review form is rendered
- When: the user submits without selecting a rating
- Then: form submission is blocked client-side with a validation error on the rating field

**Scenario 3.5 — Content field is required**
- Given: the review form is rendered
- When: the user submits with an empty content field
- Then: form submission is blocked with a validation error on the content field

**Scenario 3.6 — Title field is optional**
- Given: the review form is rendered
- When: the user submits with a valid rating and content but an empty title
- Then: submission proceeds successfully

**Scenario 3.7 — Title max length enforced**
- Given: the review form is rendered
- When: the user enters more than 100 characters in the title field
- Then: the field prevents or trims input beyond 100 characters (client-side enforcement)

**Scenario 3.8 — Content max length enforced**
- Given: the review form is rendered
- When: the user enters more than 1000 characters in the content field
- Then: the field prevents or trims input beyond 1000 characters (client-side enforcement)

**Scenario 3.9 — Success state after submission**
- Given: a valid review form rendered
- When: the user submits a valid review
- Then: the form is replaced by the inline success state showing `successTitle` and `successMessage` copy; the page does not navigate away

**Scenario 3.10 — Page accessible without session**
- Given: a user who is not logged in
- When: they visit `/es/review/<valid-token>`
- Then: the page loads normally — no auth redirect occurs

---

## Domain 4 — Review Submission API (`POST /api/reviews`)

### Requirements

1. The endpoint MUST be public — no session or auth token required.
2. A valid request body contains: `token` (string), `rating` (integer 1–5), `content` (non-empty string), and optionally `title` (string).
3. On success: a `Review` record MUST be created with `isApproved: false` and `isPublic: false`. The `TripRequest.reviewSubmittedAt` MUST be set to the current timestamp in the same transaction.
4. `Review.tripperId` MUST be populated from `TripRequest.tripperId`. If the TripRequest has no tripper (RandomTrip), `tripperId` is null.
5. `Review.tripRequestId` MUST be set to the resolved TripRequest's id.
6. Duplicate submission (same token, `reviewSubmittedAt` already set): MUST return HTTP 409.
7. Non-existent token: MUST return HTTP 404.
8. `rating` outside integer range 1–5: MUST return HTTP 400.
9. Empty `content`: MUST return HTTP 400.
10. The DB `@unique` constraint on `Review.tripRequestId` provides an additional hard guard against duplicate Review records, independently of the application-level `reviewSubmittedAt` check.

### Acceptance Scenarios

**Scenario 4.1 — Successful submission**
- Given: `POST /api/reviews` with `{ token: "valid-token", rating: 4, content: "Great trip!", title: "Loved it" }`
- When: no prior review exists for that token
- Then: HTTP 200, `{ success: true }`, Review record created (`isApproved: false`, `isPublic: false`), `TripRequest.reviewSubmittedAt` set

**Scenario 4.2 — Duplicate submission**
- Given: `POST /api/reviews` with a valid token where `TripRequest.reviewSubmittedAt` is already set
- Then: HTTP 409, no new Review record created

**Scenario 4.3 — Unknown token**
- Given: `POST /api/reviews` with `{ token: "ghost-token", rating: 3, content: "Fine" }`
- Then: HTTP 404

**Scenario 4.4 — Rating below range**
- Given: `POST /api/reviews` with `{ token: "valid", rating: 0, content: "Bad" }`
- Then: HTTP 400

**Scenario 4.5 — Rating above range**
- Given: `POST /api/reviews` with `{ token: "valid", rating: 6, content: "Superb" }`
- Then: HTTP 400

**Scenario 4.6 — Rating is not an integer**
- Given: `POST /api/reviews` with `{ token: "valid", rating: 3.5, content: "Ok" }`
- Then: HTTP 400

**Scenario 4.7 — Empty content**
- Given: `POST /api/reviews` with `{ token: "valid", rating: 5, content: "" }`
- Then: HTTP 400

**Scenario 4.8 — tripperId from TripRequest (tripper trip)**
- Given: a TripRequest with `tripperId = "tripper-uuid"` resolved by the token
- When: the review is created
- Then: `Review.tripperId = "tripper-uuid"`

**Scenario 4.9 — tripperId null (RandomTrip)**
- Given: a TripRequest with `tripperId = null` resolved by the token
- When: the review is created
- Then: `Review.tripperId = null`

**Scenario 4.10 — No session required**
- Given: `POST /api/reviews` from an unauthenticated request with a valid payload
- Then: HTTP 200, review is created (auth header absence does not cause a 401)

---

## Domain 5 — Admin Review Moderation

### Requirements

1. Review records created via the new submission flow MUST appear in the admin reviews list at `/dashboard/admin/reviews/`.
2. The existing approve and hide/show toggle actions MUST continue to function for new Review records.
3. Each Review record in the admin list MUST expose the associated `tripRequestId` to allow tracing back to the originating trip.
4. The admin list MUST show the tripper name (or "RandomTrip" / equivalent) for each review where `tripperId` is set.

### Acceptance Scenarios

**Scenario 5.1 — New reviews appear in admin list**
- Given: a Review is created via `POST /api/reviews`
- When: an admin visits `/dashboard/admin/reviews/`
- Then: the new review appears in the list with `isApproved: false` and `isPublic: false` as initial state

**Scenario 5.2 — Approve action works on new reviews**
- Given: a new Review in the admin list with `isApproved: false`
- When: the admin clicks approve
- Then: `Review.isApproved` becomes `true`

**Scenario 5.3 — Hide action works on new reviews**
- Given: a Review with `isPublic: true`
- When: the admin toggles hide
- Then: `Review.isPublic` becomes `false`

**Scenario 5.4 — tripRequestId visible in admin table**
- Given: any Review with a non-null `tripRequestId`
- When: the admin views the reviews list
- Then: the `tripRequestId` (or a link derived from it) is visible in the row

---

## Domain 6 — Tripper Public Profile (`/trippers/[tripper]`)

### Requirements

1. The reviews section on the tripper public profile MUST display reviews that are both `isApproved: true` AND `isPublic: true` and are linked to that tripper via `Review.tripperId`.
2. If no approved + public reviews exist for a tripper, the reviews section MUST render an empty state — not an error or a hidden section.
3. Reviews from the new `Review` model replace (or augment, per proposal) hardcoded testimonial data.

### Acceptance Scenarios

**Scenario 6.1 — Approved reviews displayed**
- Given: a Review with `tripperId = "t1"`, `isApproved: true`, `isPublic: true`
- When: a visitor views `/es/trippers/t1-slug`
- Then: the review content appears in the reviews section

**Scenario 6.2 — Unapproved reviews not displayed**
- Given: a Review with `tripperId = "t1"`, `isApproved: false`
- When: a visitor views the tripper's public profile
- Then: that review does NOT appear

**Scenario 6.3 — Private reviews not displayed**
- Given: a Review with `tripperId = "t1"`, `isApproved: true`, `isPublic: false`
- When: a visitor views the tripper's public profile
- Then: that review does NOT appear

**Scenario 6.4 — Empty state on zero approved reviews**
- Given: a tripper with no reviews where `isApproved: true AND isPublic: true`
- When: a visitor views the tripper's public profile
- Then: the reviews section renders an empty state (not a JS error, not a missing section)

---

## Domain 7 — Tripper Reviews Dashboard

### Requirements

1. The tripper reviews page at `/dashboard/tripper/reviews` MUST display Review model records filtered by `tripperId = current tripper`.
2. The legacy `TripRequest.customerRating` / `customerFeedback` data MUST remain visible — it MUST NOT be removed or hidden by this change.
3. Both sources (Review model + legacy TripRequest fields) MUST coexist in the dashboard view.

### Acceptance Scenarios

**Scenario 7.1 — New Review records appear in tripper dashboard**
- Given: a Review with `tripperId = "t1"` has been submitted and exists in the DB
- When: tripper "t1" visits their reviews dashboard
- Then: the review appears in the list

**Scenario 7.2 — Legacy customerRating still visible**
- Given: a TripRequest with `customerRating = 4` and `customerFeedback = "Good"` belonging to tripper "t1"
- When: tripper "t1" views their reviews dashboard
- Then: the legacy rating and feedback remain visible in the dashboard (not removed)

---

## Domain 8 — Dead Code Removal

### Requirements

1. The `PATCH` handler on `src/app/api/trips/[id]/route.ts` MUST NOT exist after this change is applied.
2. No other route or component MUST reference or depend on that PATCH handler after removal.

### Acceptance Scenarios

**Scenario 8.1 — PATCH endpoint removed**
- Given: the change is applied
- When: `PATCH /api/trips/{any-id}` is called
- Then: HTTP 405 (Method Not Allowed) or HTTP 404 — the handler no longer exists

**Scenario 8.2 — No broken callers**
- Given: the PATCH handler is removed
- Then: `npm run typecheck` and `npm run lint` both pass with no errors referencing that endpoint

---

## Domain 9 — i18n

### Requirements

1. All user-visible strings on the review form page MUST be present in both `src/dictionaries/es.json` and `src/dictionaries/en.json` under the `reviewForm` key.
2. A `ReviewFormDict` interface MUST be exported from `src/lib/types/dictionary.ts` and referenced inside `MarketingDictionary`.
3. NO hardcoded English-only or Spanish-only strings are permitted in the review page or form component.
4. The following keys MUST exist in both dictionaries:
   - `pageTitle`
   - `pageSubtitle`
   - `ratingLabel`
   - `titleLabel`
   - `titlePlaceholder`
   - `contentLabel`
   - `contentPlaceholder`
   - `submitButton`
   - `successTitle`
   - `successMessage`
   - `errorInvalidToken`
   - `errorAlreadySubmitted`
   - `errorGeneric`
5. The `ReviewFormClient` component MUST NOT call `getDictionary()` (async, server-only). The accepted pattern is for the server page to resolve the dictionary and pass `copy: ReviewFormDict` as a prop — this avoids importing both locale bundles on the client.
6. The server page (`/[locale]/review/[token]/page.tsx`) MUST normalize the locale with `hasLocale()` before calling `getDictionary()`.

### Acceptance Scenarios

**Scenario 9.1 — es locale renders Spanish copy**
- Given: a visitor accesses `/es/review/<token>`
- Then: all form labels, placeholders, and messages are in Spanish

**Scenario 9.2 — en locale renders English copy**
- Given: a visitor accesses `/en/review/<token>`
- Then: all form labels, placeholders, and messages are in English

**Scenario 9.3 — TypeScript typecheck passes**
- Given: `ReviewFormDict` interface is defined and `MarketingDictionary` includes `reviewForm: ReviewFormDict`
- When: `npm run typecheck` runs
- Then: exit code 0, no type errors related to dictionary keys

**Scenario 9.4 — All 13 required keys present in both locales**
- Given: `src/dictionaries/es.json` and `src/dictionaries/en.json`
- Then: each file contains a `reviewForm` object with all 13 keys listed in requirement 9.4

---

## Schema Delta

The following fields MUST be added to the Prisma schema as part of this change:

**TripRequest model:**
```
reviewToken       String?   @unique
reviewSubmittedAt DateTime?
```

**Review model:**
```
tripRequestId  String?       @unique
tripperId      String?
```

These additions are a prerequisite for all other domains. The `@unique` on both `reviewToken` and `tripRequestId` are non-negotiable — they are the primary guards against token collision and duplicate review records.

---

## Out of Scope

The following are explicitly NOT covered by this spec:

- Backfilling legacy `TripRequest.customerRating` / `customerFeedback` data into the `Review` model
- Editing or deleting submitted reviews
- Replying to reviews
- Rate limiting or CAPTCHA on `POST /api/reviews`
- Email preview or test rendering
- Homepage testimonials from RandomTrip reviews (noted in proposal goals but not specced here — no exploration data on the homepage testimonials component was provided)

---

## Constraints

- The review page is accessible without a session. Any session-dependent middleware MUST exclude the `/review/[token]` path.
- Component conventions: `ReviewFormClient` is a client component with a single responsibility. It lives at `src/app/[locale]/review/[token]/ReviewFormClient.tsx`. It receives `copy` sliced from the dictionary and a `token` prop. It does NOT receive the full dictionary.
- No barrel `index.ts` files are introduced.
- Domain types for review form data (if needed beyond Prisma types) go in `src/types/`, not inline in the component file.
