# Proposal: Tripper Commission Management

## Intent

Each tripper's commission rate is negotiated at contract signing, but there is no admin UI to set it. `User.commission` (`Float?`, fraction — `0.12` = 12%) already exists and already drives real earnings math, yet every read site coerces it with `|| 0`:

- `src/lib/db/tripper-queries.ts:713` — earnings calc. **Live revenue bug**: a tripper with `commission = null` earns $0 on every sale.
- `src/lib/db/tripper-queries.ts:75` — tripper profile fetch.
- `src/app/[locale]/(secure)/dashboard/tripper/settings/page.tsx:33,54,76` — hardcoded `0` defaults.

There is also no validation. `PATCH /api/user/tripper` (`route.ts:71,134`) writes `commission` straight from the tripper's own request body — that is how a `1000%` display reached the tripper settings page, forcing us to hide that section earlier. This change makes commission admin-owned, validated, and consistently defaulted.

## Scope

### In Scope

- Shared read-layer default helper: `commission ?? 0.15`. Applied at `tripper-queries.ts:713` (replacing `|| 0`), `tripper-queries.ts:75`, the settings page `formData.commission` default, and the admin modal pre-fill.
- Commission input in the existing `src/components/app/admin/UserRoleModal.tsx`, rendered only when the Tripper checkbox is checked.
- Whole-percent integer input, `0–100` inclusive, no decimals (admin types `15` → stores `0.15`). Hard-validated client-side and server-side in `PATCH /api/admin/users/[id]`.
- Atomic PATCH: an invalid commission rejects the whole request (roles included), matching the existing `if (!nextRoles) return 400` pattern.
- Read-only commission column in the admin Users table (`UsersTable.tsx`, `UsersTableRow.tsx`, `AdminUser` type, `GET /api/admin/users` select). Percent for Trippers, `—` for others.
- Restore the commission section in `TripperSettingsAccountCard.tsx` (props `commission: number`, `commissionPct = Math.round(commission * 100)`, `AdminSetBadge`), now sourced through the read-layer default.
- Harden `PATCH /api/user/tripper` so a tripper cannot write their own `commission`.
- New `es` + `en` dictionary entries for modal label/helper/validation error and the table column header.

### Out of Scope

- Any Prisma migration, DB-level default, or backfill.
- Audit trail / change history for commission edits (possible follow-up).
- Inline editing of commission in the Users table.
- Bulk commission edits, tier-derived rates, or bonus logic.
- `calculatePriceWithCommission` (`src/lib/helpers/package-geography.ts:76`) — dead code, uses a different percent scale.

## Capabilities

### New Capabilities

- `tripper-commission`: admin-owned commission rate — storage semantics, validation contract, read-layer default, and the admin/tripper surfaces that display it.

### Modified Capabilities

- None. No existing spec in `openspec/specs/` covers commission.

## Approach

Keep `commission` a nullable `Float` and make the *read layer* — not the schema — supply the default. `null` means "admin never set a rate; treat as 15%"; `0` means "explicitly negotiated 0%". A DB default or backfill would erase that distinction permanently, so the fallback lives in one shared helper that every read site calls.

Writes flow through exactly one admin-authenticated path (`PATCH /api/admin/users/[id]`), which converts whole percent → fraction and rejects anything outside `0–100` or non-integer rather than clamping. Clamping would silently persist a rate nobody agreed to.

Commission is tied to a signed contract, not the role flag: unchecking Tripper hides the field but never clears the stored value, so demote/re-promote round-trips are lossless.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/db/tripper-queries.ts` (75, 713) | Modified | Replace `\|\| 0` with shared `?? 0.15` default |
| Shared commission helper (new module) | New | `DEFAULT_COMMISSION`, fraction↔percent conversion, validation predicate |
| `src/components/app/admin/UserRoleModal.tsx` | Modified | Commission input, gated on Tripper checkbox; client validation |
| `src/app/api/admin/users/[id]/route.ts` | Modified | Parse/validate commission; atomic 400 on invalid |
| `src/app/api/admin/users/route.ts` | Modified | Add `commission: true` to GET select |
| `src/components/app/admin/UsersTable{,Row}.tsx` | Modified | Read-only commission column; `AdminUser.commission` |
| `src/app/api/user/tripper/route.ts` (71, 77, 134) | Modified | Stop accepting tripper-supplied `commission` |
| `TripperSettingsAccountCard.tsx` + settings `page.tsx` | Modified | Restore read-only section; default via helper |
| `src/dictionaries/{es,en}.json`, `src/lib/types/dictionary.ts` | Modified | New `adminUsers.headers.commission` + `adminUsers.modal.commission*` keys |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `0.15` default silently inflates earnings for trippers who genuinely earn 0% | Med | `0` stays distinct from `null`; admin sets explicit `0` for those contracts. Audit existing `null` rows before ship |
| Removing `commission` from `PATCH /api/user/tripper` breaks its `if (!commission \|\| !availableTypes?.length)` onboarding guard (`route.ts:77`) | High | Spec phase must redefine that guard — it currently blocks onboarding when commission is `0` or absent |
| Fraction/percent unit confusion between layers | Med | Single conversion helper; never convert inline. Existing `commission` dict key at `dictionary.ts:837` is a separate `0–1` experience-form field — do not reuse |
| Rounding drift (`Math.round(commission * 100)`) on legacy non-2-decimal values | Low | Integer-percent writes make new values exact; display-only rounding for legacy rows |
| Missing `en` copy | Low | Enforce dual-locale keys per `.claude/rules/i18n-and-types.md` |

## Rollback Plan

Revert the change commits. No migration, no data transformation — the DB is untouched, so rollback is code-only. Commission values written by admins during the change's lifetime remain valid fractions readable by the old `|| 0` code paths (they simply lose the `0.15` fallback and revert to the pre-existing $0 bug for `null` rows).

## Dependencies

- None. No schema change, no external service, no migration coordination.

## Success Criteria

- [x] Admin can set a tripper's commission from the Users-table pencil modal; value persists as a fraction.
- [x] Input rejects `<0`, `>100`, and non-integers on both client and server; no clamping.
- [x] A PATCH with valid roles + invalid commission persists nothing (atomic 400).
- [x] Unchecking Tripper hides the field and leaves the stored value untouched.
- [x] Earnings calc uses `?? 0.15`; a `null`-commission tripper no longer earns $0.
- [x] Users table shows percent for Trippers, `—` for non-Trippers, read-only.
- [x] Tripper settings shows the restored commission section with a plausible percent.
- [x] `PATCH /api/user/tripper` ignores a client-supplied `commission`.
- [x] All new copy present in `es` and `en`; `npm run typecheck` and `npm run lint` pass.
