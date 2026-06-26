# Design: Tripper ↔ Experience Linking

## Technical Approach

Schema-first nullable FK (`TripRequest.tripperId → User`) carries attribution from journey creation through admin assignment to earnings. Tripper-scoped surfaces reuse the existing `ownerId + isActive/status=ACTIVE` query shape in `tripper-queries.ts`. The journey wizard reads a `?tripper=slug` param, fetches the tripper's available types/levels + branding via one new endpoint, and threads them into existing components as optional props (additive, non-breaking). Admin assignment derives `actualDestination` from `experience.destinationCity, destinationCountry` instead of free text. No existing call sites break: every new prop is optional and every new query is additive.

## Architecture Decisions

| # | Decision | Choice | Rejected | Rationale |
|---|----------|--------|----------|-----------|
| 1 | Schema | `tripperId String?` + `@relation("TripperTripRequests", fields:[tripperId], references:[id], onDelete: SetNull)`; `db push` (no migration file, matches repo habit) | required FK; manual data migration | Nullable = back-fill-safe for existing rows; `SetNull` preserves request if tripper deleted |
| 2 | Landing carousel | Already correct — `getTripperBySlug` computes `availableTypes` from `isActive` experiences; keep | new query | `ACTIVE`-only refinement: add `status: "ACTIVE"` to the `availableTypes` package query (currently only `isActive`) |
| 3 | Landing blog | Delete `MOCK_BLOG_POSTS`; render `Blog` only when `publishedBlogs.length > 0`, else omit section | keep mock fallback | Mocks misrepresent tripper content; empty state = hide section |
| 4 | Wizard data fetch | One new endpoint `GET /api/trippers/[slug]/journey-context` → `{ name, avatarUrl, allowedTypes, allowedLevelsByType }` | multiple existing endpoints; embed in page SSR | Journey page is a client component; single typed call keeps client state simple |
| 5 | HeaderHero badge | New optional prop `tripperBadge?: { name: string; avatarUrl: string }` rendered as absolute top-right overlay inside the section | separate overlay component | Badge is hero-coupled (positioning, z-index); prop keeps one source of truth, stays optional |
| 6 | Type filtering | New optional prop `allowedTypes?: string[]` on `JourneyMainContent` → filter `localizedTravelerTypes` before passing to `BudgetStep` | filter in page | Filtering belongs where `localizedTravelerTypes` is consumed; `undefined` = no filtering (current behavior) |
| 7 | Level filtering | New optional prop `allowedLevelsByType?: Record<string,string[]>` threaded into `BudgetStep` experience-level options | flat allowedLevels | Levels are per-type in the data model; map mirrors `getTripperExperiencesByTypeAndLevel` output |
| 8 | TripRequest creation | `POST /api/trip-requests`: accept `body.tripper` (slug), resolve slug→id server-side, persist `tripperId`; also accept `from` as today | accept raw `tripperId` from client | Slug is what the URL/UI already carries; server resolution avoids trusting client-supplied user ids |
| 9 | Admin assign endpoint | Extend existing `GET /api/admin/experiences` with optional `?tripperId=&level=&type=&status=ACTIVE` filters (`type: { has }`) | new endpoint | Endpoint exists; add `searchParams` filtering — no new route surface |
| 10 | Destination reveal | On assign (`PATCH /api/admin/trip-requests/[id]` with `experienceId`), server reads the experience and sets `actualDestination = "${destinationCity}, ${destinationCountry}"`; admin no longer types it | client-side display only | Keeps derivation authoritative server-side; manual `actualDestination` still allowed as override when no experience assigned |
| 11 | Earnings attribution | Keep `experience.ownerId` as authoritative for paid/post-assignment earnings; use `tripperId` only for pre-assignment funnel/attribution counts | switch earnings to `tripperId` | Earnings = commission on the assigned experience's owner; `tripperId` may differ from final assignee, so `ownerId` stays the money source of truth |

## Data Flow

    /trippers/[slug]  ──URL param tripper=slug──→  /journey?tripper=slug
                                                        │
                          GET /api/trippers/[slug]/journey-context
                                                        │ {name,avatar,allowedTypes,allowedLevelsByType}
                                                        ▼
       HeaderHero(tripperBadge) + JourneyMainContent(allowedTypes, allowedLevelsByType)
                                                        │ POST /api/trip-requests {tripper:slug,...}
                                                        ▼ resolve slug→id → tripperId
                                              TripRequest{tripperId, experienceId:null}
                                                        │ admin assigns
              GET /api/admin/experiences?tripperId&level&type&status=ACTIVE
                                                        │ PATCH {experienceId}
                                                        ▼ derive actualDestination from experience
                              Earnings: experience.ownerId (paid) | tripperId (funnel)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Add `tripperId String?` + relation; add inverse on `User` |
| `src/app/api/trippers/[slug]/journey-context/route.ts` | Create | Returns branding + allowedTypes/allowedLevelsByType (ACTIVE only) |
| `src/lib/db/tripper-queries.ts` | Modify | Add `status:"ACTIVE"` to availableTypes query; add `getTripperJourneyContext` helper |
| `src/app/[locale]/trippers/[tripper]/page.tsx` | Modify | Remove `MOCK_BLOG_POSTS`; conditional Blog render |
| `src/app/[locale]/journey/page.tsx` | Modify | Read `tripper` param, fetch context, pass badge + allowed props |
| `src/components/journey/HeaderHero.tsx` | Modify | Add `tripperBadge` prop + overlay |
| `src/components/journey/JourneyMainContent.tsx` | Modify | Add `allowedTypes`, `allowedLevelsByType`; filter before BudgetStep |
| `src/components/journey/BudgetStep.tsx` | Modify | Accept filtered types/levels |
| `src/app/api/trip-requests/route.ts` | Modify | Resolve `body.tripper` slug→id; persist `tripperId` |
| `src/app/api/admin/experiences/route.ts` | Modify | Optional `tripperId/level/type/status` query filters |
| `src/app/api/admin/trip-requests/[id]/route.ts` | Modify | On `experienceId`, derive `actualDestination` server-side |
| `src/components/app/admin/TripRequestModal.tsx` | Modify | Assign-experience dropdown; destination read-only/derived |
| `src/lib/types/dictionary.ts` + `dictionaries/{es,en}.json` | Modify | Branding + assign-experience copy keys |

## Interfaces / Contracts

```ts
// GET /api/trippers/[slug]/journey-context
interface TripperJourneyContext {
  name: string;
  avatarUrl: string | null;
  allowedTypes: string[];                          // distinct ACTIVE experience types
  allowedLevelsByType: Record<string, string[]>;   // type -> distinct non-null levels
}

// HeaderHero new prop
tripperBadge?: { name: string; avatarUrl: string };

// JourneyMainContent new props (both optional; undefined = no filtering)
allowedTypes?: string[];
allowedLevelsByType?: Record<string, string[]>;

// POST /api/trip-requests body addition
tripper?: string; // slug, resolved server-side to tripperId

// GET /api/admin/experiences query params (all optional)
?tripperId=&level=&type=&status=ACTIVE   // type filter uses { has: type }
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | slug→id resolution; `actualDestination` derivation; allowedLevelsByType grouping | Jest on route handlers / query helper |
| Integration | `journey-context` returns ACTIVE-only; admin filter respects `type:{has}` + `tripperId` | Route tests (pattern exists under `experiences/[id]/__tests__`) |
| E2E | tripper-scoped journey filters cards; create persists `tripperId`; admin assign derives destination | Manual QA of the two flows |

## Migration / Rollout

`db push` adds nullable `tripperId` — no data migration; existing rows stay null. Rollback = drop column + revert commits; `experienceId`/`actualDestination` already exist so admin assignment degrades to prior manual entry.

## Open Questions

- [ ] Empty-state behavior when a tripper has zero ACTIVE experiences: hide wizard, full fallback set, or notice? (Risk flagged in proposal — spec should decide.)
- [ ] Should manual `actualDestination` entry remain allowed as an override after an experience is assigned, or be fully locked?
