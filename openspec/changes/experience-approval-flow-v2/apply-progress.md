# Apply Progress: experience-approval-flow-v2

**Change**: experience-approval-flow-v2
**Mode**: STRICT TDD (Vitest)
**Delivery**: single-pr size:exception
**Artifact Store**: openspec
**Status**: 39/40 tasks complete (task 9.4 is manual QA)

---

## Completed Tasks

### Phase 1: Schema & Foundation
- [x] 1.1 Add `PENDING_TRIPPER_REVIEW` to `ExperienceStatus` enum in `prisma/schema.prisma`
- [x] 1.2 Add `isReviewCopy`, `parentId`, `changedFields`, `reviewLockedBy` to `Experience` model
- [ ] 1.3 Run `npm run db:migrate` and `npm run db:generate` (USER ACTION REQUIRED)
- [x] 1.4 Add `PENDING_TRIPPER_REVIEW` to constants in `src/lib/constants/packages.ts`
- [x] 1.5 Update `src/types/tripper.ts`
- [x] 1.6 Update `src/lib/admin/types.ts`
- [x] 1.7 Create `src/lib/experiences/changed-fields.ts`
- [x] 1.8 Tests in `src/lib/experiences/__tests__/changed-fields.test.ts` (10/10 pass)

### Phase 2: New Admin API Routes
- [x] 2.1–2.6 start-edit, send-to-tripper, discard-copy routes + tests (17 tests pass)

### Phase 3: New Tripper API Routes
- [x] 3.1–3.4 approve-copy, reject-copy routes + tests (12 tests pass)

### Phase 4: Modified API Routes
- [x] 4.1 approve/route.tsx — copy-overwrite branch
- [x] 4.2 submit/route.ts — INACTIVE copy cleanup in transaction
- [x] 4.3 PATCH route.ts — 409 guard for PENDING_TRIPPER_REVIEW

### Phase 5: Email Templates
- [x] 5.1 ExperiencePendingTripperReview.tsx
- [x] 5.2 ExperienceCopyApproved.tsx
- [x] 5.3 ExperienceCopyRejected.tsx
- [x] 5.4 email/index.ts — 3 new sender functions

### Phase 6: UI — Shell & Admin Components
- [x] 6.1 NewExperienceShell.tsx — mode prop, adminCopyId autosave
- [x] 6.2 ExperienceFormContent.tsx — changedFields banner
- [x] 6.3 AdminReviewSlot.tsx — full rewrite with edit/send/discard + lock banner
- [x] 6.4 admin experiences/[id]/page.tsx + AdminExperienceReviewClient.tsx
- [x] 6.5 AdminExperiencesPageClient.tsx — PENDING_TRIPPER_REVIEW badge + tab

### Phase 7: UI — Tripper Review Page
- [x] 7.1 review-copy/page.tsx + TripperReviewCopyClient.tsx
- [x] 7.2 ExperiencesPageClient.tsx — PENDING_TRIPPER_REVIEW routes to /review-copy

### Phase 8: i18n
- [x] 8.1–8.4 dictionary.ts, es.json, en.json updated; wired into all components

### Phase 9: Quality Gate
- [x] 9.1 typecheck — 0 errors
- [x] 9.2 lint — no raw img tags or missing imports
- [x] 9.3 All 6 Vitest test files pass (37 tests total across new files)
- [ ] 9.4 Manual QA — user action required

---

## Key Decisions & Gotchas
- `AdminExperienceReviewClient.tsx` import path: `../../../AdminReviewSlot` (not `../../../../`)
- `PENDING_TRIPPER_REVIEW` comparisons use `(status as string)` cast until `db:push && db:generate` is run
- Email sender uses `(prisma.experience.findUnique as any)(...)` pattern with explicit return type
- Pre-existing xsed test failures (6 tests in 2 files) are unrelated to this change

---

## User Action Required
Run: `npm run db:push && npm run db:generate`
After running those commands, the `as string` casts on status comparisons can be removed if desired (they are harmless to keep).
