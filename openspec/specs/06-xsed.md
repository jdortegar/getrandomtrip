# Feature Spec: XSED

**Priority:** 6 — Secondary curated drop product  
**Routes:** `/xsed`, `/xsed/book`, `/xsed/drops`, `/xsed/drops/[slug]`, `/dashboard/admin/xsed/new`, `/dashboard/admin/xsed/[id]/edit`  
**Last audited:** 2026-06-22

---

## Product Context

XSED is a curated-drop product: a single surprise overnight trip with limited spots (typically 10), a short booking window, and the destination revealed 48 hours before departure. It is booked independently of the main journey flow.

---

## Business Rules

- **Trip dates are always canonical, never admin-configured.** Every XSED `TripRequest` runs from the upcoming Saturday to the following Sunday, computed fresh server-side at booking time via `xsedCanonicalDates()` in `POST /api/trip-requests` — regardless of any date typed into the admin drop form. `Experience.tripDate` is informational only (used for display and reveal-countdown copy); it must never be read back into a `TripRequest`'s `startDate`/`endDate`. This was a real bug: a stale `tripDate` on one drop (entered via an unconstrained `<input type="date">` with no validation) silently overrode the correct booking dates for a real purchase. Do not reintroduce any code path that lets a linked Experience's date win over the canonical computation.

---

## Status

What works end-to-end today:

- **`/xsed`** — Landing page renders. Hero, product explanation, CTA to join waitlist or book.
- **`/xsed/drops`** — Renders a list of XSED drops fetched from `/api/xsed/drops`. Shows active and past drops.
- **`/xsed/drops/[slug]`** — Individual drop detail page. Fetches drop data, sold-count from `/api/xsed/drops/[slug]/sold-count`. Renders drop info, countdown, CTA.
- **`/xsed/book`** — Booking form for XSED. Wired into the Stripe checkout flow with server-authoritative XSED-specific date handling (canonical dates override client-sent values — see `xsedCanonicalDates()` in the trip-requests API; see Business Rules above).
- **Admin drop creation** — `/dashboard/admin/xsed/new` and `/dashboard/admin/xsed/[id]/edit` allow admins to create and edit drops with date, pricing, capacity, and destination.
- **XSED notifications** — Admin can create and manage XSED notification records (`/api/admin/xsed-notifications`). Internal notify endpoint at `POST /api/internal/xsed/notify`.
- **Sold-count** — `GET /api/xsed/drops/[slug]/sold-count` returns real-time booking count for a drop.

---

## User Flows

**Traveler discovery and booking:**
1. `/xsed` → learn about the product → join waitlist or navigate to `/xsed/drops`
2. `/xsed/drops` → browse available and upcoming drops
3. `/xsed/drops/[slug]` → see drop details, countdown, remaining spots → "Reservar" CTA
4. CTA → `/xsed/book` → fill booking form → Stripe checkout → payment confirmation
5. Trip created with XSED-canonical dates; destination revealed 48h before via the reveal flow (shared with main booking flow)

**Admin drop management:**
1. `/dashboard/admin/xsed/new` → fill drop form (date, price, capacity, destination, description) → create
2. `/dashboard/admin/xsed/[id]/edit` → edit existing drop
3. `/dashboard/admin/xsed-notifications` → manage notification sends to XSED subscribers

---

## Gaps

| Severity | Issue |
|----------|-------|
| CRITICAL | XSED list page in admin sidebar is a live 404 — the sidebar link does not render the list |
| CRITICAL | Wrong role guard on XSED admin layout — a tripper can reach `/dashboard/admin/xsed/new` directly by URL |
| HIGH | `/xsed/book` does not enforce capacity — if the drop has 10 spots and 10 are booked, the form still accepts submissions |
| HIGH | No real-time spot availability shown on the booking form — user can initiate payment only to be rejected if capacity is reached |
| HIGH | Reveal flow for XSED trips shares the same broken `/reveal-destination` page as the main booking flow — not functional |
| MEDIUM | `/xsed/drops` has no status differentiation in the UI for sold-out vs. available vs. upcoming drops |
| MEDIUM | No email notification sent to XSED subscribers when a new drop goes live — only manual admin notification records |
| MEDIUM | Drop slug is admin-defined at creation — no validation for uniqueness enforced at the form level (only at DB level) |
| MEDIUM | `/xsed` waitlist CTA — where the waitlist entry goes and how it is managed is unclear; may overlap with the main waitlist |
| LOW | No public API endpoint to list XSED drops with filtering (date range, status) — current endpoint is minimal |
| LOW | Sold-count endpoint has no caching — fires a `COUNT` query on every page load |
| LOW | No admin view of who has booked a specific drop |

---

## API Coverage

| Method | Route | Status |
|--------|-------|--------|
| GET | `/api/xsed/drops` | Working |
| GET | `/api/xsed/drops/[slug]/sold-count` | Working (no cache) |
| GET | `/api/xsed/notifications` | Working |
| GET | `/api/admin/xsed` | Working |
| POST | `/api/admin/xsed` | Working |
| GET | `/api/admin/xsed/[id]` | Working |
| PATCH | `/api/admin/xsed/[id]` | Working |
| DELETE | `/api/admin/xsed/[id]` | Working |
| GET | `/api/admin/xsed-notifications` | Working |
| PATCH | `/api/admin/xsed-notifications/[id]` | Working |
| POST | `/api/internal/xsed/notify` | Working |
| POST | `/api/trip-requests` | Working — handles XSED with canonical date enforcement |
| POST | `/api/stripe/payment-intent` | Working — shared with main booking flow |

---

## Next Steps

1. **Fix admin XSED sidebar link** — point to the correct rendering route.
2. **Fix XSED admin layout role guard** — restrict to admin only.
3. **Enforce capacity on `/xsed/book`** — check remaining spots before allowing payment intent creation; surface sold-out state to the user.
4. **Show real-time availability on the drop detail and booking pages** — use `sold-count` endpoint to display remaining spots and disable CTA when at capacity.
5. **Fix the reveal flow** — XSED trips share the same broken `/reveal-destination` page; fixing that feature (see spec 01) resolves this.
6. **Add status differentiation to `/xsed/drops`** — clearly distinguish sold-out, available, upcoming, and past drops.
7. **Wire automated email on new drop** — trigger to XSED subscribers when a drop is published.
8. **Add admin view of drop bookings** — list of TripRequests linked to each XSED drop.
9. **Add slug uniqueness validation** to the admin creation form (client-side, before DB constraint fires).
