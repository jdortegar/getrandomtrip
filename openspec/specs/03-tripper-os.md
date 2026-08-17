# Feature Spec: Tripper OS

**Priority:** 3 — Content supply pipeline  
**Routes:** `/dashboard/tripper`, `/dashboard/tripper/experiences/*`, `/dashboard/tripper/blogs/*`, `/dashboard/tripper/earnings`, `/dashboard/tripper/reviews`, `/dashboard/tripper/notifications`  
**Last audited:** 2026-08-04

---

## Requirement: Tripper uses shared shell

The tripper dashboard layout SHALL use the same shared `DashboardRoleShell` components as the traveler dashboard, driven by tripper nav/heading config (`tripperNav`, `tripperHeadings`).

Existing tripper page content and routes SHALL remain unchanged. Visual parity with the pre-migration tripper dashboard SHALL be maintained.

---

## Status

What works end-to-end today:

- **Main dashboard** — Stats grid, recent bookings list, quick actions, notifications panel (audience=TRIPPER). All data from `/api/tripper/dashboard`.
- **Experience CRUD** — Create, edit, and submit flows work. All wizard steps (about, activities, itinerary, pricing) are wired. Image uploads work. Draft persistence works. Experiences list has search-by-title, bulk delete (checkbox column, select-all scoped to the current page, loops `DELETE /api/tripper/experiences/[id]`), and server-side pagination (`page`/`limit` on `GET /api/tripper/experiences`, `getTripperExperiences` does Prisma `skip`/`take`).
- **Experience approval cycle** — Full admin-edit + tripper-review loop implemented and unit-tested: submit → admin reviews → admin edits copy → sends copy to tripper → tripper approves/rejects copy. Soft-lock, copy-merge, changed-fields diff, and tripper notifications all work.
- **Blog CRUD** — Create, edit, preview (for existing posts), and publish/unpublish work. `POST /api/tripper/blogs`, `PATCH`, `DELETE` are wired. TinyMCE editor integrated. Blog list has search-by-title, bulk delete (checkbox column, select-all scoped to the current page, posts locked for review — `PENDING_REVIEW`/`PENDING_TRIPPER_REVIEW` — are excluded from selection since the single-delete endpoint rejects them with `409 locked_for_review`), and server-side pagination.
- **Earnings** — Summary cards and earnings table render. Data from `/api/tripper/earnings`. Payout status column is always "pending" (stub — see Gaps).
- **Reviews** — List renders from `/api/tripper/reviews` with server-side pagination; the NPS/rating stats strip comes from a separate dataset-wide `getTripperReviewStats` query so it stays correct across pages. Page converted from RSC-with-props to client-fetch to support pagination. Display only, no admin action available from tripper side.
- **Notifications** — List at `/dashboard/tripper/notifications`. `NotificationsPanel` in sidebar marked as audience=TRIPPER. Mark-as-read works.

---

## User Flows

**Experience creation:**
1. `/dashboard/tripper/experiences` → "Nueva experiencia" → `/dashboard/tripper/experiences/new`
2. Fill wizard tabs: About → Activities → Itinerary → Pricing
3. Save draft at any point; resume from list
4. "Enviar a revisión" → `POST /api/tripper/experiences/[id]/submit` → status transitions to `PENDING_REVIEW`
5. Admin reviews → approves/rejects or sends copy for tripper review
6. If copy sent: tripper receives notification → visits `/dashboard/tripper/experiences/[id]/review-copy`
7. Tripper approves → experience becomes ACTIVE; or rejects → admin notified

**Blog creation:**
1. `/dashboard/tripper/blogs` → "Nuevo post" → `/dashboard/tripper/blogs/new`
2. Fill title, cover image, TinyMCE body, tags
3. Save draft; preview at `/dashboard/tripper/blogs/[id]/preview`
4. Publish → `PATCH /api/tripper/blogs/[id]` with `status: "PUBLISHED"`

---

## Gaps

| Severity | Issue |
|----------|-------|
| CRITICAL | Blog list action links (`BlogPostsList`, `BlogPostRow`, `TripperQuickActions`) point to `/dashboard/tripper/blogs/…` without `/${locale}/` prefix — every other tripper page uses locale-aware paths |
| CRITICAL | "View All" in `RecentBookingsList` links to `/dashboard/tripper/bookings` — this route does not exist (404) |
| HIGH | Blog preview button in **create** mode (`/blogs/new`) silently navigates nowhere — only works on an existing saved post with an `id` |
| HIGH | Payout tracking is fully stubbed — every earnings row shows `status: "pending"`, `payoutDate: undefined`. Unusable for real finance reporting |
| MEDIUM | `getTripperReviews` includes a dead `generalReviews` DB query that is never used in the UI |
| MEDIUM | Double `SecureRoute` guards on blog pages — the layout already guards; the page-level guard is redundant |
| MEDIUM | Earnings page has no export or download for payment history |
| LOW | Blog slug is auto-generated from title at create time and never editable |

---

## API Coverage

| Method | Route | Status |
|--------|-------|--------|
| GET | `/api/tripper/dashboard` | Working |
| GET | `/api/tripper/experiences` | Working |
| POST | `/api/tripper/experiences` | Working |
| GET | `/api/tripper/experiences/[id]` | Working |
| PATCH | `/api/tripper/experiences/[id]` | Working |
| DELETE | `/api/tripper/experiences/[id]` | Working |
| POST | `/api/tripper/experiences/[id]/submit` | Working |
| POST | `/api/tripper/experiences/[id]/approve-copy` | Working |
| POST | `/api/tripper/experiences/[id]/reject-copy` | Working |
| GET | `/api/tripper/earnings` | Working (payout stub) |
| GET | `/api/tripper/reviews` | Working |
| GET | `/api/tripper/blogs` | Working |
| POST | `/api/tripper/blogs` | Working |
| GET | `/api/tripper/blogs/[id]` | Working |
| PATCH | `/api/tripper/blogs/[id]` | Working |
| DELETE | `/api/tripper/blogs/[id]` | Working |
| GET | `/api/notifications` | Working (audience=TRIPPER) |

---

---

## Feature: Hero Image Repositioning (2026-08-06)

Trippers can reposition their hero/cover image from the settings page so the focal point is preserved when the image is cropped to the banner aspect ratio.

### Data Model

Two nullable `Float` columns added to `User`:
- `heroImagePositionX Float?` — horizontal focal point, 0–100 (null = 50, center)
- `heroImagePositionY Float?` — vertical focal point, 0–100 (null = 50, center)

Values are persisted as percentages and map directly to CSS `object-position` / `background-position`.

### Settings UX (`/dashboard/tripper/settings`)

- Entering edit mode (clicking "Edit Profile") activates drag-to-reposition on the hero image area.
- The full image surface becomes a drag target (Pointer Events API — `onPointerDown` / `onPointerMove` / `onPointerUp` + `setPointerCapture`). Works for both mouse and touch.
- Cursor changes to `grab` in edit mode; `grabbing` while dragging.
- A "Drag to reposition" pill hint is shown when the image is present and not actively being dragged.
- A dedicated "Change photo" camera button overlay (top-left of the image) triggers the file picker. The image surface itself is no longer a click-to-upload target.
- A "Reset" / "Center" button snaps `heroImagePositionX` and `heroImagePositionY` back to 50.
- Position is staged in `formData` (same pattern as `nickname`, `location`) and only persisted when the tripper clicks "Save".
- Cancelling reverts position to the last-saved DB values.

### API

`GET /api/user/tripper` and `PATCH /api/user/tripper` both include `heroImagePositionX` and `heroImagePositionY`. The PATCH body passes the current percentage values; the server guards against non-number submissions with a `typeof` check.

### Public Profile Rendering (`/trippers/[tripper]`)

`getTripperBySlug` selects both position fields. `TripperHero` applies `style={{ objectPosition: \`${x}% ${y}%\` }}` to the full-bleed `<SafeImage>` banner, preserving Next.js image optimization (lazy loading, format conversion, CDN caching).

---

## Feature: Invited-Only Site Access (2026-08-16)

Generalizes the `TripperInvite` primitive into a kinded `AccessInvite` that can grant either the `TRIPPER` role or just a site-access pass through the marketing gate (`User.siteAccessGrantedAt`). Removes the existing-user guard on waitlist invites so a self-registered user can be invited to pass the gate; separates "invite someone to be a Tripper" (users table) from "invite someone to pass the gate" (waitlist table). Both accept flows now grant `siteAccessGrantedAt`; `TRIPPER`-kind grants also append the role.

### Data Model

`TripperInvite` model renamed to `AccessInvite` (table `tripper_invites` → `access_invites` via `ALTER TABLE` rename — no data loss) with new `kind` column (`AccessInviteKind` enum: `TRIPPER | SITE_ACCESS`, default `TRIPPER`). Pre-existing rows backfill to `TRIPPER` kind via the DEFAULT. New `User.siteAccessGrantedAt DateTime?` marks gate access, set to the current time on invite accept (both kinds) and on companion traveler claim.

### Admin Trigger Endpoints

`POST /api/admin/waitlist/[id]/invite` (renamed from `.../invite-tripper`, issues `kind: SITE_ACCESS`, no existing-user guard) and `POST /api/admin/users/[id]/invite-tripper` (path unchanged, issues `kind: TRIPPER`, 400 if target already `TRIPPER`/`ADMIN`). Email sends are kind-aware: `SITE_ACCESS` emails do not reference a Tripper role.

### Accept Flow — Existing User

Set `siteAccessGrantedAt` on the user regardless of `kind`. When `kind: TRIPPER`, additionally append `TRIPPER` to `roles`. Mark the invite `consumedAt` and redirect to `/` with a log-in message.

### Accept Flow — New User

Render the registration form with invite email pre-filled. On successful account creation (credentials or Google OAuth), set `siteAccessGrantedAt` regardless of `kind`. When `kind: TRIPPER`, additionally grant `roles: [TRAVELER, TRIPPER]` at creation; otherwise `roles: [TRAVELER]`. Mark the invite `consumedAt` and delete the matching `WaitlistEntry` (by email) if one exists.

### Schema Delivery Sequencing

Delivering the `AccessInvite` rename and new columns MUST follow a two-phase sequence (idempotent SQL script → `db:push`) because this repository has no Prisma migration history. Phase 1: run `npm run db:rename-access-invites` (idempotent SQL via `$executeRawUnsafe`: enum create, table+index rename, column adds). Phase 2: run `npm run db:push` (expect "already in sync"; if it proposes a drop, ABORT — do not pass `--accept-data-loss`). Phase 3: `npm run db:generate`. No application code referencing `prisma.accessInvite` may run before phase 2 completes.

### Admin Waitlist Invite Availability

Waitlist table invite action (row button and bulk invite) MUST be available for every entry regardless of existing-user status. Client-side gating (`alreadyMember` disabling the row button, `invitableSelectedIds` filter, "skipped" note) is removed alongside the server 400 guard. This explicitly supersedes the invite-filtering half of the `waitlist-bulk-actions` change's Resolved Decision #1. The other half (checkboxes and bulk delete never filtered by `alreadyMember`) is unaffected. The `alreadyMember` status chip remains rendered as information.

### Accept Page Copy Selection

The accept-invite client MUST select copy based on resolved invite's `kind`. For `kind: SITE_ACCESS`, both accept-page branches render `tripperInviteAccept.siteAccess` override strings instead of the default Tripper copy. For `kind: TRIPPER`, both branches render the default copy.

---

## Next Steps

1. **Fix blog link locale prefix** — prepend `/${locale}` to all blog navigation links in `BlogPostsList`, `BlogPostRow`, and `TripperQuickActions`.
2. **Fix "View All" bookings link** — change href to `/dashboard/tripper` (no separate bookings page) or build `/dashboard/tripper/bookings`.
3. **Fix blog preview in create mode** — disable preview button until the draft is saved and an `id` exists; then link to the real preview route.
4. **Remove dead `generalReviews` query** from `getTripperReviews`.
5. **Remove redundant `SecureRoute` guards** from blog pages — layout already guards.
6. **Design payout tracking** — decide model: manual payout records created by admin, or webhook-driven from payment processor. Implement once the model is clear.
