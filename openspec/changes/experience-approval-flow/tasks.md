# Tasks: Experience Approval Flow

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 650–850 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Schema + Types + API → PR 2: Tripper UI → PR 3: Admin UI + i18n |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending (user decision required) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Schema + Types + API (3 endpoints + guards) | PR 1 | Foundation; unblocks UI work; tests RED→GREEN included |
| 2 | Tripper UI (read-only gate, submit action, rejection banner, list badge) | PR 2 | Depends on PR 1 merged; typecheck must pass before starting |
| 3 | Admin UI (Pending Review tab, ExperienceReviewPanel) + i18n | PR 3 | Depends on PR 1; can parallel with PR 2 if isolated worktrees used |

---

## Phase 1: Schema & Types

- [ ] 1.1 `prisma/schema.prisma` — add `PENDING_REVIEW` after `DRAFT` in `ExperienceStatus` enum; drop `displayPrice String`; add `pricingByType Json?` and `reviewNote String? @db.Text`; keep `basePrice` (D1). Run `npm run db:push` then `npm run db:generate`. **Accept**: `prisma generate` exits 0; `ExperienceStatus` has 5 values.
- [ ] 1.2 `src/types/tripper.ts` — add `ExperienceStatus` union type (`"DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "INACTIVE" | "ARCHIVED"`). Update `ExperienceFormDraft`: remove `basePrice`, remove `displayPrice`, add `pricingByType?: Record<string, number> | null`, add `reviewNote?: string | null`. Update `ExperienceListItem`: remove `basePrice`/`displayPrice`, add `pricingByType?` and `reviewNote?`, change `status` type to `ExperienceStatus`. Update `TripperOwnExperienceListItem`: remove `displayPrice`, add `status: ExperienceStatus`. **Accept**: `npm run typecheck` surfaces broken consumers; no new errors from this file itself.
- [ ] 1.3 `src/lib/admin/types.ts` — update `AdminExperience`: remove `displayPrice`, add `type: string[]`, `level: string | null`, `destinationCountry: string`, `destinationCity: string`, `teaser: string`, `description: string`, `heroImage: string`, `minPax: number`, `maxPax: number`, `pricingByType: Record<string, number> | null`, `reviewNote: string | null`. **Accept**: `npm run typecheck` passes on this file.
- [ ] 1.4 Fix all `displayPrice` compile errors surfaced by 1.2–1.3. Key files: `AdminExperiencesPageClient.tsx` (line 106 `item.displayPrice`), tripper experience list page, tripper experience `[id]` page mapper. Remove `displayPrice` reads; replace with `pricingByType` min-value display or `"—"` placeholder. **Accept**: `npm run typecheck` exits 0.
- [ ] 1.5 `src/components/app/dashboard/tripper/experiences/NewExperienceShell.tsx` — remove `basePrice: 0` and `displayPrice: ""` from `EMPTY_DRAFT`. **Accept**: typecheck passes; no runtime crash on creating new draft.

---

## Phase 2: API Routes (TDD — RED first, then GREEN)

- [ ] 2.1 **[RED]** `src/app/api/tripper/experiences/[id]/submit/__tests__/route.test.ts` — write failing tests for: (a) 401 when unauthenticated, (b) 403 when caller is not owner, (c) 409 when experience is not DRAFT, (d) 422 when required fields missing (list in `missing`), (e) 200 + status becomes PENDING_REVIEW on valid DRAFT. Use the xsed test file as the mock pattern. **Accept**: `npm run test` reports these tests as failing (RED).
- [ ] 2.2 **[RED]** `src/app/api/admin/experiences/[id]/approve/__tests__/route.test.ts` — write failing tests for: (a) 401/403 when not admin, (b) 409 when experience is not PENDING_REVIEW, (c) 422 when `pricingByType` keys don't match `type[]`, (d) 422 when any value ≤ 0 or non-numeric, (e) 200 + status ACTIVE + pricingByType saved + reviewNote null on valid payload. **Accept**: `npm run test` reports these tests as RED.
- [ ] 2.3 **[RED]** `src/app/api/admin/experiences/[id]/reject/__tests__/route.test.ts` — write failing tests for: (a) 401/403 when not admin, (b) 409 when not PENDING_REVIEW, (c) 422 when `reviewNote` empty/missing, (d) 200 + status DRAFT + reviewNote saved on valid payload. **Accept**: `npm run test` reports RED.
- [ ] 2.4 `src/lib/admin/experience-pricing.ts` — create file with `validatePricingByType(input: unknown, types: string[])` returning `{ ok: true; value: Record<string, number> } | { ok: false; error: string }`. Filters out `"XSED"` from `types` before comparing keys. **Accept**: unit tests for this function pass; exported from the file.
- [ ] 2.5 `src/lib/helpers/experience-form.ts` — add `getExperienceCompleteness(form: ExperienceFormDraft): { complete: boolean; missing: string[] }` that composes `isExperienceTabComplete` across all tabs (`about`, `activities`, `media`). Must validate: `title`, `type.length > 0`, `level`, `teaser`, `description`, `heroImage`, `destinationCountry`, `destinationCity`, at least one activity name. **Accept**: function is pure (no DOM/client deps); existing tab helper tests still pass.
- [ ] 2.6 **[GREEN]** `src/app/api/tripper/experiences/[id]/submit/route.ts` — create handler: `requireSession → ownership check (404) → status === DRAFT (else 409) → getExperienceCompleteness (else 422 + missing[]) → prisma.update status=PENDING_REVIEW, reviewNote=null → 200 { experience: { id, status } }`. **Accept**: all tests from 2.1 pass GREEN.
- [ ] 2.7 **[GREEN]** `src/app/api/admin/experiences/[id]/approve/route.ts` — create handler: `requireAdmin() → status === PENDING_REVIEW (else 409) → validatePricingByType (else 422) → prisma.update status=ACTIVE, isActive=true, pricingByType=validated, reviewNote=null → 200 { experience }`. **Accept**: all tests from 2.2 pass GREEN.
- [ ] 2.8 **[GREEN]** `src/app/api/admin/experiences/[id]/reject/route.ts` — create handler: `requireAdmin() → status === PENDING_REVIEW (else 409) → reviewNote non-empty (else 422) → prisma.update status=DRAFT, isActive=false, reviewNote=trimmed → 200 { experience }`. **Accept**: all tests from 2.3 pass GREEN.
- [ ] 2.9 `src/app/api/tripper/experiences/[id]/route.ts` (PATCH) — strip `status`, `pricingByType`, `reviewNote` from accepted body destructure and `data` object (D2). Also strip `basePrice`/`displayPrice`. Add `pricingByType` and `reviewNote` to GET `select`. **Accept**: PATCH silently ignores those fields; GET returns them; typecheck passes.
- [ ] 2.10 `src/app/api/tripper/experiences/route.ts` (POST/create) — remove `basePrice`/`displayPrice` writes; new records created with `pricingByType: null`. **Accept**: typecheck passes; new draft creates without pricing fields.
- [ ] 2.11 `src/app/api/admin/experiences/route.ts` (GET) — add `type`, `level`, `destinationCountry`, `destinationCity`, `teaser`, `description`, `heroImage`, `minPax`, `maxPax`, `pricingByType`, `reviewNote` to `select`; remove `displayPrice`. **Accept**: response shape matches updated `AdminExperience` type; typecheck passes.

---

## Phase 3: Tripper UI

- [ ] 3.1 `src/components/app/dashboard/tripper/experiences/NewExperienceShell.tsx` — derive `const isReadOnly = form.status === "PENDING_REVIEW"`. Gate `persistDraft` and the autosave `useEffect`: bail early when `isReadOnly`. **Accept**: no PATCH fires when status is PENDING_REVIEW.
- [ ] 3.2 `src/components/app/dashboard/tripper/experiences/ExperienceFormContent.tsx` — wrap form body in `<fieldset disabled={isReadOnly} className="contents">`. When `isReadOnly`, replace the `<JourneyActionBar>` block with a static "Pending review" notice (use `copy.form.review.pendingTitle`/`pendingBody` keys). Pass `isReadOnly` as a prop from `NewExperienceShell`. **Accept**: all native inputs disabled when status is PENDING_REVIEW.
- [ ] 3.3 Audit custom (non-native) controls that bypass `<fieldset disabled>`: `CapacityPricingStep` price inputs, `JourneyDropdown` accordion, any div-based toggle. Add `isReadOnly` prop guard before each `onChange` call in those components. **Accept**: clicking custom controls has no effect when `isReadOnly` is true.
- [ ] 3.4 `src/components/app/dashboard/tripper/experiences/NewExperienceShell.tsx` — rework `handleSubmit`: after `flushPendingBlobs` + autosave flush, call `POST /api/tripper/experiences/{id}/submit`. On 200: navigate to experiences list. On 422: surface `missing[]` array inline (toast or inline error, matching existing `missingFields` banner pattern). **Accept**: successful submit shows PENDING_REVIEW badge in list; 422 surfaces field names.
- [ ] 3.5 `src/components/app/dashboard/tripper/experiences/NewExperienceShell.tsx` (or `ExperienceFormContent.tsx`) — add rejection banner: show when `form.status === "DRAFT" && form.reviewNote`. Use amber alert card style matching existing `missingFields` banner (line 150 of `ExperienceFormContent.tsx`). Dismissible via `useState bannerDismissed` (session-only). **Accept**: banner visible with `reviewNote` text; dismiss hides it; gone when `reviewNote` is null.
- [ ] 3.6 `src/components/app/dashboard/tripper/experiences/ExperiencesPageClient.tsx` — add "Pending review" badge when `status === "PENDING_REVIEW"`. Use `bg-yellow-100 text-yellow-800 border-yellow-200` per design-system convention. **Accept**: PENDING_REVIEW card shows distinct badge; DRAFT and ACTIVE cards unaffected.
- [ ] 3.7 `src/components/app/dashboard/tripper/experiences/steps/CapacityPricingStep.tsx` — remove `basePrice` and `displayPrice` input fields (tripper no longer prices). Remove from the form section. **Accept**: no price inputs visible in this step; typecheck passes.

---

## Phase 4: Admin UI

- [ ] 4.1 `src/app/[locale]/(secure)/dashboard/admin/ExperienceReviewPanel.tsx` — create new component. Check `src/components/ui/` for `Sheet`; if present use `Sheet`, else use `Dialog` with right-aligned content. Props: `experience: AdminExperience | null`, `copy`, `onClose`, `onApprove`, `onReject`, `saving`. Render: read-only info block (title, type, level, destination, capacity, description, `<Img>` hero image). Per-type price inputs derived from `experience.type.filter(t => t !== "XSED")`. Local state `prices: Record<string, string>`. Approve disabled until all prices are positive numbers. Reject: textarea `reviewNote` + confirm button disabled until non-empty. **Accept**: panel renders correctly; Approve disabled with empty prices; Reject disabled with empty note.
- [ ] 4.2 `src/app/[locale]/(secure)/dashboard/admin/AdminExperiencesPageClient.tsx` — add tab state `"all" | "pending"` defaulting to `"pending"`. Render two tab buttons with count badge on pending (count from `experiences.filter(e => e.status === "PENDING_REVIEW").length`). Filter visible list by tab. Add `selectedExperience: AdminExperience | null` state; clicking a PENDING_REVIEW row sets it and opens the panel. Add `approveExperience` and `rejectExperience` async functions that call the new endpoints, then `await fetchExperiences()` on success and close the panel. Wire `ExperienceReviewPanel`. Remove `item.displayPrice` cell; replace with status-appropriate display. **Accept**: pending tab shows only PENDING_REVIEW rows; approve/reject refresh list and close panel.

---

## Phase 5: i18n & Cleanup

- [ ] 5.1 `src/dictionaries/es.json` + `src/dictionaries/en.json` — add all new keys under `tripperExperiences.form.review`, `tripperExperiences.form.statusBadge`, `tripperExperiences.form.actionBar.submitForReview`, `adminPages.experiences.tabs`, `adminPages.experiences.review` as specified in design §i18n Keys. **Accept**: both files have identical key structure; no missing key warnings at runtime.
- [ ] 5.2 `src/lib/types/dictionary.ts` — extend `TripperExperiencesDict.form` with `review` sub-object and `statusBadge` object; add `actionBar.submitForReview`. Extend `AdminPagesDict.experiences` with `tabs` and `review` sub-object. **Accept**: `npm run typecheck` exits 0 with no dictionary shape errors.
- [ ] 5.3 Run `npm run typecheck` and `npm run lint` clean pass. Grep for any remaining `displayPrice` references in `src/` under experience-related files; remove or migrate each. Grep for any tripper PATCH sending `status`/`pricingByType`/`reviewNote` (should be zero). **Accept**: typecheck 0 errors; lint 0 warnings; no `displayPrice` in experience paths.
- [ ] 5.4 Verify XSED files are untouched: `src/app/api/admin/xsed/route.ts`, `src/lib/admin/types.ts` `AdminXsedExperience.basePrice`. Confirm `npm run test` still passes the existing xsed route tests. **Accept**: all pre-existing tests green; no xsed behaviour change.
