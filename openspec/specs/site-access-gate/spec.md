# site-access-gate Specification

## Change: `traveler-waitlist-access`

New capability (no prior spec exists). Full spec — not a delta. See `proposal.md` for scope/risk detail.

## Purpose

Defines who passes the marketing gate while `SiteSetting.gateEnabled` is on: the `User.siteAccessGrantedAt` grant, what sets it, `GateAwareChrome`'s pass condition, and the localStorage revalidation rule that prevents a stale unlock from substituting for the grant.

## Requirements

### Requirement: Site Access Grant

The system MUST persist a `User.siteAccessGrantedAt DateTime?` marking gate access. It MUST be set to the current time when: (a) an `AccessInvite` of any `kind` is accepted (see `tripper` capability), and (b) a companion traveler claims their `TripTraveler` row via `POST /api/travelers/submit`. It MUST NOT be set by any other action in this change, and MUST NOT be cleared by any code path in this change.

#### Scenario: Accepting a SITE_ACCESS invite grants access

- GIVEN a valid, unconsumed `AccessInvite` with `kind: SITE_ACCESS` for `alice@example.com`
- WHEN the accept flow completes for that invite
- THEN `alice`'s `User.siteAccessGrantedAt` is set to a non-null timestamp

#### Scenario: Accepting a TRIPPER invite also grants access

- GIVEN a valid, unconsumed `AccessInvite` with `kind: TRIPPER` for `bob@example.com`
- WHEN the accept flow completes for that invite
- THEN `bob`'s `User.siteAccessGrantedAt` is set to a non-null timestamp, in addition to the `TRIPPER` role grant

#### Scenario: Companion claim grants access

- GIVEN an authenticated user submits `POST /api/travelers/submit` with a valid, unconsumed traveler-invite token
- WHEN the claim succeeds
- THEN that user's `User.siteAccessGrantedAt` is set to a non-null timestamp

### Requirement: Gate Pass Condition

`GateAwareChrome` MUST render the normal site chrome, instead of the waitlist gate, for a session where `GATE_ALLOWED_ROLES.has(role) OR hasSiteAccess` is true. An authenticated user whose role is not in `GATE_ALLOWED_ROLES` and whose `hasSiteAccess` is false MUST see the gate.

#### Scenario: Authenticated traveler with no grant sees the gate

- GIVEN an authenticated `TRAVELER` session with `hasSiteAccess: false`
- WHEN `gateEnabled` is true and the route is not gate-exempt
- THEN the waitlist gate renders, not the normal chrome

#### Scenario: Authenticated traveler with a grant passes

- GIVEN an authenticated `TRAVELER` session with `hasSiteAccess: true`
- WHEN `gateEnabled` is true and the route is not gate-exempt
- THEN the normal site chrome renders

#### Scenario: Admin/tripper role passes regardless of grant

- GIVEN an authenticated session with role `admin` or `tripper` and `hasSiteAccess: false`
- WHEN `gateEnabled` is true
- THEN the normal site chrome renders, unchanged from pre-existing behavior

### Requirement: Stale Unlock Revalidation

When an authenticated session has neither a `GATE_ALLOWED_ROLES` role nor `hasSiteAccess`, `GateAwareChrome` MUST clear the `GATE_STORAGE_KEY` localStorage entry rather than trusting a previously stored unlock.

#### Scenario: Stale unlock is cleared for a non-granted authenticated user

- GIVEN `GATE_STORAGE_KEY` is already set to unlocked in localStorage from a prior session
- WHEN the user authenticates as a `TRAVELER` with `hasSiteAccess: false`
- THEN `GATE_STORAGE_KEY` is cleared and the gate renders on the next check

#### Scenario: Valid unlock is preserved for a granted user

- GIVEN `GATE_STORAGE_KEY` is set to unlocked
- WHEN the user authenticates as a `TRAVELER` with `hasSiteAccess: true`
- THEN `GATE_STORAGE_KEY` remains set and the normal chrome renders

#### Scenario: A session still resolving does not clear a valid unlock

- GIVEN `GATE_STORAGE_KEY` is set and the session status is `"loading"`
- WHEN the page mounts
- THEN the key is not cleared and the gate is not shown

## Out of Scope

- Admin revoke-access UI — no way to unset `siteAccessGrantedAt` once granted.
- The pre-existing gap where an anonymous (unauthenticated) browser can unlock via `localStorage` without any grant — inherited, not closed by this change.
- `SiteSetting.gateEnabled` semantics — remains a global on/off switch, untouched.

## API Contracts

| Surface | Behavior |
|---|---|
| `session().user.hasSiteAccess` | Derived from `User.siteAccessGrantedAt IS NOT NULL`, exposed via the existing `session()` select |
| `GateAwareChrome` | Pass condition: `GATE_ALLOWED_ROLES.has(role) \|\| hasSiteAccess`; clears `GATE_STORAGE_KEY` when neither holds |
| `POST /api/travelers/submit` | Stamps `siteAccessGrantedAt` on the claiming companion, in addition to existing behavior |
