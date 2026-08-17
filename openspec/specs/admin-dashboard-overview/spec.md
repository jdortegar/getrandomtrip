# Admin Dashboard Overview Specification

## Purpose

Defines the admin home page at `/dashboard/admin`: an all-time KPI stats grid plus a pending-actions panel, replacing the previous redirect to the trip-requests view.

## Requirements

### Requirement: Admin-Only Access

The admin home page MUST enforce the same session and role guard as other `/dashboard/admin` pages — the shared `StrictDashboardLayout` guard. Unauthenticated requests MUST redirect to the locale login page; authenticated requests from a user without the admin role MUST redirect to that user's own role's default dashboard path (e.g. `/dashboard/tripper` for a tripper, `/dashboard/traveler` for a traveler) — not a fixed admin-specific redirect target.

#### Scenario: Unauthenticated visitor

- GIVEN no active session
- WHEN a user requests `/dashboard/admin`
- THEN they are redirected to the locale login page

#### Scenario: Authenticated non-admin

- GIVEN a session for a user without the admin role
- WHEN they request `/dashboard/admin`
- THEN they are redirected to their own role's default dashboard path, per the shared `StrictDashboardLayout` guard already used by tripper/traveler pages

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

### Requirement: Dedicated Trip-Request Fulfillment Page Replaces the Modal

`/dashboard/admin/trip-requests/[id]` MUST provide 100% feature parity with the removed `TripRequestModal`: status change across the 7-state enum, experience assignment, core trip details, status timeline, delete/danger zone, and an in-app "Contact traveler" compose-and-send action — plus a read-only reference view of the assigned experience's itinerary and per-trip document management (add/list/view/remove). The trip-requests list row action MUST navigate to this page instead of opening a modal. `TripRequestModal` MUST be removed only after this page reaches parity.

(Previously: the "Contact traveler" affordance was a raw `mailto:` `<a>` link. It is now a `<button>` that opens the `ContactTravelerModal`, keeping the same `Mail` icon, label, and position in the header.)

#### Scenario: Row action navigates instead of opening a modal
- GIVEN an admin views the trip-requests list
- WHEN they click a row's edit action
- THEN they navigate to `/dashboard/admin/trip-requests/[id]` and no modal opens

#### Scenario: All removed modal actions are reachable from the new page
- GIVEN the new page is loaded for a trip request
- WHEN the admin inspects available actions
- THEN status change, experience assignment, core details, status timeline, delete/danger zone, and the "Contact traveler" action are all present

#### Scenario: New page adds itinerary reference and document management
- GIVEN a trip request has an assigned experience
- WHEN the admin opens the new page
- THEN a read-only itinerary reference section and a document management section (add/list/view/remove) are both present, neither of which existed in the modal

#### Scenario: Contact traveler opens a modal instead of the OS mail client
- GIVEN an admin clicks "Contact traveler" in the header
- WHEN the button is activated
- THEN the `ContactTravelerModal` opens in-app; no `mailto:` navigation occurs and no OS mail client is invoked
