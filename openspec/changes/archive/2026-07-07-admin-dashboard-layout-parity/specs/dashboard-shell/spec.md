# Dashboard Shell Specification

## Purpose

Shared navigation shell contract used by client, tripper, and admin dashboards. This delta covers only the testable navigation-mechanism change for admin; visual restyling of individual admin pages has no behavioral contract and is not specified here.

## Requirements

### Requirement: Admin Top Navigation

The admin dashboard MUST use the same top tab navigation shell (`StrictDashboardLayout` + `DashboardNavTabs`) as the client and tripper dashboards, instead of a role-specific left sidebar.

#### Scenario: Admin navigates via top tabs

- GIVEN an authenticated admin viewing any `/dashboard/admin/*` page
- WHEN the page renders
- THEN a top tab bar lists all 10 admin destinations (the home/dashboard tab, the 8 original sections, and a personal Notifications tab)
- AND no left sidebar navigation renders

#### Scenario: Sidebar navigation is no longer available

- GIVEN the admin dashboard shell after migration
- WHEN an admin needs to move between sections
- THEN the top tab bar is the only navigational affordance — `AdminSidebar` no longer renders anywhere in the admin dashboard

### Requirement: Admin Notifications Tab

The admin nav MUST include a personal notifications tab, distinct from the XSED-signup notifications tab, backed by the existing `Notification` model's `ADMIN` audience (already populated by `REVIEW_SUBMITTED` and destination-assignment-reminder notifications before this change — this tab surfaces data that already exists with no prior UI).

#### Scenario: Admin views their own notifications

- GIVEN one or more `Notification` rows with `audience = ADMIN` and `userId` matching the signed-in admin
- WHEN the admin opens the Notifications tab
- THEN each notification renders with an action linking to the relevant admin section (reviews for `REVIEW_SUBMITTED`, trip-requests for a destination-assignment reminder, experiences when `experienceId` is present)

#### Scenario: Unread count reflects only the admin's own notifications

- GIVEN the admin has unread `ADMIN`-audience notifications
- WHEN the nav renders
- THEN the Notifications tab shows an unread-count dot sourced from `audience=ADMIN`, never falling back to another role's count
