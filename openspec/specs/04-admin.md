# Feature Spec: Admin Dashboard

**Priority:** 4 — Operations and review  
**Routes:** `/dashboard/admin`, `/dashboard/admin/experiences/*`, `/dashboard/admin/packages`, `/dashboard/admin/payments`, `/dashboard/admin/reviews`, `/dashboard/admin/users`, `/dashboard/admin/waitlist`, `/dashboard/admin/xsed-notifications`, `/dashboard/admin/xsed/*`  
**Last audited:** 2026-06-22

---

## Status

What works end-to-end today:

- **Experience review workflow** — The most sophisticated feature in the codebase. Full pipeline: list PENDING_REVIEW experiences → admin soft-locks a record → creates a review copy → edits copy fields → sends copy to tripper for approval → tripper approves (copy overwrites original) or rejects. Soft-lock enforcement, copy-merge, changed-fields diff, and tripper notification chain are all solid.
- **Experience approval (fast path)** — Admin can also approve directly (setting pricing by type, transitioning to ACTIVE) or reject outright with a review note.
- **Packages list** — `/dashboard/admin/packages` lists packages. Read-only view.
- **Payments** — `/dashboard/admin/payments` lists all payments. Read-only.
- **Reviews** — `/dashboard/admin/reviews` lists all reviews. Admin can approve/reject individual reviews via `PATCH /api/admin/reviews/[id]`.
- **Users** — `/dashboard/admin/users` lists all users. Admin can update user details and roles via `PATCH /api/admin/users/[id]`.
- **Waitlist** — `/dashboard/admin/waitlist` lists entries. Admin can approve/reject via `PATCH /api/admin/waitlist/[id]`.
- **XSED notifications** — `/dashboard/admin/xsed-notifications` lists XSED notification records. Admin can update via `PATCH /api/admin/xsed-notifications/[id]`.
- **XSED drop management** — Admin can create (`/dashboard/admin/xsed/new`) and edit (`/dashboard/admin/xsed/[id]/edit`) XSED drops. Full form with date, pricing, capacity, and destination fields.

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
1. Trip requests listed in admin dashboard (no dedicated page — managed inline)
2. Admin can patch status via `PATCH /api/admin/trip-requests/[id]`

---

## Gaps

| Severity | Issue |
|----------|-------|
| CRITICAL | XSED list page in admin sidebar is a live 404 — the sidebar link points to a route that does not render |
| CRITICAL | Wrong role guard on XSED admin layout — a tripper can reach `/dashboard/admin/xsed/new` directly by URL |
| HIGH | Review copies appear in the `/dashboard/admin/experiences` list — `isReviewCopy: true` entries mix with originals, causing confusion and wrong review targets |
| HIGH | No dedicated admin trip-requests management page — `PATCH /api/admin/trip-requests/[id]` exists but no UI surfaces it beyond the main dashboard stats |
| MEDIUM | Payments list has no filtering by date range, status, or tripper — full unfiltered dump |
| MEDIUM | Users list has no search or filtering — full unfiltered dump |
| MEDIUM | Reviews list has no filtering by experience, status, or tripper |
| MEDIUM | Waitlist approval/rejection has no email notification to the waitlisted user |
| LOW | Packages list is read-only — no admin action (edit, deactivate) available |
| LOW | Admin dashboard main page has no summary stats (pending experience count, open trip requests, recent payments) |
| LOW | No audit log / activity history for admin actions |

---

## API Coverage

| Method | Route | Status |
|--------|-------|--------|
| GET | `/api/admin/experiences` | Working |
| GET | `/api/admin/experiences/[id]` | Working |
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
| GET | `/api/admin/waitlist` | Working |
| PATCH | `/api/admin/waitlist/[id]` | Working |
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
4. **Build admin trip-requests management page** — list all trip requests with status filter; inline status update; link to trip details.
5. **Add search/filter to payments, users, reviews lists** — date range, status, and text search at minimum.
6. **Add admin dashboard summary stats** — pending experience count, open trip requests, recent payment total.
7. **Wire waitlist approval email** — send confirmation to the waitlisted user on `PATCH /api/admin/waitlist/[id]` approval.
