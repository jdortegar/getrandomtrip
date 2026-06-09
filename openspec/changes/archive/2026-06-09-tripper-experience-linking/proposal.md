# Proposal: Tripper ↔ Experience Linking

## Intent

Trippers create experiences, but those experiences are never connected to the booking or journey flow. A client who lands via a tripper's page gets a generic journey wizard, and trip requests carry no attribution to the originating tripper. We need to (1) attribute each `TripRequest` to its source tripper, (2) make tripper-scoped surfaces show real approved experiences, and (3) let admins assign a concrete experience to a request, deriving the revealed destination from it. This unlocks correct earnings attribution and a curated, tripper-branded booking experience.

## Scope

### In Scope

- Add `tripperId String?` FK on `TripRequest` → `User`, set at journey creation from the `tripper` URL param.
- Tripper landing (`/trippers/[tripper]`): replace static experience-types carousel and `MOCK_BLOG_POSTS` with the tripper's real `ACTIVE` experiences and published posts.
- Journey wizard (when `tripper` slug present): tripper badge + avatar in `HeaderHero`; filter trip-type cards and level options to those the tripper has `ACTIVE` experiences for; brand cards with "BY TRIPPER [NAME]"; persist `tripperId` on creation.
- Admin `AdminTripEditModal`: "Assign Experience" dropdown filtered by `status=ACTIVE` + matching `level` + `type` includes request type + `ownerId = tripRequest.tripperId`; saves `experienceId`; derive `actualDestination` from the assigned experience instead of manual entry.
- Tripper OS earnings/stats: attribute via `TripRequest.tripperId` (pre-assignment) and `experience.ownerId` (post-assignment).

### Out of Scope

- Changes to `TripperPlanner` (already pushes `tripper`/`originCity`/`originCountry`).
- The experience approval state machine (owned by `experience-review-lifecycle`).
- XSED / Sunday-drop matching logic.
- Payment, commission-rate, or payout changes.

## Capabilities

### New Capabilities

- `trip-request-attribution`: `TripRequest.tripperId` lifecycle — set at creation, used for stats and admin assignment filtering.
- `tripper-curated-journey`: journey-wizard branding and approved-experience-scoped filtering of type/level when a `tripper` slug is present.

### Modified Capabilities

- `experience` (`experience-assignment`): admin assigns an `ACTIVE` experience to a request and `actualDestination` becomes derived from the assigned experience rather than manually set.

## Approach

Schema-first: add nullable `tripperId` FK (back-fill-safe, no data migration). At journey creation read the existing `tripper` param and persist both `tripperId` and `from`. Tripper-scoped reads query `Experience` by `ownerId` + `status=ACTIVE`, deriving available `type[]`/`level` sets to drive wizard filtering. Admin assignment reuses the same query shape scoped to the request's `tripperId`/`type`/`level`; on save, copy the experience's destination into `actualDestination`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Add `tripperId String?` + relation on `TripRequest` |
| `src/app/[locale]/trippers/[tripper]/page.tsx` | Modified | Real experiences + published posts |
| `src/app/[locale]/journey/page.tsx` | Modified | Pass tripper context; set `tripperId` on creation |
| `src/components/journey/JourneyMainContent.tsx` | Modified | Filter type/level by tripper experiences |
| `src/components/journey/HeaderHero.tsx` | Modified | Tripper badge + avatar |
| `AdminTripEditModal` | Modified | Assign-experience dropdown; derive destination |
| Tripper OS earnings/stats | Modified | Attribute via `tripperId` / `ownerId` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Schema uses status `ACTIVE`, context says "APPROVED" — naming drift | Med | Treat `ACTIVE` as the approved state per `ExperienceStatus`; confirm in spec |
| Tripper has zero `ACTIVE` experiences → empty wizard | Med | Fallback to full type/level set or graceful empty state |
| `Experience.type` is `String[]` — filter must use array-contains | Med | Use `type: { has: requestType }` in queries |
| Existing `TripRequest` rows have null `tripperId` | Low | Nullable FK; stats handle null attribution |

## Rollback Plan

Revert the `tripperId` migration (drop column — nullable, no data dependency) and revert the UI/query commits. `experienceId` and `actualDestination` already exist, so the assignment path degrades to prior manual behavior.

## Dependencies

- `experience-review-lifecycle` capability (defines `ACTIVE` as the approved state).

## Success Criteria

- [ ] `TripRequest.tripperId` is set whenever a journey starts from a tripper slug.
- [ ] Tripper landing shows only real `ACTIVE` experiences and published posts (no mocks).
- [ ] Journey wizard filters type/level to the tripper's `ACTIVE` experiences and shows tripper branding.
- [ ] Admin can assign an `ACTIVE`, type/level-matching experience; `actualDestination` derives from it.
- [ ] Tripper earnings attribute correctly pre- and post-assignment.
