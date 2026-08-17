# Proposal: Waitlist Bulk Actions

## Intent

The admin Waiting List (`AdminWaitlistPageClient.tsx`) only supports one-row-at-a-time invite/delete, so clearing a backlog is N sequential clicks with no confirmation and no aggregate feedback. It also happily invites emails that already have a `User` account: the waitlist invite endpoint has no existing-user guard, unlike its Users-table sibling. Add page-scoped bulk select with bulk invite + bulk delete, surface an "Already a member" signal, and block invites for emails that already resolve to a `User`.

## Scope

### In Scope

- Enrich `GET /api/admin/waitlist` with `alreadyMember: boolean` — batched `user.findMany({ where: { email: { in: emails } } })`; **any** matching `User` counts regardless of role
- Add `alreadyMember` to `AdminWaitlistEntry` (`src/lib/admin/types.ts`)
- Existing-`User` guard in `POST /api/admin/waitlist/[id]/invite-tripper` → `400` (mirrors the Users-route precedent), fixing the current gap
- Disable the single-row invite button when `alreadyMember`; render an "Already a member" badge in the existing status column, taking precedence over the Invited/Expired chip
- Page-scoped bulk selection: header checkbox with indeterminate ref + per-row checkboxes, `Set<string>` state
- Bulk-action bar with count-in-label buttons, disabled at zero selection
- Bulk invite: `Promise.allSettled` fan-out over the existing per-id invite endpoint, skipping `alreadyMember` rows client-side; `ConfirmModal tone="neutral"`
- Bulk delete: same fan-out over the existing `DELETE /api/admin/waitlist/[id]`; `ConfirmModal tone="danger"` (no typed confirmation — low-severity records)
- Partial-failure banner (`{success}` / `{total}` / `{failed}`) + refetch on completion
- All new copy in `src/dictionaries/es.json` and `en.json`, typed in `src/lib/types/dictionary.ts`

### Out of Scope

- The hardcoded `"es"` locale in the waitlist invite email send — this is **spec'd behavior** (`openspec/specs/tripper/spec.md`: "Waitlist-sourced sends MUST use locale `es`"), not a bug
- Search / filtering on the waitlist page; cross-page "select all matching"
- A new batch API endpoint — app convention is N parallel calls against existing per-id routes
- `grantTripperAndCleanup` waitlist-cleanup behavior (unchanged)
- The Invited / Expired invite-status badge — **already implemented** end-to-end (route enrichment, type, chip render)

## Capabilities

### New Capabilities

- `admin-waitlist-management`: waitlist list enrichment, page-scoped bulk selection model, bulk invite, bulk delete

### Modified Capabilities

- `tripper`: extend "Admin UI Invite Status and Button Gating" and the waitlist invite endpoint requirement with an existing-`User` guard (any role) applied uniformly to the single-row and bulk invite paths

## Approach

Copy the `AdminExperiencesPageClient` bulk pattern verbatim — `Set<string>` selection, indeterminate header checkbox, `ConfirmModal`, `Promise.allSettled` over per-id endpoints, partial-failure message, refetch. The server-side `400` guard is authoritative; the client-side skip of `alreadyMember` rows is UX only, so a stale list cannot produce a bad invite.

## Affected Areas

| Area                                                       | Impact   | Description                                       |
| ---------------------------------------------------------- | -------- | ------------------------------------------------- |
| `src/app/api/admin/waitlist/route.ts`                      | Modified | `alreadyMember` enrichment                        |
| `src/app/api/admin/waitlist/[id]/invite-tripper/route.ts`  | Modified | Existing-`User` guard → `400`                     |
| `src/app/api/admin/waitlist/[id]/route.ts`                 | Reused   | No change — bulk delete fans out to it            |
| `src/lib/admin/types.ts`                                   | Modified | `AdminWaitlistEntry.alreadyMember`                |
| `.../dashboard/admin/AdminWaitlistPageClient.tsx`          | Modified | Selection, bulk bar, modals, badge, banner        |
| `src/dictionaries/{es,en}.json`                            | Modified | Bulk + "Already a member" copy                    |
| `src/lib/types/dictionary.ts`                              | Modified | New `adminPages.waitlist` keys                    |

## Risks

| Risk                                                        | Likelihood | Mitigation                                                       |
| ----------------------------------------------------------- | ---------- | ---------------------------------------------------------------- |
| Bulk invite floods Resend (fire-and-forget sends, no rate limit) | Med    | Selection is page-scoped (≤20 rows); accept, matches per-row path |
| Partial failure leaves the list stale                       | Med        | Always refetch after fan-out; show `{failed}` count              |
| Extra `user.findMany` per waitlist page load                | Low        | Batched, unique-indexed `email` lookup                           |
| Guard blocks a legitimate re-invite of an existing account  | Low        | Documented: admin uses `UserRoleModal` direct role grant instead  |
| Untranslated new copy                                       | Med        | Dual-dictionary + `typecheck` enforcement                        |

## Rollback Plan

Revert the change commits. No schema change, no migration, no data mutation beyond the deletes the admin explicitly confirms — rollback is a pure code revert.

## Dependencies

- None external. Reuses `issueTripperInvite`, `getTripperInviteStatuses`, `sendTripperInviteEmail`, `ConfirmModal`, `TableIconButton`.

## Success Criteria

- [ ] Header checkbox selects/deselects the current page and shows indeterminate state for partial selection
- [ ] Bulk invite and bulk delete each confirm, fan out, report partial failures, clear selection, and refetch
- [ ] Rows whose email matches any existing `User` show "Already a member", have the single-row invite disabled, and are skipped by bulk invite
- [ ] `POST /api/admin/waitlist/[id]/invite-tripper` returns `400` for an email with an existing `User`, even when called directly
- [ ] All new strings exist in both `es.json` and `en.json`
- [ ] `npm run typecheck` and `npm run lint` pass
