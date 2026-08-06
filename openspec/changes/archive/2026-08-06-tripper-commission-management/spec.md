# Delta Spec: tripper-commission-management

## Change: `tripper-commission-management`

Adds a new `tripper-commission` capability. No existing spec in `openspec/specs/` covers commission storage, validation, or defaulting — see `proposal.md` for the decision record this spec formalizes.

---

# tripper-commission Specification (NEW)

## Purpose

Defines commission as an admin-owned, contract-derived rate on `User.commission` (`Float?`, fraction): who may write it, how it validates, how it defaults when unset, and where it surfaces read-only.

## Requirements

### Requirement: Shared Read-Layer Commission Default

The system MUST derive a tripper's effective commission through one shared helper applying `commission ?? 0.15` at every read site: earnings calculation, tripper profile fetch, tripper settings display, and the admin modal pre-fill. Explicit `0` MUST remain distinguishable from `null` — no site MUST use `|| 0` or any truthiness coercion.

#### Scenario: Unset commission defaults to 15%
- GIVEN a tripper with `commission: null`
- WHEN earnings are calculated or their profile/settings render
- THEN the effective rate used is `0.15`

#### Scenario: Explicit zero is not overridden
- GIVEN a tripper with `commission: 0` (contract negotiated at 0%)
- WHEN earnings are calculated or their profile/settings render
- THEN the effective rate used is `0`, not `0.15`

### Requirement: Admin-Only Commission Write Path

`commission` MUST be writable only via `PATCH /api/admin/users/[id]` by an authenticated ADMIN. `PATCH /api/user/tripper` MUST ignore any `commission` key present in its request body — it MUST NOT read, validate, or persist it.

#### Scenario: Tripper cannot set own commission
- GIVEN an authenticated TRIPPER calls `PATCH /api/user/tripper` with `commission: 10` (fraction meaning 1000%) in the body
- WHEN the request is processed
- THEN the stored `commission` value is unchanged — the submitted value has no effect

#### Scenario: Admin sets commission
- GIVEN an ADMIN submits the Users-table role modal with roles including Tripper and commission `20`
- WHEN `PATCH /api/admin/users/[id]` succeeds
- THEN `User.commission` is persisted as `0.20`

### Requirement: Commission Validation and Atomic Save

`PATCH /api/admin/users/[id]` MUST validate a submitted commission as a whole integer in `0–100` inclusive, both client-side and server-side. The server MUST reject (400) any value outside this range or non-integer — it MUST NOT clamp. If commission and roles are submitted together and commission is invalid, the entire PATCH MUST be rejected with no partial write.

#### Scenario: Invalid commission rejects the whole PATCH
- GIVEN an ADMIN submits roles + commission `150` in one PATCH
- WHEN the server validates the request
- THEN it returns 400 and neither the roles nor the commission change is persisted

#### Scenario: Non-integer commission rejected
- GIVEN an ADMIN submits commission `12.5`
- WHEN the server validates the request
- THEN it returns 400

### Requirement: Onboarding Does Not Require Commission

`PATCH /api/user/tripper` MUST NOT require a commission value to complete tripper onboarding. The existing truthiness guard (`if (!commission || !availableTypes?.length)`) MUST be corrected so commission is no longer part of the required-fields check; the shared `?? 0.15` default at read sites covers a tripper with no assigned rate.

#### Scenario: Onboarding succeeds without a commission value
- GIVEN a user completing tripper onboarding via `PATCH /api/user/tripper` with a valid `availableTypes` list and no `commission` in the body
- WHEN the request is processed
- THEN onboarding succeeds (no 400) and `User.commission` remains `null`

#### Scenario: Onboarding still requires availableTypes
- GIVEN a user submits `PATCH /api/user/tripper` with an empty `availableTypes`
- WHEN the request is processed
- THEN it returns 400, unchanged from prior behavior

### Requirement: Role-Gated, Non-Destructive Field Visibility

The commission input in `UserRoleModal.tsx` MUST render only while the Tripper role checkbox is checked. Unchecking Tripper MUST hide the input but MUST NOT clear or submit a change to the stored `commission` value.

#### Scenario: Unchecking Tripper preserves stored commission
- GIVEN a tripper with `commission: 0.20` is demoted by unchecking Tripper in the modal
- WHEN the PATCH is submitted
- THEN `User.commission` remains `0.20` in the database

#### Scenario: Re-promotion shows prior value
- GIVEN a user previously demoted from Tripper with `commission: 0.20` intact
- WHEN they are re-checked as Tripper in the modal
- THEN the commission input pre-fills with `20`

### Requirement: Read-Only Admin Users Table Column

The admin Users table MUST show a read-only commission column: a whole percent for users with the Tripper role, and an em dash (`—`) for users without it. This column MUST NOT support inline editing.

#### Scenario: Tripper row shows percent
- GIVEN a Tripper with `commission: 0.15`
- WHEN the Users table renders
- THEN the row's commission cell shows `15%`

#### Scenario: Non-tripper row shows em dash
- GIVEN a user without the Tripper role
- WHEN the Users table renders
- THEN the row's commission cell shows `—`

### Requirement: Restored Tripper Settings Commission Section

`TripperSettingsAccountCard.tsx` MUST display the tripper's effective commission (via the shared default helper) as read-only, with an admin-set indicator, replacing the previously removed section that showed unvalidated values.

#### Scenario: Settings show a plausible percent
- GIVEN a tripper with `commission: null`
- WHEN the settings page renders
- THEN the commission section shows `15%`, never a value derived from unvalidated client input

## Cross-Cutting Requirements

### Requirement: Dual-Locale Dictionary Coverage

Every user-visible string introduced by this change (modal label/helper/validation error, table column header, settings copy) MUST be present in both `src/dictionaries/es.json` and `src/dictionaries/en.json`, with matching keys typed in `src/lib/types/dictionary.ts`. No string MUST be hardcoded in components.

#### Scenario: New copy present in both locales
- GIVEN the commission UI (modal, table, settings) renders
- WHEN `npm run typecheck` runs
- THEN no missing dictionary key errors are reported for either locale

## Out of Scope

- Prisma migration, DB-level default, or backfill on `User.commission`.
- Audit trail / change history for commission edits.
- Inline editing of commission in the Users table.
- Bulk commission edits, tier-derived rates, or bonus logic.

## API Contracts

| Endpoint | Auth | Commission Behavior |
|----------|------|----------------------|
| `PATCH /api/admin/users/[id]` | ADMIN | Sole write path. Accepts whole-percent integer `0–100`; converts to fraction; atomic 400 on invalid |
| `PATCH /api/user/tripper` | TRIPPER (self) | MUST ignore `commission` in body; MUST NOT require it for onboarding |
| `GET /api/admin/users` | ADMIN | `commission` added to select for table column |
