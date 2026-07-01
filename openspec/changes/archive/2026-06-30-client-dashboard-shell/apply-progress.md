# Apply Progress: Client Dashboard Shell

**Status:** Phase 1 + 2 complete  
**Date:** 2026-06-30

## Completed

### Phase 1 — Foundation
- [x] T1.1 `src/lib/auth/dashboardPaths.ts` — strict role + default path helpers
- [x] T1.2 Shell components (`DashboardRoleShell`, `DashboardNavTabs`, `DashboardPageHeading`, `DashboardUnreadDot`)
- [x] T1.3 Nav/heading config (client + tripper)
- [x] T1.4 Tripper layout migrated to `StrictDashboardLayout`
- [x] T1.5 Tripper shell components thin-wrapped
- [x] T1.6 Client layout with strict guard
- [x] T1.7 Redirects `/dashboard` → `/dashboard/client`, `/dashboard/settings` → `/dashboard/client/settings`
- [x] T1.8 Navbar: removed Edit profile; Dashboard → `/dashboard/client`

### Phase 2 — Client Pages
- [x] T2.1 `ClientDashboardDict` + es/en dictionary entries
- [x] T2.2 Client home (summary dashboard)
- [x] T2.3 Client trips (full grid)
- [x] T2.4 Client reviews v1
- [x] T2.5 Generalized `RoleNotificationsPageClient` + client notifications page
- [x] T2.6 Client settings page
- [x] T2.7 Unread count API accepts `?audience=CLIENT|TRIPPER`

### Phase 3 — Verification
- [x] T3.1 Typecheck passes
- [x] T3.2 Automated QA (`scripts/qa-client-dashboard.mjs`, unit tests, build)
- [ ] T3.2 Authenticated browser QA (see `verify-report.md`)

## Post-verify improvements (same session)

- **Tab active bar animation** — `TabSelector` extended with `variant="inline"` (framer-motion `layoutId` spring); `AccountSettingsPanel` uses it for animated active indicator
- **Tab consistent sizing** — `DashboardNavTabs` fixed width (`w-24`) + `min-h` for all roles; `TabSelector inline` uses `flex-1 basis-0` equal columns
- **Client dashboard reorganisation** — Home: KPIs + UnpaidTripsAlert only; Trips: unified `ClientTripsTable` with status filter row (All / Upcoming / Completed) + DS table anatomy; `QuickActions`, `UpcomingTripsPanel`, `AllTripsGrid` removed
- **DashboardStatsGrid** — rebuilt to DS KPI card pattern (yellow accent bar, `bg-light-blue/10` icon puck, `font-barlow-condensed text-5xl`)
- **ClientTripsTable** — DS table (`<table>` + thead/tbody), `TableIconLink` with tooltips for all actions, `rounded-[6px]` status badges
- **UnpaidTripsAlert** — DS panel card (`bg-white border-gray-200`), amber urgency stripe (`h-1 bg-amber-400`), DS table anatomy, `TableIconLink`/`TableIconButton` with tooltips, trip type thumbnail image, `formatTripReferenceTail` for booking ref
- **Eyebrow fix** — corrected to short `text-light-blue` per DS rule; message moved to subtitle

## Notes

- Trip detail routes remain at `/dashboard/trips/[id]/*`
- Admin refactor out of scope
- Typecheck passes after all improvements
