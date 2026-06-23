# Feature Spec: Client Dashboard

**Priority:** 5 — Post-booking client experience  
**Routes:** `/dashboard`, `/dashboard/trips/[id]`, `/account`, `/trips/[id]` (redirect shim)  
**Last audited:** 2026-06-22

---

## Status

What works end-to-end today:

- **`/dashboard`** — Stats grid, `UnpaidTripsAlert` (pay/edit/delete actions), `UpcomingTripsPanel` (CONFIRMED + REVEALED trips, capped at 3), `FinancialSummary`, `NotificationsPanel`, `DashboardSkeleton`. All data from `/api/trips` + `/api/payments`.
- **`/dashboard/trips/[id]`** — Fetches trip via `/api/trips/[id]` (ownership-gated). Renders logistics, filters, addons, pricing, payment info, trip timeline. Destination reveal toggle works for REVEALED/COMPLETED trips. Not-found state works.
- **Trip delete** — Working via `DELETE /api/trips/[id]`, confirm dialog, optimistic state update.
- **`/account`** — All tabs work: Resumen, Personal (name/email/phone/address), Preferences (traveler type + tags), Security (password change). Avatar upload backed by `/api/upload`. All edits hit real endpoints.
- **`/trips/[id]`** — Pure redirect shim to `/dashboard/trips/[id]`. No rendering.

---

## User Flows

**Post-booking flow:**
1. Pay → `/checkout/success` → primary CTA links to Stripe receipt URL (bug — should link to `/dashboard`)
2. `/dashboard` → see trip in Upcoming panel → click "Ver detalles" → `/dashboard/trips/[id]`
3. View logistics (origin city, dates, traveler count, transport, filters, addons, pricing)
4. Trip transitions to REVEALED → destination toggle appears → click to reveal → **no client notification is sent**
5. "Ver Itinerario" button → links to `/dashboard/trips/[id]/details` → **route does not exist — 404**
6. Trip transitions to COMPLETED → "Dejar Reseña" button appears → **button is inert — no handler, no API**

**Account management:**
1. `/account` → edit personal info, traveler preferences, or password
2. All changes persist via real API endpoints

---

## Gaps

| Severity | Issue |
|----------|-------|
| CRITICAL | `/dashboard/trips/[id]/details` does not exist — "Ver Itinerario" button on every CONFIRMED/REVEALED trip is a broken link |
| CRITICAL | No `PATCH /api/trips/[id]` for review submission — "Dejar Reseña" button is inert; no handler, no API |
| HIGH | `AllTripsGrid` filters to COMPLETED trips only — CONFIRMED and REVEALED trips with approved payments are invisible in the grid |
| HIGH | Success page CTA links to Stripe receipt, not `/dashboard` — clients land on a Stripe PDF instead of their account |
| HIGH | Destination reveal does not trigger a client notification |
| MEDIUM | `RecentPaymentsTable` component is built and exported but rendered nowhere |
| MEDIUM | Account → Payments tab is "coming soon" placeholder; component already exists |
| MEDIUM | Account → Documents tab is "coming soon" placeholder; `idDocument` field exists in schema |
| MEDIUM | Account page calls `/api/trips?userId=X` — the API ignores this param and always uses session; misleading but harmless |
| LOW | Trip detail page has hardcoded Spanish strings for status labels and not-found copy — not i18n-ready |
| LOW | No empty-state handling when a client has no trips in the dashboard |

---

## API Coverage

| Method | Route | Status |
|--------|-------|--------|
| GET | `/api/trips` | Working |
| GET | `/api/trips/[id]` | Working (ownership-gated) |
| DELETE | `/api/trips/[id]` | Working |
| **PATCH** | **`/api/trips/[id]`** | **MISSING — needed for review submission** |
| GET | `/api/payments` | Working |
| GET | `/api/user/me` | Working |
| PATCH | `/api/user/update` | Working |
| PATCH | `/api/user/preferences` | Working |
| PATCH | `/api/user/password` | Working |
| PATCH | `/api/user/locale` | Working |
| GET | `/api/notifications` | Working |
| POST | `/api/upload` | Working (avatar) |

---

## Next Steps

1. **Add `PATCH /api/trips/[id]`** for `customerRating` + `customerFeedback` submission; wire "Dejar Reseña" button.
2. **Build or redirect `/dashboard/trips/[id]/details`** — check schema for the TripRequest ↔ Experience link before building; may require a new API endpoint to expose itinerary data.
3. **Fix `AllTripsGrid` filter** — show any trip with an approved payment, not just COMPLETED.
4. **Render `RecentPaymentsTable`** in dashboard and account Payments tab — data is already fetched.
5. **Fix success page CTA** — link to `/dashboard`, move receipt URL to a secondary action.
6. **Write client notification on REVEALED** — trigger when admin patches trip status to `REVEALED`.
7. **Internationalize trip detail page** — status labels, not-found copy, Trip Info card.
8. **Plan Documents tab** — decide scope (ID number field vs. file upload) before building.
