# Apply Progress: Experience Approval Flow

## Status: COMPLETE

All 27 tasks across 5 phases implemented. Typecheck: 0 errors. 18 new tests: all GREEN.

---

## Phase 1: Schema & Types

- [x] 1.1 `prisma/schema.prisma` — Added `PENDING_REVIEW` to `ExperienceStatus` enum; removed `displayPrice String`; added `pricingByType Json?` and `reviewNote String? @db.Text`; kept `basePrice` (XSED uses it)
- [x] 1.2 `src/types/tripper.ts` — `ExperienceStatus` union; `ExperienceFormDraft` updated; `ExperienceListItem` updated; `TripperOwnExperienceListItem` updated
- [x] 1.3 `src/lib/admin/types.ts` — `AdminExperience` updated (removed `displayPrice`, added `type[]`, `level`, destination fields, `teaser`, `description`, `heroImage`, pax/nights, `pricingByType`, `reviewNote`)

**USER MUST RUN:**
```bash
npm run db:push
npm run db:generate
```

---

## Phase 2: Server Logic & Tests

- [x] 2.1 `src/lib/helpers/experience-form.ts` — `getExperienceCompleteness()` validates title/type/level/teaser/description/heroImage/destination/activities
- [x] 2.2 `src/lib/admin/experience-pricing.ts` (NEW) — `validatePricingByType()`, filters XSED from types before key comparison
- [x] 2.3 `src/app/api/tripper/experiences/[id]/submit/route.ts` (NEW) — POST, auth+ownership, DRAFT precondition, completeness gate, transitions to PENDING_REVIEW
- [x] 2.4 `src/app/api/admin/experiences/[id]/approve/route.ts` (NEW) — POST, admin-only, PENDING_REVIEW precondition, `validatePricingByType`, transitions to ACTIVE
- [x] 2.5 `src/app/api/admin/experiences/[id]/reject/route.ts` (NEW) — POST, admin-only, PENDING_REVIEW precondition, note required, transitions to DRAFT + saves reviewNote
- [x] 2.6 Tests: 6 submit + 6 approve + 6 reject = 18 tests, all GREEN

---

## Phase 3: API Guards

- [x] 3.1 `src/app/api/tripper/experiences/[id]/route.ts` — PATCH strips `status`/`pricingByType`/`reviewNote`/`basePrice`/`displayPrice` (D2); ACTIVE→DRAFT revert logic added; GET select updated
- [x] 3.2 `src/app/api/tripper/experiences/route.ts` — POST hardcodes `status: "DRAFT"`; removed `basePrice`/`displayPrice` writes
- [x] 3.3 `src/app/api/admin/experiences/route.ts` — GET select updated to include all `AdminExperience` fields

---

## Phase 4: UI

- [x] 4.1 `src/components/app/dashboard/tripper/experiences/NewExperienceShell.tsx` — `isReadOnly` gate (`status === "PENDING_REVIEW"`), rejection banner, submit error banner, `handleSubmit` calls `/submit` endpoint, autosave gated on `!isReadOnly`
- [x] 4.2 `src/components/app/dashboard/tripper/experiences/ExperienceFormContent.tsx` — `<fieldset disabled={isReadOnly}>` wraps accordion; static "En revisión" notice replaces `JourneyActionBar` when read-only
- [x] 4.3 `src/components/app/dashboard/tripper/experiences/ExperiencesPageClient.tsx` — `PENDING_REVIEW` badge color (blue); `pricingByType` price display
- [x] 4.4 `src/components/app/dashboard/tripper/experiences/steps/CapacityPricingStep.tsx` — removed `basePrice` and `displayPrice` input fields
- [x] 4.5 `src/app/[locale]/(secure)/dashboard/admin/AdminExperiencesPageClient.tsx` — tabs (all/pending), clickable PENDING_REVIEW rows, wired `ExperienceReviewPanel`
- [x] 4.6 `src/app/[locale]/(secure)/dashboard/admin/ExperienceReviewPanel.tsx` (NEW) — `Dialog` (not Sheet), per-type price inputs (XSED filtered), two-step reject with note textarea

Supporting:
- [x] `src/lib/db/tripper-queries.ts` — replaced `displayPrice` select with `pricingByType`; `as any` casts for pre-migration fields
- [x] `src/components/app/tripper/tripper-profile/TripperProfileExperiencesPanel.tsx` — removed `displayPrice` reference
- [x] `src/app/api/experiences/route.ts` — removed `basePrice`/`displayPrice` from POST
- [x] `src/lib/constants/packages.ts` — added `PENDING_REVIEW` to `EXPERIENCE_STATUSES`
- [x] `src/app/[locale]/(secure)/dashboard/tripper/experiences/page.tsx` — Prisma select updated
- [x] `src/app/[locale]/(secure)/dashboard/tripper/experiences/[id]/page.tsx` — `initialDraft` updated

---

## Phase 5: i18n & Cleanup

- [x] 5.1 `src/dictionaries/es.json` + `src/dictionaries/en.json` — all new copy keys added
- [x] 5.2 `src/lib/types/dictionary.ts` — `PENDING_REVIEW`, `submitForReview`, `review{}`, `statusBadge{}`, `tabs{}`, `pendingReview`, admin `review{}` sub-objects
- [x] 5.3 typecheck: 0 errors; lint: no raw `<img>` in new files; remaining `displayPrice` refs are view-layer computed strings (JourneyState, FeaturedTripCard) — not DB fields, intentional; server strips guarded fields from tripper PATCH (D2 confirmed)
- [x] 5.4 XSED untouched: `AdminXsedExperience.basePrice` intact; xsed routes unchanged; pre-existing xsed test failures (6) unchanged

---

## Key Design Decisions

| ID | Decision |
|----|----------|
| D1 | Kept `basePrice` on schema — XSED uses it; only removed `displayPrice` DB column |
| D2 | Server strips `status`/`pricingByType`/`reviewNote` from tripper PATCH — no client changes needed |
| D3 | Used `Dialog` (not Sheet) — Sheet not installed in this project's shadcn setup |
| D4 | Single fetch + client-side filter for Pending Review tab |

## Pre-migration Note

`as any` casts are used on Prisma queries that reference `pricingByType` and `reviewNote`. These are temporary — once the user runs `db:push` + `db:generate`, the Prisma client will include these fields and the casts can be removed.

Route handlers use `Request` (not `NextRequest`) — none of the new endpoints require `cookies`, `nextUrl`, or other NextRequest-specific APIs. This matches the pattern used by existing xsed routes and avoids typecheck errors in test files that pass `new Request(...)`.
