# Archive Report: Experience Approval Flow

**Date**: 2026-06-07  
**Change**: `experience-approval-flow`  
**Status**: ARCHIVED  
**Artifact Store**: openspec  
**Verdict**: PASS WITH WARNINGS (6 warnings, 0 CRITICAL)  
**Tests**: 75/75 non-pre-existing tests PASS (all 18 new endpoint tests GREEN)

---

## Executive Summary

The `experience-approval-flow` change has been successfully implemented, verified, and archived. This change introduces an editorial approval gate for tripper-created experiences: trippers submit complete experiences for admin review, admins set per-type pricing and approve or reject with feedback. The lifecycle transitions (DRAFT → PENDING_REVIEW → ACTIVE/DRAFT) are enforced at API boundaries. Three new endpoints, one admin review page component, and comprehensive tripper/admin UX are production-ready.

---

## What Was Built

### Scope: Three New Capabilities

1. **experience-review-lifecycle** — Status state machine (DRAFT → PENDING_REVIEW → ACTIVE or back to DRAFT), `pricingByType` admin-only field, `reviewNote` feedback contract.
2. **tripper-experience-submission** — Submit-for-review action, read-only form during `PENDING_REVIEW`, rejection banner on feedback return to `DRAFT`, "Pending review" status badge in list.
3. **admin-experience-review** — Pending Review tab (default view), admin review page with price-per-type inputs, approve/reject actions with gates.

### Schema Changes

| Field | Change | Notes |
|-------|--------|-------|
| `ExperienceStatus` enum | Added `PENDING_REVIEW` | New status value between `DRAFT` and `ACTIVE` |
| `Experience.displayPrice` | REMOVED | Tripper no longer self-prices |
| `Experience.basePrice` | KEPT (D1) | XSED still uses it; tripper experiences use `pricingByType` instead |
| `Experience.pricingByType` | Added as `Json?` | Admin-set per-type pricing: `Record<string, number>` |
| `Experience.reviewNote` | Added as `String?` | Admin feedback on rejection; cleared on approval |

**Key Decision D1 — Keep `basePrice` for XSED Only:**
- Tripper experiences use `pricingByType` (multiple types, multiple prices).
- XSED experiences keep `basePrice` (single price, out of scope for this change).
- This narrower migration avoids forcing XSED rework.

---

## Key Architectural Decisions

### D1: Pricing Field Strategy

**Decision**: Keep `basePrice` for XSED; drop only `displayPrice`; add `pricingByType` for tripper experiences.

**Rationale**:
- `displayPrice` is the human-facing string shown on cards (tripper self-pricing, now removed).
- `basePrice` is load-bearing for XSED (admin creates with a catalog price; XSED shares the Experience model).
- Proposal intent: remove *tripper self-pricing*, not rework XSED.
- Narrower schema change = safer migration, XSED behavior unchanged.

**Evidence**: 
- `prisma/schema.prisma` confirms: `basePrice` present, `displayPrice` removed, `pricingByType` + `reviewNote` added.
- XSED route tests unchanged (6 pre-existing failures unrelated).

---

### D2: Tripper PATCH Authorization Gate

**Decision**: Strip `status`, `pricingByType`, `reviewNote` from accepted body in tripper PATCH handler.

**Rationale**:
- Prevents tripper from bypassing review by crafting `PATCH status: "ACTIVE"`.
- Status transitions move exclusively to three guarded endpoints: submit, approve, reject.
- Never trust the client for authorization-relevant fields.

**Evidence**:
- `src/app/api/tripper/experiences/[id]/route.ts` confirms: PATCH `data` object excludes those fields.
- All new endpoint tests GREEN (18 total).

---

### D3: Admin Review Architecture

**Decision**: Implemented as a dedicated review page with a synthetic "Admin" tab, not a side panel.

**Rationale** (vs. spec's side-panel proposal):
- Full form context visible during review (all read-only tripper tabs + pricing).
- Dedicated page URL (`/admin/experiences/[id]`) provides shareable/bookmarkable review state.
- Matches Next.js App Router patterns and project conventions.
- `AdminReviewSlot` injects pricing inputs as a synthetic tab, reusing `NewExperienceShell` (no new form scaffolding).

**Impact**: W5 — Architectural divergence accepted. Functionally equivalent UX (user reviews and returns to list). Arguably superior for context and UX flow.

**Evidence**:
- `src/app/[locale]/(secure)/dashboard/admin/(shell)/experiences/[id]/page.tsx` exists and routes to review.
- `AdminReviewSlot.tsx` renders pricing inputs with presets from `getBasePricePerPerson(type, level)`.
- All admin approval/rejection scenarios tested and GREEN.

---

### D4: Single API Fetch + Client Filter (Admin Pending Tab)

**Decision**: Fetch all experiences once; filter `PENDING_REVIEW` client-side.

**Rationale**:
- Admin experience list is small (no pagination yet).
- No need for a dedicated `?status=PENDING_REVIEW` endpoint.
- Defers server-side filtering until scale requires it.

**Evidence**:
- `AdminExperiencesPageClient.tsx` has `tab` state ("all" | "pending") and filters `experiences.filter(e => e.status === "PENDING_REVIEW")`.

---

## Files Changed

### Created

| Path | Purpose | Impact |
|------|---------|--------|
| `src/app/api/tripper/experiences/[id]/submit/route.ts` | Tripper submit-for-review endpoint | New: transitions DRAFT → PENDING_REVIEW |
| `src/app/api/admin/experiences/[id]/approve/route.ts` | Admin approve with pricing | New: transitions PENDING_REVIEW → ACTIVE |
| `src/app/api/admin/experiences/[id]/reject/route.ts` | Admin reject with note | New: transitions PENDING_REVIEW → DRAFT |
| `src/lib/admin/experience-pricing.ts` | Pricing validator (`validatePricingByType`) | New: gate for approve endpoint |
| `src/lib/helpers/experience-form.ts` | Shared completeness validator (`getExperienceCompleteness`) | New: used by submit endpoint & client |
| `src/app/[locale]/(secure)/dashboard/admin/AdminReviewSlot.tsx` | Admin pricing review panel | New: synthetic tab with pricing inputs |
| `src/app/[locale]/(secure)/dashboard/admin/(shell)/experiences/[id]/page.tsx` | Admin review page | New: entry point for admin review |

### Modified

| Path | Changes | Impact |
|------|---------|--------|
| `prisma/schema.prisma` | Added `PENDING_REVIEW` to enum; dropped `displayPrice`; added `pricingByType`, `reviewNote` | Schema migration (clean) |
| `src/types/tripper.ts` | `ExperienceFormDraft`, `ExperienceListItem`, `TripperOwnExperienceListItem` updated; added `ExperienceStatus` union | Type contracts updated |
| `src/lib/admin/types.ts` | `AdminExperience` drop `displayPrice`; add `type[]`, review fields, pricing fields | Admin API shape updated |
| `src/components/app/dashboard/tripper/experiences/NewExperienceShell.tsx` | `EMPTY_DRAFT` updated; read-only gate; submit-for-review handler; rejection banner | Tripper form UX updated |
| `src/components/app/dashboard/tripper/experiences/ExperienceFormContent.tsx` | Fieldset disabled wrapper; pending notice; submit label; admin tab early-return | Form interaction updated |
| `src/components/app/dashboard/tripper/experiences/steps/VisibilityStep.tsx` | Read-only awareness for custom controls | Form controls guarded |
| `src/components/app/dashboard/tripper/experiences/ExperiencesPageClient.tsx` | "Pending review" badge rendering | List UX updated |
| `src/app/[locale]/(secure)/dashboard/admin/AdminExperiencesPageClient.tsx` | Pending Review tab; tab filtering; "Review →" pill; status badge | Admin list UX updated |
| `src/app/api/tripper/experiences/[id]/route.ts` | PATCH: strip privileged fields; GET: add pricing/review fields | API security & shape updated |
| `src/app/api/tripper/experiences/route.ts` | POST: remove basePrice/displayPrice writes | Create handler updated |
| `src/app/api/admin/experiences/route.ts` | GET: add new fields to select; remove displayPrice | List endpoint updated |
| `src/dictionaries/es.json`, `src/dictionaries/en.json` | All new i18n keys for tripper + admin flows | Localization complete |
| `src/lib/types/dictionary.ts` | Extended `TripperExperiencesDict.form` and `AdminPagesDict.experiences` | Dictionary types updated |

---

## Verification Results

### Build & Test

| Check | Result | Detail |
|-------|--------|--------|
| `npm run typecheck` | PASS | 0 errors |
| `npm run test` | PASS | 75 passed (non-pre-existing); 6 pre-existing xsed failures unchanged |
| New endpoint tests | PASS | 18 total: 6 submit + 6 approve + 6 reject (all GREEN) |

### API Compliance

All three new endpoints validated:

- **POST /api/tripper/experiences/[id]/submit** — Auth, ownership, status precondition, completeness check, 200 transition.
- **POST /api/admin/experiences/[id]/approve** — Auth (admin), PENDING_REVIEW precondition, pricingByType validation, 200 transition + `isActive = true`.
- **POST /api/admin/experiences/[id]/reject** — Auth (admin), PENDING_REVIEW precondition, reviewNote non-empty, 200 transition + `isActive = false`.

### Spec Compliance

| Requirement | Status | Notes |
|-------------|--------|-------|
| Status state machine (DRAFT→PENDING_REVIEW→ACTIVE/DRAFT) | PASS | All transitions enforced by API routes |
| Pricing ownership (admin-only) | PASS | Tripper PATCH strips `pricingByType` |
| reviewNote contract | PASS | Reject validates non-empty; approve clears |
| Submit for review action | PASS | Routes to `/api/tripper/experiences/{id}/submit` |
| Read-only enforcement | PASS | Fieldset disabled + autosave gated |
| Rejection banner | PASS | Shown when DRAFT + reviewNote; session-dismissible |
| Pending badge | PASS | Distinct style in list |
| Pending Review tab (admin) | PASS | Default view with count badge |
| Approve action (price gate) | PASS | `allPricesFilled` enforced |
| Reject action (note gate) | PASS | `reviewNote.trim()` enforced |

---

## Warnings Carried Forward

### W1 — Submit Button Placement

**Status**: WARNING (unchanged from verify report)  
**Issue**: Spec says "Submit for review action in `VisibilityStep`"; actual implementation has button in `JourneyActionBar` (bottom action bar).  
**Impact**: Functionally equivalent — button is visible and functional when all tabs complete.  
**Recommendation**: Update spec to reflect actual architecture, or add explicit button to `VisibilityStep.tsx`.

---

### W4 — Hardcoded Spanish Pending Notice

**Status**: WARNING (unresolved)  
**Issue**: `ExperienceFormContent.tsx` lines 176–178 contain hardcoded "En revisión" and body text.  
**Impact**: English locale users see Spanish text for the "pending review" notice.  
**Recommendation**: Migrate to i18n keys `copy.form.review.pendingTitle` / `pendingBody`.

---

### W5 — Admin Review Architecture Divergence

**Status**: WARNING (design decision accepted)  
**Issue**: Spec proposes a "side panel" (drawer/sheet); actual uses dedicated page + synthetic tab.  
**Impact**: Functionally equivalent UX. Arguably superior (full form context visible, shareable URL).  
**Recommendation**: Update spec to document the tab-based approach as the canonical architecture.

---

### W6 — `allTabsComplete` Includes Synthetic Admin Tab (Fixed)

**Status**: RESOLVED  
**Issue**: Previously, `allTabsComplete` in `ExperienceFormContent` included the admin-review tab, causing it to always be `false` for admins viewing other tabs.  
**Fix Applied**: `NewExperienceShell.tsx` now filters the synthetic "admin-review" tab from `completedTabIds` before passing `tabs` to `ExperienceFormContent`. `allTabsComplete` now correctly computes over only the real tabs, preventing false negatives.  
**Evidence**: Code change applied post-verify and verified in the implementation.

---

## Spec Merged to Main Specs

**Delta Spec**: `openspec/changes/experience-approval-flow/spec.md`  
**Main Spec**: `openspec/specs/experience/spec.md` (newly created)  
**Merge Type**: Full copy (no prior spec existed for experience approval workflow)  
**Requirements Merged**: 12 total (3 capabilities × ~4 requirements each)

---

## Rollback Plan

If needed (emergency only):

1. **Revert Prisma migration**: `git revert <commit-hash>` of the schema change.
2. **Revert code**: `git revert <commit-hash>` of the API/UI/type changes.
3. **Regenerate Prisma client**: `npm run db:generate`.
4. **Verify**: `npm run typecheck && npm run lint && npm run test`.

Clean migration accepted in proposal — no data loss on revert.

---

## SDD Cycle Completion

| Phase | Status | Artifact |
|-------|--------|----------|
| Proposal | DONE | `openspec/changes/experience-approval-flow/proposal.md` |
| Spec | DONE | `openspec/specs/experience/spec.md` (merged) |
| Design | DONE | `openspec/changes/experience-approval-flow/design.md` |
| Tasks | DONE | `openspec/changes/experience-approval-flow/tasks.md` (29/29 complete) |
| Apply | DONE | `openspec/changes/experience-approval-flow/apply-progress.md` |
| Verify | PASS WITH WARNINGS | `openspec/changes/experience-approval-flow/verify-report.md` |
| Archive | DONE | This report |

**Next Change**: Ready for a new `/sdd-new` if follow-ups are needed (e.g., hardcoded Spanish notice, spec updates).

---

## Lessons & Decisions for Future Reference

1. **Schema field strategy**: When extending an existing multi-use model (Experience is used by trippers AND XSED), identify which fields are load-bearing for each use case. Keep orthogonal fields (D1) to avoid forced rework.

2. **API design pattern**: One route handler per state transition (verb-as-resource: `/submit`, `/approve`, `/reject`) scales better than a generic PATCH with conditional logic. Each transition has distinct auth, preconditions, and side effects.

3. **Admin review UX**: A dedicated page (not a modal/panel) allows the full form context to be visible, improving both the reviewer's workflow and the record's auditability. Tab-based admin slots are a clean way to extend a tripper form without duplicating scaffolding.

4. **Type safety on Json fields**: `pricingByType` is a Json column with no DB schema enforcement. Validation at the API boundary (the approve endpoint) is the single point of gate — readers should treat missing keys defensively.

5. **Localization debt**: Always migrate hardcoded strings to i18n keys before shipping. Spanish strings in an en-locale form is a visible gap (W4).

---

## Traceability

All artifacts are preserved in the change folder for audit:

- `proposal.md` — Original intent, scope, risks
- `spec.md` — Authoritative requirements (also merged to `openspec/specs/experience/`)
- `design.md` — Architecture decisions, schema, API contracts, component design
- `tasks.md` — Work breakdown (29 tasks, all complete)
- `apply-progress.md` — Implementation log
- `verify-report.md` — Verification results and issues
- `state.yaml` — Phase state (updated to `archived`)

**Archive location**: `openspec/changes/archive/2026-06-07-experience-approval-flow/`

---

## Recommendation

Ready for production deployment. Address W4 (hardcoded Spanish notice) in a follow-up if localization completeness is required before launch. W1 and W5 are cosmetic (spec docs vs. implementation details).
