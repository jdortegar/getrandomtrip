# Spec: Tripper ↔ Experience Linking

## Change Name
`tripper-experience-linking`

## Status
`spec-ready`

---

## 1. Context

`TripRequest` carries no record of which tripper initiated the booking. The tripper landing page renders static/mock data. The journey wizard is generic regardless of entry point. Admin assigns destinations manually. This spec defines what must be true after the change is applied — it does NOT prescribe implementation.

---

## 2. Glossary

| Term | Definition |
|---|---|
| `ACTIVE` experience | `Experience.status = ExperienceStatus.ACTIVE`. The only status treated as published/approved throughout this change. Never "APPROVED". |
| Tripper slug | `User.tripperSlug` — the URL segment identifying a tripper (e.g. `dawson`). |
| `tripperId` | New nullable FK on `TripRequest` → `User.id`. Does not exist in the current schema. |
| Curated journey | A journey session that entered via `?tripper=<slug>`, resulting in filtered and branded UI. |
| Direct journey | A journey session with no `?tripper` param — all existing behavior preserved. |

---

## 3. Schema Delta

### 3.1 `TripRequest` — new field

`TripRequest` MUST gain a nullable foreign key to `User`:

- Field name: `tripperId`
- Type: `String?` (nullable)
- Relation: `TripRequest.tripper → User` (many-to-one, optional)
- On delete: `SetNull` (TripRequest survives if the User is deleted)
- The field is nullable from day one; all existing rows remain valid with `tripperId = null`.

### 3.2 `TripRequest` — reused fields

The following fields ALREADY exist and are reused without schema changes:

- `experienceId String?` — assigned experience
- `actualDestination String?` — derived from `experience.destinationCity + destinationCountry` at reveal time; NOT set by admin during experience assignment

### 3.3 No other schema changes

`Experience`, `User`, `BlogPost`, and all other models are unchanged.

---

## 4. Behavioral Requirements

### 4.1 Tripper Landing Page (`/trippers/[slug]`)

**Experience types carousel**

- MUST display only experience types that appear in the tripper's ACTIVE experiences.
- Types MUST be de-duplicated (each distinct value from `Experience.type[]` appears at most once).
- If the tripper has zero ACTIVE experiences, the carousel section MUST render a graceful empty state (no section hidden silently, no mock data shown).
- MUST NOT display experiences with any status other than `ACTIVE`.

**Blog section**

- MUST display only `BlogPost` records with `status = BlogStatus.PUBLISHED` authored by this tripper.
- If the tripper has zero published posts, the blog section MUST be hidden entirely.
- MUST NOT render mock/static blog data regardless of published post count.

### 4.2 Journey — Tripper Attribution on TripRequest Creation

- When the journey URL contains `?tripper=<slug>` at the time a `TripRequest` is created or first saved, `TripRequest.tripperId` MUST be set to the `User.id` of the tripper whose `tripperSlug` matches the param.
- If the slug does not match any `User.tripperSlug`, `tripperId` MUST remain `null` (no error thrown to the client).
- `tripperId` MUST NOT change after the request is created, even if the user navigates away and returns.
- Journey sessions without `?tripper` param MUST leave `tripperId = null`.

### 4.3 Journey — Filtered Trip Type Cards (Curated Journey)

- In a curated journey, the trip type selection step MUST show only types for which the tripper has at least one ACTIVE experience.
- Filtering uses `Experience.type` (which is `String[]`): a type is available if any ACTIVE experience owned by the tripper has that type value in its array.
- If the tripper has ACTIVE experiences for zero types, the step MUST render a graceful empty state.

### 4.4 Journey — Filtered Level Options (Curated Journey)

- After a trip type is selected in a curated journey, the level selection MUST show only levels for which the tripper has at least one ACTIVE experience matching both the selected type AND that level.
- A level is available if `experience.status = ACTIVE AND experience.type has selectedType AND experience.level = levelValue`.
- If no levels qualify, the step MUST render a graceful empty state.

### 4.5 Journey — Tripper Branding in Header (Curated Journey)

- The journey `HeaderHero` MUST display a "VIAJE CURADO POR [TRIPPER NAME]" badge alongside the tripper's avatar when `?tripper` is present and resolves to a valid tripper.
- If the slug does not resolve, the badge MUST NOT appear (degrade to standard header).

### 4.6 Journey — Tripper Branding on Trip Type Cards (Curated Journey)

- Each trip type card in a curated journey MUST display "BY TRIPPER [NAME]" and the tripper's avatar.
- Cards in a direct journey (no `?tripper`) MUST NOT display tripper branding.

### 4.7 Journey — Direct Access (No Tripper Param)

- Without `?tripper`, ALL trip types and ALL levels MUST be shown (current behavior unchanged).
- No branding, no filtering.

### 4.8 Admin — Assign Experience to Trip Request

When an admin opens `AdminTripEditModal` for a confirmed trip request:

**Experience dropdown availability**

The dropdown MUST show ACTIVE experiences that satisfy ALL of:
1. `experience.status = ExperienceStatus.ACTIVE`
2. `experience.ownerId = tripRequest.tripperId` (only the attributed tripper's experiences)
3. `experience.type has tripRequest.type` (array-contains, not equality)
4. `experience.level = tripRequest.level`

If `tripRequest.tripperId` is null, the dropdown MUST either be hidden or show a "no tripper attributed" message — it MUST NOT show experiences from all trippers.

**Dropdown option display**

Each option MUST show: `[experience.title] — [experience.destinationCity], [experience.destinationCountry]`

**On save**

- `TripRequest.experienceId` MUST be updated to the selected experience's id.
- `TripRequest.actualDestination` MUST NOT be set by the admin save action.
- `actualDestination` is derived from `experience.destinationCity` and `experience.destinationCountry` at reveal time (outside this change's scope, but the admin save must not interfere with this contract).

### 4.9 Tripper OS — Earnings Attribution

- Trip requests where `TripRequest.tripperId = tripper.userId` MUST be counted toward that tripper's booking and earnings stats.
- This attribution applies from the moment the trip request is created — before any experience is assigned.
- Trip requests with `tripperId = null` MUST NOT appear in any tripper's stats.
- After an experience is assigned (`experienceId` set), the attributing `tripperId` does not change; both the FK and the `experience.ownerId` should agree but `tripperId` is the authoritative attribution field for the Tripper OS.

---

## 5. Invariants

These must hold at all times after the change is applied:

- `ExperienceStatus.ACTIVE` is the only status that surfaces experiences in any user-facing or admin-facing query within this change.
- `Experience.type` is always queried with array-contains semantics (`{ has: value }`), never with equality.
- `tripperId` is write-once at trip request creation; no update path is introduced by this change.
- Existing `TripRequest` rows with `tripperId = null` continue to function correctly in all flows (direct journey, admin, stats).
- `actualDestination` is never set by the admin experience assignment action.

---

## 6. Acceptance Scenarios

### S1 — Tripper landing: experience carousel from real data

**Given** a tripper with `tripperSlug = "alma"` has three ACTIVE experiences with types `["couple", "solo"]`, `["family"]`, `["couple"]`
**When** a visitor loads `/trippers/alma`
**Then** the experience types carousel shows exactly three distinct type values: `couple`, `solo`, `family` (de-duplicated; order is implementation-defined)
**And** no experience with status other than `ACTIVE` contributes to the carousel

### S2 — Tripper landing: zero ACTIVE experiences

**Given** a tripper has no experiences with `status = ACTIVE`
**When** a visitor loads their landing page
**Then** the experience types carousel renders a graceful empty state
**And** no mock data is shown

### S3 — Tripper landing: blog section hidden when no published posts

**Given** a tripper has no `BlogPost` records with `status = PUBLISHED`
**When** a visitor loads their landing page
**Then** the blog section is not rendered
**And** no static/mock blog content appears

### S4 — Tripper landing: blog posts shown when published

**Given** a tripper has two `BlogPost` records with `status = PUBLISHED`
**When** a visitor loads their landing page
**Then** exactly those two posts appear in the blog section

### S5 — Journey: tripperId set on TripRequest creation

**Given** a user navigates to the journey page with `?tripper=dawson`
**And** `User.tripperSlug = "dawson"` exists
**When** the user completes the first step and the TripRequest is created
**Then** `TripRequest.tripperId = User.id` (the matched tripper's user id)

### S6 — Journey: unresolvable slug leaves tripperId null

**Given** the journey URL contains `?tripper=nonexistent`
**When** the TripRequest is created
**Then** `TripRequest.tripperId = null`
**And** the journey proceeds without tripper branding or filtering

### S7 — Journey: no tripper param preserves current behavior

**Given** the journey URL has no `?tripper` param
**When** the client reaches the trip type selection step
**Then** all trip types are shown
**And** no tripper branding is shown

### S8 — Journey: filtered trip type cards in curated journey

**Given** tripper "dawson" has ACTIVE experiences for types `["solo", "couple"]` only
**And** the journey URL contains `?tripper=dawson`
**When** the client reaches the trip type selection step
**Then** only `solo` and `couple` cards are rendered
**And** each card shows "BY TRIPPER DAWSON" and the tripper's avatar

### S9 — Journey: empty state when tripper has no ACTIVE experiences

**Given** tripper "dawson" has no ACTIVE experiences
**And** the journey URL contains `?tripper=dawson`
**When** the client reaches the trip type selection step
**Then** a graceful empty state is rendered instead of type cards

### S10 — Journey: filtered level options

**Given** tripper "dawson" has ACTIVE experiences for type `"solo"` at levels `"essenza"` and `"modo-explora"` only
**And** the journey URL contains `?tripper=dawson`
**When** the client selects trip type `"solo"`
**Then** only levels `essenza` and `modo-explora` are shown in the level selection step

### S11 — Journey: tripper badge in header

**Given** the journey URL contains `?tripper=dawson`
**And** the tripper is resolved
**When** the journey header renders
**Then** a "VIAJE CURADO POR [TRIPPER NAME]" badge with the tripper's avatar is visible

### S12 — Admin: experience dropdown filtered correctly

**Given** a TripRequest with `type = "couple"`, `level = "essenza"`, `tripperId = "usr_abc"`
**And** tripper `usr_abc` has:
  - Experience A: `status = ACTIVE, type = ["couple", "solo"], level = "essenza"` → qualifies
  - Experience B: `status = ACTIVE, type = ["couple"], level = "modo-explora"` → excluded (wrong level)
  - Experience C: `status = PENDING_REVIEW, type = ["couple"], level = "essenza"` → excluded (not ACTIVE)
  - Experience D: `status = ACTIVE, type = ["family"], level = "essenza"`, `ownerId = "usr_xyz"` → excluded (wrong owner and type)
**When** an admin opens AdminTripEditModal for this TripRequest
**Then** only Experience A appears in the dropdown

### S13 — Admin: experience dropdown hidden when tripperId is null

**Given** a TripRequest with `tripperId = null`
**When** an admin opens AdminTripEditModal
**Then** the experience assignment dropdown is hidden or shows a "no tripper attributed" message
**And** no experiences are listed

### S14 — Admin: save sets experienceId, does not set actualDestination

**Given** an admin selects Experience A in the dropdown and saves
**When** the save action completes
**Then** `TripRequest.experienceId = Experience A's id`
**And** `TripRequest.actualDestination` is unchanged (null or its previous value)

### S15 — Tripper OS: earnings attributed via tripperId

**Given** a TripRequest with `tripperId = "usr_abc"` and `status = CONFIRMED`
**When** the Tripper OS loads stats for tripper `usr_abc`
**Then** this TripRequest is counted in their bookings and earnings

### S16 — Tripper OS: no attribution for null tripperId

**Given** a TripRequest with `tripperId = null`
**When** the Tripper OS loads stats for any tripper
**Then** this TripRequest does not appear in any tripper's stats

---

## 7. Out of Scope

- Experience approval state machine (`ExperienceStatus` transitions) — owned by `experience-review-lifecycle`.
- `TripperPlanner` changes (already emits `tripper`/`originCity`/`originCountry` params).
- XSED / Sunday-drop matching logic.
- Payment, commission-rate, or payout calculations.
- Setting `actualDestination` — happens at reveal time, outside this change.
- UI language / copy decisions (e.g. exact badge wording in locale dictionaries) — implementation concern, not spec.

---

## 8. Risks and Assumptions

| # | Risk / Assumption | Decision |
|---|---|---|
| R1 | `ExperienceStatus.ACTIVE` is the approved state | Confirmed from schema. Use `ACTIVE` everywhere, never "APPROVED". |
| R2 | `Experience.type` is `String[]` | Filter queries MUST use `{ has: value }` (Prisma array-contains). |
| R3 | Tripper has zero ACTIVE experiences | Spec requires graceful empty state, NOT a fallback to all types. |
| R4 | `tripperId` null on existing rows | Nullable FK; all existing flows continue unmodified. |
| R5 | `actualDestination` vs experience destination | Admin save sets `experienceId` only; reveal logic derives destination separately. |
| R6 | Multiple tripper roles in one User | Not possible — schema uses `tripperSlug` uniqueness; one slug per user. |
