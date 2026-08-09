# Tasks: Waitlist Bulk Actions

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~600-750 (4 new files, 7 modified, 1 new large test file) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (server/data) → PR 2 (dictionary + client) |
| Delivery strategy | ask-on-risk (default — not specified) |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Phases 1-4: helper, invite-guard, list enrichment, type | PR 1 | Self-contained backend slice, ~250-350 lines, no UI dependency |
| 2 | Phases 5-6: dictionary + client scaffold | PR 2 | Depends on PR 1's `alreadyMember` field/type; ~350-400 lines |

## Phase 1: Membership Helper (Foundation)

- [x] 1.1 RED: `src/lib/admin/__tests__/waitlistMembership.test.ts` — assert single batched `findMany`, empty-input short-circuit (no query), correct `Set` contents. (spec: Waitlist List Enrichment)
- [x] 1.2 GREEN: Create `src/lib/admin/waitlistMembership.ts` — `findExistingUserEmails(emails): Promise<Set<string>>` via one `prisma.user.findMany({ where: { email: { in } }, select: { email } })`; empty array → `new Set()`, no query. Confirm 1.1 passes.

## Phase 2: Invite-Route Guard

- [x] 2.1 RED: In `.../invite-tripper/__tests__/route.test.ts`, add `findMany: vi.fn()` to the `user` mock; add case "rejects existing-User email with 400, no invite/email sent"; set the existing happy-path test's `findMany` mock to resolve `[]`. (spec: Waitlist invite blocked for an existing user)
- [x] 2.2 GREEN: In `.../invite-tripper/route.ts`, call `findExistingUserEmails([entry.email])` after the 404 check; if matched, return `400 { error: "Email already belongs to an existing user" }` before `issueTripperInvite`. Confirm 2.1 passes, both tests green.

## Phase 3: List Enrichment

- [x] 3.1 RED: Create `src/app/api/admin/waitlist/__tests__/route.test.ts` (no prior test exists) — scenarios: match → `alreadyMember: true`; no match → `false`; exactly one `user.findMany` call per page.
- [x] 3.2 GREEN: In `src/app/api/admin/waitlist/route.ts`, call `findExistingUserEmails(rows.map(r => r.email))` alongside `getTripperInviteStatuses`; map `alreadyMember: existingEmails.has(r.email)`. Confirm 3.1 passes.

## Phase 4: Type

- [x] 4.1 Add `alreadyMember: boolean` to `AdminWaitlistEntry` in `src/lib/admin/types.ts`. Run `npm run typecheck`.

## Phase 5: Dictionary

- [x] 5.1 Add `adminPages.waitlist` keys to `src/dictionaries/es.json`: `selectAll`, `selectRow`, `alreadyMemberBadge`, `alreadyMemberHint`, `bulkActions.{inviteSelected,deleteSelected,inviteNothingToDo,inviteConfirmTitle,inviteConfirmBody,inviteSkippedNote,deleteConfirmTitle,deleteConfirmBody,cancel,confirm,partialFailure}`.
- [x] 5.2 Mirror the same keys (English copy) in `src/dictionaries/en.json`.
- [x] 5.3 Extend the `waitlist` interface in `src/lib/types/dictionary.ts` with the new fields. Run `npm run typecheck` for parity.

## Phase 6: Client Scaffold (AdminWaitlistPageClient.tsx)

- [x] 6.1 RED: Create `AdminWaitlistPageClient.test.tsx` — header checkbox selects all rendered rows; indeterminate on partial selection; per-row checkbox enabled/toggleable on an `alreadyMember` row (no `disabled`); selection clears on page change.
- [x] 6.2 GREEN: Add `selectedIds: Set<string>` + `selectAllRef`, header/per-row checkboxes (5→6 cols), `toggleSelectAll`/`toggleRow`, `allChecked`/`someSelected` → `selectAllRef.indeterminate`, clear selection in existing `useEffect([page])`. Confirm 6.1 passes.
- [x] 6.3 RED: Extend test — both bulk actions disabled at zero selection; bar labels bind to raw `selectedIds.size`; bulk-invite button disabled when selection is entirely `alreadyMember`.
- [x] 6.4 GREEN: Add bulk-action bar (`inviteSelected`/`deleteSelected`, `{count}` = `selectedIds.size`); derive `invitableSelectedIds` (selection minus `alreadyMember`); `inviteDisabled = invitableSelectedIds.length === 0`; `inviteNothingToDo` tooltip when non-empty but fully gated. Confirm 6.3 passes.
- [x] 6.5 RED: Extend test — `alreadyMember` row shows the badge instead of Invited/Expired chip (even when both true); single-row invite button `disabled` with `alreadyMemberHint` tooltip.
- [x] 6.6 GREEN: Extend `inviteChipClass` map with the neutral `alreadyMember` chip (no new badge component); render it in place of the status chip when set; add `|| entry.alreadyMember` to the single-row invite button's `disabled`, swap tooltip. Confirm 6.5 passes.
- [x] 6.7 RED: Extend test — bulk invite: neutral `ConfirmModal` before sending; excludes `alreadyMember` from fan-out, resends to live "Invited"/"Expired" rows; `allSettled` count = `invitableSelectedIds.length`; partial-failure banner + refetch + selection clear.
- [x] 6.8 GREEN: Add bulk-invite `ConfirmModal` (neutral, body = `invitableSelectedIds.length`, `inviteSkippedNote` when > 0 skipped), `Promise.allSettled` over `POST .../invite-tripper` for `invitableSelectedIds`, banner + refetch + `setSelectedIds(new Set())`. Confirm 6.7 passes.
- [x] 6.9 RED: Extend test — bulk delete: danger `ConfirmModal`, no typed confirmation; includes `alreadyMember` rows (no filter); partial-failure banner + refetch + selection clear.
- [x] 6.10 GREEN: Add bulk-delete `ConfirmModal` (danger, body = `selectedIds.size`), `Promise.allSettled` over `DELETE .../[id]` for `Array.from(selectedIds)`, reuse shared banner/refetch/clear. Confirm 6.9 passes.

## Phase 7: Verification

- [x] 7.1 Run `npm run test` (full suite) — confirm all RED/GREEN pairs above are green and no prior test regressed (esp. invite-tripper happy path).
- [x] 7.2 Run `npm run typecheck` (passes clean) and `npm run lint` (pre-existing environment breakage unrelated to this change — `next lint`/`eslint` both throw `TypeError: Converting circular structure to JSON` in ESLint's flat-config bridge before reaching any file, reproduces on an empty file list too); manual QA of select-all, bulk invite/delete, badge precedence, partial-failure banner deferred to reviewer.
