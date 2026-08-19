# Feature Spec: Tripper Price Override

**Priority:** 4 — Operations  
**Routes:** (no new routes — integrates with `/dashboard/admin/settings/users/[id]/edit` and checkout flow)  
**Last audited:** 2026-08-18  
**Related capabilities:** `admin-user-edit-page`, `trip-pricing`

---

## Status

Per-tripper override pricing is fully integrated. Admins can set per-tripper level × traveler-type prices via the edit page; these overrides are resolved at every point in the booking funnel (journey level cards, summary sidebar, checkout, and payment processing).

- **Storage** — Per-tripper overrides stored as JSON on `User.tripperPriceOverrides`.
- **Resolution** — Pure resolver function `resolveBasePricePerPerson` (override-first, catalog-fallback, tripper-aware).
- **Funnel coverage** — Journey cards, summary sidebar, and checkout all resolve via the same function.
- **RandomTrip exclusion** — Bookings with no tripper attribution always use the global catalog.

---

## User Flows

**Admin sets a tripper's price override:**
1. `/dashboard/admin/settings` (Users tab)
2. Click pencil on a tripper user → `/dashboard/admin/settings/users/[id]/edit`
3. In the "Price Override Grid" panel, enter a price (e.g., 350) for (explora, couple)
4. Save → `PATCH /api/admin/users/[id]` persists the override
5. Future trips attributed to this tripper use 350 for that pair at checkout

**Traveler books with override applied:**
1. Tripper has an override set (e.g., 350 for explora-couple)
2. Traveler visits `/journey?tripper=<slug>` and selects (couple, explora)
3. Journey cards, summary sidebar, and checkout all display/charge 350 (not the global catalog price)

**Traveler books without override:**
1. Tripper has no override for (essenza, family)
2. Traveler books that pair
3. All displays and charges resolve to the global catalog value for that pair

**RandomTrip-owned booking (no tripper):**
1. Booking created without tripper attribution (`TripRequest.tripperId` null)
2. All pricing resolves to the global catalog only; no override data is consulted

---

## Capabilities

### Override Resolution (Implemented)

#### Requirement: Resolve at Every Funnel Point
Base price resolution (override-first, catalog-fallback) MUST apply at:
- `/journey` level-selection cards (`BudgetStep.tsx` via `getPlannerLevelsForType`/`getPlannerContentForType`)
- `/journey` running-total sidebar (`JourneySummary.tsx` via `getLevelById`/`getLevelsForType`)
- `/checkout` display and charge (`CheckoutTripFromApi.basePriceUsd` from `/api/trips`)
- Stripe payment-intent, promo-code application/removal (server-side money call sites)

#### Requirement: Pure Resolver, No Prisma in Client Bundle
`resolveBasePricePerPerson` is a pure function (no DB calls, no side effects, deterministic). It never becomes async or prisma-aware. All DB access is server-side via `loadTripperPriceOverrides`, which returns the deserialized JSON to be passed as a required parameter to the resolver everywhere.

#### Requirement: Catalog Fallback
When a tripper has no override for a (type, level) pair, or when a tripper has the TRIPPER role removed, the resolver falls back to the unchanged global `PRICE_BY_TYPE_AND_LEVEL` catalog. No data migration or catalog editing is required.

#### Requirement: Not-Offered Distinction
Pairs not offered in the global catalog (e.g., honeymoon at 4 of 5 levels) return `{offered:false, price:0}` and are not editable in the admin grid. Explicit overrides of 0 are distinguished from not-offered by being stored and retrievable; not-offered is derived solely from the global catalog constants.

#### Requirement: Explicit 0 Override
An admin can explicitly set an override of 0 for an offered pair. Checkout uses 0, not the catalog value. The resolver's type reflects this: `{offered:true, price:0, source:"override"}`.

### Call-Site Wiring (Implemented)

#### Requirement: Money Call Sites
Every Stripe-bound calculation (`payment-intent`, `apply-promo`, `remove-promo`) loads the tripper's overrides and resolves via the pure resolver before calculating pax multiplier and Stripe amount.

#### Requirement: Display Call Sites
Every price display (`/journey` cards, sidebar totals, checkout UI) also resolves via the same function. Client-side checkout never calls the DB or resolver directly; it uses `basePriceUsd` returned by the API.

#### Requirement: Transitive Consistency
The displayed price shown to the traveler matches what will be charged at the money call site, because both use the same resolver against the same override data. A gap in coverage leaves two prices on the same screen.

### RandomTrip Exclusion (Implemented)

#### Requirement: No Tripper Attribution = No Override
When `TripRequest.tripperId` is null, the loader returns null immediately (no DB hit). The resolver falls back to the global catalog. Override data is never consulted for RandomTrip bookings.

---

## Storage & Persistence

### Data Shape
`User.tripperPriceOverrides: Partial<Record<TravelerTypeSlug, Partial<Record<PriceLevelId, number>>>>`

Example:
```json
{
  "couple": {
    "essenza": 300,
    "explora": 350,
    "bivouac": 500
  },
  "family": {
    "explora-plus": 400
  }
}
```

- Absent key at any level = inherit from global catalog
- Null values are treated as inherit (can be stored but are immediately cleared on save)
- Only cells with explicit overrides are present; clearing a cell deletes the key

### Validation
The write API validates all overrides atomically before any write:
- Unknown type → 400
- Unknown level → 400
- Negative value → 400
- Non-finite (NaN, Infinity) → 400
- Override on a not-offered pair → 400
- Any validation failure → 400 with no data mutation

---

## Testing Strategy

### Unit (TDD first)

| What | Cases |
|---|---|
| `resolveBasePricePerPerson` | override hit; absent-key fallback; explicit 0; not-offered; overrides:null; xsed flat rate; unknown type; unknown level |
| `parseTripperPriceOverridesPayload` | unknown type/level; NaN; negative; not-offered pair; null clears key; empty-object stripping |
| `loadTripperPriceOverrides` | tripperId:null returns null (no DB hit); tripperId present fetches and parses |

### Integration

| What | Cases |
|---|---|
| `PATCH /api/admin/users/[id]` | non-admin 403; invalid cell 400; non-tripper target 400; happy path atomic |
| `POST /api/stripe/payment-intent` | charged amount uses override; fallback to catalog when no override |
| `/journey` level cards | display override price when tripper param present and override set |
| `JourneySummary` sidebar | totals reflect override; "per person" line reflects override |

### Manual QA

- Pencil → edit page → set override → save → checkout → verify charged amount matches override
- Tripper without override still charges catalog price
- RandomTrip-owned booking (no tripper param) always charges catalog price
- Grid distinguishes not-offered from 0 override visually

---

## API Coverage

| Method | Route | Status |
|--------|-------|--------|
| GET | `/api/admin/users` | Returns users with `tripperPriceOverrides` field (JSON) |
| PATCH | `/api/admin/users/[id]` | Accepts optional `priceOverrides` body field; validates atomically; 400 on any error |
| GET | `/api/trips/[id]` | Returns `basePriceUsd: number` (resolved override-or-catalog) |
| GET | `/api/trips` | Returns `basePriceUsd: number` per trip (resolved) |
| POST | `/api/stripe/payment-intent` | Uses resolved `basePriceUsd` for Stripe amount |
| POST | `/api/stripe/apply-promo` | Uses resolved `basePriceUsd` for discount calc |
| POST | `/api/stripe/remove-promo` | Uses resolved `basePriceUsd` for baseline |

---

## Files Changed (openspec perspective)

| File | Impact | Notes |
|---|---|---|
| `src/lib/pricing/resolve-base-price.ts` | Created | Pure resolver function, unit-tested |
| `src/lib/pricing/tripper-price-overrides.ts` | Created | Types, `isPairOffered`, both parsers (lenient and strict) |
| `src/lib/pricing/tripper-price-overrides.server.ts` | Created | Prisma loader + batch loader |
| `src/lib/data/traveler-types/index.ts` | Modified | Extracted `applyPaxMultiplier`; catalog literals untouched |
| `src/lib/utils/levels.ts` | Modified | Added optional `overrides` param to `getPlannerLevelsForType`, `getPlannerContentForType`, `getLevelById`, `getLevelsForType`; each resolves via pure resolver |
| `src/lib/helpers/trip-request-pricing.ts` | Modified | Added required `overrides` param to `paymentTotalsInputFromTripRequest` |
| `src/app/api/stripe/payment-intent/route.ts` | Modified | Wired loader + resolver + multiplier |
| `src/app/api/stripe/apply-promo/route.ts` | Modified | Same wiring |
| `src/app/api/stripe/remove-promo/route.ts` | Modified | Same wiring |
| `src/app/api/trips/[id]/route.ts` | Modified | Resolves and returns `basePriceUsd` |
| `src/app/api/trips/route.ts` | Modified | Resolves and returns `basePriceUsd` per trip (list endpoint) |
| `src/types/Checkout.ts` | Modified | `basePriceUsd: number` on `CheckoutTripFromApi` (required) |
| `src/app/[locale]/(secure)/checkout/page.tsx` | Modified | Uses `trip.basePriceUsd` from API; card prices derive from same value |
| `src/components/app/journey/BudgetStep.tsx` | Modified | Accepts `tripperPriceOverrides` prop; passes to level resolver |
| `src/components/app/journey/JourneySummary.tsx` | Modified | Accepts `tripperPriceOverrides` prop; resolves sidebar prices |

---

## Migration / Rollout

- Single additive nullable column (`tripperPriceOverrides Json?` on `User`)
- No backfill required; absent column = inherit catalog
- Rollback: stop passing `overrides` to the resolver (pass null) — stored data goes inert

---

## Next Steps

None — this capability is shipped and verified. Future enhancements:
- Audit log of override changes (who, when, what)
- Cross-tripper reporting (which trippers override a given pair)
- Bulk override import/export

---

## Known Issues

None — this capability is complete and tested.
