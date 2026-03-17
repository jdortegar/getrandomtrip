# Verification: core.ts types vs other files

This document lists types defined in `src/types/core.ts` and where they are duplicated or diverged in the codebase, with recommendations.

**Rule (from project):** Manual types live in `lib/types/`; core types are the single source of truth for domain/app. Prisma types only for enums or raw DB access.

---

## Summary

| Area | Duplicated in | Recommendation |
|------|----------------|-----------------|
| User / Auth | userStore.ts, NavbarProfile.tsx, roles.ts | Consolidate user types to core; userStore to re-export or extend core. Fix TravelerType mismatch (core = EN slugs, userStore = ES). |
| Journey | journeyStore.ts | Use core types in slice (JourneyState, LevelSlug, Addon*, Filters/Logistics aligned with core). |
| Tripper | types/tripper.ts, tripperStore.ts | Keep tripper.ts for **API/DB** (uppercase enums, RouteStatus extras); core for **domain**. Align TripperState once. |
| Blog | types/blog.ts, lib/data/shared/blog-types.ts, page-level interfaces | One canonical BlogPost in core or types/blog; others use subset or rename (e.g. BlogPostCard). |
| Addon | lib/data/shared/addons-catalog.ts | Catalog shape is data-source specific; consider extending core Addon or mapping at load. |
| PaginatedResponse | lib/db/database.ts | Different shape (no ApiResponse); keep both or define one in core and adapt DB. |
| TravelerType (slug) | userStore (ES), useInitJourney, checkout (local) | Use core TravelerType everywhere; userStore currently uses Spanish slugs (separate migration). |
| TravelerType (card) | lib/data/travelerTypes.ts | **Different concept** (interface: title, description, imageUrl…). Rename to `TravelerTypeCard` or `TravelerTypeConfig` to avoid clash. |

---

## 1. Base types (ID, Timestamp, Currency)

- **core.ts:** `ID`, `Timestamp`, `Currency`
- **Elsewhere:** Not redefined.
- **Action:** None.

---

## 2. User & authentication

| Type | In core | Also defined in | Notes |
|------|---------|-----------------|--------|
| UserRole | `'client' \| 'tripper' \| 'admin'` | **lib/roles.ts** (`\| null`), **types/tripper.ts** (`'CLIENT'\|'TRIPPER'\|'ADMIN'`), **userStore.ts** (same as core) | roles: extend core with `null`. tripper: API/DB use uppercase. userStore: duplicate. |
| TravelerType | `'solo' \| 'couple' \| … \| 'paws'` | **userStore.ts** (`'solo' \| 'pareja' \| 'familia' \| 'amigos' \| 'empresa'`), **useInitJourney.ts** (local), **checkout** (local) | userStore uses **Spanish** slugs; core and lib/data/traveler-types use **English**. Consolidate to core + i18n for display. |
| BudgetLevel | `'low' \| 'mid' \| 'high'` | **userStore.ts** (identical) | Remove from userStore; import from core. |
| User | Full interface | **userStore.ts** (same shape), **NavbarProfile.tsx** (subset: name?, avatar?, role?) | userStore duplicates; NavbarProfile can use `Pick<User, 'name' \| 'avatar' \| 'role'>`. |
| UserPreferences | prefs shape | **userStore.ts** as `UserPrefs` (same shape) | Alias or import: `type UserPrefs = UserPreferences`. |
| UserSocials | ig, yt, web | **userStore.ts** (identical) | Import from core. |
| UserMetrics | bookings, spendUSD, … | **userStore.ts** (identical) | Import from core. |

**Recommendation:**  
- userStore: import `User`, `UserPreferences`, `UserSocials`, `UserMetrics`, `UserRole`, `BudgetLevel` from `@/types/core`. Keep a single `TravelerType` from core and migrate from Spanish slugs in a separate task.  
- roles.ts: `import type { UserRole } from '@/types/core'; export type UserRoleOrNull = UserRole | null;` and use `UserRoleOrNull` where null is needed.  
- NavbarProfile: use `Pick<User, 'name' \| 'avatar' \| 'role'>` from core instead of local `User`.

---

## 3. Journey & travel

| Type | In core | Also defined in | Notes |
|------|---------|-----------------|--------|
| JourneyType | union of slugs | — | Only in core. |
| LevelSlug | essenza \| modo-explora \| … | **journeyStore.ts** (identical) | Remove from journeyStore; import from core. |
| TransportMode, ClimatePreference, TimePreference, DeparturePreference, AccommodationType | filter/journey enums | — | Only in core. |
| Location, JourneyLogistics, JourneyFilters, JourneyState | full interfaces | **journeyStore.ts**: `Logistics` (simplified: city, country strings), `Filters` (uses FilterOption key), `AddonUnit`, `AddonSelection`, `AddonsState`, `JourneyState` (from: string, type: string, level: string, …) | journeyStore uses slightly looser types (string vs union). Align with core: use `JourneyState`, `JourneyLogistics`, `JourneyFilters` from core; keep slice state compatible (e.g. `level: LevelSlug`). |

**Recommendation:**  
- journeyStore: import `LevelSlug`, `JourneyType`, `AddonUnit`, `AddonSelection`, `AddonsState`, `JourneyState`, `JourneyLogistics`, `JourneyFilters` from core. Map internal `Logistics` to `JourneyLogistics` if needed; use `Filters` from journey-filters (already aligned with core `JourneyFilters`).

---

## 4. Addons & pricing

| Type | In core | Also defined in | Notes |
|------|---------|-----------------|--------|
| AddonUnit, AddonCategory, AddonSelection, AddonsState | core | **journeyStore.ts** (AddonUnit, AddonSelection, AddonsState — identical) | Import from core in journeyStore. |
| Addon, AddonOption | core (category enum, unit, priceUSD, options) | **lib/data/shared/addons-catalog.ts** (category: string, type: 'perPax'\|'perTrip', priceType, applyToLevel, …) | Catalog is **data-source** shape; core is **domain** shape. Keep both; map catalog → core Addon when loading. |

**Recommendation:**  
- journeyStore: use core addon types.  
- addons-catalog: keep local interface; add a mapper to core `Addon` if used in app state.

---

## 5. Tripper

| Type | In core | Also defined in | Notes |
|------|---------|-----------------|--------|
| TripperLevel, RouteStatus, EarningStatus | core (RouteStatus: draft \| in_review \| published \| archived) | **types/tripper.ts** (RouteStatus includes `needs_changes`, `approved`; UserRole uppercase; Earning status without 'cancelled') | tripper.ts = **API/DB** (more statuses, uppercase). core = **domain**. |
| TripperRoute, Earning | core | **types/tripper.ts** (same names, slightly different fields) | tripper.ts used by tripperStore, tripper-queries, TripperHero, TripperInspirationGallery. |
| TripperState | core (routes, earnings) | **tripperStore.ts** (same shape, imports from tripper) | Single source: either core or tripper. store/types.ts uses core; tripperStore uses tripper.ts types. |

**Recommendation:**  
- Keep **types/tripper.ts** for DB/API (TripperRoute, Earning, RouteStatus, etc.) and use it in tripper slice and server code.  
- In **core.ts**: either remove TripperRoute, Earning, TripperState, RouteStatus, TripperLevel and document “tripper domain types live in types/tripper”, or keep core as the public app contract and map tripper.ts → core in the slice.  
- Prefer one canonical place for “tripper domain” (e.g. types/tripper.ts) and have store/types.ts import from there if the store is tripper-focused.

---

## 6. Blog

| Type | In core | Also defined in | Notes |
|------|---------|-----------------|--------|
| BlogPost | id, slug, title, excerpt, content, authorId, authorName, tags, featuredImage, status, … | **types/blog.ts** (blocks, format, faq, seo, …), **lib/data/shared/blog-types.ts** (minimal: image, category, title, href), **app/[locale]/blog/page.tsx** (author object, travelType, excuseKey, …), **blog/[slug]/page.tsx**, **components/tripper/blog/types.ts** (blocks, authorHandle, …) | Several **different shapes**: full post (core vs blog), card (blog-types), page-specific. |

**Recommendation:**  
- Choose one **canonical** full post type: either extend core `BlogPost` with blocks/format/faq or make types/blog.ts the canonical and re-export from core.  
- Use a distinct name for card/minimal (e.g. `BlogPostCard`) in blog-types and pages.  
- Replace local `BlogPost` interfaces in pages with the canonical type or a Pick<> of it.

---

## 7. API & DB

| Type | In core | Also defined in | Notes |
|------|---------|-----------------|--------|
| ApiResponse | success, data?, error?, message? | — | Only in core. |
| PaginatedResponse | extends ApiResponse<T[]>, pagination | **lib/db/database.ts** (data: T[], pagination; no success/error/message) | Different: core is API wrapper; db is plain list + pagination. Keep both or add `PaginatedResult<T>` in core for “data + pagination” and use in DB. |

**Recommendation:**  
- Keep core `PaginatedResponse` for API responses.  
- In database.ts either keep current interface or import a `PaginatedResult<T>` from core if you add it (same shape as current db PaginatedResponse).

---

## 8. Form & validation

| Type | In core | Also defined in | Notes |
|------|---------|-----------------|--------|
| FormField, FormState | core | — | Only in core. |

**Action:** None.

---

## 9. Other renames to avoid confusion

- **lib/data/travelerTypes.ts:** `TravelerType` is an **interface** (title, description, imageUrl, …). Rename to `TravelerTypeCard` or `TravelerTypeConfig` so it doesn’t clash with core `TravelerType` (slug union).

---

## 10. Who uses core.ts today

- **store/types.ts** imports from `@/types/core`: User, UserPreferences, JourneyState, JourneyLogistics, JourneyFilters, AddonsState, TripperState, TripperRoute, Earning, BlogPost.  
- Actual slices (userStore, journeyStore, tripperStore) define or import from other files; aligning them with store/types implies aligning them with core (or moving store/types to import from the same sources as the slices).

---

## Suggested next steps (priority)

1. **Low-risk:** roles.ts use `UserRole` from core + `UserRoleOrNull`; NavbarProfile use `Pick<User, 'name'|'avatar'|'role'>` from core.  
2. **Low-risk:** journeyStore import LevelSlug, AddonUnit, AddonSelection, AddonsState, JourneyState (and optionally JourneyLogistics, JourneyFilters) from core; remove local type definitions that match.  
3. **Low-risk:** userStore import User, UserSocials, UserMetrics, UserRole, BudgetLevel, UserPreferences from core; keep UserPrefs as alias of UserPreferences; defer TravelerType migration (ES → EN).  
4. **Rename:** lib/data/travelerTypes.ts `TravelerType` → `TravelerTypeCard` (or similar) and update consumers.  
5. **Design decision:** Single canonical BlogPost (core vs types/blog) and introduce BlogPostCard for minimal shape.  
6. **Design decision:** Tripper types: either “core = domain, tripper = API” and map in slice, or “tripper = single source” and have store/types import from tripper.
