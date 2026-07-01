# Tasks: Client Dashboard Shell

**Change:** client-dashboard-shell
**Delivery strategy:** single-pr
**Phases:** 1 (shell + routing) + 2 (client pages) combined

---

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~800–1200 |
| 400-line budget risk | High |
| Chained PRs recommended | Optional (can split shell vs pages) |
| Suggested split | PR1 shell+tripper migration → PR2 client pages |
| Delivery strategy | single-pr (user chose Phase 1+2 together) |

Decision needed before apply: **size exception recommended** (~2× budget)

---

## Phase 1: Foundation — Auth, Shell, Tripper Migration

### T1.1 — Create `src/lib/auth/dashboardPaths.ts`

**Details:**
- `hasStrictRole(roles, required: 'client' | 'tripper' | 'admin')`
- `getDefaultDashboardPath(roles, locale)` → admin > tripper > client
- Export `DashboardRole` type

### T1.2 — Create shell components

**Files:**
- `src/components/app/dashboard/shell/DashboardRoleShell.tsx`
- `src/components/app/dashboard/shell/DashboardNavTabs.tsx`
- `src/components/app/dashboard/shell/DashboardPageHeading.tsx`
- `src/components/app/dashboard/shell/DashboardUnreadDot.tsx`

**Details:** Extract from `TripperNavTabs` + `TripperPageHeading`; accept `role` + config; preserve active-state logic and responsive tab styling.

### T1.3 — Create nav/heading config

**Files:**
- `src/components/app/dashboard/config/clientNav.ts`
- `src/components/app/dashboard/config/clientHeadings.ts`
- `src/components/app/dashboard/config/tripperNav.ts`
- `src/components/app/dashboard/config/tripperHeadings.ts`

**Details:** Migrate tripper tab definitions from `TripperNavTabs.tsx`; define 5 client tabs (dashboard, trips, reviews, notifications, settings).

### T1.4 — Migrate tripper layout to shared shell

**File:** `src/app/[locale]/(secure)/dashboard/tripper/layout.tsx`
**Details:**
- Use `DashboardRoleShell role="tripper"`
- Strict tripper guard via `hasStrictRole` + redirect
- Remove direct imports of `TripperPageHeading` / `TripperNavTabs`

### T1.5 — Deprecate or thin-wrap old tripper shell components

**Files:** `TripperNavTabs.tsx`, `TripperPageHeading.tsx`
**Details:** Delete if fully migrated, or re-export from shared shell for any external imports.

### T1.6 — Add client layout with strict guard

**File:** `src/app/[locale]/(secure)/dashboard/client/layout.tsx`
**Details:** `SecureRouteWrapper` + strict client check + `DashboardRoleShell role="client"`.

### T1.7 — Add redirects for legacy routes

**Files:**
- `src/app/[locale]/(secure)/dashboard/page.tsx` → redirect `/dashboard/client`
- `src/app/[locale]/(secure)/dashboard/settings/page.tsx` → redirect `/dashboard/client/settings`

**Details:** Replace monolithic client dashboard page with server redirect.

### T1.8 — Update navbar profile menu

**File:** `src/components/NavbarProfile.tsx`
**Details:**
- Remove Edit profile link
- `DASHBOARD_MENU_ITEM.href` → `/dashboard/client`

---

## Phase 2: Client Pages + i18n

### T2.1 — Add `ClientDashboardDict` + dictionary entries

**Files:** `src/lib/types/dictionary.ts`, `src/dictionaries/es.json`, `src/dictionaries/en.json`
**Details:** Keys for tabs, page headings, reviews KPIs, empty states.

### T2.2 — Create `ClientHomePageClient.tsx` + RSC page

**Files:**
- `src/components/app/dashboard/client/ClientHomePageClient.tsx`
- `src/app/.../dashboard/client/page.tsx`

**Details:** KPIs + `UnpaidTripsAlert` + `UpcomingTripsPanel` (max 3) + `QuickActions`. No HeaderHero, no full grid.

### T2.3 — Create `ClientTripsPageClient.tsx` + RSC page

**Files:**
- `src/components/app/dashboard/client/ClientTripsPageClient.tsx`
- `src/app/.../dashboard/client/trips/page.tsx`

**Details:** Full `AllTripsGrid`; design-system section header.

### T2.4 — Create `ClientReviewsPageClient.tsx` + RSC page

**Files:**
- `src/components/app/dashboard/client/ClientReviewsPageClient.tsx`
- `src/app/.../dashboard/client/reviews/page.tsx`

**Details:** KPIs from trips with `customerRating`; list panel.

### T2.5 — Generalize notifications + client page

**Files:**
- `src/components/app/dashboard/shared/RoleNotificationsPageClient.tsx`
- `src/app/.../dashboard/client/notifications/page.tsx`
- Update tripper notifications page to use shared component

**Details:** Props: `audience`, `resolveHref`, `copy`. Client href → `/dashboard/trips/[id]`.

### T2.6 — Create client settings page

**File:** `src/app/.../dashboard/client/settings/page.tsx`
**Details:** `AccountSettingsPanel role="client"` inside `Section`; no HeaderHero.

### T2.7 — Wire `DashboardUnreadDot` on client notifications tab

**Details:** Fetch unread count filtered by `audience=CLIENT`; update unread-count API if needed to accept audience param.

---

## Phase 3: Verification

### T3.1 — Typecheck and lint

**Commands:** `npx tsc -p tsconfig.json --noEmit`

### T3.2 — Manual QA

- [ ] All 5 client tabs render with design-system layout
- [ ] `/dashboard` and `/dashboard/settings` redirect
- [ ] Tripper tabs visually unchanged
- [ ] Admin-only user redirected from `/dashboard/tripper`
- [ ] Tripper+client user accesses both silos
- [ ] Client notifications deep-link to trip detail
- [ ] Navbar: no Edit profile; Dashboard → client home

---

## Dependency Graph

```
T1.1 → T1.2 → T1.3 → T1.4, T1.6 (parallel)
T1.4 → T1.5
T1.6 → T2.2–T2.6
T1.7, T1.8 (parallel, early)
T2.1 → T2.2–T2.6
T2.5 → T2.7
T2.* → T3.*
```

## Next Step

Run **sdd-apply** against this change (`client-dashboard-shell`).
