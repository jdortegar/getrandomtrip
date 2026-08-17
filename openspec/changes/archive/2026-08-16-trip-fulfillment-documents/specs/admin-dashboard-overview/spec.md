# Delta for admin-dashboard-overview

## ADDED Requirements

### Requirement: Dedicated Trip-Request Fulfillment Page Replaces the Modal

`/dashboard/admin/trip-requests/[id]` MUST provide 100% feature parity with the removed `TripRequestModal`: status change across the 7-state enum, experience assignment, core trip details, status timeline, delete/danger zone, and the `mailto:` affordance — plus a read-only reference view of the assigned experience's itinerary and per-trip document management (add/list/view/remove). The trip-requests list row action MUST navigate to this page instead of opening a modal. `TripRequestModal` MUST be removed only after this page reaches parity.

(Previously: row actions on `/dashboard/admin/trip-requests` opened `TripRequestModal`, which had no itinerary reference view and no document management.)

#### Scenario: Row action navigates instead of opening a modal
- GIVEN an admin views the trip-requests list
- WHEN they click a row's edit action
- THEN they navigate to `/dashboard/admin/trip-requests/[id]` and no modal opens

#### Scenario: All removed modal actions are reachable from the new page
- GIVEN the new page is loaded for a trip request
- WHEN the admin inspects available actions
- THEN status change, experience assignment, core details, status timeline, delete/danger zone, and the `mailto:` affordance are all present

#### Scenario: New page adds itinerary reference and document management
- GIVEN a trip request has an assigned experience
- WHEN the admin opens the new page
- THEN a read-only itinerary reference section and a document management section (add/list/view/remove) are both present, neither of which existed in the modal
