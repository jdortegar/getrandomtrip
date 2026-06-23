# Feature Spec: Discovery

**Priority:** 2 — Client acquisition entry point  
**Routes:** `/experiences`, `/experiences/by-type/[type]`, `/experiences/by-tripper/[tripper]`, `/trippers`, `/trippers/[tripper]`  
**Last audited:** 2026-06-22

---

## Status

What works end-to-end today:

- **`/experiences`** — Renders Hero + `TravelerTypesCarousel` + `TypePlanner`. All data from static dictionaries and `lib/data/traveler-types`. Selecting a type scrolls to the planner; clicking a level card navigates to `/journey?travelType=<type>&experience=<level>`. No database calls. `family`, `paws`, `honeymoon` show a "coming soon" badge and are not clickable.
- **`/experiences/by-type/[type]`** — Statically pre-rendered for all slugs. Renders Hero, story paragraph, TypePlanner, blog posts, InspirationBanner, Testimonials — all from static data. Journey entry via `LevelCard`. No database queries.
- **`/trippers`** — Server-rendered. Calls `getAllTrippers()` (all users with `TRIPPER` role, ordered alphabetically). Renders `HeaderHero` + `TopTrippersGrid`. Search modal filters client-side by name/bio. Clicking a card navigates to `/trippers/<slug>`.
- **`/trippers/[tripper]`** — Server-rendered. Fetches `getTripperBySlug`, featured trips, experiences by type/level, published blogs. Renders hero, origin-city form (`TripperPlanner`), type carousel filtered to the tripper's active types, optional blog section, Testimonials. `TripperPlanner` CTA navigates to `/journey?tripper=<slug>&originCity=<city>&originCountry=<country>`.
- **`/experiences/by-tripper/[tripper]`** — Fetches tripper + `getTripperExperiencesByTypeAndLevel` (filtering `isActive: true, status: ACTIVE`). Renders tripper header + mystery-overlay cards grouped by type. **Orphaned — no in-app link points to this route.**

---

## User Flows

**Flow A — Browse by traveler type:**
1. `/experiences` → select type in carousel → scroll to TypePlanner → click level card → `/journey?travelType=<type>&experience=<level>`
2. Alternative: click type card `href` → `/experiences/by-type/<type>` → same level-card CTA → `/journey`

**Flow B — Browse trippers:**
1. `/trippers` → click tripper card → `/trippers/<slug>`
2. Fill origin country + city in `TripperPlanner` → `/journey?tripper=<slug>&originCity=<city>&originCountry=<country>`
3. Alternative: click type card in `TripperTravelerTypesSection` → `/experiences/by-type/<type>` (loses tripper context)

**Flow C — Tripper search:**
1. `/trippers` → click search card → `TripperSearchModal` opens → type name/bio → click result → `/trippers/<slug>`

**Flow D — By-tripper experience list (orphaned):**
1. Must navigate directly by URL — zero in-app links point here
2. Sees mystery experience cards — no CTA, no link to `/journey`
3. Can only navigate back to `/trippers` or `/trippers/<slug>`

---

## Gaps

| Severity | Issue |
|----------|-------|
| CRITICAL | `/experiences/by-tripper/[tripper]` is fully orphaned — zero in-app navigation links point to this route |
| CRITICAL | Experience cards on `/experiences/by-tripper/[tripper]` have no CTA — no link to `/journey` |
| HIGH | Rating "4.9/5" on the by-tripper page is hardcoded — not computed from reviews |
| HIGH | `getAllTrippers()` has no active-experience filter — trippers with zero published experiences appear in the grid, leading to empty profile pages |
| HIGH | `GET /api/experiences` filters `isActive: true` but not `status: "ACTIVE"` — can surface PENDING/DRAFT/REJECTED packages |
| MEDIUM | Tripper type cards on `/trippers/[tripper]` navigate to `/experiences/by-type/<type>`, losing the tripper context (slug not forwarded to journey) |
| MEDIUM | No "See all experiences" link from `/trippers/[tripper]` to `/experiences/by-tripper/<slug>` |
| MEDIUM | No cross-link from `/experiences/by-type/[type]` to trippers who cover that type |
| MEDIUM | `getTripperAvailableTypesAndLevels` in `tripper-trips.ts` gates on `isActive` only, not `status: "ACTIVE"` — inconsistent with the rest of the codebase |
| LOW | No sorting or filtering on `/trippers` — flat alphabetical list only |
| LOW | Search modal filters by name and bio only — cannot filter by type, location, or specialization |
| LOW | `/experiences/by-type/[type]` is entirely static — no real-time counts, no live tripper coverage, no availability signal |
| LOW | Blog posts on type pages are from static arrays in `lib/data/traveler-types`, not from the database |
| LOW | Testimonials on type pages are static |
| LOW | Coming-soon types (`family`, `paws`, `honeymoon`) have accessible pages at `/experiences/by-type/<type>` — no guard or redirect |

---

## API Coverage

| Endpoint | Method | Notes |
|----------|--------|-------|
| `GET /api/trippers` | GET | Not used by discovery pages; SSR calls `getAllTrippers()` directly |
| `GET /api/trippers/[slug]/journey-context` | GET | Used by journey wizard; filters on `status: ACTIVE` |
| `GET /api/experiences` | GET | Has `isActive: true` but missing `status: ACTIVE` guard; requires `tripperId` param |

Discovery pages perform all data fetching via direct Prisma calls (server components). There is no public endpoint for browsing experiences without a `tripperId`, and no cross-filter endpoint by type, level, or destination.

---

## Next Steps

1. **Link to `/experiences/by-tripper/[tripper]`** from the tripper profile page — add "Ver todas las experiencias" link. One-line change.
2. **Add journey CTA to experience cards** on the by-tripper page — "Quiero este viaje" → `/journey?tripper=<slug>&travelType=<type>`.
3. **Fix hardcoded rating** — compute from `getTripperDashboardStats(tripper.id).averageRating` or hide when no reviews.
4. **Filter `getAllTrippers()`** to only return trippers with at least one active + published experience.
5. **Fix `GET /api/experiences` status gap** — add `status: "ACTIVE"` to the where clause.
6. **Propagate tripper context through type carousel** — link to `/journey?tripper=<slug>&travelType=<type>` instead of `/experiences/by-type/<type>`.
7. **Add "Browse trippers for this type"** to `/experiences/by-type/[type]` pages with a server-side query.
8. **Live data for `/experiences/by-type/[type]`** — replace static experience counts/labels with real DB counts per level.
9. **Add filtering to `/trippers`** — at minimum by traveler type, using the `travelerType` field already fetched by `getAllTrippers()`.
10. **Align `getTripperAvailableTypesAndLevels`** to also require `status: "ACTIVE"`.
