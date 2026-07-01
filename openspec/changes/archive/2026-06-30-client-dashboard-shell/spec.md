# Spec Delta: Client Dashboard Shell

**Domains:** `client-dashboard`, `dashboard-role-shell`, `tripper-os` (layout only)

---

## ADDED: Dashboard Role Shell

### Requirement: Shared tab shell

The system SHALL render a consistent dashboard shell for client and tripper roles consisting of:
- A page heading (title + description) derived from the current pathname
- A horizontal tab strip with icon + label per tab
- Tab content area below the shell header band

### Scenario: Active tab highlighting

**Given** a user on `/dashboard/client/trips`
**When** the tab strip renders
**Then** the "My Trips" tab is visually active
**And** other tabs are inactive

### Requirement: Audience-scoped unread dot

The system SHALL show an unread notification dot on the notifications tab when the user has unread notifications for that role's audience.

### Scenario: Client unread count

**Given** a client with 2 unread `CLIENT` audience notifications
**When** the client notifications tab renders
**Then** an unread dot appears on that tab

---

## MODIFIED: Client Dashboard

### Requirement: Client route segment

The client dashboard SHALL live under `/dashboard/client/*`.

| Tab | Route |
|-----|-------|
| Home | `/dashboard/client` |
| My Trips | `/dashboard/client/trips` |
| My Reviews | `/dashboard/client/reviews` |
| Notifications | `/dashboard/client/notifications` |
| Settings | `/dashboard/client/settings` |

### Scenario: Legacy redirect

**Given** a user navigates to `/dashboard`
**When** the request is handled
**Then** the user is redirected to `/dashboard/client`

### Scenario: Settings redirect

**Given** a user navigates to `/dashboard/settings`
**When** the request is handled
**Then** the user is redirected to `/dashboard/client/settings`

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

### Requirement: Shared trip detail routes

Trip detail pages SHALL remain at `/dashboard/trips/[id]/*` outside the client tab shell.

---

## MODIFIED: Role Access (Dashboard Layouts)

### Requirement: Strict segment guards

Each dashboard role layout SHALL verify strict role membership:
- `/dashboard/client/*` — any authenticated user with a known role
- `/dashboard/tripper/*` — user MUST have `tripper` in `roles[]`
- `/dashboard/admin/*` — user MUST have `admin` in `roles[]`

Admin god-mode (`hasRoleAccess` promoting admin to all roles) SHALL NOT apply to dashboard layout guards.

### Scenario: Unauthorized segment access

**Given** a user with only `admin` role (no tripper)
**When** they navigate to `/dashboard/tripper`
**Then** they are redirected to `/dashboard/admin`

### Scenario: Redirect priority

Redirect target SHALL follow priority: admin > tripper > client.

---

## MODIFIED: Navbar Profile Menu

### Requirement: Simplified profile menu

The navbar profile dropdown SHALL contain:
- Dashboard → `/dashboard/client`
- Tripper OS → `/dashboard/tripper` (if tripper role)
- Admin → `/dashboard/admin` (if admin role)

The "Edit profile" menu item SHALL be removed. Settings are accessed via dashboard tabs.

---

## MODIFIED: Tripper OS (layout only)

### Requirement: Tripper uses shared shell

The tripper dashboard layout SHALL use the same shared shell components as client, driven by tripper nav/heading config.

Existing tripper page content and routes SHALL remain unchanged.

Visual parity with pre-migration tripper dashboard SHALL be maintained.
