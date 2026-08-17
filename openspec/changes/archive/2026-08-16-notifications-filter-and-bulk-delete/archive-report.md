# Archive Report: Notifications Filter, Pagination and Bulk Delete

**Status**: Fully archived and merged to main specs  
**Date**: 2026-08-16  
**Change Name**: `notifications-filter-and-bulk-delete`  
**Artifact Store Mode**: hybrid (openspec + engram)

## What Shipped

Complete feature implementation bringing notifications to feature parity with existing list surfaces (experiences and blog). All 42 tasks marked complete.

### Feature Summary

- **Read-status filtering** (All / Unread / Read) via `SELECT` dropdown, scoped by Prisma `isRead` index
- **Server-side pagination** accepting `page`, `limit`, `status` parameters with result count
- **Current-page bulk selection** with tri-state select-all checkbox
- **Per-id ownership-scoped deletion** via new `DELETE /api/notifications/[id]` endpoint
- **Global mark-all-read** via new `PATCH /api/notifications/read-all` endpoint, reaches rows beyond the loaded page
- **Unread-dot freshness** via shared pub/sub bus (`src/lib/notifications/unreadDotBus.ts`), reflecting mutations without remount
- **Dead-code cleanup**: removed unused `NotificationsPanel`, `NotificationsList`, `NotificationItem` (157 lines)
- **Dual-locale copy**: all user-visible strings localized in both `es` and `en` dictionaries (15 new keys)

### Why This Mattered

Notifications were the only list surface in the dashboard with no affordances for filtering, selection, or deletion — inconsistent with experiences and blog implementations and creating a poor UX for users managing accumulated notifications. The feature leverages the existing shared-component architecture (`RoleNotificationsPageClient`) to apply the full pattern uniformly across traveler, tripper, and admin roles with zero per-role logic forks.

## Specs Merged

### 1. Dashboard Shell (`openspec/specs/dashboard-shell/spec.md`)

**Modified Requirement**: Admin Notifications Tab

Added new scenario **"Unread dot refreshes after a mutation without a remount"** to strengthen the existing requirements. The dot now MUST reflect:
- Mark-read mutations on individual notifications
- Global mark-all-read across unread rows beyond the current page  
- Bulk-delete operations
- All without shell remount or navigation

This closes a pre-existing bug (the dot only updated on mount) and bundles it with the feature.

**Changes**: +10 lines (scenario added to end of requirement)

### 2. Notifications Management (`openspec/specs/notifications-management/spec.md`) — **NEW**

Complete specification for the notifications list contract. Created as a new top-level capability spec at `openspec/specs/notifications-management/spec.md` following the pattern of existing capability specs (`auth-verification`, `site-access-gate`, etc.).

**Contents**:
- **5 Requirements** covering click-to-mark-read semantics, paginated/filtered list, per-id deletion with ownership scoping, bulk delete UI, and global mark-all-read
- **9 Scenarios** detailing how each requirement is verified (selection clears on filter change, cross-user delete is rejected, partial-failure handling, etc.)
- **7 Explicit non-goals** clarifying scope boundaries (no search box, no cross-page select-all, no schema changes, etc.)

**Location**: `openspec/specs/notifications-management/spec.md` (177 lines)

## Delta Specs Retained

Both delta spec files remain in the change folder as-is for audit trail:
- `openspec/changes/notifications-filter-and-bulk-delete/specs/dashboard-shell/spec.md`
- `openspec/changes/notifications-filter-and-bulk-delete/specs/notifications-management/spec.md`

These document the original deltas and decisions made during the change.

## Verification

All 42 tasks completed:
- **Phase A** (shared query module + API routes + tests): 10/10 ✅
- **Phase B1** (client data layer): 10/10 ✅
- **Phase B2** (bulk delete UI): 11/11 ✅
- **Phase C** (unread-dot freshness + dead-code removal): 7/7 ✅
- **Phase D** (cross-cutting verification): 4/4 ✅

Strict TDD mode active throughout — all RED/GREEN test pairs executed, with high coverage on:
- Status filter query behavior (unread → `isRead:false`, read → `isRead:true`, all → no `isRead`)
- Ownership scoping on `DELETE` (404 when row belongs to another user)
- Global `read-all` reach beyond page 1 (verified via test without id constraint)
- Selection clearing on filter and page change
- Partial-failure tally in bulk-delete banner
- Checkbox click preventing mark-read via `stopPropagation`
- Unread dot refresh via bus subscription

## Artifact Contents

| Artifact | Location | Status |
|---|---|---|
| **proposal.md** | `openspec/changes/notifications-filter-and-bulk-delete/proposal.md` | ✅ Intent, scope, decisions, risks, rollback plan |
| **design.md** | `openspec/changes/notifications-filter-and-bulk-delete/design.md` | ✅ Technical approach, architecture decisions, interfaces, file changes, testing strategy |
| **tasks.md** | `openspec/changes/notifications-filter-and-bulk-delete/tasks.md` | ✅ All 42 tasks marked complete, phases A–D executed |
| **delta: dashboard-shell** | `openspec/changes/notifications-filter-and-bulk-delete/specs/dashboard-shell/spec.md` | ✅ Merged into main spec |
| **delta: notifications-management** | `openspec/changes/notifications-filter-and-bulk-delete/specs/notifications-management/spec.md` | ✅ Copied to main spec (new capability) |

## Files Changed (Summary)

### Main Specs Updated
- `openspec/specs/dashboard-shell/spec.md` — +10 lines (scenario added)
- `openspec/specs/notifications-management/spec.md` — **NEW**, 177 lines

### Implementation Files (per design)
- `src/lib/notifications/list-query.ts` — **NEW** (shared query module)
- `src/lib/notifications/unreadDotBus.ts` — **NEW** (pub/sub bus)
- `src/app/api/notifications/route.ts` — Modified (pagination, filter, counts)
- `src/app/api/notifications/[id]/route.ts` — **NEW** (DELETE endpoint)
- `src/app/api/notifications/read-all/route.ts` — **NEW** (PATCH read-all)
- `src/components/app/dashboard/shared/RoleNotificationsPageClient.tsx` — Modified (rearchitecture: filter, selection, bulk delete, pagination)
- `src/app/[locale]/(secure)/dashboard/{admin,traveler,tripper}/notifications/page.tsx` — Modified (adapt to new data contract)
- `AdminNotificationsPageClient.tsx`, `NotificationsPageClient.tsx`, `TravelerNotificationsPageClient.tsx` — Modified (props only)
- `src/components/app/dashboard/shell/DashboardUnreadDot.tsx` — Modified (bus subscription + refresh)
- `src/lib/types/dictionary.ts` — Modified (NotificationsDict extended)
- `src/dictionaries/{es,en}.json` — Modified (15 new keys × 2 locales)
- `src/components/app/notifications/{NotificationsPanel,NotificationsList,NotificationItem}.tsx` — **REMOVED** (dead code, 157 lines)

### Tests Added (strict TDD)
- `src/lib/notifications/__tests__/list-query.test.ts` — **NEW**
- `src/lib/notifications/__tests__/unreadDotBus.test.ts` — **NEW**
- `src/app/api/notifications/__tests__/route.test.ts` — **NEW**
- `src/app/api/notifications/[id]/__tests__/route.test.ts` — **NEW**
- `src/app/api/notifications/read-all/__tests__/route.test.ts` — **NEW**
- `src/components/app/dashboard/shared/__tests__/RoleNotificationsPageClient.test.tsx` — **NEW**

**Total Estimated Impact**: ~1,600–1,750 changed lines (proposal estimate: 950–1,150; revision corrected for test boilerplate and actual component rearchitecture)

**PR Strategy**: Chained PRs across 4 slices (Slice A: API layer, Slice B1: client data, Slice B2: bulk delete UI, Slice C: freshness + cleanup) to respect 400-line review budget.

## Rollback and Reversibility

- **Code-only change**: No schema modifications, no migrations. A straight `git revert` restores prior behavior exactly.
- **New routes are additive**: `DELETE /api/notifications/[id]` and `PATCH /api/notifications/read-all` are unreachable until client ships; can be removed independently if needed.
- **Deleted notifications are irreversible**: If delete logic misbehaves in production, revert the client first (removing the affordance), then investigate the endpoint. The rows are already gone from the database.
- **Git history available**: Dead-code deletion can be recovered from commit history if removal proves wrong.

## SDD Cycle Complete

This change has been:
1. ✅ **Proposed** — intent, scope, decisions, risks documented
2. ✅ **Specified** — 2 capability specs (1 modified, 1 new) with scenarios and non-goals
3. ✅ **Designed** — technical approach, interfaces, architecture decisions, data flow
4. ✅ **Tasked** — 42 detailed tasks spanning 4 phases with strict TDD coverage
5. ✅ **Applied** — all tasks completed, tests passing, implementation verified
6. ✅ **Verified** — no CRITICAL issues, all requirements met
7. ✅ **Archived** — specs merged to main, delta specs retained, change ready for production

**Next**: The change folder may now be moved to `openspec/changes/archive/2026-08-16-notifications-filter-and-bulk-delete/` (operator task — no shell access to move in this executor context).
