# Admin Dashboard Refactor — Design Spec
**Date:** 2026-04-06  
**Status:** Approved

---

## Overview

Full refactor of `/dashboard/admin`. Replaces a single-file, 38-column raw data dump table with a structured admin shell: persistent left sidebar, focused trip request table with status filter + KPI strip, and a slide-over detail/edit panel. Existing app Navbar and HeaderHero remain unchanged.

---

## Layout Structure

```
<AppNavbar />                        ← unchanged, global
<HeaderHero />                       ← unchanged, title driven by active section
<div class="flex">
  <AdminSidebar />                   ← 188px fixed width, white, border-r
  <main>                             ← flex-1, bg-gray-50
    {children}                       ← section page renders here
  </main>
</div>
```

The sidebar is rendered at the **layout level** and persists across section navigations.  
`TripRequestSlideOver` lives inside `page.tsx` (not layout) — it is local to the trips section. When other sections are built they own their own panels.

---

## Route Structure

All routes are children of `src/app/[locale]/dashboard/admin/`:

| Route | Page | Initial state |
|---|---|---|
| `/dashboard/admin` | Trip Requests | default section |
| `/dashboard/admin/users` | Users | placeholder |
| `/dashboard/admin/packages` | Packages | placeholder |
| `/dashboard/admin/payments` | Payments | placeholder |
| `/dashboard/admin/reviews` | Reviews | placeholder |
| `/dashboard/admin/waitlist` | Waitlist | placeholder |

All routes are protected by `<SecureRoute requiredRole="admin">` at the layout level (not per-page).

---

## Component Tree

```
AdminLayout (layout.tsx)
├── AdminSidebar
│   └── AdminSidebarLink (×6)
└── {children}  ← page slot

page.tsx (Trip Requests)
├── TripRequestsFilterBar
├── TripRequestsKPIStrip
│   └── AdminKPICard (×4)
├── TripRequestsTable
│   └── TripRequestsTableRow (×n)
└── TripRequestSlideOver  ← rendered when selectedTripId is set
    ├── TripRequestDetails
    └── TripStatusTimeline
```

---

## Components (SOLID, single responsibility)

### `AdminLayout`
- Wraps `<SecureRoute requiredRole="admin">`
- Renders `<AdminSidebar>` + `{children}`
- No data fetching, no context — keeps layout responsibilities minimal

### `AdminSidebar`
- Renders 6 `<AdminSidebarLink>` items
- Reads `usePathname()` to mark active link
- No state

### `AdminSidebarLink`
- Props: `href`, `label`, `icon`, `badge?`
- Active state via `isActive` prop
- No logic

### `TripRequestsFilterBar`
- Props: `activeFilter`, `onFilterChange`, `counts`
- Renders status filter pills (All, Pending, Confirmed, Revealed, Completed, Cancelled)
- No data fetching

### `TripRequestsKPIStrip`
- Props: `trips: AdminTripRequest[]`
- Derives counts internally via a util function `countTripsByStatus(trips)`
- Renders 4 `<AdminKPICard>` items

### `AdminKPICard`
- Props: `label`, `count`
- Pure display, no logic

### `TripRequestsTable`
- Props: `trips`, `onEdit`
- Renders table header + maps rows
- No direct state

### `TripRequestsTableRow`
- Props: `trip`, `isSelected`, `onEdit`
- Single row render
- `isSelected` drives the left-border highlight + "editing" label

### `TripRequestSlideOver`
- Props: `trip`, `onClose`, `onSaved`
- Manages local `draft` state (status + actualDestination)
- Calls `PATCH /api/admin/trip-requests/[id]` on save
- Renders: header, badges, `<TripRequestDetails>`, fields, `<TripStatusTimeline>`, action buttons

### `TripRequestDetails`
- Props: `trip`
- Renders read-only key/value rows (origin, dates, nights/pax, transport, payment amount)
- Pure display

### `TripStatusTimeline`
- Props: `currentStatus`
- Renders dot + label for each status in the ordered flow
- Uses `TRIP_STATUS_FLOW` constant (ordered array from utils)

### `StatusBadge`
- Props: `status`, `variant?: 'trip' | 'payment'`
- Returns colored pill using `TRIP_STATUS_COLORS` or `PAYMENT_STATUS_COLORS` maps from utils
- Open/Closed: extend maps to add new statuses without touching the component

---

## Utils to create

### `src/lib/admin/trip-status.ts`
```ts
TRIP_STATUS_FLOW: TripRequestStatus[]      // ordered pipeline
TRIP_STATUS_COLORS: Record<status, {bg, text, border}>
PAYMENT_STATUS_COLORS: Record<status, {bg, text, border}>
countTripsByStatus(trips): Record<status, number>
```

### `src/lib/admin/format.ts`
```ts
formatAdminDate(iso: string | null): string   // "Mar 10, 2026" or "—"
formatAdminAmount(amount: number, currency: string): string  // "ARS 450,000"
```

---

## State & Data Flow

```
page.tsx  (all state is local to the trips section)
  trips: AdminTripRequest[]           ← from useTripRequests()
  statusFilter: TripRequestStatus | 'ALL'
  selectedTripId: string | null

useTripRequests() hook
  - fetches GET /api/admin/trip-requests once on mount
  - returns { trips, loading, error, refresh }
  - no defensive fallbacks for impossible error shapes
```

`TripRequestSlideOver` receives the full trip object looked up as `trips.find(t => t.id === selectedTripId)` — no second fetch needed.

On save, `refresh()` is called to refetch the list. `selectedTripId` is cleared on close.

---

## Design Tokens (no new values)

- Sidebar bg: `bg-white`, `border-r border-gray-200`
- Main area: `bg-gray-50`
- Cards: `bg-white rounded-xl shadow-sm ring-1 ring-gray-100`
- Active sidebar item: `bg-gray-100 font-bold text-gray-900`
- Buttons: existing `<Button>` component, `variant="default"` (dark) and `variant="secondary"` (outlined)
- Status badges: `StatusBadge` component using existing color vocabulary (green/yellow/blue/gray chips)
- Typography: `font-barlow-condensed uppercase` for headings, `text-base` for body (per recent checkout fix)
- Lucide icons for sidebar (no emojis)

---

## Out of Scope (this iteration)

- Users, Packages, Payments, Reviews, Waitlist section implementations — scaffold routes only, content TBD
- Search / sorting within the trips table
- Bulk status changes
- Export / CSV

---

## Files to Create / Modify

**New:**
- `src/app/[locale]/dashboard/admin/layout.tsx`
- `src/app/[locale]/dashboard/admin/users/page.tsx` (placeholder)
- `src/app/[locale]/dashboard/admin/packages/page.tsx` (placeholder)
- `src/app/[locale]/dashboard/admin/payments/page.tsx` (placeholder)
- `src/app/[locale]/dashboard/admin/reviews/page.tsx` (placeholder)
- `src/app/[locale]/dashboard/admin/waitlist/page.tsx` (placeholder)
- `src/components/app/admin/AdminSidebar.tsx`
- `src/components/app/admin/AdminSidebarLink.tsx`
- `src/components/app/admin/AdminKPICard.tsx`
- `src/components/app/admin/StatusBadge.tsx`
- `src/components/app/admin/TripRequestsFilterBar.tsx`
- `src/components/app/admin/TripRequestsKPIStrip.tsx`
- `src/components/app/admin/TripRequestsTable.tsx`
- `src/components/app/admin/TripRequestsTableRow.tsx`
- `src/components/app/admin/TripRequestSlideOver.tsx`
- `src/components/app/admin/TripRequestDetails.tsx`
- `src/components/app/admin/TripStatusTimeline.tsx`
- `src/hooks/useTripRequests.ts`
- `src/lib/admin/trip-status.ts`
- `src/lib/admin/format.ts`

**Modified:**
- `src/app/[locale]/dashboard/admin/page.tsx` — full rewrite
