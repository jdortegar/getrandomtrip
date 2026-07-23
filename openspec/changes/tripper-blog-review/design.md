# Design: Tripper Blog Review Pipeline

## Technical Approach

Port the proven `Experience` review-copy architecture onto `BlogPost` as a **dedicated parallel implementation** (proposal decision 4 — no shared abstraction). Four layers, each mirroring the experience shape 1:1 and named for blogs:

1. **Data**: extend `enum BlogStatus` with `PENDING_REVIEW` + `PENDING_TRIPPER_REVIEW`; add the review fields (`reviewNote`, `tripperNote`, `isReviewCopy`, `parentId`, `reviewLockedBy`, `changedFields`) plus the rejected-copy tombstone marker (`isDiscarded` — see the flagged decision). Applied via `npm run db:push` (this repo has **no** migration files — `prisma/migrations/` holds only `.gitkeep`; `db:migrate` is aliased to `prisma db push`). Additive columns with safe defaults → zero-downtime, no backfill.
2. **API**: a tripper `submit` finalizer + copy approve/reject routes, and admin approve/reject/start-edit/send-to-tripper/discard-copy/edit-copy routes — each replicating the exact transaction/soft-lock/tombstone logic of its experience counterpart. The tripper `PATCH /api/tripper/blogs/[id]` loses its client-driven `status` toggle and gains auto-revert-to-DRAFT and a PENDING_TRIPPER_REVIEW edit lock. Every transition is server-derived from role + current state.
3. **UI**: a new "Blog" admin nav tab + `/dashboard/admin/blog` list (Pending/All tabs + pending-count) + `/dashboard/admin/blog/[id]` review screen that embeds the **existing** `NewBlogPostShell` (given a minimal `mode` system) with an `AdminBlogReviewActionsBar`. The tripper `BlogPageClient` toggle is replaced with state-driven row actions, and a new tripper `/dashboard/tripper/blog/[id]/review-copy` page lets the tripper approve/reject an admin copy.
4. **Visibility**: every public + list query gains an `isReviewCopy: false` gate so copy rows (real `BlogPost` rows sharing `authorId`) never leak.

Unlike experiences, there is **no admin-owned / RANDOMTRIP concept for blogs** and **no pricing** — the flow is strictly tripper-authored → admin-moderated. So the blog submit finalizer has a single target (`PENDING_REVIEW`) with no source branch.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|---|---|---|---|
| **Rejected-copy terminal state (the flagged open question)** | Add `isDiscarded Boolean @default(false)` on `BlogPost`, coexisting with `isReviewCopy`. `reject-copy` sets the copy `{ isDiscarded: true }` (kept as audit reference); the "active copy" predicate becomes `{ parentId, isReviewCopy: true, isDiscarded: false }`; `submit` hard-deletes any `{ isReviewCopy: true, isDiscarded: true }` tombstone on resubmit. Copy `status` stays `DRAFT`. | (a) Add `INACTIVE`/`DISCARDED` value to `BlogStatus` and reuse the experience's `NOT: { status: "INACTIVE" }` predicate. (b) Reuse `DRAFT` alone with no marker (can't distinguish an in-progress copy from a rejected one). | Experience got `INACTIVE` **for free** because it is already a legitimate *primary-post* status (`ExperienceStatus` has it). `BlogStatus` has none, and the proposal explicitly scopes `INACTIVE`/`ARCHIVED` **out** for blogs. Adding the enum value would create a phantom lifecycle state that never legitimately applies to a primary post, forcing every `BlogStatus` consumer (`BlogStatusBadge`, dict `status` keys, `BLOG_STATUSES` filter array, the `status.toLowerCase()` transforms, the public switch) to handle a value that only ever appears on hidden copy rows — a leaky abstraction. Copies are **already** distinguished structurally by `isReviewCopy: true`; a second coexisting boolean keeps the tombstone concern orthogonal to lifecycle status and is consistent with that established pattern. Parity with experience is in the tombstone **semantics** (keep-for-reference + excluded-from-active-lookup), which the boolean reproduces exactly — not in the specific enum value. |
| Status machine | Add **only** `PENDING_REVIEW` + `PENDING_TRIPPER_REVIEW` to `BlogStatus`. `@default(DRAFT)` preserved. Terminal states remain `DRAFT`/`PUBLISHED`. | Also add `INACTIVE`/`ARCHIVED` for symmetry with `ExperienceStatus`. | Proposal decisions 2 explicitly exclude `ARCHIVED` and `INACTIVE`; nothing in the blog flow archives or deactivates a primary post. |
| Schema delivery | Edit `schema.prisma`, apply with `npm run db:push`. All new columns are additive with safe defaults; new enum values are additive. | `prisma migrate dev`. | Repo does not use migration files (see Technical Approach). A lone migration would fracture the workflow — identical constraint to `admin-owned-experiences`. |
| Parallel (non-generic) routes | Dedicated `/api/{admin,tripper}/blogs/[id]/*` routes, one per experience counterpart, blog-specific. | A generic "reviewable resource" controller. | Proposal decision 4 — build blog-specific, mirror shapes/names, defer any unification. |
| Admin list GET route | Add `GET /api/admin/blogs` returning all **non-copy** posts (`isReviewCopy: false`) with author info, mirroring `GET /api/admin/experiences`. Not in the proposal's affected-areas table but mechanically required by `AdminBlogPageClient` (which fetches it exactly as `AdminExperiencesPageClient` fetches `/api/admin/experiences`). | Server-fetch the list in the page component. | Parity with the experience admin list (client-fetch + Pending/All tabs). Flagged in Open Questions. |
| Blog wizard reuse | Give `NewBlogPostShell` a minimal `mode: BlogShellMode = "tripper" \| "adminEdit" \| "adminReadOnly"` + `adminCopyId?` + `reviewActionsSlot?`, and `BlogFormContent` a `readOnly?` prop. In `adminEdit`, autosave PATCHes `/api/admin/blogs/[copyId]/edit-copy`; in `adminReadOnly`, autosave is disabled and the shell footer nav is replaced by `reviewActionsSlot`. **No `adminCreate` mode** (admins never author blogs). | Duplicate the ~350-line shell into an admin variant; add a full `ExperienceShellMode`-sized enum. | Mirrors how `AdminExperienceReviewClient` wraps `NewExperienceShell` via `adminReviewSlot`/`reviewActionsSlot`; the minimal 3-value mode is all the blog flow needs (no pricing slot). |
| Changed-fields helper | New `src/lib/blog/changed-fields.ts` with `MUTABLE_BLOG_FIELDS`, `computeChangedFields`, `overwriteOriginalWithCopy` — the blog analogue of `src/lib/experiences/changed-fields.ts`. Preserves original `slug` on overwrite (avoids `@unique` churn). | Reuse the experience helper with a field-list param. | Field sets differ entirely; a parallel file matches decision 4 and keeps the experience helper untouched. |
| Public/list visibility | Add `isReviewCopy: false` to every public + owner + admin list query (see Interfaces). Copy rows share `authorId` and are otherwise valid `BlogPost` rows. | Rely on `status` alone. | An active copy sits at `DRAFT` (hidden from public by the existing `PUBLISHED` gate) but WOULD appear in the tripper's own list (`authorId`-only filter) and could be published-by-accident via overwrite races — the `isReviewCopy` gate is the authoritative guard (proposal risk row). |
| Email direction parity | `submit`/`copy-approve`/`copy-reject` use new `sendBlog*` helpers in `src/lib/email/index.ts`; `send-to-tripper` uses `sendBlogPendingTripperReview`. Admin **approve/reject → tripper** emails are sent **inline** in the route via `sendMail` + new `BlogApproved`/`BlogRejected` components — exactly mirroring `approve/route.tsx` and `reject/route.tsx` (which send `ExperienceApproved`/`ExperienceRejected` inline, NOT via a helper). | A `sendBlogApproved`/`sendBlogRejected` helper for every direction. | Faithful mirror: the experience approve/reject direction is already inline-in-route; the helper layer only exists for the other four transitions. |

## Interfaces / Contracts

### Prisma (`prisma/schema.prisma`, `model BlogPost` + `enum BlogStatus`)
```prisma
enum BlogStatus {
  DRAFT
  PENDING_REVIEW
  PENDING_TRIPPER_REVIEW
  PUBLISHED
}

model BlogPost {
  // ...existing...
  reviewNote     String?  @db.Text          // admin editorial feedback; cleared on approve/submit
  tripperNote    String?  @db.Text          // tripper note to admin at submission
  isReviewCopy   Boolean  @default(false)   // true on lazy admin-edit copies
  parentId       String?                    // FK to original post (copy rows only)
  reviewLockedBy String?                    // admin id holding the edit soft-lock
  changedFields  String[] @default([])      // fields the admin changed (copy → tripper diff)
  isDiscarded    Boolean  @default(false)   // rejected-copy tombstone (see Decision)
}
```
No relation added for `parentId` (matches experience — it is a bare FK string, resolved by explicit queries).

### `POST /api/tripper/blogs/[id]/submit` (new — DRAFT → PENDING_REVIEW)
Auth: owner (`authorId === user.id`). Load post; 409 if `status !== "DRAFT"`. Run `getBlogCompleteness`; 422 `{ error: "incomplete", missing }` if not complete. Then in a `$transaction`: delete any tombstone copy (`{ parentId: id, isReviewCopy: true, isDiscarded: true }`), then `update { status: "PENDING_REVIEW", reviewNote: null }`. After commit: `sendBlogSubmitted(id, user.id)`. (No source/pricing branch — unlike experience.)

### `POST /api/admin/blogs/[id]/approve` (PENDING_REVIEW → PUBLISHED)
Admin-only. 409 unless `PENDING_REVIEW`. Body `{ reviewNote? }`. If an active copy exists (`{ parentId: id, isReviewCopy: true, isDiscarded: false }`) → `$transaction`: `overwriteOriginalWithCopy(tx, id, copy.id)` (sets `status: PUBLISHED`, `publishedAt` if null, `isReviewCopy:false`, `parentId:null`, `reviewLockedBy:null`, `reviewNote:null`, `changedFields:[]`), then hard-delete the copy. Else direct `update { status: "PUBLISHED", publishedAt: existing ?? now, reviewNote }`. Fire-and-forget inline `sendMail` + `BlogApproved` to the author + `Notification`.

### `POST /api/admin/blogs/[id]/reject` (PENDING_REVIEW → DRAFT)
Admin-only. 409 unless `PENDING_REVIEW`. Body `{ reviewNote }` required non-empty (422 `note_required`). `update { status: "DRAFT", reviewNote }`. Inline `sendMail` + `BlogRejected` + `Notification` to author.

### `POST /api/admin/blogs/[id]/start-edit` (lazy copy + soft-lock)
Admin-only, `$transaction` mirroring experience: load original; 409 unless `PENDING_REVIEW`; 409 `locked` if `reviewLockedBy` held by another admin; idempotent return if same admin already holds lock + copy exists. Otherwise create a copy from the original minus identity fields (`id, authorId, createdAt, updatedAt, slug, isReviewCopy, parentId, reviewLockedBy, changedFields, isDiscarded`) with `{ authorId: original.authorId, isReviewCopy: true, parentId: id, status: "DRAFT", slug: null, isDiscarded: false, changedFields: [], reviewNote: null }`, then set `reviewLockedBy: caller.id` on the original. Returns `{ copyId }`.

### `PATCH /api/admin/blogs/[id]/edit-copy` (save copy edits)
Admin-only. 403 unless target `isReviewCopy === true`. Accepts the same body fields as the tripper blog PATCH (title/subtitle/tagline/coverUrl/content/blocks/faq/tags/travelType/excuseKey/format/seo) and writes them to the copy. Regenerates the copy's `slug` as `null` is kept (copy has no public slug).

### `POST /api/admin/blogs/[id]/send-to-tripper` (PENDING_REVIEW → PENDING_TRIPPER_REVIEW)
Admin-only. Body `{ reviewNote? }`. Find active copy; `computeChangedFields(copy, original)` (422 `no_changes` if empty); `$transaction`: `update copy { changedFields, reviewNote }`, `update original { status: "PENDING_TRIPPER_REVIEW", reviewLockedBy: null }`. Then `sendBlogPendingTripperReview(id, original.authorId)` + `Notification`.

### `POST /api/admin/blogs/[id]/discard-copy`
Admin-only. Find active copy; `$transaction`: hard-delete copy + clear `reviewLockedBy` on original (stays `PENDING_REVIEW`).

### `POST /api/tripper/blogs/[id]/approve-copy` (PENDING_TRIPPER_REVIEW → PUBLISHED)
Owner-only. 409 unless `PENDING_TRIPPER_REVIEW`. Find active copy; `$transaction`: `overwriteOriginalWithCopy(tx, id, copy.id)` then hard-delete copy. `sendBlogCopyApproved(id, user.id)` (→ admin).

### `POST /api/tripper/blogs/[id]/reject-copy` (PENDING_TRIPPER_REVIEW → DRAFT)
Owner-only. 409 unless `PENDING_TRIPPER_REVIEW`. Find active copy; `$transaction`: `update copy { isDiscarded: true }` (tombstone, kept as reference), `update original { status: "DRAFT" }`. `sendBlogCopyRejected(id, user.id)` (→ admin).

### `PATCH /api/tripper/blogs/[id]` (modified — strip toggle, add auto-revert + lock)
Remove `status` from the accepted body (transitions only via guarded endpoints). Add: 409 `locked_for_review` when `existing.status === "PENDING_TRIPPER_REVIEW"`. Compute `contentChanged` over the blog content fields — **title, subtitle, tagline, coverUrl, content, blocks, tags, travelType, excuseKey, format, seo, faq** (JSON/array fields via `JSON.stringify` equality). `revertToDraft = existing.status === "PUBLISHED" && contentChanged` → include `{ status: "DRAFT" }` in the update (leave `publishedAt` for history; the public `PUBLISHED` gate hides it). Mirrors the experience PATCH `revertToDraft`/`contentChanged` logic.

### `getBlogCompleteness` (`src/lib/helpers/blog-form.ts`, extend)
```ts
export function getBlogCompleteness(
  draft: Pick<BlogFormDraft, "title" | "coverUrl"> & { content?: string | null },
): { complete: boolean; missing: string[] } // requires title + coverUrl + content (non-empty)
```
Pure function mirroring `getExperienceCompleteness`. Server maps the DB row → the shape before calling (subtitle/tags/faq/gallery/sections optional).

### `src/lib/blog/changed-fields.ts` (new)
`MUTABLE_BLOG_FIELDS = [title, subtitle, tagline, coverUrl, content, blocks, tags, travelType, excuseKey, format, seo, faq]`. `JSON_FIELDS = { blocks, seo, faq }`, `ARRAY_FIELDS = { tags }`. `overwriteOriginalWithCopy` copies these to the original + sets `{ status: "PUBLISHED", publishedAt: original.publishedAt ?? new Date(), isReviewCopy: false, parentId: null, reviewLockedBy: null, reviewNote: null, changedFields: [] }` and **preserves original `slug`**.

### `NewBlogPostShell` — new mode surface
```ts
export type BlogShellMode = "tripper" | "adminEdit" | "adminReadOnly";
// new props: mode?: BlogShellMode (default "tripper"); adminCopyId?: string;
//            reviewActionsSlot?: React.ReactNode; reviewLeftSlot?: React.ReactNode
```
- `persistDraft`: in `adminEdit` PATCH `/api/admin/blogs/${adminCopyId}/edit-copy`; else the existing tripper POST/PATCH branch.
- autosave `useEffect`: skip entirely when `mode === "adminReadOnly"`.
- footer nav (Next/Finish): rendered only in `tripper` mode; `adminReadOnly`/`adminEdit` render `reviewActionsSlot` instead.
- `BlogFormContent` gains `readOnly?: boolean` → disables all inputs when `mode === "adminReadOnly"`.

### Admin nav (`src/components/app/dashboard/config/adminNav.ts`)
Add after the `xsed` tab (content-management grouping), before `notifications`:
```ts
{ href: base("/blog"), icon: Newspaper, label: copy.blog }, // import Newspaper from lucide-react
```
Non-exact so `/blog/[id]` review pages keep the tab active. New `AdminDashboardDict["nav"].blog` key + heading mapping in `adminHeadings`.

### Public / owner / admin visibility guard (add `isReviewCopy: false`)
- `src/app/api/blogs/route.ts` (public list) — add to the `where` object alongside `status: PUBLISHED`.
- `src/app/api/blogs/[id]/route.ts` (public detail) — add to the `findFirst.where`.
- `src/lib/db/tripper-queries.ts` `getTripperPublishedBlogs` (~L877) — add to the `where`.
- `src/app/api/tripper/blogs/route.ts` (owner list) — add to `where: { authorId }` so the tripper's own list hides copies.
- `GET /api/admin/blogs` (new admin list) — filter `isReviewCopy: false`.

### `BlogPageClient` state-driven actions (replaces `handleTogglePublish`)
Per row status: **DRAFT** → "Submit for Review" button `POST /submit`; **PENDING_REVIEW** → disabled waiting indicator, no action; **PENDING_TRIPPER_REVIEW** → link to `/dashboard/tripper/blog/[id]/review-copy`; **PUBLISHED** → no action (no manual unpublish, proposal decision 3). `BlogStatusBadge`, the `BLOG_STATUSES` filter array, dict `status` keys, and `BlogPost["status"]` in `@/types/blog` all extend to the 4 lowercase values.

## Data Flow
```
DRAFT ──tripper Submit──▶ PENDING_REVIEW ──admin approve──▶ PUBLISHED
   ▲                          │  │
   │                          │  └─admin start-edit─▶ copy{isReviewCopy}+lock (still PENDING_REVIEW)
   │                          │         │
   │                          │         ├─edit-copy (PATCH copy) ──┐
   │                          │         ├─discard-copy ─▶ delete copy, unlock (PENDING_REVIEW)
   │                          │         └─send-to-tripper ─▶ PENDING_TRIPPER_REVIEW
   │                          │                                     │
   │            admin reject  │              tripper approve-copy ──┼─▶ overwrite original,
   └──────────────────────────┘                (PUBLISHED) ◀────────┘   delete copy
   ▲                                          tripper reject-copy
   └────────── copy{isDiscarded:true} kept ◀── (original → DRAFT)

edit PUBLISHED post (PATCH content changed) ─▶ auto-revert to DRAFT (re-review)

public/list queries: status filter AND isReviewCopy:false  ⇒ copies never leak
```

## File Changes
| File | Action | Notes |
|---|---|---|
| `prisma/schema.prisma` | Modify | Extend `BlogStatus`; add 7 fields to `BlogPost`. Apply via `npm run db:push`. |
| `src/app/api/tripper/blogs/[id]/submit/route.ts` | Create | DRAFT→PENDING_REVIEW + completeness gate + tombstone cleanup + `sendBlogSubmitted`. |
| `src/app/api/tripper/blogs/[id]/approve-copy/route.ts` | Create | Overwrite + delete copy → PUBLISHED. |
| `src/app/api/tripper/blogs/[id]/reject-copy/route.ts` | Create | Copy `isDiscarded:true`, original → DRAFT. |
| `src/app/api/tripper/blogs/[id]/route.ts` | Modify | Strip `status` from body; add lock guard + auto-revert-to-DRAFT. |
| `src/app/api/admin/blogs/[id]/{approve,reject,start-edit,send-to-tripper,discard-copy,edit-copy}/route.ts` | Create | Admin moderation + review-copy endpoints (mirror experience). |
| `src/app/api/admin/blogs/route.ts` | Create | `GET` admin list (non-copy posts + author) for `AdminBlogPageClient`. |
| `src/lib/blog/changed-fields.ts` | Create | `MUTABLE_BLOG_FIELDS`, `computeChangedFields`, `overwriteOriginalWithCopy`. |
| `src/lib/helpers/blog-form.ts` | Modify | Add `getBlogCompleteness` (title + coverUrl + content). |
| `src/components/app/dashboard/tripper/blog/NewBlogPostShell.tsx` | Modify | Add `mode`/`adminCopyId`/`reviewActionsSlot`/`reviewLeftSlot`; branch autosave + footer. |
| `src/components/app/dashboard/tripper/blog/BlogFormContent.tsx` | Modify | Add `readOnly` prop → disable inputs. |
| `src/components/app/dashboard/tripper/blog/BlogPageClient.tsx` | Modify | Replace `handleTogglePublish` with state-driven row actions. |
| `src/app/[locale]/(secure)/dashboard/admin/blog/page.tsx` | Create | Admin server page (requireAdmin) → `AdminBlogPageClient`. |
| `src/app/[locale]/(secure)/dashboard/admin/AdminBlogPageClient.tsx` | Create | Pending/All tabs + pending-count (mirror `AdminExperiencesPageClient`). |
| `src/app/[locale]/(secure)/dashboard/admin/blog/[id]/page.tsx` | Create | Fetch original + active copy → `AdminBlogReviewClient`. |
| `src/app/[locale]/(secure)/dashboard/admin/blog/[id]/AdminBlogReviewClient.tsx` | Create | Wrap `NewBlogPostShell` with mode state + `AdminBlogReviewActionsBar`. |
| `src/app/[locale]/(secure)/dashboard/admin/AdminBlogReviewActionsBar.tsx` | Create | Sticky approve/reject/start-edit/send/discard bar (mirror `AdminReviewActionsBar`). |
| `src/app/[locale]/(secure)/dashboard/tripper/blog/[id]/review-copy/page.tsx` | Create | Tripper reviews admin copy (mirror experience review-copy page). |
| `src/app/[locale]/(secure)/dashboard/tripper/blog/[id]/review-copy/TripperBlogReviewCopyClient.tsx` | Create | Read-only copy view + approve/reject-copy. |
| `src/components/app/dashboard/config/adminNav.ts` | Modify | Add "Blog" tab (`Newspaper`). |
| `src/components/app/dashboard/config/adminHeadings.ts` | Modify | Add `blog` + `blog/[id]` heading mappings. |
| `src/lib/email/index.ts` | Modify | Add `sendBlogSubmitted`, `sendBlogPendingTripperReview`, `sendBlogCopyApproved`, `sendBlogCopyRejected`. |
| `src/emails/{BlogSubmitted,BlogApproved,BlogRejected,BlogPendingTripperReview,BlogCopyApproved,BlogCopyRejected}.tsx` | Create | New email components mirroring the `Experience*` ones. |
| `src/app/api/blogs/route.ts`, `src/app/api/blogs/[id]/route.ts`, `src/lib/db/tripper-queries.ts`, `src/app/api/tripper/blogs/route.ts` | Modify | Add `isReviewCopy: false` visibility guard. |
| `src/lib/admin/types.ts` | Modify | Add `AdminBlog` type for the admin list. |
| `src/types/blog.ts` | Modify | Extend `BlogPost["status"]` union to the 4 lowercase states. |
| `src/lib/types/dictionary.ts` + `src/dictionaries/{es,en}.json` | Modify | New admin + tripper blog-review copy in both locales. |

## Testing Strategy
| Layer | What to Test | Approach |
|---|---|---|
| Type | New enum values + 7 fields wire through; `BlogShellMode` union; `BlogPost["status"]` widened; dict keys | `npm run typecheck` |
| Lint | No raw `<img>`, design-system compliance on new admin/tripper pages | `npm run lint` |
| Unit | `getBlogCompleteness` (title+cover+content permutations); `computeChangedFields` / `overwriteOriginalWithCopy` (JSON/array equality, slug preserved) | Vitest, mirroring experience `__tests__` |
| Integration (route) | Each transition's status guard (409 on wrong state), completeness 422, soft-lock 409, tombstone cleanup on resubmit, `isDiscarded` set on reject-copy, `isReviewCopy:false` on approve overwrite | Route tests mirroring `src/app/api/**/experiences/**/__tests__` |
| Integration (visibility) | Copy row (`isReviewCopy:true`) never returned by public list/detail, owner list, admin list | Seed a copy row, assert exclusion |
| Manual — tripper | Submit gated on completeness; DRAFT/PENDING_REVIEW/PENDING_TRIPPER_REVIEW/PUBLISHED render correct row actions; review-copy approve/reject; edit PUBLISHED auto-reverts | QA ≥360px + ≥1280px |
| Manual — admin | Blog tab + Pending/All + count; approve/reject/start-edit/send/discard; edit copy embedded in wizard; emails fire both locales | QA both locales |

## Migration / Rollout
1. Merge schema + code. 2. `npm run db:push` (additive columns + enum values; safe defaults; **no backfill** — existing posts stay `DRAFT`/`PUBLISHED`). No feature flag needed — the new statuses are unreachable until the new routes ship. Rollback: revert commits; columns are additive with safe defaults so they can linger harmlessly, or drop via `db:push` after removing the fields. If rolling back after copy rows exist, delete `isReviewCopy:true` rows first to avoid orphans (proposal rollback note).

## Open Questions
- [ ] `GET /api/admin/blogs` is not in the proposal's affected-areas table but is mechanically required by `AdminBlogPageClient` (parity with `/api/admin/experiences`). Confirm `sdd-tasks` includes it.
- [ ] `changedFields` was not named in the proposal's field list but is needed for the review-copy diff display (experience parity). Confirm inclusion vs. computing the diff on the fly in the review-copy page.
- [ ] Auto-revert leaves `publishedAt` populated on a reverted post (status `DRAFT`). Confirm keeping it (history) vs. nulling it — public gate keys on `status`, so either is safe.
- [ ] Admin approve/reject → tripper emails are sent inline in-route (experience parity). Confirm this vs. adding `sendBlogApproved`/`sendBlogRejected` helpers for symmetry with the other four senders.
