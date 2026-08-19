# Feature Spec: Admin Dashboard

**Priority:** 4 — Operations and review  
**Routes:** `/dashboard/admin`, `/dashboard/admin/experiences/*`, `/dashboard/admin/packages`, `/dashboard/admin/payments`, `/dashboard/admin/reviews`, `/dashboard/admin/settings`, `/dashboard/admin/settings/users/[id]/edit`, `/dashboard/admin/xsed-notifications`, `/dashboard/admin/xsed/*`  
**Last audited:** 2026-08-18  
**Related capabilities:** `admin-user-edit-page`, `tripper-price-override`

---

## Status

What works end-to-end today:

- **Experience review workflow** — The most sophisticated feature in the codebase. Full pipeline: list PENDING_REVIEW experiences → admin soft-locks a record → creates a review copy → edits copy fields → sends copy to tripper for approval → tripper approves (copy overwrites original) or rejects. Soft-lock enforcement, copy-merge, changed-fields diff, and tripper notification chain are all solid.
- **Experience approval (fast path)** — Admin can also approve directly (setting pricing by type, transitioning to ACTIVE) or reject outright with a review note.
- **Experiences list bulk actions** — Search-by-title, bulk archive (checkbox column, select-all scoped to the current page, pending-review rows excluded from selection), and server-side pagination. `PATCH /api/admin/experiences/[id]` now also accepts `status: "ARCHIVED"` (ARCHIVED-only — not a general status-transition endpoint; PENDING_REVIEW/PENDING_TRIPPER_REVIEW/ACTIVE transitions still go through the dedicated review-workflow routes above). The "pending" count badge comes from a separate dataset-wide query, not the paginated result set.
- **Packages list** — `/dashboard/admin/packages` lists packages. Read-only view.
- **Payments** — `/dashboard/admin/payments` lists all payments with server-side pagination. Read-only. No delete endpoint exists for payments (deliberate — financial/audit record).
- **Reviews** — `/dashboard/admin/reviews` lists all reviews with server-side pagination. Admin can approve/reject individual reviews via `PATCH /api/admin/reviews/[id]`.
- **Trip requests** — `/dashboard/admin/trip-requests` lists trip requests with server-side pagination and independently-composable filters (status, travel type, experience level, payment status incl. a "no payment" state, and a traveler name/email search); the KPI strip counts come from a separate dataset-wide query so they stay correct regardless of which page or filter is active. Every real column (Traveler, Trip date, Origin, Type/Level, Status, Payment) is sortable via a shared `SortButton` header. Trip date's sort is anchored to "now" rather than a plain chronological sort — the default view shows the soonest-upcoming trip first, then further-out upcoming trips, then past trips ordered most-recent-first (toggling reverses the whole sequence); every other column sorts as a normal DB-level column sort. Admin can patch status via `PATCH /api/admin/trip-requests/[id]`.
- **Settings** — `/dashboard/admin/settings` is a single tabbed page (Users / Waitlist / XSED Notifications / Features):
  - **Users tab** — lists all users with server-side pagination. Admin can edit a user (roles, commission, price overrides) via a pencil link → `/dashboard/admin/settings/users/[id]/edit` (full page form, not a modal); delete a user via `DELETE /api/admin/users/[id]` (blocks self-delete); and search by name and bulk-delete via a checkbox column with a typed-confirmation modal (must type "DELETE" to confirm, given each deletion cascades across the user's trips, payments, reviews, and blog posts). The current admin's own row is excluded from bulk selection, and selection is scoped to the current page. Any non-tripper user row can also be invited to become a Tripper (`POST /api/admin/users/[id]/invite-tripper`) — this is the only place in the admin UI that promotes an existing user to `TRIPPER`.
  - **Waitlist tab** — lists entries with server-side pagination, an "Already a member" badge for entries whose email already resolves to a `User`, page-scoped bulk select, bulk delete (`DELETE /api/admin/waitlist/[id]`, no filtering), and "Invite as Traveler" (`POST /api/admin/waitlist/[id]/invite`, single row or bulk) — issues a `SITE_ACCESS`-kind invite that gets the invitee past the marketing waitlist gate with the default `TRAVELER` role only; it does **not** grant `TRIPPER` (see the Users tab above for that).
  - **XSED Notifications tab** — lists XSED notification records with server-side pagination. Admin can update via `PATCH /api/admin/xsed-notifications/[id]`.
  - **Features tab** — two independent toggles backed by the singleton `SiteSetting` row, each with its own save/error state (`GET`/`PATCH /api/admin/site-settings`):
    - **Waitlist gate** (`gateEnabled`, default on) — when on, only signed-in users who are `admin`/`tripper` or hold a site-access grant (`User.siteAccessGrantedAt`) pass the marketing gate (`GateAwareChrome.tsx`); everyone else sees the public waitlist page instead of the site.
    - **XSED window validation** (`xsedWindowEnforcementEnabled`, default on) — when on, `/xsed/book` only renders the booking form during the Sunday 16-20hs local-time window (`isLocalWindowOpen()`); when off, the window check is bypassed for everyone, in addition to the pre-existing admin-role and `XSED_BYPASS_WINDOW`-env-var bypasses (all three bypasses are independent ORs — any one of them opens the page).
- **XSED drop management** — Admin can create (`/dashboard/admin/xsed/new`) and edit (`/dashboard/admin/xsed/[id]/edit`) XSED drops. Full form with date, pricing, capacity, and destination fields.
- **Blog moderation** — `/dashboard/admin/blog` lists tripper blog posts with status filter (dropdown, not tabs), search-by-title, and server-side pagination; the "pending" badge comes from a separate dataset-wide query, not the paginated result set.

---

## User Flows

**Experience approval (fast path):**
1. `/dashboard/admin/experiences` → filter by `PENDING_REVIEW`
2. Click experience → `/dashboard/admin/experiences/[id]`
3. Review in read-only mode → set pricing per traveler type → "Aprobar" → `POST /api/admin/experiences/[id]/approve`
4. Experience status → `ACTIVE`; tripper notified via email

**Experience review (edit + tripper approval loop):**
1. Same entry as above → "Editar experiencia" → `POST /api/admin/experiences/[id]/start-edit` (acquires soft-lock, creates review copy)
2. Admin edits copy fields → `PATCH /api/admin/experiences/[id]/edit-copy`
3. "Enviar al tripper" → `POST /api/admin/experiences/[id]/send-to-tripper` (computes changed-fields diff, stores on copy, transitions original to `PENDING_TRIPPER_REVIEW`, sends notification)
4. Tripper approves → copy fields overwrite original, experience → `ACTIVE`; or tripper rejects → admin notified

**Experience rejection:**
1. From read-only review view → "Rechazar" → expand note field → "Confirmar rechazo" → `POST /api/admin/experiences/[id]/reject`
2. Experience status → `REJECTED`; tripper receives rejection email with note

**Trip request management:**
1. `/dashboard/admin/trip-requests` → filter/search/sort to find a trip → click edit action → `/dashboard/admin/trip-requests/[id]`
2. Admin can patch status via `PATCH /api/admin/trip-requests/[id]`

---

## Gaps

| Severity | Issue |
|----------|-------|
| CRITICAL | XSED list page in admin sidebar is a live 404 — the sidebar link points to a route that does not render |
| CRITICAL | Wrong role guard on XSED admin layout — a tripper can reach `/dashboard/admin/xsed/new` directly by URL |
| HIGH | Review copies appear in the `/dashboard/admin/experiences` list — `isReviewCopy: true` entries mix with originals, causing confusion and wrong review targets |
| MEDIUM | Trip requests list has no bulk actions (bulk status update, bulk delete). `DELETE /api/admin/trip-requests/[id]` exists but cascades and hard-deletes the linked `Payment` row (`Payment.tripRequestId onDelete: Cascade`) — a bulk-delete would be a backdoor around the fact that payments otherwise have no delete endpoint at all. Deliberately not built for this reason. |
| MEDIUM | Payments list has no filtering by date range, status, or tripper — full unfiltered dump |
| MEDIUM | Reviews list has no filtering by experience, status, or tripper |
| LOW | Packages list is read-only — no admin action (edit, deactivate) available |
| LOW | Admin dashboard main page has no summary stats (pending experience count, open trip requests, recent payments) |
| LOW | No audit log / activity history for admin actions |

---

## API Coverage

| Method | Route | Status |
|--------|-------|--------|
| GET | `/api/admin/experiences` | Working |
| GET | `/api/admin/experiences/[id]` | Working |
| PATCH | `/api/admin/experiences/[id]` | Working (`isActive`, `isFeatured`, `status: "ARCHIVED"`) |
| POST | `/api/admin/experiences/[id]/approve` | Working |
| POST | `/api/admin/experiences/[id]/reject` | Working |
| POST | `/api/admin/experiences/[id]/start-edit` | Working |
| PATCH | `/api/admin/experiences/[id]/edit-copy` | Working |
| POST | `/api/admin/experiences/[id]/discard-copy` | Working |
| POST | `/api/admin/experiences/[id]/send-to-tripper` | Working |
| GET | `/api/admin/payments` | Working |
| GET | `/api/admin/reviews` | Working |
| PATCH | `/api/admin/reviews/[id]` | Working |
| GET | `/api/admin/trip-requests` | Working |
| PATCH | `/api/admin/trip-requests/[id]` | Working |
| GET | `/api/admin/users` | Working |
| PATCH | `/api/admin/users/[id]` | Working |
| DELETE | `/api/admin/users/[id]` | Working (blocks self-delete) |
| POST | `/api/admin/users/[id]/invite-tripper` | Working — issues a `TRIPPER`-kind invite; 400 if already tripper/admin |
| GET | `/api/admin/waitlist` | Working — includes `alreadyMember` per entry |
| DELETE | `/api/admin/waitlist/[id]` | Working, no already-member filtering |
| POST | `/api/admin/waitlist/[id]/invite` | Working — issues a `SITE_ACCESS`-kind invite (traveler role only, no already-member guard) |
| GET | `/api/admin/site-settings` | Working — returns `gateEnabled` + `xsedWindowEnforcementEnabled` |
| PATCH | `/api/admin/site-settings` | Working — partial update, either or both flags |
| GET | `/api/admin/xsed` | Working |
| POST | `/api/admin/xsed` | Working |
| GET | `/api/admin/xsed/[id]` | Working |
| PATCH | `/api/admin/xsed/[id]` | Working |
| DELETE | `/api/admin/xsed/[id]` | Working |
| GET | `/api/admin/xsed-notifications` | Working |
| PATCH | `/api/admin/xsed-notifications/[id]` | Working |

---

## Next Steps

1. **Fix XSED sidebar link** — point to the correct route that renders the XSED list.
2. **Fix XSED layout role guard** — restrict to admin role only; a tripper must not be able to reach creation/edit forms.
3. **Filter review copies from experiences list** — add `isReviewCopy: false` to the default query in `GET /api/admin/experiences`.
4. **Add search/filter to payments and reviews lists** — date range, status, and text search at minimum. (Users and trip requests lists already have search + rich filters as of 2026-08-12; all admin tables have server-side pagination as of 2026-08-04.)
5. **Add admin dashboard summary stats** — pending experience count, open trip requests, recent payment total.
