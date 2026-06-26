# Waitlist & Newsletter

**Status**: Partial
**Priority**: Low

## Purpose

Two lightweight lead-capture mechanisms. The waitlist collects interested users before a feature or market goes live. The newsletter captures emails for ongoing content distribution. Both feed into the admin's view of potential customers.

## What's Implemented

- `POST /api/waitlist`: upserts an entry, validates email and name
- Admin waitlist page: read-only list of entries
- `POST /api/newsletter`: validates email and logs it (no further action)

## Gaps

- [ ] Newsletter signup does nothing beyond logging — `TODO: integrate with ESP` comment is unresolved; no email is stored in any provider list
- [ ] No confirmation email sent on waitlist signup
- [ ] No admin CSV export for waitlist entries
- [ ] No admin action to delete a waitlist entry or mark it as contacted
- [ ] No unsubscribe mechanism for either waitlist or newsletter
- [ ] No deduplication feedback to the user — re-signing up with the same email gives no indication the address is already registered

## Out of Scope

- Double opt-in confirmation flow
- Segmented newsletter lists by interest or locale
