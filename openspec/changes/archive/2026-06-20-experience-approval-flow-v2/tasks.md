# Tasks: Experience Approval Flow v2

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1,400–1,800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Schema + types + utilities → PR 2: API routes + email templates → PR 3: UI + i18n |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: size-exception
400-line budget risk: High

> **Note — delivery strategy is `single-pr`**: the orchestrator must record a `size:exception` before launching `sdd-apply`. The estimate (~1,600 changed lines) exceeds the 400-line budget by ~4×. Suggest admin approval before proceeding.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Schema migration + TS types + constants + utility functions | PR 1 (base: main) | Additive only; safe to ship independently |
| 2 | API routes (5 new + 3 modified) + email templates | PR 2 (base: PR 1) | All server logic; tests travel with routes |
| 3 | UI: Shell mode prop, admin slot, tripper review page + i18n | PR 3 (base: PR 2) | All client changes; i18n finalized here |

---

## Phase 1: Schema & Foundation

- [x] 1.1 Add `PENDING_TRIPPER_REVIEW` to `ExperienceStatus` enum in `prisma/schema.prisma`
- [x] 1.2 Add `isReviewCopy Boolean @default(false)`, `parentId String?`, `changedFields String[] @default([])`, `reviewLockedBy String?` to `Experience` model in `prisma/schema.prisma`
- [ ] 1.3 Run `npm run db:migrate` and `npm run db:generate` to apply migration and regenerate Prisma client
- [x] 1.4 Add `PENDING_TRIPPER_REVIEW` to the `ExperienceStatus` union/constant in `src/lib/constants/packages.ts`
- [x] 1.5 Update `src/types/tripper.ts`: add `PENDING_TRIPPER_REVIEW` to any status union types, add `isReviewCopy`, `parentId`, `changedFields`, `reviewLockedBy` to relevant experience interfaces
- [x] 1.6 Update `src/lib/admin/types.ts`: add copy-related fields (`isReviewCopy`, `parentId`, `changedFields`, `reviewLockedBy`) to `AdminExperience` interface
- [x] 1.7 Create `src/lib/experiences/changed-fields.ts`: pure `computeChangedFields(copy, original)` function that deep-compares all mutable fields (JSON fields via `JSON.stringify`, scalars/arrays direct compare); export the mutable field list as a constant
- [x] 1.8 Write unit tests for `computeChangedFields` in `src/lib/experiences/__tests__/changed-fields.test.ts`: scalar change, JSON field change, array change, no-change returns `[]`, all-fields-changed returns full list

---

## Phase 2: New Admin API Routes

- [x] 2.1 Create `src/app/api/admin/experiences/[id]/start-edit/route.ts`: transactional soft-lock; idempotent re-entry if caller already holds lock; 409 with locker identity if another admin holds it; 201 with copy id on creation; 403 if not ADMIN; guard: original must be `PENDING_REVIEW`
- [x] 2.2 Write tests for `start-edit` in `__tests__/start-edit.test.ts`: 401, 403, 404 (original not found), 409 (locked by other admin), 201 happy path (copy created + lock set), 201 idempotent re-entry (no second copy)
- [x] 2.3 Create `src/app/api/admin/experiences/[id]/send-to-tripper/route.ts`: call `computeChangedFields`; 422 if result empty; store `changedFields` on copy; transition original → `PENDING_TRIPPER_REVIEW`; clear `reviewLockedBy`; trigger `ExperiencePendingTripperReview` email to tripper
- [x] 2.4 Write tests for `send-to-tripper` in `__tests__/send-to-tripper.test.ts`: 401, 403, 404 (no copy), 422 (no changed fields), 200 happy path (changedFields stored + status updated + lock cleared), edge case (single field changed)
- [x] 2.5 Create `src/app/api/admin/experiences/[id]/discard-copy/route.ts`: transactional hard-delete of copy + clear `reviewLockedBy` on original; 404 if no copy; 403 if not ADMIN
- [x] 2.6 Write tests for `discard-copy` in `__tests__/discard-copy.test.ts`: 401, 403, 404 (no copy), 200 happy path (copy deleted + lock cleared + original remains PENDING_REVIEW), edge case (discard after edit without sending)

---

## Phase 3: New Tripper API Routes

- [x] 3.1 Create `src/app/api/tripper/experiences/[id]/approve-copy/route.ts`: single `prisma.$transaction`; overwrite original with copy's mutable fields (preserve id, ownerId, createdAt, slug); set `changedFields=[]`, `status=ACTIVE`, `isActive=true`; hard-delete copy; send `ExperienceCopyApproved` email to admin
- [x] 3.2 Write tests for `approve-copy` in `__tests__/approve-copy.test.ts`: 401, 403 (not owner), 409 (original not in PENDING_TRIPPER_REVIEW), 404 (no copy), 200 happy path (overwrite + copy deleted + ACTIVE), edge case (verify identity fields preserved)
- [x] 3.3 Create `src/app/api/tripper/experiences/[id]/reject-copy/route.ts`: set copy → `INACTIVE`; set original → `DRAFT`; send `ExperienceCopyRejected` email to admin
- [x] 3.4 Write tests for `reject-copy` in `__tests__/reject-copy.test.ts`: 401, 403, 409 (wrong status), 404 (no copy), 200 happy path (copy INACTIVE + original DRAFT), edge case (tripper can edit again after reject — PATCH no longer blocked)

---

## Phase 4: Modified API Routes

- [x] 4.1 Modify `src/app/api/admin/experiences/[id]/approve/route.tsx`: branch on whether a non-INACTIVE copy exists for the original; if yes → execute the same atomic overwrite from `approve-copy`; if no → existing direct-approve path; update tests to cover both branches
- [x] 4.2 Modify `src/app/api/tripper/experiences/[id]/submit/route.ts`: inside the `DRAFT → PENDING_REVIEW` transaction, look for an `INACTIVE` copy (`parentId = original.id`, `isReviewCopy=true`, `status=INACTIVE`); if found, hard-delete it in the same transaction; update/add test for the INACTIVE-copy cleanup scenario
- [x] 4.3 Modify `src/app/api/tripper/experiences/[id]/route.ts` (PATCH handler): add guard at the top — if `experience.status === 'PENDING_TRIPPER_REVIEW'` return 409; add test case for this guard

---

## Phase 5: Email Templates

- [x] 5.1 Create `src/emails/ExperiencePendingTripperReview.tsx`: email to tripper; props — `tripperName`, `experienceTitle`, `changedFields: string[]`, `reviewUrl`, `locale`; es + en copy inline or via i18n map
- [x] 5.2 Create `src/emails/ExperienceCopyApproved.tsx`: email to admin; props — `adminName`, `experienceTitle`, `tripperName`, `locale`
- [x] 5.3 Create `src/emails/ExperienceCopyRejected.tsx`: email to admin; props — `adminName`, `experienceTitle`, `tripperName`, `locale`
- [x] 5.4 Add three sender functions in `src/lib/email/index.ts` (or wherever existing senders live adjacent to `sendMail`): `sendExperiencePendingTripperReview`, `sendExperienceCopyApproved`, `sendExperienceCopyRejected`

---

## Phase 6: UI — Shell & Admin Components

- [x] 6.1 Add `mode: 'tripper' | 'adminEdit' | 'adminReadOnly'` and `adminCopyId?: string` props to `NewExperienceShell.tsx`; replace status-based `isReadOnly` derivation (line ~134) with `mode !== 'tripper' && mode !== 'adminEdit'` logic; route autosave PATCH to `adminCopyId` when `mode === 'adminEdit'`
- [x] 6.2 Add `changedFields?: string[]` prop to `ExperienceFormContent.tsx`; apply a highlight class (e.g. `ring-2 ring-amber-400`) to form fields whose name appears in `changedFields`
- [x] 6.3 Modify `AdminReviewSlot.tsx`: add three action buttons — "Edit" (calls `start-edit`, sets `adminEdit` mode), "Send to tripper" (calls `send-to-tripper`), "Discard" (calls `discard-copy`); show soft-lock warning banner when `reviewLockedBy` is set and is not the current admin
- [x] 6.4 Modify the admin experience page (`src/app/[locale]/(secure)/.../admin/.../experiences/[id]/page.tsx`): pass resolved `mode` prop to `NewExperienceShell`; pass `adminCopyId` when in `adminEdit` mode; render `AdminReviewSlot` with action handlers
- [x] 6.5 Modify `AdminExperiencesPageClient.tsx`: add `PENDING_TRIPPER_REVIEW` tab/badge; filter and count rows by this status; no routing change needed

---

## Phase 7: UI — Tripper Review Page

- [x] 7.1 Create `src/app/[locale]/(secure)/dashboard/tripper/experiences/[id]/review-copy/page.tsx`: server page; fetch original (must be `PENDING_TRIPPER_REVIEW`) and associated copy; render `NewExperienceShell` in `adminReadOnly` mode with copy data; render `changedFields` summary panel; include "Approve" and "Reject" buttons that call tripper endpoints then redirect
- [x] 7.2 Modify `ExperiencesPageClient.tsx` (tripper side): show `PENDING_TRIPPER_REVIEW` status badge on the experience card/row; link to the `review-copy` page for experiences in that status

---

## Phase 8: i18n

- [x] 8.1 Add `experienceReview` section to `src/lib/types/dictionary.ts` with all new UI copy keys (soft-lock banner, action button labels, changed-fields summary, approve/reject confirmation, status badge)
- [x] 8.2 Add `experienceReview` section with all keys to `src/dictionaries/es.json`
- [x] 8.3 Add `experienceReview` section with all keys to `src/dictionaries/en.json`
- [x] 8.4 Wire dictionary keys into all modified/new components (replace any hardcoded strings added in phases 6–7)

---

## Phase 9: Quality Gate

- [x] 9.1 Run `npm run typecheck` and fix every unhandled `ExperienceStatus` union member across all switch/conditional statements
- [x] 9.2 Run `npm run lint` and fix any raw `<img>` tags, missing imports, or ESLint errors introduced in this change
- [x] 9.3 Verify all 6 Vitest test files pass (`start-edit`, `send-to-tripper`, `discard-copy`, `approve-copy`, `reject-copy`, `changed-fields`)
- [ ] 9.4 Manual QA: run the full 7-transition happy path (submit → start-edit → send-to-tripper → approve-copy) and verify emails fire; run reject path and confirm DRAFT + INACTIVE copy; run resubmit and confirm INACTIVE copy is cleaned up
