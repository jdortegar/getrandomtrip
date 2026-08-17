# Admin Waitlist Management Specification

## Purpose

Capability for the admin Waiting List page's existing-member enrichment, page-scoped bulk selection, and bulk invite/delete actions, which fan out to the existing per-id waitlist endpoints rather than a new batch endpoint. See `proposal.md` for scope/risk detail.

## Requirements

### Requirement: Waitlist List Enrichment with Existing-Member Signal

The system MUST enrich `GET /api/admin/waitlist` responses with `alreadyMember: boolean` per entry, computed via a single batched `User.findMany({ where: { email: { in: emails } } })` lookup matching entries' emails against existing `User` rows of **any** role. `AdminWaitlistEntry` (`src/lib/admin/types.ts`) MUST include this field.

#### Scenario: Entry email matches an existing user of any role

- GIVEN a waitlist entry with email `x@example.com` and an existing `User` row with that email and role `TRAVELER`
- WHEN `GET /api/admin/waitlist` runs
- THEN that entry's `alreadyMember` is `true`

#### Scenario: Entry email has no matching user

- GIVEN a waitlist entry whose email matches no `User` row
- WHEN `GET /api/admin/waitlist` runs
- THEN that entry's `alreadyMember` is `false`

### Requirement: Page-Scoped Bulk Selection Model

The Waiting List admin page MUST support selecting multiple rows via a `Set<string>` of waitlist entry ids, scoped to the currently loaded page. A header checkbox MUST select/deselect all currently rendered rows and MUST render an indeterminate visual state when the selection is a non-empty subset of the page. Per-row checkboxes toggle individual ids. The selection MUST be cleared on page/navigation change and after a bulk action completes.

#### Scenario: Header checkbox selects the full page

- GIVEN a waitlist page with 10 rendered rows and none selected
- WHEN the admin checks the header checkbox
- THEN all 10 row ids are added to the selection and the header checkbox shows fully checked

#### Scenario: Partial selection shows indeterminate

- GIVEN 3 of 10 rows on the page are selected
- WHEN the page renders
- THEN the header checkbox shows an indeterminate visual state

#### Scenario: Selection resets on page change

- GIVEN a non-empty selection on page 1
- WHEN the admin navigates to page 2
- THEN the selection is empty

### Requirement: Bulk-Action Bar

The page MUST render a bulk-action bar reflecting the live selected count in each action's label (e.g., "Invite (3)", "Delete (3)"), and MUST disable both bulk actions when the selection is empty.

#### Scenario: Actions disabled at zero selection

- GIVEN no rows are selected
- WHEN the page renders
- THEN both bulk actions are disabled

#### Scenario: Bar reflects live count

- GIVEN 5 rows selected
- WHEN the bar renders
- THEN both action labels include the count `5`

### Requirement: Bulk Invite Action

On confirmation (`ConfirmModal tone="neutral"`), the system MUST invite all selected ids via `Promise.allSettled` calls to the existing `POST /api/admin/waitlist/[id]/invite` endpoint (see `tripper` spec for endpoint behavior and role/kind gating) — no new batch endpoint. After the fan-out settles, the system MUST report success/failure counts, refetch the waitlist, and clear the selection.

#### Scenario: Confirmation required before sending

- GIVEN 4 selected rows
- WHEN the admin clicks bulk invite
- THEN a neutral-tone confirmation modal appears before any request is sent

#### Scenario: Bulk invite action processes all selected rows

- GIVEN 5 selected rows
- WHEN the admin confirms bulk invite
- THEN 5 invite requests are sent to the endpoint

#### Scenario: Partial failure is reported

- GIVEN 10 rows are invited via fan-out and 2 requests fail
- WHEN the fan-out settles
- THEN the admin sees a message reporting 8 succeeded and 2 failed, the list is refetched, and the selection is cleared

### Requirement: Bulk Delete Action

On confirmation (`ConfirmModal tone="danger"`, no typed confirmation required), the system MUST delete the selected ids via `Promise.allSettled` calls to the existing `DELETE /api/admin/waitlist/[id]` endpoint. After the fan-out settles, the system MUST report success/failure counts, refetch the waitlist, and clear the selection.

#### Scenario: Confirmation required before deleting

- GIVEN 3 selected rows
- WHEN the admin clicks bulk delete
- THEN a danger-tone confirmation modal appears before any request is sent, without requiring a typed confirmation phrase

#### Scenario: Partial failure is reported

- GIVEN 6 rows are deleted via fan-out and 1 request fails
- WHEN the fan-out settles
- THEN the admin sees a message reporting 5 succeeded and 1 failed, the list is refetched, and the selection is cleared

### Requirement: Dual-Locale Dictionary Coverage for New Copy

Every new user-visible string introduced by this capability (bulk-action bar labels, confirmation modal copy, partial-failure messages, "Already a member" badge for status display) MUST be present in both `src/dictionaries/es.json` and `src/dictionaries/en.json` with matching keys, typed in `src/lib/types/dictionary.ts`. No such string MUST be hardcoded in the component.

#### Scenario: Dictionary parity enforced

- GIVEN the new bulk-action and already-member copy is added
- WHEN `npm run typecheck` runs
- THEN no missing dictionary key errors are reported for either locale

## Out of Scope

- Search / filtering on the waitlist page; cross-page "select all matching"
- A new batch API endpoint
- Changes to `WaitlistEntry` cleanup-on-accept behavior
- Locale used for the waitlist invite email (already `es`, unchanged)
- Invite endpoint behavior and access gating (defined in `tripper` spec)

## API Contracts

| Endpoint | Change |
|---|---|
| `GET /api/admin/waitlist` | Adds `alreadyMember: boolean` per entry |
| `POST /api/admin/waitlist/[id]/invite` | Reused by bulk fan-out; endpoint behavior defined in `tripper` spec |
| `DELETE /api/admin/waitlist/[id]` | Reused by bulk fan-out; no change |
