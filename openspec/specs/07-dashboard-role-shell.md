# Feature Spec: Dashboard Role Shell

**Priority:** 5 — Shared dashboard infrastructure  
**Routes:** applies to `/dashboard/client/*` and `/dashboard/tripper/*`  
**Last audited:** 2026-06-30

---

## Overview

The Dashboard Role Shell is a shared layout component (`DashboardRoleShell`) that wraps both the client and tripper dashboards. It provides a consistent chrome layer consisting of a page heading band and a horizontal tab strip, driven by per-role configuration objects.

---

## Requirements

### Requirement: Shared tab shell

The system SHALL render a consistent dashboard shell for client and tripper roles consisting of:
- A page heading (title + description) derived from the current pathname
- A horizontal tab strip with icon + label per tab
- Tab content area below the shell header band

### Requirement: Audience-scoped unread dot

The system SHALL show an unread notification dot on the notifications tab when the user has unread notifications for that role's audience.

---

## Scenarios

### Scenario: Active tab highlighting

**Given** a user on `/dashboard/client/trips`  
**When** the tab strip renders  
**Then** the "My Trips" tab is visually active  
**And** other tabs are inactive

### Scenario: Client unread count

**Given** a client with 2 unread `CLIENT` audience notifications  
**When** the client notifications tab renders  
**Then** an unread dot appears on that tab

---

## Components

| Component | Purpose |
|-----------|---------|
| `DashboardRoleShell` | Wraps role-specific dashboard layouts with heading + tab strip |
| `DashboardNavTabs` | Renders horizontal tab strip from nav config |
| `DashboardPageHeading` | Renders title + description from heading config |
| `DashboardUnreadDot` | Fetches unread count and renders dot badge on notifications tab |
| `StrictDashboardLayout` | Enforces strict role membership guard before rendering shell |

---

## Config

Each role provides two config objects:

- `clientNav` / `tripperNav` — array of tab items with `href`, `label`, `icon`, and `audience` (for unread dot)
- `clientHeadings` / `tripperHeadings` — map of pathname → `{ title, description }`

---

## Next Steps

- Extend shell to support admin dashboard when admin panel is built
- Add keyboard navigation and ARIA roles to tab strip
