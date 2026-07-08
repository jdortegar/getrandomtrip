# Dashboard Shell Specification

## Purpose

Shared navigation shell contract used by client, tripper, and admin dashboards. This delta covers only the testable navigation-mechanism change for admin; visual restyling of individual admin pages has no behavioral contract and is not specified here.

## Requirements

### Requirement: Admin Top Navigation

The admin dashboard MUST use the same top tab navigation shell (`StrictDashboardLayout` + `DashboardNavTabs`) as the client and tripper dashboards, instead of a role-specific left sidebar.

#### Scenario: Admin navigates via top tabs

- GIVEN an authenticated admin viewing any `/dashboard/admin/*` page
- WHEN the page renders
- THEN a top tab bar lists 8 admin destinations in this order: Dashboard, Trip Requests, Experiences, Payments, Reviews, New TGIS Drop, Notifications, Settings
- AND no left sidebar navigation renders

#### Scenario: Sidebar navigation is no longer available

- GIVEN the admin dashboard shell after migration
- WHEN an admin needs to move between sections
- THEN the top tab bar is the only navigational affordance — `AdminSidebar` no longer renders anywhere in the admin dashboard

### Requirement: Admin Settings Grouping

Users, Waitlist, and TGIS Notifications MUST be grouped under a single "Settings" nav tab rather than each having their own top-level tab, following the same pattern already used for client/tripper account settings (`AccountSettingsPanel` + `TabSelector`): one nav entry linking to a page that renders an internal horizontal tab bar switching between the three sections, with no page-level duplication of the eyebrow/heading pattern inside each sub-section.

#### Scenario: Admin opens Settings

- GIVEN an authenticated admin on any admin page
- WHEN they open the Settings tab
- THEN they land on `/dashboard/admin/settings`, which renders one page header ("Configuration" / "Settings") followed by a `TabSelector` with three tabs: Users, Waitlist, TGIS Notifications
- AND the Users tab is selected by default

#### Scenario: Sub-section content is unchanged

- GIVEN the admin has selected a Settings sub-tab (Users, Waitlist, or TGIS Notifications)
- WHEN that sub-tab's content renders
- THEN it reuses the existing `AdminUsersPageClient` / `AdminWaitlistPageClient` / `AdminXsedNotificationsPageClient` components unmodified in behavior, without their own repeated eyebrow/heading block

### Requirement: Tripper Nav Excludes Admin-Only Drop Creation

The tripper dashboard nav MUST NOT include a shortcut to admin-only TGIS drop creation, even for users who hold both the tripper and admin roles. That feature is reachable only through the admin dashboard's own "New TGIS Drop" tab.

#### Scenario: Dual-role user sees no drop-creation tab in tripper nav

- GIVEN a user with both TRIPPER and ADMIN roles viewing `/dashboard/tripper/*`
- WHEN the tripper nav renders
- THEN it shows the same 8 tabs as any tripper (Dashboard, Experiences, Create Experience, Blog, Earnings, Reviews, Notifications, Settings)
- AND no "New Drop" or TGIS-drop-related tab appears

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
