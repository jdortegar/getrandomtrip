# Design: Experience Approval Flow

## Approach

This change adds an editorial gate to the experience lifecycle without introducing a new
service layer. It stays inside the existing architecture: thin App Router route handlers per
action, Prisma as the single source of truth for status, and client components that read a
status field to switch UX modes. No state machine library, no workflow engine — the
lifecycle is three enum values and three guarded transitions, each enforced at its own API
boundary.

Three architectural decisions drive the rest of the design:

1. **One route handler per transition (verb-as-resource), not a generic PATCH.** Submit,
   approve, and reject each have distinct auth (tripper-owns vs admin), distinct preconditions
   (source status), and distinct side effects (completeness check vs pricing write vs note
   write). Folding them into the existing PATCH would force a soup of conditional auth and
   validation. Each gets its own `POST .../[id]/{action}` endpoint. This mirrors the existing
   admin pattern (`/api/admin/xsed`) where actions are explicit endpoints with a local
   `requireAdmin()` guard.

2. **Status is the single UX driver on the tripper side.** The form does not gain a separate
   "locked" flag. `status === "PENDING_REVIEW"` derives read-only; `status === "DRAFT" &&
   reviewNote` derives the rejection banner. State stays in one field, so there is no risk of
   a "locked but DRAFT" or "editable but PENDING" contradiction.

3. **`pricingByType` is admin-owned, validated at the boundary.** Because Prisma cannot
   enforce the shape of a `Json` column, the approve endpoint is the gate: it rejects any
   payload whose keys do not exactly match the experience's `type[]` array. This keeps the
   "no schema enforcement on Json" risk contained to one validated function instead of
   spreading optimistic trust across readers.

Pattern: **layered guard → precondition → mutation** inside each handler, identical structure
across the three new endpoints so they read the same and fail the same way.

## Key Decisions

**Decision D1 — keep `basePrice`, drop only `displayPrice`.**
- Rationale: `basePrice` is load-bearing for XSED (admin xsed create/edit, `xsed.ts` data
  layer, public drop pricing). The proposal's intent is to remove *tripper self-pricing*,
  which is `displayPrice` (the human string shown on cards) plus the tripper's ability to set
  `basePrice` via the form. Tripper experiences will stop reading/writing `basePrice`;
  pricing comes from `pricingByType`. XSED keeps `basePrice`.
- Rejected alternative: drop both and add `"XSED"` to every `pricingByType`. Rejected because
  it forces XSED rework that the proposal explicitly defers, and XSED has a single price (no
  per-traveller-type axis), so `pricingByType` is the wrong shape for it.

**Decision D2 — strip privileged fields from tripper PATCH.**
- Rationale: the whole point of the gate is that the tripper cannot set price or status. Today
  PATCH trusts `status` from the body. Leaving that open would let a tripper PATCH
  `status: "ACTIVE"` and bypass review. Status transitions move exclusively to the three
  guarded endpoints.
- Rejected alternative: keep PATCH permissive and rely on UI to never send those fields.
  Rejected — never trust the client for an authorization-relevant field.

**Decision D3 — Admin Review Architecture (Tab-Based Page vs. Side Panel).**
- Implemented as a dedicated review page with a synthetic "Admin" tab, not a side panel (spec proposed side panel).
- Rationale: Full form context visible during review (all read-only tripper tabs + pricing). Dedicated page URL provides shareable/bookmarkable review state. Matches Next.js patterns and project conventions. `AdminReviewSlot` injects pricing as a synthetic tab, reusing `NewExperienceShell`.
- Impact: Functionally equivalent UX. Arguably superior for context and shareability.

**Decision D4 — single fetch + client filter for the pending tab.**
- Rationale: the admin list is small and already fully fetched; a dedicated
  `?status=PENDING_REVIEW` endpoint adds surface for no benefit at this scale. The tab is a
  client filter.
- Rejected alternative: server-side filtered endpoint. Defers until the list grows large enough
  to need pagination.

## Files Created

| Path | Purpose |
|------|---------|
| `src/app/api/tripper/experiences/[id]/submit/route.ts` | Tripper submit-for-review transition |
| `src/app/api/admin/experiences/[id]/approve/route.ts` | Admin approve + set pricingByType |
| `src/app/api/admin/experiences/[id]/reject/route.ts` | Admin reject + set reviewNote |
| `src/lib/admin/experience-pricing.ts` | `validatePricingByType` boundary validator |
| `src/lib/helpers/experience-form.ts` | `getExperienceCompleteness` shared validator |
| `src/app/[locale]/(secure)/dashboard/admin/AdminReviewSlot.tsx` | Admin pricing review (synthetic tab) |
| `src/app/[locale]/(secure)/dashboard/admin/(shell)/experiences/[id]/page.tsx` | Admin review page |

## Files Modified

| Path | Change |
|------|--------|
| `prisma/schema.prisma` | `PENDING_REVIEW` enum value; drop `displayPrice`; add `pricingByType`, `reviewNote`; keep `basePrice` (D1) |
| `src/types/tripper.ts` | `ExperienceFormDraft`, `ExperienceListItem`, `TripperOwnExperienceListItem` updated; add `ExperienceStatus` union |
| `src/lib/admin/types.ts` | `AdminExperience` — drop `displayPrice`, add review/pricing/info fields |
| `src/app/api/admin/experiences/route.ts` | GET select: add new fields, drop `displayPrice` |
| `src/app/api/tripper/experiences/[id]/route.ts` | Drop price fields; strip `status`/`pricingByType`/`reviewNote` from PATCH (D2); add fields to GET select |
| `src/app/api/tripper/experiences/route.ts` | Drop `basePrice`/`displayPrice` on create |
| `src/components/app/dashboard/tripper/experiences/NewExperienceShell.tsx` | `EMPTY_DRAFT`, read-only gate, submit-for-review, rejection banner |
| `src/components/app/dashboard/tripper/experiences/ExperienceFormContent.tsx` | `disabled` fieldset wrap, pending notice, submit label |
| `src/components/app/dashboard/tripper/experiences/steps/VisibilityStep.tsx` | Read-only awareness for custom controls |
| `src/components/app/dashboard/tripper/experiences/ExperiencesPageClient.tsx` | "Pending review" badge |
| `src/app/[locale]/(secure)/dashboard/admin/AdminExperiencesPageClient.tsx` | Pending Review tab + panel wiring; drop `displayPrice` cell |
| `src/dictionaries/es.json`, `src/dictionaries/en.json` | New tripper + admin copy keys |
| `src/lib/types/dictionary.ts` | Extend `TripperExperiencesDict.form` and `AdminPagesDict.experiences` |
