# Tasks: review-system

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 450–600 |
| 400-line budget risk | High |
| Chained PRs recommended | No |
| Suggested split | Single PR (tight schema cohesion — token + submission must ship atomically) |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | All 6 phases | PR 1 | Schema migration must be atomic with token logic; single-pr with size:exception |

---

## Phase 1: Schema & Foundation

- [x] 1.1 `prisma/schema.prisma` — Add `reviewToken String? @unique` and `reviewSubmittedAt DateTime?` to `TripRequest` model. Satisfies spec Schema Delta / Scenario 1.1, 1.2, 1.3.
- [x] 1.2 `prisma/schema.prisma` — Add `tripRequestId String? @unique`, `tripperId String?`, and relations (`tripRequest TripRequest?`, `tripper User?` with `"TripperReviews"` relation name) to `Review` model. Satisfies spec Schema Delta / Scenario 4.5 DB guard.
- [x] 1.3 Run `npm run db:migrate` (or `db:push` for dev) to apply schema changes. Verify Prisma client regenerates without errors.
- [x] 1.4 `src/lib/types/dictionary.ts` — Export `ReviewFormDict` interface with all 13 required keys; add `reviewForm: ReviewFormDict` field to `MarketingDictionary`. Satisfies Scenario 9.3.
- [x] 1.5 `src/dictionaries/es.json` — Add `reviewForm` section with all 13 keys in Spanish (`pageTitle`, `pageSubtitle`, `ratingLabel`, `titleLabel`, `titlePlaceholder`, `contentLabel`, `contentPlaceholder`, `submitButton`, `successTitle`, `successMessage`, `errorInvalidToken`, `errorAlreadySubmitted`, `errorGeneric`). Satisfies Scenario 9.1, 9.4.
- [x] 1.6 `src/dictionaries/en.json` — Same 13 keys in English. Satisfies Scenario 9.2, 9.4.
- [x] 1.7 Run `npm run typecheck` — must pass with no dictionary-related errors. Satisfies Scenario 9.3.

## Phase 2: Token Generation + Email

- [x] 2.1 `src/app/api/admin/trip-requests/[id]/route.ts` — On `COMPLETED` status transition: generate `crypto.randomUUID()`, call `prisma.tripRequest.update({ data: { reviewToken } })` synchronously before any email call. Guard: skip if `reviewToken` already set (`?? existing`). Satisfies Scenarios 1.1, 1.2, 1.3.
- [x] 2.2 `src/emails/TripCompleted.tsx` — Add `reviewToken: string` prop; change CTA `href` from `${BASE_URL}/${locale}/dashboard` to `${BASE_URL}/${locale}/review/${reviewToken}`. Satisfies Scenarios 2.1, 2.2.
- [x] 2.3 `src/lib/email/index.ts` — Update `sendTripCompleted()` signature to accept `reviewToken: string` as third parameter; pass it to the email component. Satisfies Scenario 2.1.
- [x] 2.4 `src/app/api/admin/trip-requests/[id]/route.ts` — Update `sendTripCompleted()` call site to pass the persisted `reviewToken`. Satisfies Scenario 2.1.

## Phase 3: Public Review API

- [x] 3.1 `src/app/api/reviews/route.ts` — Create `POST` handler (no auth). Validate body: `token` (string), `rating` (integer 1–5), `content` (non-empty string), `title` (optional string). Return 400 on invalid inputs. Satisfies Scenarios 4.4, 4.5, 4.6, 4.7, 4.10.
- [x] 3.2 Same file — Look up `TripRequest` by `reviewToken`; return 404 if not found. Return 409 if `reviewSubmittedAt` is already set. Satisfies Scenarios 4.2, 4.3.
- [x] 3.3 Same file — In `prisma.$transaction`: create `Review` record with `tripRequestId`, `tripperId` (from TripRequest, nullable), `rating`, `title`, `content`, `isApproved: false`, `isPublic: false`; update `TripRequest.reviewSubmittedAt = new Date()`. Return `{ success: true }`. Satisfies Scenarios 4.1, 4.8, 4.9.

## Phase 4: Public Review Page

- [x] 4.1 `src/app/[locale]/review/[token]/page.tsx` — Server component. Normalize locale with `hasLocale()`; call `getDictionary(locale)`. Look up `TripRequest` by `reviewToken` via Prisma. Render error state (`errorInvalidToken`) if not found; render inline success state if `reviewSubmittedAt` is set; else render `<ReviewFormClient>` with trip summary + sliced `copy` + `token` prop. Page must have no auth guard. Satisfies Scenarios 3.1, 3.2, 3.3, 3.10, 9.1, 9.2, 9.6.
- [x] 4.2 `src/app/[locale]/review/[token]/ReviewFormClient.tsx` — Client component. Uses `useParams()` for locale; imports dictionaries statically. Renders star rating (1–5, required), title (optional, `maxLength={100}`), content (required, `maxLength={1000}`). Validates client-side before submit. `POST /api/reviews`; on success replaces form with inline success state (no redirect). Satisfies Scenarios 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 9.5.
- [x] 4.3 `src/middleware.ts` — Verify `/review/[token]` path is excluded from any session-required middleware matcher. Satisfies Scenario 3.10. (review page is under `/[locale]/review/` outside `(secure)` layout group — no auth guard applies)

## Phase 5: Tripper Profile + Dashboard Wiring

- [x] 5.1 `src/lib/db/tripper-queries.ts` — Add `getApprovedReviewsForTripper(tripperId: string)`: query `Review` where `tripperId`, `isApproved: true`, `isPublic: true`. Satisfies Scenarios 6.1, 6.2, 6.3.
- [x] 5.2 `src/lib/db/tripper-queries.ts` — Update `getTripperReviews()` to return Review model records filtered by `tripperId` (currently fetched but discarded). Satisfies Scenario 7.1.
- [x] 5.3 `src/lib/helpers/Tripper.ts` — Refactor `getAllTestimonialsForTripper()` from sync to async; call `getApprovedReviewsForTripper()` and merge with or replace hardcoded testimonials. Satisfies Scenarios 6.1, 6.4.
- [x] 5.4 `src/app/[locale]/trippers/[tripper]/page.tsx` — Await the now-async `getAllTestimonialsForTripper()`; pass DB-backed reviews to the reviews section. Render empty state when array is empty. Satisfies Scenarios 6.1, 6.4.
- [x] 5.5 `src/app/[locale]/(secure)/dashboard/tripper/reviews/page.tsx` — Wire Review model records (from `getTripperReviews()`) alongside legacy `customerRating`/`customerFeedback` TripRequest fields. Both sources must coexist in the rendered output. Satisfies Scenarios 7.1, 7.2.
- [x] 5.6 Admin reviews page (`src/app/[locale]/(secure)/dashboard/admin/(shell)/reviews/` + `AdminReviewsPageClient.tsx`) — Surface `tripRequestId` (or a derived link) and tripper name (or "RandomTrip") in the review table row. Satisfies Scenarios 5.1, 5.2, 5.3, 5.4.

## Phase 6: Dead Code Removal + Final Verification

- [x] 6.1 `src/app/api/trips/[id]/route.ts` — Remove the `PATCH` handler entirely. Satisfies Scenarios 8.1, 8.2.
- [x] 6.2 Run `npm run typecheck` — zero errors. Satisfies Scenario 8.2, 9.3.
- [x] 6.3 Run `npm run lint` — pre-existing environment issue (Macintosh HD symlink creates false `lint` directory); no raw `<img>` tags in new files verified with rg. Satisfies Scenario 8.2.
