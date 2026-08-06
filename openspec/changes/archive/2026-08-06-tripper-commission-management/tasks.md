# Tasks: Tripper Commission Management

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~440–470 (3 new test files ~275 incl. mock boilerplate; helper+test ~70; modal+helpers+test ~125; read sites/table/settings/i18n ~65) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (backend contract) → PR 2 (UI + read sites) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending — orchestrator to ask user |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Phases 1–3: shared helper + admin-only write path + tripper-route lockdown (backend only, ~275 lines incl. 2 new route test files) | PR 1 | Self-contained; closes the write hole. No UI. |
| 2 | Phases 4–7: read-site sweep, admin table column, admin modal dirty-tracking, settings restore (~190 lines) | PR 2 | Depends on PR 1's helper module + route contract. If `feature-branch-chain`: base = PR 1 branch. If `stacked-to-main`: base = main after PR 1 merges. |
| — | Phase 8: final verification | attaches to PR 2 | Runs after both units land |

---

## Phase 1: Foundation — Shared Commission Helper

- [x] 1.1 RED — `src/lib/tripper/__tests__/commission.test.ts`: `effectiveCommission` (null/undefined→0.15, 0 stays 0, 0.2 stays 0.2), `toCommissionPercent`, `isValidCommissionPercent` (accepts 0/100, rejects -1/101/12.5/"15"/NaN), `commissionPercentToFraction(15)===0.15`.
- [x] 1.2 GREEN — create `src/lib/tripper/commission.ts` exporting `DEFAULT_COMMISSION`, `effectiveCommission`, `toCommissionPercent`, `isValidCommissionPercent`, `commissionPercentToFraction` per design's Interfaces block.

## Phase 2: Admin-Only Write Path — `PATCH /api/admin/users/[id]`

- [x] 2.1 RED — create `src/app/api/admin/users/[id]/__tests__/route.test.ts` (no existing file): 401/403 unchanged; `commission: 20` → `update` called with `0.2`; `150`/`12.5`/`"20"` → 400 **and `prisma.user.update` never called**; commission absent → `data` has no `commission` key.
- [x] 2.2 GREEN — modify `src/app/api/admin/users/[id]/route.ts`: validate `hasCommission`/`isValidCommissionPercent` before the single `prisma.user.update`; conditional `commission: commissionPercentToFraction(...)` in `data`; select includes `commission`.

## Phase 3: Lock Down Tripper Self-Service — `PATCH /api/user/tripper`

- [x] 3.1 RED — create `src/app/api/user/tripper/__tests__/route.test.ts`: body `commission: 10` → `update` data has no `commission` key; no commission + valid `availableTypes` → 200; empty `availableTypes` → 400.
- [x] 3.2 GREEN — modify `src/app/api/user/tripper/route.ts`: remove `commission` from destructure and `data`, add comment noting admin-only ownership; guard becomes `!Array.isArray(availableTypes) || availableTypes.length === 0`; keep `commission: true` in `select`.

## Phase 4: Read-Site Sweep

- [x] 4.1 `src/lib/db/tripper-queries.ts` (lines 75, 713) — replace `commission || 0` with `effectiveCommission(...)`.
- [x] 4.2 `src/app/[locale]/trippers/[tripper]/page.tsx` (line 114) — remove redundant `|| 0` (already defaulted upstream).
- [x] 4.3 `src/app/[locale]/(secure)/dashboard/tripper/settings/page.tsx` — `EMPTY_FORM`/initial `profile` use `DEFAULT_COMMISSION`/`effectiveCommission(extras.commission)`; drop `commission` from PATCH save body (server ignores it); pass `commission={formData.commission}` to `<TripperSettingsAccountCard>`.

## Phase 5: Admin Users Table — Read-Only Commission Column

- [x] 5.1 `src/app/api/admin/users/route.ts` GET select — add `commission: true`.
- [x] 5.2 `src/components/app/admin/UsersTableRow.tsx` — add `commission: number | null` to `AdminUser`; new cell: `roles.includes("TRIPPER") ? \`${toCommissionPercent(commission)}%\` : "—"`.
- [x] 5.3 `src/components/app/admin/UsersTable.tsx` — insert `copy.headers.commission` after roles header; add `adminUsers.headers.commission` to `src/lib/types/dictionary.ts` + `src/dictionaries/es.json` ("Comisión") + `en.json` ("Commission") in this same task.

## Phase 6: Admin Modal — Commission Input with Dirty-Tracking

- [x] 6.1 RED — create `src/components/app/admin/__tests__/userRoleModalHelpers.test.ts`: `shouldIncludeCommission(isTripper, commissionTouched)` — false when tripper checked but untouched (the null→0.15 leak case), true only when touched; `isModalDirty(rolesChanged, isTripper, commissionTouched, commissionValid)` — true on roles-only change with commission untouched (Save enabled) while `shouldIncludeCommission` for that same state stays false (PATCH body omits commission); false when nothing changed; false when touched but invalid.
- [x] 6.2 GREEN — create `src/components/app/admin/userRoleModalHelpers.ts` (Extract-Before-Mock: pure logic, no component render needed) exporting `shouldIncludeCommission` and `isModalDirty`.
- [x] 6.3 Modify `src/components/app/admin/UserRoleModal.tsx`: add `commissionPct` (string) and a separate `commissionTouched` boolean state, both reset in the existing `useEffect` (deps `[user.id, userRolesKey, user.commission]`) whenever the modal loads a user; input's `onChange` sets `commissionTouched = true` alongside the value — touched tracks "was edited", independent of what the input currently shows; render input only while `roles.includes("TRIPPER")`, styled like `BulkDeleteUsersModal.tsx:70-79` with trailing `%`; use `isModalDirty(...)` for the Save `disabled` prop and `shouldIncludeCommission(...)` to decide whether `commission: parsedPct` is included in the PATCH body — **body inclusion MUST key off `commissionTouched`, never off `isTripper` alone**, so a roles-only save on a `null`-commission tripper never writes `0.15`. Add `adminUsers.modal.{commissionLabel, commissionPlaceholder, commissionError}` to `dictionary.ts` + `es.json` + `en.json` in this same task.

## Phase 7: Tripper Settings — Restore Commission Section

- [x] 7.1 `src/components/app/dashboard/tripper/settings/TripperSettingsAccountCard.tsx` — restore `commission: number` prop, compute `commissionPct`, re-add the label/`AdminSetBadge`/value/helper block using existing dict keys (`commissionLabel`, `adminSet`, `commissionHelper` — already present, no i18n task needed).

## Phase 8: Final Verification

- [x] 8.1 `npm run typecheck` — zero errors, both locales keyed.
- [x] 8.2 `npm run test` — full suite green, including all new/extended files above.
- [x] 8.3 `npm run lint` — BLOCKED: pre-existing sandbox/environment issue, unrelated to this change (see apply-progress notes; verified same failure occurs on a clean stash of the tree).
- [ ] 8.4 Manual QA (≥360px, ≥1280px): 20%/0% round-trip through table + settings; uncheck Tripper preserves stored value on re-promotion; commission-only edit enables Save; roles-only edit on a `null`-commission tripper leaves it `null` (not `0.15`) after save. — NOT DONE: no browser/DB access in this sandbox; deferred to sdd-verify / human QA.
