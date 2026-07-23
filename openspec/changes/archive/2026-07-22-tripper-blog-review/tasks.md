# Tasks: Tripper Blog Review Pipeline

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1800–2400 (schema ~20; 8 new API routes ~280 + tests ~320; admin GET list route ~60 incl. test; tripper PATCH route modify ~80 incl. test; changed-fields.ts + blog-form.ts ~160 incl. tests; NewBlogPostShell/BlogFormContent modify ~110; BlogPageClient modify ~70; 6 new admin/tripper UI pages/components ~600; adminNav/adminHeadings ~35; dictionary.ts+es.json+en.json ~250; email/index.ts + 6 email components ~370; 4 leak-guard query fixes + tests ~100) |
| 400-line budget risk | High |
| Chained PRs recommended | No (user-selected single-pr this session) |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

This change is substantially larger than `admin-owned-experiences` (~300–380 lines, Medium) — it ports an entire review-copy pipeline (schema, 8 new API routes + 1 new admin list route, 2 new tripper pages, 3 new admin pages/components, a completeness gate, a changed-fields helper, 6 new email components, 4 leak-guard query fixes) onto `BlogPost`. Under normal guard logic a High estimate would trigger a chained-PR recommendation, but delivery strategy is fixed to `single-pr` per the user's explicit choice this session — do not split into chained/stacked PRs. `size:exception` will need to be recorded before apply given the estimate is well above the 400-line budget.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Everything below (Phases 1–9) | PR 1 (single) | `size:exception` recorded — diff is expected to exceed ~400 lines. If the user later reconsiders, natural chain boundaries are: (a) schema+helpers, (b) core+copy routes, (c) admin UI, (d) tripper UI+emails, (e) leak-guards+dict. |

---

## Phase 1: Schema, Completeness Gate & Changed-Fields Helper (Foundation)

- [x] 1.1 `prisma/schema.prisma` — extend `enum BlogStatus` with `PENDING_REVIEW`, `PENDING_TRIPPER_REVIEW`; add `reviewNote`, `tripperNote`, `isReviewCopy`, `parentId`, `reviewLockedBy`, `changedFields`, `isDiscarded` to `BlogPost`. Satisfies spec "Blog Status State Machine", "Review-Copy Terminal State". Also added `BLOG_APPROVED`/`BLOG_REJECTED`/`BLOG_PENDING_TRIPPER_REVIEW` to `NotificationType` enum (additive, mirrors the 3 `EXPERIENCE_*` values — needed for the `Notification.create` calls in Phase 2/3 routes, not explicitly named in design.md but mechanically required).
- [x] 1.2 Run `npm run db:push` to apply additive columns + enum values. **DB was reachable this run** (Neon Postgres) — actually applied, not environment-blocked.
- [x] 1.3 RED — `src/lib/helpers/__tests__/blog-form.test.ts` (new file — no prior file existed to extend): `getBlogCompleteness` permutations — missing title/coverUrl/content each blocks; all-present passes. Satisfies spec "Submission Completeness Gate".
- [x] 1.4 GREEN — add `getBlogCompleteness` to `src/lib/helpers/blog-form.ts` (title+coverUrl+content required, mirrors `getExperienceCompleteness`).
- [x] 1.5 RED — `src/lib/blog/__tests__/changed-fields.test.ts`: `computeChangedFields` diffs JSON fields (blocks/seo/faq) and array fields (tags) correctly; `overwriteOriginalWithCopy` preserves original `slug` and resets review fields.
- [x] 1.6 GREEN — create `src/lib/blog/changed-fields.ts`: `MUTABLE_BLOG_FIELDS`, `computeChangedFields`, `overwriteOriginalWithCopy` per design.md Interfaces.
- [x] 1.7 `src/types/blog.ts` — extend `BlogPost["status"]` union to the 4 lowercase states; also added the 7 review-pipeline fields to the `BlogPost` interface (optional, present on tripper/admin surfaces only).
- [x] 1.8 `src/lib/admin/types.ts` — add `AdminBlog` + `AdminBlogAuthor` types for the admin list (mirrors `AdminExperience` shape).

**Decision confirmed (design open item)**: `changedFields` is a persisted schema field (not computed on the fly) — consistent with 1.1, needed for the review-copy diff display.

## Phase 2: Tripper Submit + Admin Approve/Reject Core Routes

- [x] 2.1 RED — `src/app/api/tripper/blogs/[id]/submit/__tests__/route.test.ts`: 409 if `status !== DRAFT`; 422 `incomplete` + `missing[]` on failed completeness; success deletes tombstone copy + sets `PENDING_REVIEW` + clears `reviewNote`.
- [x] 2.2 GREEN — create `src/app/api/tripper/blogs/[id]/submit/route.ts` per design.md Interfaces; calls `sendBlogSubmitted`. **Deviation from plan**: implemented the real `sendBlogSubmitted` function + `BlogSubmitted` email component immediately (Phase 6 content) instead of a placeholder stub, to avoid a second editing pass — functionally equivalent, Phase 6 tasks below are marked done for the same reason.
- [x] 2.3 RED — `src/app/api/admin/blogs/[id]/approve/__tests__/route.test.ts`: 409 unless `PENDING_REVIEW`; direct approve → `PUBLISHED` + `publishedAt: existing ?? now`; with active copy → `overwriteOriginalWithCopy` + copy hard-deleted.
- [x] 2.4 GREEN — create `src/app/api/admin/blogs/[id]/approve/route.tsx`; inline `sendMail` + `BlogApproved` + `Notification` (type `BLOG_APPROVED`, added to schema in 1.1).
- [x] 2.5 RED — `src/app/api/admin/blogs/[id]/reject/__tests__/route.test.ts`: 422 `note_required` on empty `reviewNote`; 409 unless `PENDING_REVIEW`; success → `DRAFT` + `reviewNote`.
- [x] 2.6 GREEN — create `src/app/api/admin/blogs/[id]/reject/route.tsx`; inline `sendMail` + `BlogRejected` + `Notification` (type `BLOG_REJECTED`).
- [x] 2.7 RED — `src/app/api/tripper/blogs/[id]/__tests__/route.test.ts` (new file — no prior test existed): client-sent `status` ignored; 409 `locked_for_review` when `PENDING_TRIPPER_REVIEW`; `contentChanged` over the full content field list triggers revert only when `PUBLISHED`; a review-mechanism-only field change (`tripperNote`) does not revert.
- [x] 2.8 GREEN — modify `src/app/api/tripper/blogs/[id]/route.ts`: strip `status` from destructured body (never persisted from client), add `locked_for_review` guard, compute `contentChanged` over title/subtitle/tagline/coverUrl/content/blocks/tags/travelType/excuseKey/format/seo/faq, `revertToDraft = PUBLISHED && contentChanged` → `updateData.status = "DRAFT"` (publishedAt untouched). Also added `tripperNote` write-through (needed by the tripper wizard's admin-note field).

**Decision confirmed (design open item)**: auto-revert **keeps `publishedAt`** (does not null it) — matches the approve route's `existing ?? now` pattern, which assumes `publishedAt` survives a `DRAFT` cycle; the public gate already keys on `status` alone, so no leak risk from keeping it. Verified via test: "publishedAt is KEPT, not nulled, on auto-revert".

## Phase 3: Copy-Editing Sub-Flow (start-edit / edit-copy / send-to-tripper / approve-copy / reject-copy / discard-copy)

- [x] 3.1 RED — `src/app/api/admin/blogs/[id]/start-edit/__tests__/route.test.ts`: 409 unless `PENDING_REVIEW`; 409 `locked` if `reviewLockedBy` held by another admin; idempotent same-admin re-call; copy created stripped of identity fields + `reviewLockedBy` set.
- [x] 3.2 GREEN — create `src/app/api/admin/blogs/[id]/start-edit/route.ts` per design.md transaction spec. Active-copy predicate uses `isDiscarded: false` (not `NOT: { status: "INACTIVE" }` — blog uses the boolean tombstone per the design decision).
- [x] 3.3 RED — `src/app/api/admin/blogs/[id]/edit-copy/__tests__/route.test.ts`: 403 unless target `isReviewCopy === true`; writes allowed body fields to the copy; `slug` stays untouched (never written by this route).
- [x] 3.4 GREEN — create `src/app/api/admin/blogs/[id]/edit-copy/route.ts`.
- [x] 3.5 RED — `src/app/api/admin/blogs/[id]/send-to-tripper/__tests__/route.test.ts`: 422 `no_changes` if `computeChangedFields` is empty; success sets copy `changedFields`/`reviewNote` + original `PENDING_TRIPPER_REVIEW` + `reviewLockedBy: null`.
- [x] 3.6 GREEN — create `src/app/api/admin/blogs/[id]/send-to-tripper/route.ts`; calls `sendBlogPendingTripperReview`. Notification copy is inlined (locale-branched object), not read from a dict — the experience route's `esCopy.adminExperienceReview`/`enCopy.adminExperienceReview` dict keys don't have a blog equivalent yet (dict work is Phase 8, not yet done); revisit to use the dict once Phase 8 lands, for consistency (currently functional but not the exact same source-of-truth pattern as the experience route).
- [x] 3.7 RED — `src/app/api/admin/blogs/[id]/discard-copy/__tests__/route.test.ts`: hard-deletes copy, clears `reviewLockedBy`, original stays `PENDING_REVIEW`.
- [x] 3.8 GREEN — create `src/app/api/admin/blogs/[id]/discard-copy/route.ts`.
- [x] 3.9 RED — `src/app/api/tripper/blogs/[id]/approve-copy/__tests__/route.test.ts`: 409 unless `PENDING_TRIPPER_REVIEW`; `overwriteOriginalWithCopy` + copy hard-deleted + `PUBLISHED`.
- [x] 3.10 GREEN — create `src/app/api/tripper/blogs/[id]/approve-copy/route.ts`; calls `sendBlogCopyApproved`.
- [x] 3.11 RED — `src/app/api/tripper/blogs/[id]/reject-copy/__tests__/route.test.ts`: 409 unless `PENDING_TRIPPER_REVIEW`; copy set `isDiscarded: true` (not deleted); original → `DRAFT`, content unaffected.
- [x] 3.12 GREEN — create `src/app/api/tripper/blogs/[id]/reject-copy/route.ts`; calls `sendBlogCopyRejected`.

## Phase 4: Admin Blog List & Review UI

- [x] 4.1 **CONFIRMED (design open item resolved)**: `GET /api/admin/blogs` is required — mechanically needed by `AdminBlogPageClient`, mirroring `GET /api/admin/experiences`. RED `__tests__/route.test.ts` (filter `isReviewCopy: false`, author select shape, optional `status` filter) then GREEN `src/app/api/admin/blogs/route.ts`.
- [x] 4.2 `NewBlogPostShell.tsx` — add `BlogShellMode` (`"tripper" | "adminEdit" | "adminReadOnly"`), `adminCopyId`, `reviewActionsSlot`, `reviewLeftSlot`; branch `persistDraft` (PATCH `/api/admin/blogs/${adminCopyId}/edit-copy` in `adminEdit`); skip autosave in `adminReadOnly`; render `reviewActionsSlot` instead of footer nav in `adminEdit`/`adminReadOnly`. Branching extracted to `newBlogPostShellHelpers.ts` (`resolveBlogPersistTarget`, `shouldSkipAutosave`, `shouldSwapFooterForReviewActions`) per the TDD note below. **No `adminReviewSlot`/pricing tab** — blogs have no pricing, so unlike `NewExperienceShell` there is no extra admin-only tab; `reviewActionsSlot` is the only admin surface, rendered once (footer position) via `BlogFormContent`. `reviewLeftSlot` renders as a banner between nav and content in `NewBlogPostShell` itself.
- [x] 4.3 `BlogFormContent.tsx` — add `readOnly?` prop (wraps accordion content in `<fieldset disabled={readOnly}>`, hides the missing-fields banner) and `reviewActionsSlot?` prop (renders in place of the footer `JourneyActionBar` when present).
- [x] 4.4 `src/app/[locale]/(secure)/dashboard/admin/blog/page.tsx` — create admin server page → `AdminBlogPageClient`. **Deviation**: no explicit `requireAdmin` call in this file — mirrors `admin/experiences/page.tsx` exactly, which relies on `AdminLayout`'s `StrictDashboardLayout requiredRole="admin"` gate instead of a per-page check (verified by reading the actual layout.tsx). The review-copy detail page (4.6) DOES its own explicit session/role check, mirroring `admin/experiences/[id]/page.tsx`, since it fetches data server-side and needs `user.id`.
- [x] 4.5 `AdminBlogPageClient.tsx` — create Pending/All tabs + pending-count badge, mirrors `AdminExperiencesPageClient` (no type/level column or featured/normal toggle — blogs have neither).
- [x] 4.6 `src/app/[locale]/(secure)/dashboard/admin/blog/[id]/page.tsx` — create: fetch original + active copy → `AdminBlogReviewClient`. Uses `mapBlogPostToDraft` (existing helper) instead of manual field-by-field mapping (Experience's page does the latter only because `ExperienceFormDraft` has no equivalent mapper).
- [x] 4.7 `AdminBlogReviewClient.tsx` — create: wrap `NewBlogPostShell` with mode state + `AdminBlogReviewActionsBar`.
- [x] 4.8 `AdminBlogReviewActionsBar.tsx` — create approve/reject/start-edit/send/discard action bar, mirrors `AdminReviewActionsBar` minus the pricing/`allPricesFilled` gate (blogs have no price step).

**TDD note**: full shell/list/review-client render tests are skipped (7+ mock breach — router, fetch, wizard content, nav, sidebar, actions bar, modal — violates Mock Hygiene Rule), same Extract-Before-Mock justification as `admin-owned-experiences` Phase 5. Branching logic (mode → autosave target / footer slot) extracted into `newBlogPostShellHelpers.ts` and unit-tested directly (RED→GREEN, 6 tests in `__tests__/newBlogPostShellHelpers.test.ts`).

## Phase 5: Tripper Dashboard UI

- [x] 5.1 `BlogPageClient.tsx` — replace `handleTogglePublish` with state-driven row actions: `DRAFT` → Submit button (`POST /submit`); `PENDING_REVIEW` → disabled waiting indicator; `PENDING_TRIPPER_REVIEW` → link to review-copy page; `PUBLISHED` → no action. Also hides the Edit pencil for `PENDING_TRIPPER_REVIEW` rows (editing the locked original would 409 `locked_for_review` — not in the original design.md text, but a direct, non-freelance consequence of the batch-1 lock guard).
- [x] 5.2 `src/app/[locale]/(secure)/dashboard/tripper/blog/[id]/review-copy/page.tsx` — create: fetch original + copy, guard ownership + `PENDING_TRIPPER_REVIEW` status.
- [x] 5.3 `TripperBlogReviewCopyClient.tsx` — create: read-only copy view (`mode="adminReadOnly"`) + approve/reject-copy actions.
- [x] 5.4 Update `BlogStatusBadge` (added `PENDING_REVIEW`/`PENDING_TRIPPER_REVIEW` styles, same colors as `ExperienceStatusBadge`) + `BLOG_STATUSES` filter array to the 4 lowercase status values.
- [x] 5.5 Extracted the status→row-action resolver into `src/lib/blog/row-actions.ts` (`resolveBlogRowAction(status)`) and unit-tested it directly (RED→GREEN, 4 tests), per the same Mock Hygiene Rule noted in Phase 4.

## Phase 6: Email Notifications

- [x] 6.1 `src/lib/email/index.ts` — implemented `sendBlogSubmitted`, `sendBlogPendingTripperReview`, `sendBlogCopyApproved`, `sendBlogCopyRejected`, mirroring `sendExperience*` signatures. (Done inline during Phase 2/3, not as a separate later pass — see 2.2 note.)
- [x] 6.2 Created `src/emails/{BlogSubmitted,BlogApproved,BlogRejected,BlogPendingTripperReview,BlogCopyApproved,BlogCopyRejected}.tsx` mirroring `Experience*` components, localized to recipient locale (es/en).
- [x] 6.3 Wired `BlogApproved`/`BlogRejected` inline `sendMail` calls directly in the approve/reject routes (no stub step needed since 6.1/6.2 were done first).
- [x] 6.4 Each transition route's test file (submit, approve, reject, send-to-tripper, approve-copy, reject-copy) mocks `@/lib/email` or `@/lib/helpers/sendMail` and asserts exactly one send call — see the "sends a ... email" test cases in each `__tests__/route.test.ts`.

## Phase 7: Public/Owner Query Leak-Guard Fixes

- [x] 7.1 `src/app/api/blogs/route.ts` (public list) — added `isReviewCopy: false` to `where` alongside `status: PUBLISHED`.
- [x] 7.2 `src/app/api/blogs/[id]/route.ts` (public detail) — added `isReviewCopy: false` to `findFirst.where`.
- [x] 7.3 `src/lib/db/tripper-queries.ts` `getTripperPublishedBlogs` (~L877) — added `isReviewCopy: false` to `where`.
- [x] 7.4 **Explicitly flagged leak surface (not in proposal's original affected-areas)**: `src/app/api/tripper/blogs/route.ts` — the tripper's OWN blog list (`authorId`-only filter) — added `isReviewCopy: false` to `where: { authorId }` so admin review copies never appear in the tripper's own list, not just public-facing queries.
- [x] 7.5 RED — created route tests for 7.1–7.4 (`src/app/api/blogs/__tests__/route.test.ts`, `src/app/api/blogs/[id]/__tests__/route.test.ts`, `src/lib/db/__tests__/tripper-queries.getTripperPublishedBlogs.test.ts`, `src/app/api/tripper/blogs/__tests__/route.test.ts`), each asserting the `where` clause passed to Prisma includes `isReviewCopy: false` (mock-based assertion on the query shape, not a live-DB seed — consistent with this repo's unit-test convention of mocked Prisma).
- [x] 7.6 GREEN — confirmed all 4 tests pass after 7.1–7.4 edits.

## Phase 8: Admin Nav, Headings, Dictionary & Types

- [x] 8.1 `adminNav.ts` — add Blog tab (`Newspaper` icon) after `xsed`, before `notifications`; non-exact match.
- [x] 8.2 `adminHeadings.ts` — add `blog` + `blog/[id]` heading mappings; place before any conflicting generic detail regex (per the `xsed/new` precedent from `admin-owned-experiences`).
- [x] 8.3 Updated `adminNav.test.ts` (10-tab order/href assertions incl. Blog) + `adminHeadings.test.ts` (2 new cases: blog list vs. blog/[id] detail). **Deviation**: "pending-count badge wiring" turned out to be scoped to `AdminBlogPageClient`'s own internal Pending/All toggle pill (mirroring `AdminExperiencesPageClient`'s in-page badge) — there is no sidebar-nav-level badge mechanism in `DashboardNavTabItem`/`DashboardNavTabs` for any tab (verified: only `showUnreadDot`+`audience` exist, used solely by Notifications), so no nav-level badge code or test was added; the pending count lives entirely in `AdminBlogPageClient`.
- [x] 8.4 `src/lib/types/dictionary.ts` — extended `AdminDashboardDict` (`nav.blog`, `pageHeadings.blog`/`blogDetail`), `AdminPagesDict.blog` (list dict, mirrors `.experiences` minus type/level + featured/normal), new top-level `adminBlogReview` + `tripperBlogReviewCopy` dicts (mirror `adminExperienceReview`/`tripperExperienceReviewCopy` minus pricing), and `TripperBlogsDict` (`status.PENDING_REVIEW`/`PENDING_TRIPPER_REVIEW`, `table.submit`/`submitError`/`waitingReview`/`reviewChanges`).
- [x] 8.5 `src/dictionaries/es.json` — added all new keys under `adminDashboard`, `adminPages.blog`, `adminBlogReview`, `tripperBlogReviewCopy`, `tripperBlogs`.
- [x] 8.6 `src/dictionaries/en.json` — mirrored all keys in English. Both files validated as parseable JSON.

## Phase 9: Final Verification

- [x] 9.1 `npm run typecheck` — zero errors repo-wide (confirmed after this batch's changes).
- [x] 9.2 `npm run test` — 421/421 tests green, zero regressions (grew from the original 374 as manual QA and 2 independent code-review passes surfaced real bugs, each landing with its own regression test).
- [ ] 9.3 `npm run lint` — **blocked**, same pre-existing environment issue batch 1 flagged (`next lint` → "Invalid project directory provided, no such directory: .../lint", unrelated to this change, argv-parsing issue with the Next.js lint wrapper in this environment). Manually verified instead: no raw `<img>` and no `dark:` classes in any file touched this batch (`git status --porcelain` file list grepped for both patterns — zero matches).
- [x] 9.4 Manual QA (tripper) — done by the human across several live sessions. Found and fixed: submit-for-review flow reworked to match Experience exactly (confirm modal, tripper note), completeness-gate bug (content tab ignored the feature quote), a legacy-content mapping bug (feature-quote-only posts got duplicated into a phantom section on re-edit), missing server-side edit/delete guards during PENDING_REVIEW, and the review-copy "ghost duplicate" leak (below).
- [x] 9.5 Manual QA (admin) — done by the human. Found and fixed: sticky admin review action bar built to match Experience's, `handleDiscardCopy` mode/state bug (left the action bar permanently disabled and swapped in the wrong footer), missing status guard on discard-copy (could orphan a post at PENDING_TRIPPER_REVIEW with no copy left to act on), admin approve never resetting `isActive: true` (a post auto-reverted or unpublished then re-approved stayed invisible), and the pending-tripper-review email never included the actual changed fields.
- [x] 9.6 Manual QA (leak guard) — done, and this is the one that found the most serious bug: review copies (`isReviewCopy: true`) were reachable through the tripper's own `GET`/`PATCH`/`DELETE` `/api/tripper/blogs/[id]` routes (no exclusion filter), letting a tripper load and submit an admin's internal working copy as if it were their own post. Fixed there, then a full code-review pass found the same unpatched pattern in 5 more call sites (`submit`, `approve-copy`, `reject-copy` routes, the tripper's own list page, and the review-copy page) — all now excluded.
