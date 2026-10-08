# Review locale filter

## Objective

Public review surfaces show only reviews written in the current UI locale, mirroring how the blog shows each locale only its own posts.

## Problem / why

`Review` stores no language, so `/en` pages show Spanish reviews and vice versa. `User.locale` is the user's last-browsed UI language (overwritten by `useSyncLocale`), so it cannot identify a review's language: it drifts after submission and forces one language per user.

## Scope

- Add `Review.locale` (`"es" | "en"`, default `"es"`), fixed at submission from the review page route locale.
- Backfill existing rows from the author's `User.locale` (fallback `es`).
- Filter public review queries and the tripper testimonials API by locale.
- Filter only: no translation of review content.

Out of scope: tripper dashboard, admin, and traveler private review views (they keep showing all reviews); XSED testimonials (they come from `TripRequest.customerFeedback`).

## Constraints

- Migration is additive only; rollout SQL follows `prisma/rollouts/blog-content-translations.sql`.
- Locale normalized with `hasLocale()`; anything invalid falls back to `es`.
- No commits without explicit user approval.

## Tasks

- [x] T1 Schema + migration + rollout SQL (column, index, backfill from users.locale) — route: delegated (writer trigger: 2+ non-trivial files)
- [x] T2 Submission saves locale: review page → form → `POST /api/reviews` with validation; tests — route: delegated
- [x] T3 Public queries take locale: `getHomepageTestimonials`, `getReviewsForTripType`, `getApprovedReviewsForTripper` / `getAllTestimonialsForTripper`; callers on home, by-type, tripper profile; tests — route: delegated
- [x] T4 Tripper testimonials API accepts `?locale=`; `BlogPostClient` sends it — route: delegated
- [x] T5 Checks: typecheck, lint, focused vitest — route: delegated with writer

## Acceptance criteria

- New reviews persist the locale of the page they were submitted from.
- `/en` public surfaces show only `en` reviews; `/es` only `es` reviews.
- Existing reviews have a locale matching their author's `User.locale`, or `es`.

## Checks

`npm run typecheck`, `npm run lint`, `npx vitest run` on the touched test files.

## Progress

- Exploration done; design decided with the user (separate column, backfill from User.locale, filter only).
- Delivery strategy: ask-on-risk; forecast ~250 authored lines, single slice.

- T1–T5 implemented by one delegated writer (uncommitted). Test-first: new tests in `src/app/api/reviews/__tests__/route.test.ts` (4 failing) and `src/lib/db/__tests__/tripper-queries.publicReviewsLocale.test.ts` (6 failing) observed RED before implementation, then GREEN.
- Migration `prisma/migrations/20261007120000_review_locale/migration.sql` and rollout `prisma/rollouts/review-locale.sql` written; `npx prisma generate` and `npx prisma validate` run. No migrate/db push executed against any database.

## Verification evidence

- `npx vitest run src/app/api/reviews src/lib/db/__tests__/tripper-queries.publicReviewsLocale.test.ts src/lib/db/__tests__/tripper-queries.getTripperReviews.test.ts`: 3 files, 35 tests passed.
- `npx vitest run src/app/[locale]/experiences/by-type src/app/[locale]/trippers src/components/by-type` (callers): 22 tests passed.
- `npm run typecheck`: no errors.
- `npm run lint`: no errors or warnings.
- Pending: manual QA on `/es` and `/en` (home, by-type, tripper profile, blog post); applying the rollout SQL to the approved target.

## Next step

User reviews the diff and decides on the work-unit commit; apply `prisma/rollouts/review-locale.sql` to the approved database before deploying.
