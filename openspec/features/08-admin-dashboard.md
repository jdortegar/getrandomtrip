# Admin Dashboard

**Status**: Partial
**Priority**: Medium

## Purpose

Internal operations tool for the GetRandomTrip team. Admins manage trip requests, review and approve or reject tripper experiences, view users, monitor payments, and manage XSED drops. Not exposed to clients or trippers.

## What's Implemented

- Trip requests: full list with `AdminTripEditModal` for status and `actualDestination` edits; status-change emails sent on update
- Experiences: full list, pending-review tab, approve/reject flow with note and pricing override, emails sent on both outcomes; search-by-title and bulk archive (pending-review rows excluded from selection)
- Users: full list, edit (role assignment), delete (single + bulk with typed "DELETE" confirmation, self-delete blocked), search-by-name
- Payments: read-only table
- Reviews: read-only list
- Waitlist: read-only list
- XSED notifications signup list
- XSED drop create and edit

## Gaps

- [ ] Packages page is a "Coming soon" placeholder — no admin package management
- [ ] No pagination on any admin table — all rows loaded at once
- [ ] Reviews moderation list exists but approve/reject action is not wired in the UI
- [ ] No KPI overview on the main admin dashboard page
- [ ] No bulk approve/reject for pending-review experiences (bulk archive exists for the general list); no payment CSV export; payments and trip requests deliberately excluded from bulk-delete rollout — payments has no delete endpoint at all, and trip-request delete cascades to its linked payment

## Out of Scope

- Real-time operations monitoring or alerting
- Audit log of admin actions
- Multi-admin role levels (super-admin vs. ops)
