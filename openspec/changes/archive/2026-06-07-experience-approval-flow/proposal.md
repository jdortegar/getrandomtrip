# Proposal: Experience Approval Flow

## Intent

Today a tripper publishes experiences directly with no editorial gate, and they self-set
`basePrice`/`displayPrice`. There is no way for admins to review quality or own pricing before
an experience goes live. This change introduces a review handoff: trippers submit, admins
approve (and set per-type pricing) or reject with feedback. This protects catalog quality and
moves pricing authority to the admin.

## Scope

### In Scope

- Add `PENDING_REVIEW` to `ExperienceStatus`; lifecycle `DRAFT → PENDING_REVIEW → ACTIVE`,
  rejection returns to `DRAFT` with a populated `reviewNote`.
- Schema: drop `basePrice` and `displayPrice`; add `pricingByType Json?` and `reviewNote String?`.
  Clean migration (experience table may be dropped/recreated — no data migration).
- Tripper: `VisibilityStep` gets a "Submit for review" button (replaces publish), enabled only
  when required fields are complete; on submit status → `PENDING_REVIEW` and the form is read-only.
- Tripper list card: "Pending review" badge when `status === PENDING_REVIEW`.
- Tripper: rejected experiences show `reviewNote` as a dismissible banner atop the form.
- Admin: "Pending Review" tab on the experiences page; clicking a row opens a side panel.
- Admin side panel: read-only info (title, type(s), level, destination, capacity, description,
  hero image) + one price-per-person input per selected type + Approve / Reject (reject needs note).
- Admin Approve → status `ACTIVE`, save `pricingByType`. Reject → status `DRAFT`, save `reviewNote`.

### Out of Scope

- Notifications (email/in-app) when an experience is submitted, approved, or rejected — separate SDD.
  Only stub: tripper sees `reviewNote` inline in the form.
- Multi-reviewer / approval audit history beyond `reviewNote`.
- Reworking XSED-specific pricing or the public catalog price rendering beyond the field swap.

## Capabilities

> No `openspec/specs/` directory exists yet; capability names below are new.

### New Capabilities

- `experience-review-lifecycle`: status transitions, `reviewNote`, and `pricingByType` ownership rules.
- `admin-experience-review`: admin Pending Review tab, side panel, approve/reject + pricing actions.
- `tripper-experience-submission`: submit-for-review UX, read-only state, rejection banner.

### Modified Capabilities

- None (no prior specs).

## Approach

1. Schema first: extend the enum, swap pricing fields, add `reviewNote`; clean migration via `db:push`.
2. Update `ExperienceFormDraft` type and `EMPTY_DRAFT` to drop base/display price, add `pricingByType`.
3. Tripper side: replace publish with submit-for-review (sets `PENDING_REVIEW`), gate by completeness,
   render read-only when pending, show dismissible `reviewNote` banner when back in `DRAFT`.
4. Admin side: add Pending Review tab + side panel component; new/extended admin API endpoints for
   approve (status + `pricingByType`) and reject (status + `reviewNote`).
5. Type updates in `src/lib/admin/types.ts` (`AdminExperience`) to drop `displayPrice`, add new fields.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Enum + Experience pricing/reviewNote fields |
| `src/types/tripper.ts` | Modified | `ExperienceFormDraft` pricing fields |
| `src/components/app/dashboard/tripper/experiences/NewExperienceShell.tsx` | Modified | `EMPTY_DRAFT`, submit-for-review, read-only |
| `src/components/app/dashboard/tripper/experiences/steps/VisibilityStep.tsx` | Modified | Submit button + rejection banner |
| `src/app/[locale]/(secure)/dashboard/admin/AdminExperiencesPageClient.tsx` | Modified | Pending Review tab + side panel |
| `src/lib/admin/types.ts` | Modified | `AdminExperience` fields |
| `src/app/api/admin/experiences/*` & `src/app/api/tripper/experiences/*` | Modified | Approve/reject + submit endpoints |
| `src/dictionaries/{es,en}.json` + `dictionary.ts` | Modified | New copy keys |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Dropping `basePrice`/`displayPrice` breaks catalog/journey price rendering | High | Grep all readers before apply; route price display through `pricingByType` |
| `pricingByType` shape drift (no schema enforcement on Json) | Med | Validate keys against selected `type[]` at API boundary |
| Existing experiences left in legacy state after migration | Low | Clean migration accepted — table dropped/recreated |

## Rollback Plan

Revert the migration (the Experience table can be dropped/recreated cleanly) and revert the code
changes. No production data dependency exists per the clean-migration decision.

## Dependencies

- Prisma migration must land before API/UI changes that read `pricingByType`/`reviewNote`.

## Success Criteria

- [ ] A tripper can submit a complete experience for review and sees it locked as read-only.
- [ ] A pending experience appears in the admin Pending Review tab with a side panel.
- [ ] Admin approval sets `ACTIVE` and persists `pricingByType`; rejection sets `DRAFT` and persists `reviewNote`.
- [ ] Rejected tripper sees the `reviewNote` banner and can edit/resubmit.
- [ ] `npm run typecheck` and `npm run lint` pass with no references to removed price fields.
