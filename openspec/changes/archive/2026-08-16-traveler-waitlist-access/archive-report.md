# Archive Report: traveler-waitlist-access

**Completed:** 2026-08-16  
**All 54 tasks complete** ✓

## Executive Summary

Shipped the invited-only site access gate: generalized `TripperInvite` into kinded `AccessInvite` (TRIPPER | SITE_ACCESS), added `User.siteAccessGrantedAt` grant signal, unified accept flows for both kinds, dropped the existing-user guard on waitlist invites, and updated the gate pass condition to `GATE_ALLOWED_ROLES || hasSiteAccess`. All SDD specs merged, no regressions in testing or manual QA.

## What Shipped

### Schema Changes
- `User.siteAccessGrantedAt DateTime?` — gate signal, set on invite accept and companion claim
- `AccessInvite` model (renamed from `TripperInvite`, table `tripper_invites` → `access_invites`)
- `AccessInviteKind` enum: `TRIPPER | SITE_ACCESS` (default `TRIPPER`)
- Idempotent two-phase migration: SQL script (`npm run db:rename-access-invites`) → `npm run db:push`

### Core Functionality
- **Token module generalization** — `accessInviteTokens.ts` (renamed from `tripperInviteTokens.ts`) with kinded issue/peek/consume, `stampSiteAccess`, `grantAccessAndCleanup(userId, email, kind)`
- **Session** — `session.user.hasSiteAccess` boolean derived from `User.siteAccessGrantedAt IS NOT NULL` (zero extra queries)
- **OAuth grant split** — `signIn()` branches on `kind: TRIPPER` to append role+`tripperSince`; both kinds stamp site access
- **Accept flows (existing + new user)** — kind-aware: `SITE_ACCESS` grants only access; `TRIPPER` grants both access and role
- **Waitlist endpoint renamed & unlocked** — `POST /api/admin/waitlist/[id]/invite` (was `/invite-tripper`), issues `SITE_ACCESS`, no existing-user 400 guard
- **Gate component revalidation** — `GateAwareChrome` derives `sessionGrantsAccess`, clears stale localStorage unlock when authenticated without a grant, guarded on `status !== "loading"` (prevents page-load clearing)
- **Email templates kind-aware** — `SITE_ACCESS` invites do not claim a Tripper role
- **Admin UI copy updates** — Waitlist "Invite as Tripper" → "Invite as Traveler"; removed `alreadyMember`-based row disabling, invitable filter, and skipped note; kept the status chip
- **Dictionaries** — New `tripperInviteAccept.siteAccess` block; renamed/removed keys; added `loginAction` label for gate CTA
- **Travelers/submit stamp** — Companion claim now grants site access via `stampSiteAccess()`

### Verification
- **Automated**: 178 test files, 1317 tests, all passing (RED/GREEN phases complete, no regressions)
- **Type safety**: `npm run typecheck` passes; no remaining references to old symbol names
- **Manual QA**: Full path tested (invited waitlister → register → verify email → log in → gate passes); grant-less `TRAVELER` still sees gate; admin/tripper without grant still pass

## Spec Merges

### 1. New Capability: `site-access-gate` (Full Spec)
**Merged into:** New spec file `openspec/specs/site-access-gate/spec.md` (delta location; not merged into existing main spec)

**Content:** Complete specification for the site-access grant signal (`User.siteAccessGrantedAt`), grant scenarios (invite accept + companion claim), gate pass condition, localStorage revalidation rule, and API contracts. Covers the three-state `useSession()` status handling to prevent page-load clearing.

### 2. Modified Capability: `tripper` (Tripper OS)
**Merged into:** `openspec/specs/03-tripper-os.md` (lines 123–188)

**New sections added:**
- **Feature: Invited-Only Site Access** — highlights the `TripperInvite` → `AccessInvite` generalization, data model changes, and new grant signal
- **Admin Trigger Endpoints** — documents the two endpoints: waitlist (issues `SITE_ACCESS`, no guard) and users table (issues `TRIPPER`, existing 400 guard unchanged)
- **Accept Flow — Existing User** — `kind`-aware behavior: `SITE_ACCESS` sets only `siteAccessGrantedAt`; `TRIPPER` adds role
- **Accept Flow — New User** — kind-aware role defaults (`[TRAVELER]` for `SITE_ACCESS`, `[TRAVELER, TRIPPER]` for `TRIPPER`)
- **Schema Delivery Sequencing** — two-phase migration sequence, prohibition on `--accept-data-loss`, and ordering constraints
- **Admin Waitlist Invite Availability** — removal of client-side `alreadyMember`-based filtering (explicitly supersedes the invite-filter half of `waitlist-bulk-actions`'s Resolved Decision #1)
- **Accept Page Copy Selection** — kind-aware copy override logic for both accept branches

**No conflicts:** No prior `AccessInvite` or `siteAccessGrantedAt` content existed. The new sections slot before the existing "Next Steps" and are fully additive.

### 3. Admin Dashboard: No New Merge Needed
**File:** `openspec/specs/04-admin.md`

**Finding:** Already contains the merged content (verified via git diff):
- Line 22: Waitlist tab updated with "Invite as Traveler" and `SITE_ACCESS` language
- Line 22: `POST /api/admin/waitlist/[id]/invite` endpoint documented
- Line 24: Features tab with both `gateEnabled` and `xsedWindowEnforcementEnabled` flags
- No duplicate additions required.

### 4. XSED Spec: No New Merge Needed
**File:** `openspec/specs/06-xsed.md`

**Finding:** Already contains the merged content:
- Line 19: `SiteSetting.xsedWindowEnforcementEnabled` flag documented
- Line 26: Features tab toggle ("XSED window validation") referenced
- No duplicate additions required.

## Merge Decisions & Notes

1. **03-tripper-os.md placement:** New feature section inserted before "Next Steps" to maintain spec structure. Sections are in logical order (data model → endpoints → accept flows → schema delivery → admin gating → copy selection).

2. **No duplication:** 04-admin.md and 06-xsed.md had already received their deltas during the apply phase (visible in working tree as uncommitted changes). Confirmed content matches expectations; no additional merging needed.

3. **site-access-gate as separate capability:** The new `site-access-gate` spec exists in the delta folder (`specs/site-access-gate/spec.md`) and is NOT merged into an existing main spec because `site-access-gate` is a new, standalone capability with no prior spec. It documents the gate pass condition, revalidation rule, and API contracts (the "why" and "what"), while `tripper` spec documents the invite flow mechanisms (the "how"). Both are intentionally separate.

## Artifacts

- **Proposal:** `openspec/changes/traveler-waitlist-access/proposal.md` — 83 lines, scope/risk/success criteria
- **Design:** `openspec/changes/traveler-waitlist-access/design.md` — 705 lines, 11 ADRs, data flow, file changes, testing strategy, rollout order
- **Tasks:** `openspec/changes/traveler-waitlist-access/tasks.md` — 118 lines, 11 phases, all 54 items checked ✓
- **Spec (tripper delta):** `openspec/changes/traveler-waitlist-access/specs/tripper/spec.md` — 210 lines, merged into 03-tripper-os.md
- **Spec (site-access-gate new):** `openspec/changes/traveler-waitlist-access/specs/site-access-gate/spec.md` — 92 lines, standalone capability spec
- **Main specs updated:**
  - `openspec/specs/03-tripper-os.md` — 188 lines added, tripper delta merged
  - `openspec/specs/04-admin.md` — no new edits (already merged)
  - `openspec/specs/06-xsed.md` — no new edits (already merged)

## Rollback

Revert the code commits and run the inverse SQL from design ADR 1. Grants are additive — no user data is destroyed; affected users simply return to gate-blocked. The physical table rename is fully reversible.

## Observation IDs for Traceability

(Reference the full SDD artifacts via the change folder path and the topic keys recorded in Engram)

- Proposal: `sdd/traveler-waitlist-access/proposal`
- Design: `sdd/traveler-waitlist-access/design`
- Tasks: `sdd/traveler-waitlist-access/tasks`
- Verify report: `sdd/traveler-waitlist-access/verify-report`
- Archive report: `sdd/traveler-waitlist-access/archive-report`
