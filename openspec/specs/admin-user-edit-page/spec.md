# Feature Spec: Admin User Edit Page

**Priority:** 4 — Operations  
**Routes:** `/dashboard/admin/settings/users/[id]/edit`  
**Last audited:** 2026-08-18  
**Related capabilities:** `tripper-price-override`, `trip-pricing`

---

## Status

Admin user editing has been elevated from a lightweight modal (`UserRoleModal.tsx`, now deleted) to a full dedicated page supporting roles, commission, and per-tripper price overrides.

- **Page access control** — `/dashboard/admin/settings/users/[id]/edit` is ADMIN-only; non-admins are redirected; unknown user IDs return `notFound()`.
- **Role toggle editing** — TRAVELER is a locked base role; TRIPPER and ADMIN are independently toggleable booleans.
- **Commission editing** — When TRIPPER is enabled, a commission percentage field (0–100) is visible and required.
- **Price grid CRUD** — A 5x6 grid (levels: essenza, explora, explora-plus, bivouac, atelier; types: couple, solo, family, group, honeymoon, paws) allows per-tripper override of base prices. Each cell is independently nullable and non-negative. Non-offered pairs (where global catalog has 0) are distinguished from explicit overrides of 0. All changes persist via a single atomic `PATCH /api/admin/users/[id]` request.
- **Pencil navigation** — The Users tab of `/dashboard/admin/settings` now navigates to the edit page via a pencil link instead of opening a modal.

---

## User Flows

**User role and pricing edit:**
1. `/dashboard/admin/settings` (Users tab)
2. Click pencil on a user row → `/dashboard/admin/settings/users/[id]/edit`
3. Adjust roles (lock TRAVELER; toggle TRIPPER/ADMIN) → commission field appears/hides based on TRIPPER state
4. Optionally edit price overrides (grid cells, null = inherit global catalog)
5. Save → single `PATCH /api/admin/users/[id]` (atomically updates roles, commission, and priceOverrides)

---

## Capabilities Implemented

### admin-user-edit-page (New)

#### Requirement: Page Access Control
The system MUST serve `/dashboard/admin/settings/users/[id]/edit` only to authenticated ADMIN users.

#### Requirement: Role Toggle Editing
TRAVELER is a locked base role; TRIPPER and ADMIN are independently toggleable booleans, persisted via `PATCH /api/admin/users/[id]`.

#### Requirement: Commission Editing
When TRIPPER is enabled, a commission percentage field (0–100) is visible and validated as a non-negative integer.

#### Requirement: Price Grid CRUD
A grid (5 levels × 6 traveler types) allows nullable, non-negative numeric overrides, editable only by ADMIN. Validation rejects invalid input (negative, non-finite, or overrides on not-offered pairs) with a 400 response and no data written.

#### Requirement: Not-Offered vs Explicit-Zero Distinction
The grid distinguishes globally not-offered pairs from explicit override values of 0. Not-offered cells are non-editable; explicit overrides (including 0) are stored and used at checkout.

#### Requirement: Full Localization
All new UI strings (panel titles, toggle labels, grid headers, "not offered" copy, validation messages) exist in both `es.json` and `en.json` under `adminUsers.editPage.*`.

---

### tripper-price-override (New)

Per-tripper level × traveler-type price overrides that supersede the global `PRICE_BY_TYPE_AND_LEVEL` catalog at checkout, stored as a nullable JSON map on `User.tripperPriceOverrides`.

#### Requirement: Override Resolution Everywhere in the Funnel
The tripper-attributed base price MUST resolve via override-first, catalog-fallback at every point in the funnel: level-selection cards (`/journey`), running-total sidebar, and checkout. A tripper-attributed trip uses the override; a RandomTrip-owned trip (no tripper attribution) always uses the global catalog.

#### Requirement: Storage Shape
`User.tripperPriceOverrides: Partial<Record<TravelerTypeSlug, Partial<Record<PriceLevelId, number>>>>`. Absent keys = inherit. Only cells with explicit overrides are stored; clearing a cell deletes the key.

#### Requirement: Validation
The write API (`PATCH /api/admin/users/[id]`) validates all overrides before any write: rejects unknown type/level, negative, non-finite, or not-offered pairs with a 400 and no data mutation.

---

### trip-pricing (Modified)

#### Requirement: Tripper-Aware Resolution
Base price per person resolution adds tripper awareness. Instead of a global-only `getBasePricePerPerson(type, level)`, use `resolveBasePricePerPerson({ type, level, overrides })` which first checks the tripper's override, then falls back to the global catalog. The resolver is a pure function (no prisma, unit-testable); the loader (`loadTripperPriceOverrides`) fetches the JSON from the DB server-side only.

#### Requirement: Call-Site Wiring
Every money call site (`POST /api/stripe/payment-intent`, `apply-promo`, `remove-promo`) loads the tripper's overrides and resolves via the pure resolver. Display sites (`/journey` level cards, `JourneySummary`, checkout) also resolve via the same function, passed the tripper's overrides from journey context. `GET /api/trips` and `GET /api/trips/[id]` return a resolved `basePriceUsd` so the client never needs to recalculate.

#### Requirement: RandomTrip-Owned Exclusion
Bookings with no tripper attribution (`TripRequest.tripperId` null) always use the global catalog, regardless of any override data that exists for any tripper.

---

## Gaps (if any)

None — this capability is complete and verified.

---

## API Coverage

| Method | Route | Status |
|--------|-------|--------|
| GET | `/api/admin/users` | Working (lists all users) |
| GET | `/dashboard/admin/settings/users/[id]/edit` | Working — server page, ADMIN-only, notFound on missing user |
| PATCH | `/api/admin/users/[id]` | Working — extended to accept optional `priceOverrides` field; validates before write |
| POST | `/api/admin/users/[id]/invite-tripper` | Working (unchanged) |
| DELETE | `/api/admin/users/[id]` | Working (unchanged) |

---

## Files Changed (openspec perspective)

| File | Impact | Notes |
|---|---|---|
| `prisma/schema.prisma` | Modified | Added `tripperPriceOverrides Json?` to `User` (additive, nullable) |
| `src/lib/pricing/resolve-base-price.ts` | Created | Pure resolver, ADR-3 |
| `src/lib/pricing/tripper-price-overrides.ts` | Created | Types, validators, parsers |
| `src/lib/pricing/tripper-price-overrides.server.ts` | Created | Prisma loader |
| `src/app/[locale]/(secure)/dashboard/admin/settings/users/[id]/edit/page.tsx` | Created | Server page, ADMIN guard |
| `src/components/app/admin/user-edit/AdminUserEditPageClient.tsx` | Created | Full page form |
| `src/components/app/admin/user-edit/RoleAccessPanel.tsx` | Created | Panel 1: roles + commission |
| `src/components/app/admin/user-edit/PriceOverrideGrid.tsx` | Created | Panel 2: 5×6 grid |
| `src/app/api/stripe/payment-intent/route.ts` | Modified | Wired loader+resolver |
| `src/app/api/stripe/apply-promo/route.ts` | Modified | Same wiring |
| `src/app/api/stripe/remove-promo/route.ts` | Modified | Same wiring |
| `src/app/api/trips/[id]/route.ts` | Modified | Added resolved `basePriceUsd` |
| `src/app/api/trips/route.ts` | Modified | Added resolved `basePriceUsd` (list endpoint, what checkout actually fetches) |
| `src/app/api/admin/users/[id]/route.ts` | Modified | Extended PATCH to accept `priceOverrides` |
| `src/components/app/admin/UsersTableRow.tsx` | Modified | Pencil now links to edit page |
| `src/components/app/admin/AdminUsersPageClient.tsx` | Modified | Dropped modal state |
| `src/components/app/admin/UserRoleModal.tsx` | Deleted | Superseded |
| `src/dictionaries/{es,en}.json` | Modified | Added `adminUsers.editPage.*` keys |

---

## Known Issues

**SUGGESTION (non-blocking):** `checkout/page.tsx:409-413` retains a defensive fallback `getBasePriceFromCatalog(...)` behind `trip.basePriceUsd ??` even though the field is required on the API response type. This is dead code under normal typed usage (the API always populates it), but a future diff could consider removing it for clarity.

---

## Next Steps

None — this capability is shipped and verified. Future enhancements (e.g. per-cell audit history, cross-tripper reporting) can be scoped separately.
