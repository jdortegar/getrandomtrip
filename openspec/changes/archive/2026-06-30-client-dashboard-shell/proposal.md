# Proposal: Client Dashboard Shell

## Intent

Align the client dashboard with the tripper design system: tab shell, section headers, KPI cards, and role-scoped routing. Introduce `/dashboard/client/*` as a first-class silo alongside tripper and admin, with shared shell components and strict role guards.

## Scope

### In Scope (Phase 1 + 2)

- Shared `DashboardRoleShell`, `DashboardNavTabs`, `DashboardPageHeading`, role nav/heading config
- Migrate tripper layout to shared shell (parity preserved)
- `/dashboard/client/layout.tsx` with tab shell + strict `client` guard
- Client routes: home, trips, reviews, notifications, settings
- Redirects: `/dashboard` → `/dashboard/client`; `/dashboard/settings` → `/dashboard/client/settings`
- Strict role guards + `getDefaultDashboardPath(roles)` (admin → tripper → client)
- Generalize notifications page (`audience=CLIENT`); `DashboardUnreadDot` by audience
- Navbar: remove Edit profile; Dashboard → `/dashboard/client`
- i18n: `clientDashboard` dictionary keys (es/en)
- Reuse existing widgets: `DashboardStatsGrid`, `UnpaidTripsAlert`, `UpcomingTripsPanel`, `AllTripsGrid`, `AccountSettingsPanel`

### Out of Scope

- Admin dashboard refactor (sidebar → tabs)
- Trip detail page design-system pass (`/dashboard/trips/[id]/*`)
- Client reviews pending-review CTA / review token links (v2)
- New client reviews API
- `PATCH /api/trips/[id]` for review submission (existing gap)

## Capabilities

### New Capabilities

- `dashboard-role-shell`: shared heading + tab shell, nav config per role, unread dot by audience

### Modified Capabilities

- `client-dashboard`: routes move to `/dashboard/client/*`; tab shell; home summary vs trips list split; dedicated reviews/notifications/settings tabs
- `tripper-os`: layout uses shared shell; `TripperNavTabs`/`TripperPageHeading` migrated to config-driven components

## Approach

Extract shared shell from tripper, then add client segment. RSC shells fetch data server-side; client components render design-system UI. Trip detail stays at `/dashboard/trips/[id]`. Guards use strict `roles.includes()` — not `hasRoleAccess` god-mode — with redirect via `getDefaultDashboardPath`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/app/dashboard/shell/*` | New | Shared shell components |
| `src/components/app/dashboard/config/*` | New | client/tripper nav + heading config |
| `src/lib/auth/dashboardPaths.ts` | New | `getDefaultDashboardPath`, strict role check |
| `src/app/.../dashboard/client/*` | New | 5 tab pages + layout |
| `src/app/.../dashboard/page.tsx` | Modified | Redirect to `/dashboard/client` |
| `src/app/.../dashboard/settings/page.tsx` | Modified | Redirect to `/dashboard/client/settings` |
| `src/app/.../dashboard/tripper/layout.tsx` | Modified | Use shared shell |
| `src/components/app/dashboard/tripper/TripperNavTabs.tsx` | Removed/Migrated | Config-driven tabs |
| `src/components/NavbarProfile.tsx` | Modified | Remove edit profile; update dashboard href |
| `src/dictionaries/{es,en}.json` | Modified | `clientDashboard` copy |
| `openspec/specs/05-client-dashboard.md` | Modified | Route + UX updates |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Tripper visual regression after shell migration | Med | Migrate tripper first; compare tab active states |
| Broken bookmarks to `/dashboard`, `/dashboard/settings` | Low | Permanent redirects |
| Strict guards block admin browsing tripper routes | Low | Expected; navbar links only show entitled roles |
| Large single change | Med | SDD tasks split by phase; typecheck after each |

## Rollback Plan

Revert feature commits. Restore tripper-specific layout components. Remove `/dashboard/client` routes. Restore navbar links. Redirects are additive and removable.

## Success Criteria

- [ ] Client sees 5 tabs; each page matches design-system patterns
- [ ] `/dashboard` and `/dashboard/settings` redirect correctly
- [ ] Tripper dashboard unchanged visually after shell migration
- [ ] Strict guards redirect unauthorized role access
- [ ] Notifications work with `audience=CLIENT` and deep links to trips
- [ ] `npm run typecheck` passes
