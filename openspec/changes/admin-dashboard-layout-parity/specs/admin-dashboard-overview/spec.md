# Admin Dashboard Overview Specification

## Purpose

Defines the admin home page at `/dashboard/admin`: an all-time KPI stats grid plus a pending-actions panel, replacing the previous redirect to the trip-requests view.

## Requirements

### Requirement: Admin-Only Access

The admin home page MUST enforce the same session and role guard as other `/dashboard/admin` pages — the shared `StrictDashboardLayout` guard. Unauthenticated requests MUST redirect to the locale login page; authenticated requests from a user without the admin role MUST redirect to that user's own role's default dashboard path (e.g. `/dashboard/tripper` for a tripper, `/dashboard` for a client) — not a fixed admin-specific redirect target.

#### Scenario: Unauthenticated visitor

- GIVEN no active session
- WHEN a user requests `/dashboard/admin`
- THEN they are redirected to the locale login page

#### Scenario: Authenticated non-admin

- GIVEN a session for a user without the admin role
- WHEN they request `/dashboard/admin`
- THEN they are redirected to their own role's default dashboard path, per the shared `StrictDashboardLayout` guard already used by tripper/client pages

### Requirement: Server-Side Stats Computation

The system MUST compute four stats server-side, at request time, via direct Prisma aggregation in the page's server component, with no time-range filter: trips sold = count of `TripRequest` where `status = COMPLETED`; gross earnings = sum of `Payment.amount` where `status` is `APPROVED` or `COMPLETED`; waitlist size = count of `WaitlistEntry`; XSED signups = count of `XsedNotificationSignup`.

#### Scenario: Stats render current totals

- GIVEN N completed trips, a sum S of approved/completed payments, W waitlist entries, and X XSED signups at request time
- WHEN an admin loads the home page
- THEN the four KPI cards show N, S (as currency), W, and X respectively

#### Scenario: Zero-value stats still render

- GIVEN a count or sum of zero for any one of the four stats
- WHEN the home page renders
- THEN that KPI card shows "0" (or "$0" for earnings) and MUST NOT be hidden, blank, or omitted from the grid

#### Scenario: Data reflects the latest state on every load

- GIVEN a `TripRequest` status changes to `COMPLETED` after the admin's previous page load
- WHEN the admin reloads the home page
- THEN the trips-sold KPI reflects the updated count immediately, with no caching delay

### Requirement: Pending Actions Panel

The pending-actions panel MUST list three categories, each computed server-side: experiences awaiting review (`Experience.status = PENDING_REVIEW`); trip requests needing destination assignment (`TripRequest.status = CONFIRMED` AND `actualDestination IS NULL`); customer reviews awaiting approval (`Review.isApproved = false`). Each category row MUST show its current count and MUST link to the corresponding admin section, filtered to show only items matching that category's criteria.

#### Scenario: Category with pending items

- GIVEN one or more items match a category's filter
- WHEN the home page renders
- THEN that row shows the matching count and a link that navigates to the admin section pre-filtered to that criteria

#### Scenario: Category with zero pending items

- GIVEN zero items match a category's filter
- WHEN the home page renders
- THEN the row still renders showing a count of "0" — it MUST NOT be silently omitted from the panel

#### Scenario: All categories empty

- GIVEN all three categories have zero pending items
- WHEN the home page renders
- THEN the panel itself still renders with all three rows at "0" — it MUST NOT collapse to a hidden or blank panel
