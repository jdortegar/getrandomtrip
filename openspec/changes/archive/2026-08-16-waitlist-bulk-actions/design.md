# Design: Waitlist Bulk Actions

## Technical Approach

Three layers, no new endpoints and no schema change:

1. **Shared membership lookup** — one batched helper defines "already a member" (any `User` row matching the email, any role) and is consumed by both the list route and the invite route.
2. **Server guard (authoritative)** — `POST /api/admin/waitlist/[id]/invite-tripper` returns `400` when the email resolves to a `User`. Bulk invite fans out to this same route, so the guard applies per item with no bulk-specific code.
3. **Client scaffold (UX only)** — page-scoped `Set<string>` selection copied verbatim from `AdminUsersPageClient` + `UsersTableRow`, `Promise.allSettled` fan-out, `ConfirmModal`, partial-failure banner copied from `RoleNotificationsPageClient.handleBulkDelete`.

## Architecture Decisions

### Decision: membership helper in a new `src/lib/admin/waitlistMembership.ts`

| Option | Tradeoff |
| --- | --- |
| Inline `user.findMany` in each route | Duplicates the definition of "already a member" in two places |
| Add to `src/lib/auth/tripperInviteTokens.ts` | Co-located with `getTripperInviteStatuses`, but that file owns *token lifecycle*; a `User`-existence query dilutes its cohesion |
| **New `src/lib/admin/waitlistMembership.ts`** (chosen) | One definition, testable in isolation, sits with the other admin query helpers |

Rationale: single source of truth, and the helper deliberately uses `prisma.user.findMany` — **not** `findUnique`. The invite route already calls `prisma.user.findUnique` for the admin caller lookup, and its existing test mocks that method with a single `mockResolvedValue`. A `findUnique`-based guard would read the caller's own mock and silently trip. Distinct method = no mock aliasing.

### Decision: server guard authoritative, client skip cosmetic

Client-side gating can act on a stale list; the `400` cannot. Bulk invite additionally filters `alreadyMember` ids before the fan-out so a defensive server `400` never inflates the failure count in the banner.

### Decision: invite button disabled, not hidden

The Users table *hides* the invite button for existing TRIPPER/ADMIN (`openspec/specs/tripper/spec.md` "Admin UI Invite Status and Button Gating"). Here the button stays rendered and `disabled` with a tooltip. Rationale: a vanishing button reads as a missing feature; badge + disabled button + tooltip explain *why* the action is unavailable.

### Decision: gated rows stay *selectable*; only the invite fan-out filters them

**FINAL — signed off.** (Reverses one initial interview detail; see Resolved Decisions #1.)

| Option | Tradeoff |
| --- | --- |
| Disable the row checkbox for `alreadyMember` (initial interview call) | Blocks **bulk delete** of exactly the stale rows this change exists to clear, and contradicts the spec's `Page-Scoped Bulk Selection Model` MUST ("header checkbox MUST select/deselect all currently rendered rows") |
| **Checkbox enabled on every row; filter at invite fan-out** (chosen) | Satisfies both spec MUSTs; an already-registered entry stays bulk-deletable |

One `Set<string>` feeds two actions and the gate only applies to one of them:

- `toggleSelectAll` / per-row checkbox → **never** consult `alreadyMember`. No `disabled` prop on any checkbox.
- Bulk **delete** → `Array.from(selectedIds)`, full selection, no filtering.
- Bulk **invite** → `invitableSelectedIds` (selection minus `alreadyMember`); disabled when that derived set is empty; the confirm body reports the effective count plus a skipped note.

`alreadyMember` is referenced in exactly three places in the client: the status-cell chip, the per-row single-invite button's `disabled`/tooltip, and the `invitableSelectedIds` derivation (which in turn drives the bulk-invite button's disabled state). Nowhere else.

### Decision: bulk-invite button *label* shows the raw selection count; the *modal* shows the effective count

The spec's `Bulk-Action Bar` scenario ("5 rows selected → both action labels include the count `5`") is satisfied literally: both bar labels bind to `selectedIds.size`. The `alreadyMember` filter surfaces one step later, inside the confirm modal — `inviteConfirmBody` uses `invitableSelectedIds.length`, and `inviteSkippedNote` renders the difference when it is non-zero. Rationale: a label whose number silently shrinks relative to the visible checkbox count is harder to trust than a label that matches what the admin selected and a modal that explains what will actually happen. The only place `alreadyMember` changes the *bar* is the invite button's disabled state (effective count zero) plus its tooltip.

### Decision: "Already a member" chip = terminal-state palette, replaces the invite chip

Read-only status role → `rounded-[6px]`, no dot (binary signal), reusing the canonical `ARCHIVED` colors from `design-system.md`: `border-neutral-200 bg-neutral-50 text-neutral-600`. Distinct from the chips already in this file (`invited` = sky, `expired` = amber) and semantically "terminal, nothing to do here" — green would read as "invite succeeded". Rendered **instead of** the invite chip (one chip per status cell) because it is the signal that blocks the action.

Deviation noted: `design-system.md` forbids inline status-badge styles, but `AdminWaitlistPageClient` already renders `inviteChipClass` inline. Extend that local map rather than introducing a 6th badge component for one row.

## Data Flow

    GET /api/admin/waitlist ──┬─→ waitlistEntry.findMany (page)  ─┐
                              ├─→ getTripperInviteStatuses(emails)┤→ entries[]
                              └─→ findExistingUserEmails(emails) ─┘   (+alreadyMember)
                                        │ 1 batched user.findMany
    AdminWaitlistPageClient
      selectedIds:Set  ── select-all = every rendered row
           │
           ├─ bulk invite → minus alreadyMember → ConfirmModal neutral
           │                                      → allSettled(POST .../invite-tripper)
           └─ bulk delete → full selection       → ConfirmModal danger
                                                  → allSettled(DELETE .../[id])
                                        │
                              partial-failure banner → fetchEntries()

## File Changes

| File | Action | Description |
| --- | --- | --- |
| `src/lib/admin/waitlistMembership.ts` | Create | `findExistingUserEmails(emails: string[]): Promise<Set<string>>` — one `user.findMany`; returns empty Set for empty input without querying |
| `src/lib/admin/__tests__/waitlistMembership.test.ts` | Create | Batching, empty-input short-circuit, Set contents |
| `src/app/api/admin/waitlist/route.ts` | Modify | Call the helper alongside `getTripperInviteStatuses`; add `alreadyMember` per entry |
| `src/app/api/admin/waitlist/[id]/invite-tripper/route.ts` | Modify | Guard after the 404 check, before `issueTripperInvite` → `400` |
| `src/app/api/admin/waitlist/[id]/invite-tripper/__tests__/route.test.ts` | Modify | Add `user.findMany` to the prisma mock (existing happy-path test 500s without it); add the `400` case |
| `src/app/api/admin/waitlist/__tests__/route.test.ts` | Create | `alreadyMember` enrichment, single batched lookup |
| `src/lib/admin/types.ts` | Modify | `AdminWaitlistEntry.alreadyMember: boolean` (required — the route always sets it) |
| `src/app/[locale]/(secure)/dashboard/admin/AdminWaitlistPageClient.tsx` | Modify | Selection state (`Set<string>` + `selectAllRef`), leading checkbox column (`<th>` + per-row `<td>`, 5 cols → 6), bulk bar, two `ConfirmModal`s, `alreadyMember` chip in the status cell, `disabled` + tooltip on the single-row invite button, partial-failure banner, `setSelectedIds(new Set())` in the existing `useEffect([page])` |
| `src/app/[locale]/(secure)/dashboard/admin/__tests__/AdminWaitlistPageClient.test.tsx` | Create | Select-all/indeterminate, gating, fan-out, partial failure |
| `src/dictionaries/{es,en}.json` | Modify | New `adminPages.waitlist` keys (both locales, same change) |
| `src/lib/types/dictionary.ts` | Modify | Extend the `waitlist` interface |

Unchanged: `src/app/api/admin/waitlist/[id]/route.ts` (bulk delete reuses it as-is).

## Interfaces / Contracts

```ts
// src/lib/admin/waitlistMembership.ts
export async function findExistingUserEmails(
  emails: string[],
): Promise<Set<string>>; // prisma.user.findMany({ where: { email: { in: emails } }, select: { email: true } })
```

`GET /api/admin/waitlist` — response shape unchanged (`{ entries, total, page, limit }`); each entry gains `alreadyMember: boolean`.

`POST /api/admin/waitlist/[id]/invite-tripper` — new branch, mirroring the Users-route precedent:

```
400 { error: "Email already belongs to an existing user" }
```

New `adminPages.waitlist` dictionary keys: `selectAll`, `selectRow`, `alreadyMemberBadge`, `alreadyMemberHint`, `bulkActions.{inviteSelected,deleteSelected,inviteNothingToDo,inviteConfirmTitle,inviteConfirmBody,inviteSkippedNote,deleteConfirmTitle,deleteConfirmBody,cancel,confirm,partialFailure}`. Placeholder semantics — these differ per key and are **not** interchangeable:

| Key | Placeholder | Bound to |
| --- | --- | --- |
| `bulkActions.inviteSelected` | `{count}` | `selectedIds.size` (raw selection) |
| `bulkActions.deleteSelected` | `{count}` | `selectedIds.size` (raw selection) |
| `bulkActions.inviteConfirmBody` | `{count}` | `invitableSelectedIds.length` (effective) |
| `bulkActions.inviteSkippedNote` | `{skipped}` | `selectedIds.size - invitableSelectedIds.length`; rendered inside the invite confirm body only when > 0 |
| `bulkActions.inviteNothingToDo` | — | tooltip on the bulk-invite button when the selection is non-empty but fully `alreadyMember` |
| `bulkActions.deleteConfirmBody` | `{count}` | `selectedIds.size` (delete never filters) |
| `bulkActions.partialFailure` | `{success}` / `{failed}` / `{total}` | fan-out length, **not** selection size |
| `alreadyMemberHint` | — | tooltip on the disabled single-row invite button |

Client selection contract:

```ts
const allChecked = entries.length > 0 && entries.every((e) => selectedIds.has(e.id));
const someSelected = selectedIds.size > 0 && !allChecked;      // → selectAllRef.indeterminate
const invitableSelectedIds = entries
  .filter((e) => selectedIds.has(e.id) && !e.alreadyMember)
  .map((e) => e.id);                                            // invite fan-out only

const inviteDisabled = invitableSelectedIds.length === 0;       // covers empty selection too
const deleteDisabled = selectedIds.size === 0;
```

Bulk delete uses `Array.from(selectedIds)` — **no `alreadyMember` filter**. `{total}` in `partialFailure` is the fan-out length, not the selection size.

Checkbox contract (explicit, because it is the one place the initial interview was reversed):

```tsx
{/* header */}
<input type="checkbox" ref={selectAllRef} checked={allChecked}
       onChange={toggleSelectAll} aria-label={copy.selectAll} />
{/* per row — NO disabled prop, alreadyMember is not consulted here */}
<input type="checkbox" checked={selectedIds.has(entry.id)}
       onChange={() => toggleRow(entry.id)} aria-label={copy.selectRow} />
```

## Testing Strategy

| Layer | What to Test | Approach |
| --- | --- | --- |
| Unit | `findExistingUserEmails` batching + empty input | Vitest, `vi.mock("@/lib/prisma")` |
| Integration (route) | `400` guard; `alreadyMember` enrichment; exactly one `user.findMany` per page | Existing admin-route test pattern (mock `next-auth` + prisma, import route module) |
| Component | select-all/indeterminate, **row checkbox is enabled and toggleable on an `alreadyMember` row**, disabled single-row invite button on that same row, invite fan-out skips `alreadyMember` while **bulk delete includes it**, bulk-invite button disabled when the selection is entirely `alreadyMember`, **bulk invite fans out to rows with a live "Invited" chip (resend, not skipped)**, `allSettled` call count, partial-failure banner, selection cleared on page change | Vitest + happy-dom, mock `fetch`, one rejecting call for the partial case |

TDD slice order (RED → GREEN per unit): helper → invite-route guard → list-route enrichment → type + dictionary → client scaffold → client tests.

## Migration / Rollout

No migration required. No schema change, no feature flag — additive field plus a new `400` branch.

## Resolved Decisions

No open questions remain. All three forks raised during design were signed off by the product owner on 2026-08-07 and are recorded below as final. `sdd-tasks` should treat these as settled input and must not reopen them.

### 1. Row checkbox stays enabled on every row, including `alreadyMember` — FINAL

Selection and bulk **delete** work normally on every rendered row regardless of `alreadyMember`. Only the **invite fan-out** filters: `invitableSelectedIds` = selection minus `alreadyMember`, and the bulk-invite button disables when that derived set is empty.

Consequences, all intentional:

- `AdminWaitlistPageClient` renders **no** `disabled` prop on the header or per-row checkbox. `alreadyMember` is consulted only by the status chip, the single-row invite button, and `invitableSelectedIds`.
- The existing accept-triggered cleanup stays **untouched**: `grantTripperAndCleanup` (`src/lib/auth/tripperInviteTokens.ts:145`) keeps deleting the `WaitlistEntry` on invite acceptance, and the registration route keeps its own `waitlistEntry.deleteMany` (`src/app/api/auth/register/route.ts:92`). This matches the spec's Out of Scope item "Changes to `WaitlistEntry` cleanup-on-accept behavior".
- The admin now *additionally* gains a manual path: bulk-deleting stale "Already a member" rows. Automatic cleanup-on-accept and manual bulk delete coexist — they are independent, idempotent deletes of the same row type, so there is no conflict and no ordering requirement between them.

Rejected: disabling the checkbox for `alreadyMember` rows (the initial interview call). It would have blocked bulk delete on exactly the backlog this change exists to clear and contradicted the spec MUST "header checkbox MUST select/deselect all currently rendered rows".

### 2. Bulk invite resends to rows with a live "Invited" chip, no special-casing — FINAL

Bulk invite fans out to every `invitableSelectedIds` entry regardless of its `TripperInvite`-derived status. A row showing "Invited" or "Expired" is re-invited exactly as the single-row button already does (`issueTripperInvite` invalidates prior unconsumed invites, then issues a new one — `src/lib/auth/tripperInviteTokens.ts:17-27`). Rationale: bulk is a loop over the per-row action; divergent semantics between the two entry points would be the surprising behavior, not duplicate mail.

Consequences: **no** exclusion logic, **no** warning copy, and **no** extra dictionary key for already-invited rows in the bulk path. `inviteSkippedNote` covers `alreadyMember` only.

Rejected: excluding or warning on already-invited rows. It would fork bulk behavior away from the single-row action and add a second, differently-scoped "skipped" count to the confirm body.

### 3. Email case-sensitivity gap is an accepted, documented limitation — FINAL

`WaitlistEntry.email` is lowercased on insert (`src/app/api/waitlist/route.ts:24`) while `User.email` is stored as typed (`src/app/api/auth/register/route.ts`). `findExistingUserEmails` therefore uses an **exact** `where: { email: { in: emails } }` match and will report `alreadyMember: false` for someone who registered as `Alice@Example.com`. This is not fixed in this change — no normalization, no `mode: "insensitive"`.

Rationale: every email-matching path in the app has this identical limitation today, so exact match is the consistent choice and fixing it here would leave the codebase half-normalized:

| Existing call site | Match |
| --- | --- |
| `getTripperInviteStatuses` (`tripperInviteTokens.ts:90`) | exact `email: { in: emails }` |
| `resolveOAuthInviteGrant` (`tripperInviteTokens.ts:115`) | exact `===` |
| `grantTripperAndCleanup` (`tripperInviteTokens.ts:145`) | exact `deleteMany({ where: { email } })` |
| Registration waitlist cleanup (`register/route.ts:92`) | exact `deleteMany({ where: { email } })` |

Blast radius if it bites: an admin sees an invitable row for a user who already has an account, sends an invite, and the invite is issued. The server guard misses it for the same reason the flag does. No data corruption — a redundant email, and acceptance is a no-op grant on an existing account.

Follow-up (out of scope here): normalize `User.email` to lowercase at write time across registration and OAuth, then backfill, and every table above becomes correct at once. Case-insensitive matching in this one helper alone (`OR: emails.map(e => ({ email: { equals: e, mode: "insensitive" } }))`) is explicitly rejected — one query still, but it drops the unique btree index and fixes only one of five call sites.
