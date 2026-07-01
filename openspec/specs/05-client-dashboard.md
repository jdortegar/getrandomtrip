# Feature Spec: Client Dashboard

**Priority:** 5 — Post-booking client experience  
**Routes:** `/dashboard/client`, `/dashboard/client/trips`, `/dashboard/client/reviews`, `/dashboard/client/notifications`, `/dashboard/client/settings`, `/dashboard/trips/[id]`, `/account`, `/trips/[id]` (redirect shim)  
**Last audited:** 2026-06-30

---

## Architecture: Tabbed Shell

The client dashboard lives under `/dashboard/client/*` and uses the shared `DashboardRoleShell` — a horizontal tab strip driven by `clientNav` config. Legacy routes redirect:

- `/dashboard` → `/dashboard/client`
- `/dashboard/settings` → `/dashboard/client/settings`

### Requirement: Client route segment

The client dashboard SHALL live under `/dashboard/client/*`.

| Tab | Route |
|-----|-------|
| Home | `/dashboard/client` |
| My Trips | `/dashboard/client/trips` |
| My Reviews | `/dashboard/client/reviews` |
| Notifications | `/dashboard/client/notifications` |
| Settings | `/dashboard/client/settings` |

Trip detail pages remain at `/dashboard/trips/[id]/*` outside the client tab shell.

### Requirement: Client home content

The client home tab SHALL show a summary dashboard:
- KPI stat cards (total trips, upcoming, completed, total spent, average rating)
- Unpaid trips alert
- Upcoming trips panel (max 3)
- Quick actions

The home tab SHALL NOT include the full trips grid or `HeaderHero`.

### Requirement: Client trips tab

The trips tab SHALL render the full trips grid for all paid/approved trips.

### Requirement: Client reviews tab (v1)

The reviews tab SHALL display:
- KPIs: average rating given, trips reviewed count
- List of completed trips where `customerRating` is set

Data source: existing trips fetch (`getTrips()` or server equivalent).

### Requirement: Client notifications tab

The notifications tab SHALL list notifications with `audience=CLIENT`, ordered by `createdAt desc`.

Clicking a notification with `tripRequestId` metadata SHALL navigate to `/dashboard/trips/[id]`.

### Requirement: Client settings tab

The settings tab SHALL render `AccountSettingsPanel` with `role="client"` inside the tab shell (no `HeaderHero`).

---

## Requirement: Strict segment guards

Each dashboard role layout SHALL verify strict role membership:
- `/dashboard/client/*` — any authenticated user with a known role
- `/dashboard/tripper/*` — user MUST have `tripper` in `roles[]`
- `/dashboard/admin/*` — user MUST have `admin` in `roles[]`

Admin god-mode (`hasRoleAccess` promoting admin to all roles) SHALL NOT apply to dashboard layout guards.

Redirect target SHALL follow priority: admin > tripper > client.

---

## Requirement: Navbar profile menu

The navbar profile dropdown SHALL contain:
- Dashboard → `/dashboard/client`
- Tripper OS → `/dashboard/tripper` (if tripper role)
- Admin → `/dashboard/admin` (if admin role)

The "Edit profile" menu item SHALL be removed. Settings are accessed via dashboard tabs.

---

## Status

What works end-to-end today:

- **`/dashboard/client`** — Tabbed shell with 5 tabs (Home, My Trips, My Reviews, Notifications, Settings). Home shows KPI stat cards, `UnpaidTripsAlert`, `UpcomingTripsPanel` (max 3), quick actions.
- **`/dashboard/client/trips`** — Full trips grid for all paid/approved trips.
- **`/dashboard/client/reviews`** — KPI cards + list of completed trips with `customerRating`.
- **`/dashboard/client/notifications`** — Notifications with `audience=CLIENT`; click navigates to trip detail.
- **`/dashboard/client/settings`** — `AccountSettingsPanel` with `role="client"`.
- **`/dashboard/trips/[id]`** — Fetches trip via `/api/trips/[id]` (ownership-gated). Renders logistics, filters, addons, pricing, payment info, trip timeline. Destination reveal toggle works for REVEALED/COMPLETED trips. Not-found state works.
- **Trip delete** — Working via `DELETE /api/trips/[id]`, confirm dialog, optimistic state update.
- **`/account`** — All tabs work: Resumen, Personal (name/email/phone/address), Preferences (traveler type + tags), Security (password change). Avatar upload backed by `/api/upload`. All edits hit real endpoints.
- **`/trips/[id]`** — Pure redirect shim to `/dashboard/trips/[id]`. No rendering.

---

## User Flows

**Post-booking flow:**
1. Pay → `/checkout/success` → primary CTA links to `/dashboard/client` ✅
2. `/dashboard/client` → see trip in Upcoming panel → click "Ver detalles" → `/dashboard/trips/[id]`
3. View logistics (origin city, dates, traveler count, transport, filters, addons, pricing)
4. Trip transitions to REVEALED → destination toggle appears → click to reveal → **no client notification is sent**
5. "Ver Itinerario" button → links to `/${locale}/dashboard/trips/[id]/details` ✅ (fixed — route created)
6. Trip transitions to COMPLETED → "Dejar Reseña" button appears → **button is inert — no handler, no API**

**Account management:**
1. `/account` → edit personal info, traveler preferences, or password
2. All changes persist via real API endpoints

---

## Gaps

| Severity | Issue |
|----------|-------|
| CRITICAL | No `PATCH /api/trips/[id]` for review submission — "Dejar Reseña" button is inert; no handler, no API |
| HIGH | `AllTripsGrid` filters to COMPLETED trips only — CONFIRMED and REVEALED trips with approved payments are invisible in the grid |
| HIGH | Destination reveal does not trigger a client notification |
| MEDIUM | `RecentPaymentsTable` component is built and exported but rendered nowhere |
| MEDIUM | Account → Payments tab is "coming soon" placeholder; component already exists |
| MEDIUM | Account → Documents tab is "coming soon" placeholder; `idDocument` field exists in schema |
| MEDIUM | Account page calls `/api/trips?userId=X` — the API ignores this param and always uses session; misleading but harmless |
| LOW | Trip detail page has hardcoded Spanish strings for status labels and not-found copy — not i18n-ready |
| LOW | No empty-state handling when a client has no trips in the dashboard |

## Needs Design

Pages that are functionally complete but require a visual design pass before shipping:

| Page | Route | Notes |
|------|-------|-------|
| Trip detail | `/dashboard/trips/[id]` | Functional but uses ad-hoc layout — needs design system pass, i18n for hardcoded strings, and responsive review |
| Trip itinerary | `/dashboard/trips/[id]/details` | Newly created — mirrors trip detail layout; needs full design pass |

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
