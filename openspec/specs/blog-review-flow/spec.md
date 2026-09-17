# Blog Review Flow Specification

## Change: `tripper-blog-review`

Adds a new `blog-review-flow` capability formalizing the tripper submit → admin moderation → review-copy → publish lifecycle for `BlogPost`, replacing the current unmoderated `handleTogglePublish` direct-toggle. See the `tripper-blog-review` change proposal for locked decisions and design rationale.

---

# blog-review-flow Specification (NEW)

## Purpose

Defines the `BlogPost` status state machine, its transitions, the submission completeness gate, the admin edit soft-lock, email notifications, the admin moderation surface, and public visibility rules — bringing blog publishing to parity with the existing `Experience` review pipeline.

## Requirements

### Requirement: Blog Status State Machine

The system MUST enforce a 4-state `BlogStatus` lifecycle (`DRAFT`, `PENDING_REVIEW`, `PENDING_TRIPPER_REVIEW`, `PUBLISHED`) with exactly these transitions, each server-derived from the authenticated caller's role and current state — never trusted from client-sent status:

- `DRAFT → PENDING_REVIEW` (tripper submits; requires completeness gate to pass)
- `PENDING_REVIEW → PUBLISHED` (admin approves directly, no copy)
- `PENDING_REVIEW → DRAFT` (admin rejects, with `reviewNote`)
- `PENDING_REVIEW → PENDING_TRIPPER_REVIEW` (admin starts edit: creates a review-copy row with `isReviewCopy: true`, `parentId` = original, sets `reviewLockedBy`)
- `PENDING_TRIPPER_REVIEW → PUBLISHED` (tripper approves copy: copy content overwrites original atomically, copy row removed from active editing)
- `PENDING_TRIPPER_REVIEW → DRAFT` (tripper rejects copy: original reverts, copy reaches a terminal state per the Review-Copy Terminal State requirement)

No other direct transition is permitted.

#### Scenario: Tripper submits a complete draft for review

- GIVEN a `BlogPost` in `DRAFT` with title, coverUrl, and content all present
- WHEN the tripper submits it for review
- THEN status becomes `PENDING_REVIEW`

#### Scenario: Admin approves directly

- GIVEN a `BlogPost` in `PENDING_REVIEW` with no active review copy
- WHEN an admin approves it
- THEN status becomes `PUBLISHED`

#### Scenario: Admin rejects with a note

- GIVEN a `BlogPost` in `PENDING_REVIEW`
- WHEN an admin rejects it with a non-empty `reviewNote`
- THEN status becomes `DRAFT` and `reviewNote` is persisted

#### Scenario: Admin starts an edit, creating a review copy

- GIVEN a `BlogPost` in `PENDING_REVIEW` with no `reviewLockedBy` set
- WHEN an admin starts editing it
- THEN a new row is created with `isReviewCopy: true` and `parentId` pointing at the original
- AND the original transitions to `PENDING_TRIPPER_REVIEW` with `reviewLockedBy` set to the admin's id

#### Scenario: Tripper approves the admin's copy

- GIVEN a `BlogPost` in `PENDING_TRIPPER_REVIEW` with an associated review copy
- WHEN the tripper approves the copy
- THEN the copy's content overwrites the original atomically and the original's status becomes `PUBLISHED`

#### Scenario: Tripper rejects the admin's copy

- GIVEN a `BlogPost` in `PENDING_TRIPPER_REVIEW` with an associated review copy
- WHEN the tripper rejects the copy
- THEN the original reverts to `DRAFT`
- AND the review copy reaches its terminal state without altering the original's data

#### Scenario: Invalid transition rejected

- GIVEN a `BlogPost` in `PUBLISHED` status
- WHEN a request attempts to set status directly to `PENDING_TRIPPER_REVIEW`, bypassing `PENDING_REVIEW`
- THEN the API MUST return an error and status MUST NOT change

---

### Requirement: No Manual Unpublish

The system MUST NOT expose any action that lets a tripper or admin move a `PUBLISHED` post back to `DRAFT` by direct choice. The only paths from `PUBLISHED` to `DRAFT` are admin rejection (reached via `PENDING_REVIEW`/`PENDING_TRIPPER_REVIEW`) and the automatic content-edit revert.

#### Scenario: No unpublish action exists for a published post

- GIVEN a `BlogPost` in `PUBLISHED` status
- WHEN the tripper or admin views available actions for that post
- THEN no available action sets status to `DRAFT` directly — only editing content (triggering auto-revert) or an admin rejection reached through the standard review states can do so

---

### Requirement: Auto-Revert to DRAFT on Published Content Edit

The system MUST auto-revert a `PUBLISHED` post to `DRAFT` when a reviewable content field (title, subtitle, tagline, coverUrl, content, tags, travelType, blocks/gallery, faq, seo) changes, mirroring `Experience`'s `revertToDraft`. Changes to system/review-mechanism fields (`reviewNote`, `tripperNote`, `reviewLockedBy`, `publishedAt`, `slug`) MUST NOT trigger the revert, since they are not tripper-authored content.

#### Scenario: Editing a published post's content forces re-review

- GIVEN a `BlogPost` in `PUBLISHED` status
- WHEN its title or content changes via a tripper-authored update
- THEN status reverts to `DRAFT`
- AND the post must be resubmitted for review before it is public again

#### Scenario: Review-mechanism field change does not trigger revert

- GIVEN a `BlogPost` in `PUBLISHED` status
- WHEN only a system/review field (e.g. `reviewLockedBy` being cleared) changes, with no reviewable content field changing
- THEN status remains `PUBLISHED`

---

### Requirement: Submission Completeness Gate

The system MUST require `title`, `coverUrl`, and `content` to be present before a `DRAFT` post can be submitted for review. `subtitle`, `tags`, `faq`, gallery/blocks, and other fields are optional for submission.

#### Scenario: Missing required field blocks submission

- GIVEN a `BlogPost` in `DRAFT` missing `coverUrl`
- WHEN the tripper attempts to submit it for review
- THEN the submission is rejected with a message indicating `coverUrl` is required
- AND status remains `DRAFT`

#### Scenario: Complete draft can be submitted

- GIVEN a `BlogPost` in `DRAFT` with `title`, `coverUrl`, and `content` all present
- WHEN the tripper submits it for review
- THEN the submission succeeds and status becomes `PENDING_REVIEW`

---

### Requirement: Review Soft-Lock

The system MUST prevent two admins from concurrently starting an edit on the same `PENDING_REVIEW` post via a `reviewLockedBy`-equivalent field.

#### Scenario: Second admin blocked from starting edit

- GIVEN a `BlogPost` in `PENDING_REVIEW` already locked by admin A (`reviewLockedBy = A`)
- WHEN admin B attempts to start editing the same post
- THEN the request MUST be rejected and the lock MUST remain held by admin A

#### Scenario: Lock released once the review-copy cycle resolves

- GIVEN a `BlogPost`'s review-copy cycle completes (tripper approves or rejects the copy)
- WHEN that terminal transition occurs
- THEN `reviewLockedBy` MUST be cleared

---

### Requirement: Email Notification on Every Transition

The system MUST send an email notification to the other party on every status transition: submission (tripper → admins), approve/reject (admin → tripper author), send-to-tripper (admin → tripper), and copy-approve/copy-reject (tripper → reviewing admin). Emails MUST be localized to the recipient's locale.

#### Scenario: Admins notified on submission

- GIVEN a tripper submits a `DRAFT` post for review
- WHEN the submission succeeds
- THEN an email is sent notifying admins a post is pending review

#### Scenario: Tripper notified on every admin-driven transition

- GIVEN an admin approves, rejects, or sends a review copy to the tripper
- WHEN that action completes
- THEN an email is sent to the post's author notifying them of the outcome, localized to their locale

#### Scenario: Admin notified on tripper's copy decision

- GIVEN a tripper approves or rejects an admin's review copy
- WHEN that action completes
- THEN an email is sent to the reviewing admin notifying them of the tripper's decision

---

### Requirement: Admin Blog Moderation List

The system MUST provide an admin blog list surface with a Pending tab (posts in `PENDING_REVIEW` or `PENDING_TRIPPER_REVIEW`) and an All tab (every non-review-copy post regardless of status), plus a pending-count badge on the admin "Blog" navigation entry — conceptually mirroring the existing `AdminExperiencesPageClient` list/tab/badge pattern as a parallel, non-shared implementation.

#### Scenario: Admin sees pending count badge

- GIVEN there are 3 `BlogPost`s in `PENDING_REVIEW` status
- WHEN an admin views the dashboard navigation
- THEN the Blog tab shows a badge with count 3

#### Scenario: Pending tab shows only posts awaiting action

- GIVEN a mix of `BlogPost`s across `DRAFT`, `PENDING_REVIEW`, `PENDING_TRIPPER_REVIEW`, and `PUBLISHED`
- WHEN the admin opens the Pending tab
- THEN only `PENDING_REVIEW` and `PENDING_TRIPPER_REVIEW` rows are listed

#### Scenario: All tab shows every post regardless of status

- GIVEN posts across all statuses
- WHEN the admin opens the All tab
- THEN every non-review-copy post is listed regardless of status

---

### Requirement: Public Visibility Gate

Public blog queries MUST return only rows where `status === PUBLISHED` AND `isReviewCopy === false` (or the equivalent non-copy indicator). Review-copy rows and any non-`PUBLISHED` status MUST never be publicly queryable.

#### Scenario: Review copy never appears publicly

- GIVEN a `BlogPost` in `PENDING_TRIPPER_REVIEW` with an associated review-copy row (`isReviewCopy: true`)
- WHEN a public blog listing or detail query runs
- THEN the review-copy row is never returned, regardless of its content

#### Scenario: Only PUBLISHED originals are publicly queryable

- GIVEN `BlogPost`s across all statuses
- WHEN a public blog listing or detail query runs
- THEN only rows with status `PUBLISHED` and `isReviewCopy: false` are returned

---

### Requirement: Review-Copy Terminal State After Rejection

When a tripper rejects an admin's review copy, the copy row MUST reach a terminal state such that it is no longer visible or actionable to either the tripper or any admin, and MUST NOT affect the original post's data. The specific field/enum mechanism representing this terminal state (e.g. an `INACTIVE` status value vs. a structural boolean) is realized as `isDiscarded: boolean` on the `BlogPost` model — rejecting a copy sets `isDiscarded: true`, and all active-copy queries filter for `isDiscarded: false`.

#### Scenario: Rejected copy disappears from both admin and tripper surfaces

- GIVEN a tripper rejects an admin's review copy
- WHEN the rejection completes
- THEN the copy row no longer appears in any admin blog list, the tripper review-copy page, or any public query
- AND the original post's content and status (now `DRAFT`) are unaffected by the rejected copy's content

---

## Out of Scope

- A shared generic "reviewable resource" abstraction unifying `Experience` and `BlogPost` review flows — deliberately deferred; this spec covers a dedicated, parallel `BlogPost` implementation only.
- An `ARCHIVED` `BlogStatus` value — nothing in this flow archives a post.
- Any manual unpublish path, for either role.
- Reworking the blog wizard steps (`FaqStep`, `GalleryStep`, etc.) themselves.

## Schema Delta

| Change | Detail |
|--------|--------|
| `BlogStatus` enum | MODIFIED — add `PENDING_REVIEW`, `PENDING_TRIPPER_REVIEW` (existing `DRAFT`, `PUBLISHED` preserved, `@default(DRAFT)` unchanged) |
| `BlogPost.reviewNote` | ADDED — admin rejection note |
| `BlogPost.tripperNote` | ADDED — tripper copy-rejection note |
| `BlogPost.isReviewCopy` | ADDED — marks a row as an admin-authored review copy |
| `BlogPost.parentId` | ADDED — links a review copy to its original post |
| `BlogPost.reviewLockedBy` | ADDED — soft-lock holder during admin edit |
| `BlogPost.changedFields` | ADDED — tracks which fields admin changed in review copy, for tripper diff display |
| `BlogPost.isDiscarded` | ADDED — terminal state marker for rejected copies |

## API Contracts (New)

| Endpoint | Auth | Behavior |
|----------|------|----------|
| `PATCH /api/tripper/blogs/[id]/submit` | TRIPPER | `DRAFT → PENDING_REVIEW` if completeness gate passes |
| `PATCH /api/admin/blogs/[id]/approve` | ADMIN | `PENDING_REVIEW → PUBLISHED` |
| `PATCH /api/admin/blogs/[id]/reject` | ADMIN | `PENDING_REVIEW → DRAFT`, requires `reviewNote` |
| `PATCH /api/admin/blogs/[id]/start-edit` \| `send-to-tripper` | ADMIN | Creates review copy, `PENDING_REVIEW → PENDING_TRIPPER_REVIEW`, sets `reviewLockedBy`; blocked if already locked |
| `PATCH /api/tripper/blogs/[id]/approve-copy` | TRIPPER | Copy overwrites original atomically, `PENDING_TRIPPER_REVIEW → PUBLISHED` |
| `PATCH /api/tripper/blogs/[id]/reject-copy` | TRIPPER | `PENDING_TRIPPER_REVIEW → DRAFT`, copy reaches terminal state |

---

# blog-review-flow-v2: RandomTrip Ownership & Auto-Publish Specification

## Change: `randomtrip-blog-ownership`

Adds a `RANDOMTRIP` ownership path to `BlogPost`, mirroring the equivalent `Experience.source` mechanism (see `experience-review-lifecycle`/`experience-randomtrip-ownership`). A RANDOMTRIP-sourced post is owned by a dedicated pseudo-user, not by whichever admin created it, and skips the tripper review pipeline entirely.

## MODIFIED Requirements

### Requirement: Blog Status State Machine (Extended — RANDOMTRIP bypass)

In addition to the v1 transitions, the system MUST support a `DRAFT → PUBLISHED` direct transition for `BlogPost` rows with `source: RANDOMTRIP`, bypassing `PENDING_REVIEW` entirely — there is no review step for admin-owned content. This transition MUST NOT be reachable for `source: TRIPPER` rows, which keep the full v1 pipeline unchanged.

#### Scenario: RANDOMTRIP post auto-publishes on submit

- GIVEN a `BlogPost` in `DRAFT` with `source: RANDOMTRIP`
- WHEN the submit endpoint is called
- THEN status becomes `PUBLISHED` directly, `isActive` is set `true`, and `publishedAt` is set
- AND the post never occupies `PENDING_REVIEW`
- AND no "submitted for review" notification is sent

#### Scenario: TRIPPER post is unaffected

- GIVEN a `BlogPost` in `DRAFT` with `source: TRIPPER`
- WHEN the submit endpoint is called
- THEN status becomes `PENDING_REVIEW`, identical to pre-change behavior

---

### Requirement: Auto-Revert to DRAFT on Published Content Edit (Amended — RANDOMTRIP exempt)

The existing `Auto-Revert to DRAFT` requirement MUST NOT apply to `source: RANDOMTRIP` posts. Editing a published RANDOMTRIP post's content MUST leave it `PUBLISHED` and `isActive: true` — there is no review step to re-enter.

#### Scenario: Editing a published RANDOMTRIP post does not unpublish it

- GIVEN a `BlogPost` in `PUBLISHED` status with `source: RANDOMTRIP`
- WHEN its title or content changes via a PATCH
- THEN status remains `PUBLISHED` and `isActive` remains `true`

---

## ADDED Requirements

### Requirement: BlogPost Ownership Source

`BlogPost` MUST carry a `source: BlogSource` field with values `TRIPPER | RANDOMTRIP`, defaulting to `TRIPPER`, derived exclusively from the authenticated caller's role at creation time — never trusted from the request body — mirroring `Experience.source` exactly.

#### Scenario: Source derived from admin caller

- GIVEN an authenticated ADMIN calls the blog creation endpoint
- WHEN the row is created
- THEN `source` is persisted as `RANDOMTRIP` regardless of any `source` value present in the request body

---

### Requirement: RandomTrip Pseudo-User Ownership

`Experience.ownerId` and `BlogPost.authorId` MUST be set to a dedicated "RandomTrip" system user's id (seeded via `scripts/seed-randomtrip-user.ts`, no password, `roles: ["ADMIN"]`, no `tripperSlug`) whenever the row's `source` is `RANDOMTRIP` — never to the individual admin account that triggered creation. `Experience.createdById` / `BlogPost.createdById` (added to `BlogPost` by this change, mirroring the existing `Experience` field) MUST be set to the real creating admin's id, for audit purposes only — it MUST NOT be used for access control or public attribution.

This decouples brand-owned content from any individual admin's account lifecycle: both `owner`/`author` relations cascade-delete their content, so without this indirection, deleting an admin's account would delete every RANDOMTRIP row they ever created.

#### Scenario: New RANDOMTRIP post owned by the pseudo-user

- GIVEN an authenticated ADMIN creates a new blog post
- WHEN the row is created
- THEN `authorId` is the RandomTrip pseudo-user's id, and `createdById` is the real admin's id

#### Scenario: Admin's own "My Blog" list no longer shows their RANDOMTRIP posts

- GIVEN an admin created a RANDOMTRIP post (now owned by the pseudo-user)
- WHEN that admin views their personal blog list (`GET /api/tripper/blogs`, scoped by `authorId === caller.id`)
- THEN the post does not appear there — it is visible only from the admin-wide list (`GET /api/admin/blogs`)

---

### Requirement: Any Admin May Manage a RANDOMTRIP Post

`GET`/`PATCH`/`DELETE /api/tripper/blogs/[id]` and `POST /api/tripper/blogs/[id]/submit` MUST authorize the request when either the caller is the post's `authorId` (owner) OR the caller has the ADMIN role AND the post's `source` is `RANDOMTRIP` — mirroring the equivalent `isOwner || isAdminOnRandomtrip` check on the experience routes. This MUST NOT extend to `source: TRIPPER` posts, which remain owner-only.

#### Scenario: A different admin can edit a RANDOMTRIP post

- GIVEN admin B (not the original creator) is authenticated as ADMIN
- WHEN admin B calls GET/PATCH on a `BlogPost` with `source: RANDOMTRIP`
- THEN the request succeeds regardless of who created it

#### Scenario: A non-owning admin cannot edit a TRIPPER post

- GIVEN an ADMIN who is not the post's author
- WHEN that admin calls PATCH on a `BlogPost` with `source: TRIPPER`
- THEN the request MUST return 404 ("not found or access denied")

---

### Requirement: One-Time Ownership Backfill

A one-time, idempotent migration (`scripts/backfill-randomtrip-ownership.ts`) MUST, for every existing row with `source: RANDOMTRIP` across `Experience` and `BlogPost`: (1) where `createdById` is null, set it to the row's current `ownerId`/`authorId`; then (2) set `ownerId`/`authorId` to the RandomTrip pseudo-user's id.

#### Scenario: Existing RANDOMTRIP rows repointed without losing creator history

- GIVEN a RANDOMTRIP experience created before this change, with `ownerId` = admin A and `createdById: null`
- WHEN the migration runs
- THEN `createdById` becomes admin A's id, and `ownerId` becomes the RandomTrip pseudo-user's id

---

### Requirement: Admin-Only "New Post" Creation Route

The system MUST provide a dedicated `/dashboard/admin/blog/new` route (`NewBlogPostShell` with `mode: "adminCreate"`), distinct from the tripper's own `/dashboard/tripper/blog/new`. The admin nav's "New Post" tab MUST link to this route, not the tripper route.

In `adminCreate` mode: the finalize CTA MUST read "Publish" (not "Submit for review"), the confirm-modal copy MUST state the post publishes immediately as a RandomTrip post skipping review, and the tripper-note field MUST NOT be shown (there is no reviewer to address).

#### Scenario: Admin nav does not send an admin to a tripper-branded URL

- GIVEN an admin clicks "New Post" in the admin nav
- WHEN the page loads
- THEN the URL is `/dashboard/admin/blog/new`, not `/dashboard/tripper/blog/new`

#### Scenario: New-post copy reflects auto-publish, not review

- GIVEN an admin is on the last step of `/dashboard/admin/blog/new` with a complete draft
- WHEN the admin views the finalize button and its confirm modal
- THEN the button reads "Publish" and the modal states the post goes live immediately, with no tripper-note input shown

---

### Requirement: Admin Blog List Defaults to All

The admin blog list (`AdminBlogPageClient`) MUST default to the "All" tab, not "Pending". Since RANDOMTRIP posts never enter `PENDING_REVIEW`, a "Pending"-first default would hide them from the admin entirely on first load. The list MUST also render an Edit action for `source: RANDOMTRIP` rows (which have nothing to "review"), linking to the shared `/dashboard/tripper/blog/[id]` edit page.

#### Scenario: Newly-published RANDOMTRIP post is visible without switching tabs

- GIVEN an admin just published a new RANDOMTRIP post
- WHEN that admin opens `/dashboard/admin/blog`
- THEN the post is visible immediately, on the default "All" tab

#### Scenario: RANDOMTRIP row shows an Edit action, not a Review action

- GIVEN a `PUBLISHED` `BlogPost` with `source: RANDOMTRIP` in the admin blog list
- WHEN the admin views that row's actions
- THEN an Edit icon linking to `/dashboard/tripper/blog/[id]` is shown, not a Review action

---

### Requirement: RandomTrip Attribution Has No Public Profile Link

The public post-attribution UI (`TripperMottoBanner`) MUST render the attribution as plain text, not a link to `/trippers/[slug]`, when the author has no `tripperSlug` — which is always true for the RandomTrip pseudo-user by design (it is not a real tripper and has no public profile page).

#### Scenario: RANDOMTRIP post attribution is not a dead link

- GIVEN a published `BlogPost` with `source: RANDOMTRIP` (author = RandomTrip pseudo-user, no `tripperSlug`)
- WHEN a visitor views the post's feature-quote attribution
- THEN the attribution text renders without a link

---

## Schema Delta (blog-review-flow-v2 additions)

| Change | Detail |
|--------|--------|
| `BlogSource` enum | ADDED — `TRIPPER \| RANDOMTRIP` |
| `BlogPost.source` | ADDED as `BlogSource @default(TRIPPER)` |
| `BlogPost.createdById` | ADDED as `String?`, relation `BlogCreatedBy`, `onDelete: SetNull` |

## API Contracts (blog-review-flow-v2 additions)

| Endpoint | Auth | Behavior |
|----------|------|----------|
| `POST /api/tripper/blogs` | TRIPPER or ADMIN | `source`/`authorId`/`createdById` server-derived from caller role, per Ownership requirements above |
| `GET/PATCH/DELETE /api/tripper/blogs/[id]` | Owner OR (ADMIN AND `source: RANDOMTRIP`) | See "Any Admin May Manage a RANDOMTRIP Post" |
| `POST /api/tripper/blogs/[id]/submit` | Owner OR (ADMIN AND `source: RANDOMTRIP`) | `DRAFT → PUBLISHED` direct for RANDOMTRIP; `DRAFT → PENDING_REVIEW` for TRIPPER |
