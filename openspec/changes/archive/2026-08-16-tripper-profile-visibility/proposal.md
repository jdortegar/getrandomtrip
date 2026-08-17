# Proposal: Tripper Profile Visibility

## Intent

Two problems on the same read path, both about whether a tripper should be reachable.

**1. Broken tripper links (live 404 bug).** `getAllTrippers()` (`src/lib/db/tripper-queries.ts:187-218`) — the single shared query behind the public directory (`src/app/[locale]/trippers/page.tsx:15`) and `/api/trippers` (feeding `TripperSearchModal`) — filters only `roles: { has: "TRIPPER" }`, never `tripperSlug`. An invited tripper has `tripperSlug = null` until she completes onboarding (`grantTripperAndCleanup`, `src/lib/auth/tripperInviteTokens.ts:122-140`, sets only `roles`; the slug is derived later by `PATCH /api/user/tripper`, which requires non-empty `availableTypes`). `TopTrippersGrid.tsx:32-35` and `TripperSearchModal.tsx:160-167` then **synthesize** a slug from her name (`name.toLowerCase().replace(/\s+/g, "-")`) and link to it. That slug was never persisted, so `getTripperBySlug` (`tripper-queries.ts:23-83`) misses and the page calls `notFound()` (`trippers/[tripper]/page.tsx:80`). Reproduced with tripper `florencia-denis-magyari`. `about-us/page.tsx:48` already does the right thing (`.filter((t) => t.tripperSlug)`).

**2. No way for a tripper to go offline.** A tripper who stops taking bookings has no self-service control. Today the only options are staying fully public or asking an admin to strip her role.

## Decision Log

All decisions below were resolved in a live grill-me session against the code and are **final** for this change.

| # | Decision |
|---|----------|
| 1 | Fix the 404 inside `getAllTrippers()` itself (`tripperSlug: { not: null }`), not at each call site — one shared function, both surfaces fixed at once. |
| 2 | **Delete** the fallback slug synthesis in `TopTrippersGrid.tsx:32-35` and `TripperSearchModal.tsx:160-167`. Once the list is filtered the branch is dead, and it *is* the bug pattern — keeping it as a "defensive fallback" preserves the defect. Simplify to `href={tripper.tripperSlug}`. |
| 3 | `isActive` stays a **separate concept** from slug completeness. "Not onboarded yet" (no slug) and "chose to go offline" (`isActive = false`) are different states; merging them would render the toggle off-by-default for every unfinished profile. |
| 4 | Schema: `isActive Boolean @default(true)` on `User`. Default `true` so no current tripper disappears on deploy. |
| 5 | Tripper self-service only. No admin override or admin-side surfacing in this change. |
| 6 | Inactive means invisible **and** unbookable, not just hidden — see In Scope. |
| 7 | Direct hits on an inactive profile show a dedicated **"tripper unavailable"** state, never a bare 404. A bookmark or shared itinerary link must not look like a dead link. This forces `getTripperBySlug` and `trippers/[tripper]/page.tsx:76-80` to distinguish not-found from found-but-inactive (both collapse to `null`/`notFound()` today) — a discriminated return shape. |
| 8 | The journey flow reuses that **same** unavailable state when a tripper goes inactive mid-configuration (`getTripperJourneyContext`, `tripper-queries.ts:392-421` → `api/trippers/[slug]/journey-context/route.ts:12` → `JourneyPageClient.tsx:136`). Explicitly rejected: silently degrading to the generic journey with no message. |
| 9 | Matching exclusion covers **all** sites now — not deferred. Each is a one-line `where` addition; no join restructuring. |
| 10 | Existing assignments are untouched. No cancel, flag, or migrate of any TripRequest based on `isActive`. |
| 11 | The toggle applies **immediately** via its own dedicated endpoint, not batched into the settings Save button. A tripper should not have to remember a second Save to go offline, and batching risks an unrelated form edit reverting her status. |
| 12 | `PATCH /api/user/tripper/status` is a **new** route, not an extension of `PATCH /api/user/tripper`. The existing endpoint 400s without a non-empty `availableTypes` array (`route.ts:81-86`) and, when `tripperSlug` is absent from the body, **silently regenerates** a new slug from her name via `generateUniqueTripperSlug` (`route.ts:97-120`). An `{ isActive }`-only PATCH there would either fail validation or change her public URL as a side effect of flipping a switch. |
| 13 | Reuse the existing `Switch` primitive (`src/components/ui/Switch.tsx`, `checked` / `onCheckedChange`, already used at `AdminSiteAccessPageClient.tsx:95`). No new switch component, no Radix dependency. |
| 14 | Toggle is disabled with a hint until `tripperSlug` is set — there is nothing to show or hide before that, so toggling would have no observable effect. The API mirrors this: 400 when the caller's `tripperSlug` is still null, so an incomplete profile cannot be activated. |

## Scope

### In Scope

**Bugfix**
- `tripperSlug: { not: null }` in the `getAllTrippers()` `where` clause.
- Remove synthesized-slug fallbacks from `TopTrippersGrid.tsx` and `TripperSearchModal.tsx`.

**Schema**
- Prisma migration: `isActive Boolean @default(true)` on `User`.

**Visibility**
- `isActive: true` added to the same `getAllTrippers()` `where` clause.
- `getTripperBySlug` + `trippers/[tripper]/page.tsx`: discriminated outcome (`not-found` vs `inactive`); render a "tripper unavailable" state for the latter.
- `getTripperJourneyContext` + `JourneyPageClient`: same unavailable state mid-flow.

**Matching exclusion** — `isActive: true` on the **User-lookup** step in each of:
- `src/app/api/trip-requests/route.ts:410-418` (`?tripper=<slug>` → `tripperId` via `findFirst`).
- `src/lib/db/tripper-queries.ts` — `getTripperJourneyContext` (392-421), `getTripperFeaturedTrips` (122-134), `getTripperExperiencesByTypeAndLevel` (321-329).
- `src/lib/data/tripper-trips.ts:8-118` (`getTripperAvailableTypesAndLevels`, `tripperHasExperiencesForTypeAndLevel`, `getTripperAvailableTypes`, `getTripperAvailableLevelsForType`; used by `experiences/by-tripper/[tripper]/page.tsx`).
- `src/app/api/experiences/route.ts:12-44` — `owner.isActive` in `where` (`owner` already in `select`).
- `src/app/api/admin/experiences/route.ts:29,45` + `src/components/app/admin/TripRequestModal.tsx:87-88` — `owner: { isActive: true }`.
- `src/app/api/admin/trip-requests/[id]/route.ts:93-118` — experience lookup on `experienceId` assignment currently has **no** owner filter; add one.

> These functions resolve a tripper by slug/id first, then query `Experience` by raw `ownerId`. The `isActive` check MUST land on the User lookup. Placed on the `Experience` query it silently does nothing.

**UI + copy**
- New toggle row inside `TripperSettingsPublicUrlCard.tsx`, **above** the domain+slug block (before line 60), under the eyebrow/heading. Rendered from `dashboard/tripper/settings/page.tsx:357-365`.
- `PATCH /api/user/tripper/status` — accepts only `{ isActive: boolean }`, own session auth check, 400 if `tripperSlug` is null, updates only `isActive`.
- New keys in **both** `src/dictionaries/es.json` and `en.json` (+ `src/lib/types/dictionary.ts`): toggle label ("Profile visible" / "Perfil visible"), disabled hint, and the shared "tripper unavailable" copy. Extend the existing `TripperSettingsPublicUrlCard` dict section if one exists rather than adding a new one.

### Out of Scope

- Any admin-side control or display of `isActive` (no users-table column, no badge, no override toggle).
- Changing already-assigned or in-progress TripRequests when a tripper goes inactive — only **new** assignment is blocked.
- `src/app/api/internal/destination-reveal/route.ts` — operates on already-`CONFIRMED` trips; must not be touched.
- Data migration, cancellation, or flagging of existing trips based on `isActive`.
- Admin-driven deactivation, scheduled/auto deactivation, or vacation dates.

## Capabilities

### New Capabilities

- `tripper-profile-visibility`: listing eligibility (persisted slug + active flag), the active/inactive self-service contract, the unavailable-vs-not-found distinction, and the matching-exclusion surface.

### Modified Capabilities

- None. `openspec/specs/tripper/spec.md` covers invite and commission only; no existing requirement changes.

## Approach

Two independent predicates, one `where` clause. Listing eligibility becomes `roles has TRIPPER AND tripperSlug != null AND isActive = true`, applied once in `getAllTrippers()` so the directory and the search API stay in sync by construction. The synthesized-slug fallback is removed rather than hardened, because it existed only to paper over the missing filter.

`isActive` is deliberately not a second meaning for "slug missing". Deactivation is a *choice* a fully onboarded tripper makes, so the two conditions filter the same list but drive different user-facing outcomes: an incomplete profile is simply absent, while a deactivated one is absent from discovery yet still answers its URL with an explicit unavailable state. That requires the single lookup that today returns `Tripper | null` to return a three-way outcome, reused by both the public profile page and the journey flow so the messaging is identical in both.

Matching exclusion is enforced at every slug/id→User resolution rather than at the `Experience` query, since the two-step pattern in `tripper-queries.ts` and `tripper-trips.ts` would swallow the filter otherwise. The write path is a purpose-built minimal endpoint so that flipping visibility cannot mutate the slug — the existing tripper PATCH regenerates it as a side effect, which is exactly the hazard this endpoint avoids.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` + migration | Modified | `isActive Boolean @default(true)` on `User` |
| `src/lib/db/tripper-queries.ts` (23-83, 122-134, 187-218, 321-329, 392-421) | Modified | Listing filter; discriminated `getTripperBySlug`; active check on 3 lookups |
| `src/lib/data/tripper-trips.ts` (8-118) | Modified | Active check on 4 User lookups |
| `src/app/api/trip-requests/route.ts` (410-418) | Modified | `isActive: true` on `?tripper=` resolution |
| `src/app/api/experiences/route.ts` (12-44) | Modified | `owner.isActive` filter |
| `src/app/api/admin/experiences/route.ts` (29,45) | Modified | `owner: { isActive: true }` |
| `src/app/api/admin/trip-requests/[id]/route.ts` (93-118) | Modified | Add owner filter to experience lookup |
| `src/app/api/user/tripper/status/route.ts` | New | `{ isActive }`-only PATCH |
| `src/app/[locale]/trippers/[tripper]/page.tsx` (76-80) | Modified | Unavailable state vs `notFound()` |
| `src/app/[locale]/journey/JourneyPageClient.tsx` (136) | Modified | Unavailable state mid-flow |
| `TripperSettingsPublicUrlCard.tsx` | Modified | Visibility toggle row using `ui/Switch` |
| `TopTrippersGrid.tsx` (32-35), `TripperSearchModal.tsx` (160-167) | Modified | Delete synthesized-slug fallback |
| `src/components/app/admin/TripRequestModal.tsx` (87-88) | Modified | Owner-active filter in query params |
| `src/dictionaries/{es,en}.json`, `src/lib/types/dictionary.ts` | Modified | Toggle label, disabled hint, unavailable copy |

**Size**: ~14 files touched + 1 new route + 1 migration, of which ~9 are one-line `where` additions. The non-trivial work is the `getTripperBySlug` three-way restructuring and its two consumer surfaces. Expect a **High** 400-line budget risk once tests are included — `delivery_strategy` is `ask-on-risk`, so tasks must forecast honestly and the user decides on chaining. Natural slice boundary: (A) 404 bugfix + filter, (B) schema + toggle + endpoint, (C) matching exclusion + unavailable states.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `isActive` added to the `Experience` query instead of the User lookup → filter silently no-ops | High | Called out per-file in In Scope; spec must assert the check location, tests must cover an inactive owner's experiences |
| A matching site is missed, letting an inactive tripper still be assigned | Med | Exhaustive site list above with line refs; verify phase greps every `tripperSlug`/`ownerId` resolution |
| Migration adds a column to a hot `User` table | Low | Boolean with a default — additive, no backfill, no lock of consequence |
| Trippers with a slug but never "activated" read as active | Low | Intentional: default `true` preserves today's behavior; deactivation is opt-in |
| Unavailable state leaks tripper existence (enumeration) | Low | Accepted — the profile was public until deactivation; copy reveals nothing beyond that |
| Toggle enabled before a slug exists, producing a no-op | Low | Disabled in UI *and* 400 in the API — both layers |
| Missing `en`/`es` copy | Low | Dual-locale keys enforced per `.claude/rules/i18n-and-types.md`; typecheck gates the dict type |
| Removing the slug fallback breaks a caller relying on the synthesized value | Low | Both call sites are the only consumers; `rg` confirm at apply time |

## Rollback Plan

Code revert is safe on its own — every change is either a `where` addition or additive UI/route, so reverting restores prior behavior (including the 404 bug). The column is the only stateful piece: leave `isActive` in place on revert (unused nullable-safe boolean with a default) rather than dropping it, so any tripper who deactivated is not silently republished by a `DROP COLUMN`. If the column must go, capture `id` + `isActive` for all `isActive = false` rows first so the choices can be replayed.

## Dependencies

- Prisma migration must be applied before the reads that filter on `isActive` ship — order slices accordingly if chained.
- Vitest + happy-dom (strict TDD active): spec/design/tasks must plan RED/GREEN coverage for the listing filter, the three-way slug lookup, the status endpoint guards, and at least one matching-exclusion site per pattern (User-lookup two-step, `owner` relation join).

## Success Criteria

- [ ] A newly invited tripper with no `tripperSlug` never appears in the directory or search modal — no synthesized-slug links exist anywhere.
- [ ] Every tripper card in the directory and search modal resolves to a real profile page (no 404).
- [ ] A tripper with a slug can flip "Profile visible" off and it takes effect immediately, with no separate Save.
- [ ] The toggle is disabled with a hint before the slug exists, and `PATCH /api/user/tripper/status` 400s in that state.
- [ ] Flipping the toggle never changes `tripperSlug`.
- [ ] An inactive tripper's URL renders the "tripper unavailable" state, not a 404.
- [ ] A client configuring a journey with a tripper who goes inactive sees the same unavailable state, not a silent generic fallback.
- [ ] An inactive tripper cannot be resolved via `?tripper=<slug>`, cannot surface experiences in client or admin assignment lists, and cannot be attached to a new `experienceId`.
- [ ] TripRequests already holding her `tripperId`/`experienceId` are unchanged.
- [ ] `destination-reveal` is untouched in the diff.
- [ ] All new copy present in `es` and `en`; `npm run typecheck`, `npm run lint`, and the vitest suite pass.
