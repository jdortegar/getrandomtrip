# Proposal: Tripper Blog Review Pipeline

## Intent

Today a tripper publishes a `BlogPost` by flipping `status` directly between the only two `BlogStatus` values (`DRAFT ↔ PUBLISHED`) via `handleTogglePublish` in `BlogPageClient.tsx` → a bare `PATCH /api/tripper/blogs/[id]`. There is **zero admin gate, zero validation, and zero moderation surface** — no admin blog list, no admin blog API routes, no "Blog" tab in `adminNav.ts`. Meanwhile `Experience` already has a full, battle-tested review-copy pipeline. This change brings `BlogPost` to parity: trippers submit for review, admins approve/reject or directly edit-and-return-for-approval, and nothing reaches the public without passing the gate.

## Scope

### In Scope

- **4-state status machine** (decision 2): `DRAFT → PENDING_REVIEW → PUBLISHED`, plus `PENDING_TRIPPER_REVIEW` while an admin's edited copy awaits tripper approval. Transitions exactly mirror `Experience`.
- **Full review-copy mechanism** (decision 1): admin can directly edit a submitted post, save it as a review copy (`isReviewCopy: true`, `parentId` = original), send it back; tripper approves (copy overwrites original in a transaction, original → `PUBLISHED`, copy deleted) or rejects (original → `DRAFT`).
- **New `BlogPost` fields** mirroring `Experience`: `reviewNote`, `tripperNote`, `isReviewCopy`, `parentId`, `reviewLockedBy` (soft-lock preventing two admins editing the same pending post). Prisma migration required.
- **Submission completeness gate** (decision 6): `title`, `coverUrl`, and `content` required to submit; subtitle/tags/FAQ/gallery/sections optional. New pure function mirroring `getExperienceCompleteness`.
- **Auto-revert-to-DRAFT** (decision 3): editing an already-`PUBLISHED` post's content forces re-review, mirroring `Experience`'s `revertToDraft`. No manual unpublish anywhere.
- **Dedicated admin routes** (decision 4, parallel not generic): `/api/admin/blogs/[id]/{approve,reject,start-edit,send-to-tripper,discard-copy,edit-copy}` + tripper `/api/tripper/blogs/[id]/{submit,approve-copy,reject-copy}`.
- **Admin UI**: new "Blog" tab in `adminNav.ts`, `/dashboard/admin/blog` list (Pending/All tabs + pending-count badge, mirroring `AdminExperiencesPageClient`), admin review screen embedding the **existing** blog wizard shell (`NewBlogPostShell`) so admin can edit content directly, plus dedicated `AdminBlogReviewActionsBar`.
- **Tripper UI**: replace `handleTogglePublish` with state-driven row actions (Submit on `DRAFT`, waiting indicator on `PENDING_REVIEW`, approve/reject on `PENDING_TRIPPER_REVIEW` via a new `/dashboard/tripper/blog/[id]/review-copy` page).
- **Full email parity** (decision 5): new `sendBlog*` senders mirroring `sendExperience*` for submit→admin, approve/reject→tripper, copy-approve/copy-reject→admin.
- New `es` + `en` dictionary entries for all new UI copy.

### Out of Scope (Non-Goals)

- **Shared generic "reviewable resource" abstraction** — considered and deliberately deferred (decision 4). We build blog-specific components/routes mirroring the experience shape, exactly as XSED got its own dedicated flow. Not overlooked; a future refactor may unify them.
- **`ARCHIVED` state** for blog posts (decision 2) — nothing in the flow archives a post.
- **Manual unpublish** for tripper or admin (decision 3).
- Reworking the blog wizard steps themselves (`FaqStep`, `GalleryStep`, etc.) — reused as-is.

## Capabilities

### New Capabilities

- `blog-review-flow`: the blog submission → admin moderation → review-copy → publish lifecycle, its status machine, completeness gate, soft-lock, and email notifications.

### Modified Capabilities

- None (no existing blog spec in `openspec/specs/`; the tripper direct-toggle behavior being removed is not spec-backed).

## Approach

Port the proven `Experience` review-copy architecture onto `BlogPost` as a **dedicated parallel implementation**, not a shared abstraction. Extend `BlogStatus` and the `BlogPost` model with the review fields, then replicate the endpoint shape, admin list, admin review screen (wrapping the existing wizard shell for direct editing), sticky action bars, tripper review-copy page, completeness function, and email senders — each blog-specific and named for blogs. Server-derive every status transition from the authenticated role and the current state; never trust client-sent status. The tripper's direct publish toggle is removed entirely and replaced with state-aware actions.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` (`BlogPost`, `enum BlogStatus`) | Modified | Add `PENDING_REVIEW` + `PENDING_TRIPPER_REVIEW` states; add `reviewNote`, `tripperNote`, `isReviewCopy`, `parentId`, `reviewLockedBy` |
| `prisma/migrations/` | New | Additive columns + enum values, `@default(DRAFT)` preserved |
| `src/app/api/tripper/blogs/[id]/route.ts` + new `submit`/`approve-copy`/`reject-copy` routes | New/Modified | Submit-for-review, tripper copy approve/reject, auto-revert-to-DRAFT on edit of published |
| `src/app/api/admin/blogs/[id]/{approve,reject,start-edit,send-to-tripper,discard-copy,edit-copy}` | New | Admin moderation + review-copy endpoints |
| `src/components/app/dashboard/config/adminNav.ts` | Modified | New "Blog" tab → `/dashboard/admin/blog` |
| `src/app/[locale]/(secure)/dashboard/admin/blog/` (list + `[id]` review) | New | Admin list (Pending/All + count badge) + review screen wrapping `NewBlogPostShell` |
| `AdminBlogReviewActionsBar` + tripper `ReviewActionsBar` blog variant | New | Sticky action bars mirroring experience ones |
| `src/components/app/dashboard/tripper/blog/BlogPageClient.tsx` | Modified | Replace `handleTogglePublish` with state-driven row actions |
| `src/app/[locale]/(secure)/dashboard/tripper/blog/[id]/review-copy/page.tsx` | New | Tripper reviews admin's proposed copy |
| `src/lib/helpers/blog-form.ts` | Modified | New `getBlogCompleteness` pure function (title, coverUrl, content required) |
| `src/lib/email/` | New | `sendBlog*` senders mirroring `sendExperience*` |
| `src/dictionaries/{es,en}.json` + `src/lib/types/dictionary.ts` | Modified | All new admin + tripper blog-review copy in both locales |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Rejected review-copy has no clean terminal state (`BlogStatus` lacks `INACTIVE`) | High | **Open question — flagged for sdd-design** (see below). Do not resolve in proposal. |
| Transaction copy-overwrite corrupts original on partial failure | Med | Wrap overwrite + copy delete + status change in a single Prisma `$transaction`, mirroring experience `approve-copy` |
| Two admins start editing the same pending post | Med | Soft-lock via `reviewLockedBy`, checked before `start-edit`, matching experiences |
| Parallel (non-shared) implementation drifts from experience behavior over time | Med | Mirror endpoint/UI names and shapes 1:1; document the deferred shared abstraction so future unification is intentional |
| Public visibility leak (post visible before approval) | Med | Public queries must gate on `status === PUBLISHED` AND `isReviewCopy === false` |
| Untranslated new copy | Low | Enforce dual `es`/`en` entries per `i18n-and-types.md` |

## Open Questions (for sdd-design)

- **How does a rejected review-copy row represent its terminal "kept for reference but inactive" state, given `BlogStatus` has no `INACTIVE` value the way `ExperienceStatus` does?** This was a real gap left unresolved in the decision interview. Options to weigh in design: (a) add an `INACTIVE` value to `BlogStatus`, or (b) represent it structurally via `isReviewCopy: true` + a dedicated boolean (e.g. `isDiscarded`/`isRejectedCopy`) rather than overloading `status`. Recommendation leans toward the structural boolean to avoid an `INACTIVE` value that never applies to primary (non-copy) posts, but this is design's call.

## Rollback Plan

Revert the change commits. New `BlogPost` columns are additive with safe defaults, so schema rollback is low-risk (drop columns + new enum values via down migration once no rows use them). No data backfill is required (existing posts stay `DRAFT`/`PUBLISHED`). The removed tripper `handleTogglePublish` is restored by the revert. If rolling back after review-copy rows exist in production, delete `isReviewCopy: true` rows first to avoid orphaned copies.

## Dependencies

- Prisma migration coordination (`db:migrate` / `db:push`) for the new enum values and columns.
- Depends on the existing blog wizard shell (`NewBlogPostShell`) and experience review pattern remaining as the reference — no changes to `Experience` required.

## Success Criteria

- [ ] Tripper can submit a `DRAFT` post for review only when title, coverUrl, and content are present; incomplete posts are blocked with clear microcopy.
- [ ] Admin sees a Blog tab + list with Pending/All tabs and a pending-count badge.
- [ ] Admin can approve (→ `PUBLISHED`), reject (→ `DRAFT` + `reviewNote`), or start editing (creates review copy, original → `PENDING_TRIPPER_REVIEW`, soft-lock set).
- [ ] Tripper can approve an admin copy (copy overwrites original in a transaction, → `PUBLISHED`, copy removed) or reject it (original → `DRAFT`).
- [ ] Editing a `PUBLISHED` post auto-reverts it to `DRAFT` for re-review; no manual unpublish exists anywhere.
- [ ] Emails fire for every transition, mirroring the experience flow, in both locales.
- [ ] Public blog queries never expose non-`PUBLISHED` or review-copy rows.
- [ ] All new copy present in `es` and `en`; `npm run typecheck` and `npm run lint` pass.
