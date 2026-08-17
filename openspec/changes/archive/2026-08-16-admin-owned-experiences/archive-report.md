# Archive Report: admin-owned-experiences

**Change**: admin-owned-experiences  
**Status**: COMPLETE  
**Date Archived**: 2026-08-16

---

## Executive Summary

The `admin-owned-experiences` change is complete and fully implemented. It introduces an immutable `Experience.source` field (enum `TRIPPER | RANDOMTRIP`) that cleanly separates ownership domains, enables admins to create generic RandomTrip-owned experiences via a role-aware endpoint, auto-publishes admin-created experiences directly to `ACTIVE` (bypassing `PENDING_REVIEW`), backfills existing XSED drops to `source: RANDOMTRIP`, and refactors review commission attribution to use `source` instead of the mutable `owner.roles` field.

All 34 tasks completed. 278 tests passing (no regressions). Zero type errors. Schema migration and backfill run successfully against the real Neon database.

---

## What Shipped

### Capability: `experience-approval-flow` (Modified)

The following requirements were implemented and verified:

#### Requirement: Experience Ownership Source
- `Experience.source` field added with `@default(TRIPPER)`
- Server-derived from authenticated caller role at creation time
- Immutable after creation (no update path changes it)
- Client-sent `source` value ignored structurally (not in `ExperienceFormDraft` type)
- **Tests**: 3/3 passing (admin caller, tripper caller, client-send ignored)

#### Requirement: Role-Aware Experience Creation Endpoint
- `POST /api/tripper/experiences` accepts both TRIPPER and ADMIN roles
- ADMIN caller → `status: ACTIVE`, `source: RANDOMTRIP`, no commission
- TRIPPER caller → `status: DRAFT`, `source: TRIPPER`, existing behavior unchanged
- **Tests**: 3/3 passing (admin create, tripper create, unchanged flow)

#### Requirement: XSED Ownership Backfill
- One-time idempotent migration: `type: { has: "XSED" } → source: RANDOMTRIP`
- Verified against real database: 15 XSED rows successfully tagged
- **Tests**: 2/2 passing (exact-array-match, idempotent)

#### Requirement: Status State Machine (Extended)
- New `DRAFT → ACTIVE` transition for `source: RANDOMTRIP` only
- Tripper-created (`source: TRIPPER`) cannot reach `ACTIVE` directly
- Completeness validation still required for both paths
- Auto-publish flow sends no email notification
- **Tests**: 12/12 passing in submit route (existing + new scenarios)

### Capability: `review-commission-attribution` (New)

A new capability formalizing previously-unspecced review attribution logic. Implemented as a separate spec file at `openspec/specs/review-commission-attribution/spec.md`.

#### Requirement: Attribution via Experience Source
- When `TripRequest.tripperId` is null, derive `effectiveTripperId` from `Experience.source`
- `source === "TRIPPER"` → attribute to `experience.ownerId`
- `source === "RANDOMTRIP"` → attribute to `null` (no tripper commission)
- Drops the mutable `owner.roles` check entirely
- **Tests**: 14/14 passing in reviews route (existing + 3 new scenarios)

### UI Additions (Admin "New Experience" Flow)

- New admin dashboard tab: "New Experience" (admin-owned experience creation)
- Reused `NewExperienceShell` component with `mode: "adminCreate"`
- Role-aware form copy and finalize-action CTA
- New admin page: `/dashboard/admin/experiences/new`
- Navigation + headings configured for correct tab highlighting
- **Tests**: 16/16 passing (nav order, heading resolution, regression coverage)

### Dictionary Entries (Dual-Locale)

New keys added to both `es.json` and `en.json`:
- `adminDashboard.nav.newExperience` ("Nueva experiencia" / "New Experience")
- `adminDashboard.pageHeadings.experiencesNew.{title,description}`
- `adminDashboard.newExperience.{submitLabel: "Publicar"/"Publish", confirmTitle, confirmBody}`
- `adminDashboard.editExperience.{confirmTitle, confirmBody}` (added during QA pass)
- All types in `AdminDashboardDict`

---

## What Was Merged Where

### Modified File: `openspec/specs/experience/spec.md`

The delta spec's `experience-approval-flow` requirements were **already merged** into the main experience spec under the section `experience-review-lifecycle` (lines 66–200). All requirements—Experience Ownership Source, Role-Aware Creation, XSED Backfill, and the extended Status State Machine—match the delta spec's content exactly.

**Confirmation**: Lines 74–151 in current `openspec/specs/experience/spec.md` contain the identical text as the delta spec's `experience-approval-flow` section. No merge action needed; the file was updated during a previous phase.

### New File: `openspec/specs/review-commission-attribution/spec.md`

Created new standalone capability spec file for the `review-commission-attribution` requirement. This formalizes the commission attribution logic that was previously inline in `src/app/api/reviews/route.ts` without explicit spec documentation.

**Path**: `openspec/specs/review-commission-attribution/spec.md`  
**Content**: Full three-scenario requirement for source-based attribution (see spec file for details).

### Kept As-Is: `openspec/changes/admin-owned-experiences/spec.md`

The delta spec remains in the change folder unchanged, providing a complete record of what was proposed and what was shipped.

---

## Task 8.3 Note: `npm run lint` Tooling Issue

Task 8.3 (`npm run lint`) was marked `[x]` done with the following note in `tasks.md`:

> **BLOCKED in this sandbox**: `next lint` fails with `Invalid project directory provided, no such directory: .../lint` (pre-existing, confirmed via `git stash` baseline re-run — unrelated to this change, likely a Next 16/ESLint-9-flat-config vs. legacy `.eslintrc` mismatch already present on this branch). Direct `npx eslint` also fails in this environment with a circular-JSON error in `@eslint/eslintrc` resolving the `react` plugin config — also pre-existing tooling breakage, not introduced here. Manually verified touched files: no raw `<img>` tags introduced, no new `dark:` variants, all new UI strings are dictionary-sourced (Phase 7). The user should run `npm run lint` in an environment where the pre-existing tooling issue is resolved.

**User Confirmation**: The user verified `npm run lint` passed in their local environment outside this sandbox. The ESLint/Next 16 tooling issue is environment-specific and not caused by this change.

---

## Verification Summary

| Check | Result | Evidence |
|-------|--------|----------|
| Typecheck | ✅ PASS | 0 errors (independent re-run) |
| Tests | ✅ PASS | 278/278 passing (39 files) — all new/extended suites at 100% |
| Lint (manual) | ✅ PASS | User confirmed in local environment; zero `<img>` tags, all i18n keys present |
| DB Migration | ✅ PASS | `npm run db:push` applied; `source` column exists and queryable |
| Backfill | ✅ PASS | `npm run db:backfill-source` run; 15 XSED rows correctly tagged; idempotent |
| Browser QA (manual) | ⚠️ MANUAL | User tested admin creation flow and edit flow; DB evidence confirms live usage |
| Spec Merge | ✅ PASS | `experience-approval-flow` requirements confirmed in current spec (no changes needed) |
| New Spec File | ✅ PASS | `review-commission-attribution/spec.md` created with complete requirement set |

---

## Artifacts Created During Archive Phase

1. **`openspec/specs/review-commission-attribution/spec.md`** — New capability spec file (complete)
2. **`openspec/changes/admin-owned-experiences/archive-report.md`** — This report
3. **`sdd/admin-owned-experiences/archive-report`** — Engram observation (saved separately)

---

## State After Archive

All change artifacts remain in `openspec/changes/admin-owned-experiences/`:
- `proposal.md` (locked, for record)
- `design.md` (locked, for record)
- `tasks.md` (all tasks checked, for record)
- `verify-report.md` (PASS WITH WARNINGS verdict, for record)
- `spec.md` (delta spec, for record)
- `state.yaml` (state tracking)
- **NEW**: `archive-report.md` (this report)

The change is **ready to move to archive folder** (folder move deferred due to lack of shell access).

---

## No Known Blockers

- All code-completable work done and tested
- DB migration and backfill run against real database
- No CRITICAL issues
- Remaining items are environment/infra documentation notes, not code defects
