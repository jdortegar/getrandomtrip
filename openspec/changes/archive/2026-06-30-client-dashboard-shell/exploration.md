# Exploration: Client Dashboard Shell

**Source:** grill-me session (2026-06-30)

## Problem

Tripper dashboard was refactored to the design system (tab shell, KPI cards, tables). Client dashboard still lives at `/dashboard` as a monolithic client page with `HeaderHero`. Admin uses a separate sidebar shell. Multi-role users (admin ⊃ tripper ⊃ client) need clearly separated dashboard silos.

## Decisions (locked)

| # | Topic | Decision |
|---|-------|----------|
| 1 | Route convention | `/dashboard/{role}/{pages}` — not `{role}/dashboard` |
| 2 | Client segment | `/dashboard/client/*`; `/dashboard` redirects to `/dashboard/client` |
| 3 | Route files | Explicit `client/`, `tripper/`, `admin/` folders — no dynamic `[role]` segment |
| 4 | Settings | `/dashboard/client/settings` inside tab shell |
| 5 | Trip detail | Keep shared `/dashboard/trips/[id]/*` (full-page flows, outside tabs) |
| 6 | Multi-role | Split silos; no auto-redirect between roles |
| 7 | Guards | Strict membership per segment; redirect to best dashboard on deny |
| 8 | Redirect priority | admin → tripper → client |
| 9 | Client home UX | Design-system tab content; no `HeaderHero`; greeting in `PageHeading` |
| 10 | Client reviews v1 | Trip ratings from `getTrips()` / `customerRating` |
| 11 | Home vs trips tab | Home = summary (KPIs, unpaid, upcoming 3); trips tab = full `AllTripsGrid` |
| 12 | Shell extraction | Extract shared shell first; migrate tripper; then build client |
| 13 | Notifications | Generalize `NotificationsPageClient` with `audience` + `resolveHref` |
| 14 | Navbar menu | Remove "Edit profile"; keep Dashboard / Tripper OS / Admin only |
| 15 | Navbar links | Explicit `/dashboard/client`; settings via tabs only |
| 16 | Delivery | Phase 1 + 2 together via SDD; admin refactor deferred |

## Rejected alternatives

- `{role}/dashboard/{pages}` — breaks existing patterns and secure paths
- Dynamic `[role]` folder for all pages — admin shell differs; page content is role-specific
- `/dashboard/client/trips/[id]` — breaks emails, notifications deep links
- Auto-redirect trippers away from client dashboard
- Admin god-mode passing all layout guards without redirect
