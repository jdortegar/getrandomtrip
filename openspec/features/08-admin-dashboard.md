# Admin Dashboard

**Status**: Partial
**Priority**: Medium

## Purpose

Internal operations tool for the GetRandomTrip team. Admins manage trip requests, review and approve or reject tripper experiences, view users, monitor payments, and manage XSED drops. Not exposed to clients or trippers.

## What's Implemented

- Trip requests: full list with `AdminTripEditModal` for status and `actualDestination` edits; status-change emails sent on update
- Experiences: full list, pending-review tab, approve/reject flow with note and pricing override, emails sent on both outcomes
- Users: read-only list
- Payments: read-only table
- Reviews: read-only list
- Waitlist: read-only list
- XSED notifications signup list
- XSED drop create and edit

## Gaps

- [ ] Packages page is a "Coming soon" placeholder — no admin package management
- [ ] No pagination on any admin table — all rows loaded at once
- [ ] No admin UI for user edit, delete, or role assignment
- [ ] Reviews moderation list exists but approve/reject action is not wired in the UI
- [ ] No KPI overview on the main admin dashboard page
- [ ] No bulk operations — no bulk approve/reject for experiences, no payment CSV export

## Out of Scope

- Real-time operations monitoring or alerting
- Audit log of admin actions
- Multi-admin role levels (super-admin vs. ops)
