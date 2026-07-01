# Design: Client Dashboard Shell

## Technical Approach

Extract tripper's tab shell into config-driven shared components, migrate tripper to them, then add `/dashboard/client/*` with identical UX patterns. RSC page shells handle auth + data fetch; client components render design-system content. Trip detail routes remain shared at `/dashboard/trips/[id]/*`. Role guards use strict membership with redirect fallback.

## Architecture Decisions

| # | Decision | Choice | Alternatives rejected | Rationale |
|---|----------|--------|-----------------------|-----------|
| D1 | Route shape | `/dashboard/client/*` explicit folder | Dynamic `[role]` segment | Admin shell differs; pages are role-specific |
| D2 | Shell sharing | `DashboardRoleShell` + config maps | Copy tripper layout for client | One implementation; visual parity |
| D3 | Trip detail | Stay at `/dashboard/trips/[id]/*` | Move under `/dashboard/client/trips/[id]` | Emails, notifications, bookmarks unchanged |
| D4 | Auth guard | Strict `roles.includes(role)` in layout | `hasRoleAccess` (admin god-mode) | User requirement: split silos |
| D5 | Deny behavior | Redirect via `getDefaultDashboardPath` | 403 page | Better UX; priority admin > tripper > client |
| D6 | Client home | Summary only (no full grid) | Duplicate grid on home + trips | Matches tripper home vs list pattern |
| D7 | Client reviews v1 | Derive from `getTrips()` + `customerRating` | New `/api/client/reviews` | Data already available |
| D8 | Notifications | Generalize `NotificationsPageClient` | Duplicate client component | Same UI; different `audience` + href resolver |
| D9 | Navbar | Remove Edit profile; explicit `/dashboard/client` | Keep `/dashboard/settings` in menu | Settings live in tab strip |
| D10 | Page pattern | RSC shell + `*PageClient` | Monolithic `"use client"` pages | Matches tripper refactor convention |

## Route Tree

```
/dashboard                          → redirect /dashboard/client
/dashboard/client                   → ClientHomePageClient
/dashboard/client/trips             → ClientTripsPageClient (AllTripsGrid)
/dashboard/client/reviews           → ClientReviewsPageClient
/dashboard/client/notifications     → RoleNotificationsPageClient (audience=CLIENT)
/dashboard/client/settings          → AccountSettingsPanel role="client"
/dashboard/settings                 → redirect /dashboard/client/settings
/dashboard/trips/[id]/*             → unchanged (shared)
/dashboard/tripper/*                → shared shell (existing pages)
/dashboard/admin/*                  → unchanged (out of scope)
```

## Data Flow

```
Client layout (RSC)
  └─ SecureRouteWrapper strict client check
  └─ DashboardRoleShell role="client"
       ├─ DashboardPageHeading (config: clientHeadings)
       ├─ DashboardNavTabs (config: clientNav)
       └─ {children}

Client home page (RSC)
  └─ fetch trips + payments server-side OR pass to client fetch
  └─ ClientHomePageClient
       ├─ DashboardStatsGrid
       ├─ UnpaidTripsAlert
       ├─ UpcomingTripsPanel (max 3)
       └─ QuickActions

Client notifications (RSC)
  └─ prisma.notification.findMany({ audience: 'CLIENT' })
  └─ RoleNotificationsPageClient
       └─ resolveHref → /dashboard/trips/[tripRequestId]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/auth/dashboardPaths.ts` | Create | `hasStrictRole`, `getDefaultDashboardPath` |
| `src/components/app/dashboard/shell/DashboardRoleShell.tsx` | Create | Heading + tabs wrapper |
| `src/components/app/dashboard/shell/DashboardNavTabs.tsx` | Create | Config-driven tabs |
| `src/components/app/dashboard/shell/DashboardPageHeading.tsx` | Create | Pathname → title from config |
| `src/components/app/dashboard/shell/DashboardUnreadDot.tsx` | Create | Unread dot by audience |
| `src/components/app/dashboard/config/clientNav.ts` | Create | 5 client tabs |
| `src/components/app/dashboard/config/clientHeadings.ts` | Create | Page heading map |
| `src/components/app/dashboard/config/tripperNav.ts` | Create | Migrated from TripperNavTabs |
| `src/components/app/dashboard/config/tripperHeadings.ts` | Create | Migrated from TripperPageHeading |
| `src/components/app/dashboard/client/ClientHomePageClient.tsx` | Create | Summary dashboard |
| `src/components/app/dashboard/client/ClientTripsPageClient.tsx` | Create | Full trips grid |
| `src/components/app/dashboard/client/ClientReviewsPageClient.tsx` | Create | Ratings list + KPIs |
| `src/components/app/dashboard/shared/RoleNotificationsPageClient.tsx` | Create | Generalized notifications |
| `src/app/.../dashboard/client/layout.tsx` | Create | Client shell + guard |
| `src/app/.../dashboard/client/page.tsx` | Create | Home RSC shell |
| `src/app/.../dashboard/client/trips/page.tsx` | Create | Trips RSC shell |
| `src/app/.../dashboard/client/reviews/page.tsx` | Create | Reviews RSC shell |
| `src/app/.../dashboard/client/notifications/page.tsx` | Create | Notifications RSC shell |
| `src/app/.../dashboard/client/settings/page.tsx` | Create | Settings page |
| `src/app/.../dashboard/page.tsx` | Modify | Server redirect |
| `src/app/.../dashboard/settings/page.tsx` | Modify | Server redirect |
| `src/app/.../dashboard/tripper/layout.tsx` | Modify | Use DashboardRoleShell |
| `src/app/.../dashboard/tripper/notifications/page.tsx` | Modify | Use RoleNotificationsPageClient |
| `src/components/NavbarProfile.tsx` | Modify | Remove edit profile; update hrefs |
| `src/lib/types/dictionary.ts` | Modify | `ClientDashboardDict` |
| `src/dictionaries/{es,en}.json` | Modify | Client dashboard copy |

## Interfaces

```ts
// src/lib/auth/dashboardPaths.ts
export type DashboardRole = "client" | "tripper" | "admin";

export function hasStrictRole(
  roles: AppRole[],
  required: DashboardRole,
): boolean;

export function getDefaultDashboardPath(
  roles: AppRole[],
  locale: string,
): string;
```

```ts
// Nav tab config
export interface DashboardNavTab {
  href: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
  showUnreadDot?: boolean;
  requiredRole?: AppRole; // filter tabs by permission
}
```

## Testing Strategy

- Manual QA: all 5 client tabs, redirects, tripper visual parity
- Typecheck + lint after each phase
- Verify strict guard: admin-only user hitting `/dashboard/tripper` redirects to admin
- Verify tripper+client user can access both silos via navbar
