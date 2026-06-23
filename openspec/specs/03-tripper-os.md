# Feature Spec: Tripper OS

**Priority:** 3 — Content supply pipeline  
**Routes:** `/dashboard/tripper`, `/dashboard/tripper/experiences/*`, `/dashboard/tripper/blogs/*`, `/dashboard/tripper/earnings`, `/dashboard/tripper/reviews`, `/dashboard/tripper/notifications`  
**Last audited:** 2026-06-22

---

## Status

What works end-to-end today:

- **Main dashboard** — Stats grid, recent bookings list, quick actions, notifications panel (audience=TRIPPER). All data from `/api/tripper/dashboard`.
- **Experience CRUD** — Create, edit, and submit flows work. All wizard steps (about, activities, itinerary, pricing) are wired. Image uploads work. Draft persistence works.
- **Experience approval cycle** — Full admin-edit + tripper-review loop implemented and unit-tested: submit → admin reviews → admin edits copy → sends copy to tripper → tripper approves/rejects copy. Soft-lock, copy-merge, changed-fields diff, and tripper notifications all work.
- **Blog CRUD** — Create, edit, preview (for existing posts), and publish/unpublish work. `POST /api/tripper/blogs`, `PATCH`, `DELETE` are wired. TinyMCE editor integrated.
- **Earnings** — Summary cards and earnings table render. Data from `/api/tripper/earnings`. Payout status column is always "pending" (stub — see Gaps).
- **Reviews** — List renders from `/api/tripper/reviews`. Display only, no admin action available from tripper side.
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
| LOW | No pagination on experiences list — all experiences load at once |
| LOW | No bulk-action support on experiences list (e.g., archive multiple) |
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

## Next Steps

1. **Fix blog link locale prefix** — prepend `/${locale}` to all blog navigation links in `BlogPostsList`, `BlogPostRow`, and `TripperQuickActions`.
2. **Fix "View All" bookings link** — change href to `/dashboard/tripper` (no separate bookings page) or build `/dashboard/tripper/bookings`.
3. **Fix blog preview in create mode** — disable preview button until the draft is saved and an `id` exists; then link to the real preview route.
4. **Remove dead `generalReviews` query** from `getTripperReviews`.
5. **Remove redundant `SecureRoute` guards** from blog pages — layout already guards.
6. **Design payout tracking** — decide model: manual payout records created by admin, or webhook-driven from payment processor. Implement once the model is clear.
7. **Add pagination to experiences list** with server-side cursor or page offset.
