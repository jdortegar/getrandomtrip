# Design: Admin-Owned (RandomTrip) Experiences

## Technical Approach

Add one immutable, server-derived ownership signal — `source: ExperienceSource` (`TRIPPER | RANDOMTRIP`) — to the `Experience` model, and thread it through the three layers that already exist for experience authoring instead of building a parallel admin stack:

1. **Data**: new `enum ExperienceSource` + `source` field on `Experience` (`@default(TRIPPER)`), shipped via `prisma db push` (this repo has **no** migration files — see Decision "Schema delivery"). A standalone one-time backfill script retags existing XSED drops to `RANDOMTRIP`.
2. **API**: `POST /api/tripper/experiences` and `POST /api/tripper/experiences/[id]/submit` become **role/source-aware**. The POST derives `source` from the authenticated caller's roles (admin → `RANDOMTRIP`, otherwise `TRIPPER`); the submit finalizer branches on the row's `source` (RANDOMTRIP → straight to `ACTIVE`, no `PENDING_REVIEW`, no submitted-email; TRIPPER → today's `PENDING_REVIEW` path). `source` is never read from the request body.
3. **UI**: reuse the existing multi-step `NewExperienceShell` via a new `mode: "adminCreate"`, mounted at a new admin route `dashboard/admin/experiences/new`, reachable from a new "New Experience" admin nav tab that mirrors the XSED "New Drop" tab.
4. **Attribution**: `reviews/route.ts` switches commission attribution from the drift-prone `owner.roles.includes("TRIPPER")` to the authoritative `experience.source === "TRIPPER"`.

Cross-checked against the proposal's 11 locked decisions. Two reconciliations the proposal could not know (verified against current code):

1. **No commission field in the active form** — `commission` is a `User`-level rate (Tripper Settings), and `CapacityPricingStep`/`CapacityDurationStep` are dead code (not wired into any tab). So "hide the commission field for admin" is a UI no-op; the *real* commission omission for RANDOMTRIP is enforced solely in `reviews/route.ts` (see Decision "Commission").
2. **A live pricing step DOES exist — but not in the create wizard.** The tripper "New Experience" wizard (`NewExperienceShell` mode `"tripper"`, tabs `about`/`logistics`/`activities`) has no price input; trippers never set price. Pricing is set later, during **admin review**, by `AdminReviewSlot` (the `admin-pricing` / "Pricing & approval" step), which `NewExperienceShell` renders *only* when an `adminReviewSlot` prop is passed (only `AdminExperienceReviewClient` does this). It shows one editable price per non-XSED traveler-type, **preset from `getBasePricePerPerson(type, level)`** — a fixed config value in `PRICE_BY_TYPE_AND_LEVEL` (`src/lib/data/traveler-types/index.ts:112`); on approve it is stored as `Experience.pricingByType` (JSON). Commission is NOT part of this step at all — it is a tripper-only rate applied downstream at checkout/attribution. Because `mode="adminCreate"` does not pass `adminReviewSlot`, the pricing step is **already absent** from the admin create flow (no hide-code needed). The real consequence is that RANDOMTRIP rows skip the entire review pipeline where `pricingByType` is normally set → they would reach `ACTIVE` **unpriced** (`pricingByType: null`). See Decision "RANDOMTRIP pricing" and Open Questions.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|---|---|---|---|
| Ownership signal | Add `enum ExperienceSource { TRIPPER RANDOMTRIP }` + `source ExperienceSource @default(TRIPPER)` on `Experience`, placed right after `status` (schema line ~163). | Reuse `type: ["XSED"]`; derive from `owner.roles` at read time. | `type` is an overloaded travel-category array; `owner.roles` is mutable and can drift (a tripper promoted to admin would flip attribution retroactively). `source` is a single immutable ownership fact set once at creation. |
| Schema delivery | Edit `schema.prisma`, apply with `npm run db:push`. Additive nullable-with-default column → zero-downtime, no data migration. | `prisma migrate dev` generating a `migration.sql`. | This repo does **not** use migration files (`prisma/migrations/` holds only `.gitkeep`; `db:migrate` is aliased to `prisma db push` in package.json). Introducing a lone migration would fracture the workflow. |
| Backfill mechanism | Standalone script `scripts/backfill-experience-source.ts` run via `npx tsx`, added as `db:backfill-source` in package.json. Uses `prisma.experience.updateMany({ where: { type: { has: "XSED" } }, data: { source: "RANDOMTRIP" } })`; logs matched count before/after. | Hand-edited `migration.sql`; put it in `prisma/seed.ts`. | No migration file exists to hand-edit. `seed.ts` is for full-DB seeding, not a targeted one-time backfill. `scripts/*.ts` + `npx tsx` is the established pattern here (e.g. `scripts/grant-all-roles-to-all-users.ts` → `db:grant-all-roles`). `type: { has: "XSED" }` is Prisma's exact array-element match — equivalent to `'XSED' = ANY(type)`, avoiding substring false positives. Idempotent + reversible (`SET source: "TRIPPER"` to undo). |
| Role-aware create | In `POST /api/tripper/experiences`, compute `isAdmin = getAppRoles(user).includes("admin")`. Set `source: isAdmin ? "RANDOMTRIP" : "TRIPPER"`. Ignore any `source` in the body (the `ExperienceFormDraft` type has no `source` field, so it's already untyped/dropped — do **not** add it). Initial `status` stays `"DRAFT"` for both roles. | Set `status: "ACTIVE"` for admin at create time; add a separate `POST /api/admin/experiences`. | Autosave fires on the first keystroke; creating an `ACTIVE` row immediately would publish a near-empty experience publicly. Keeping create as `DRAFT` for both roles preserves the safe autosave contract; the `ACTIVE` flip happens only at the explicit finalize step. A separate endpoint duplicates ~35 lines of create logic the proposal explicitly forbids. |
| Auto-publish path | Make `POST /api/tripper/experiences/[id]/submit` branch on the loaded row's `source`: `RANDOMTRIP` → `status: "ACTIVE"` (skip `PENDING_REVIEW`, skip `sendExperienceSubmitted`); `TRIPPER` → unchanged (`PENDING_REVIEW` + email). Completeness validation (`getExperienceCompleteness`) runs for **both**. | A dedicated admin publish endpoint; branch on caller role instead of `source`. | Branching on `source` keeps the "source is the source of truth" invariant and reuses the shared completeness gate (admin experiences still must be complete before going live). Branching on live caller role would re-introduce the mutable-role drift `source` was added to eliminate. NOTE: the proposal's Affected-Areas table does not list this route, but it is the mechanically necessary home for the locked "auto-publish DRAFT → ACTIVE" decision — flagged in Open Questions. |
| Form reuse | Add `mode: "adminCreate"` to `NewExperienceShell`. Editable (not read-only); autosave uses the existing tripper POST/PATCH branch unchanged; `handleRequestSubmit` gate widens to allow `adminCreate`; `confirmSubmit` finalize calls the same `/submit` (which now auto-activates for RANDOMTRIP) and redirects to `/dashboard/admin/experiences` instead of the tripper list. | New bespoke `AdminNewExperienceShell`; add `adminCreate` handling into XsedDropShell. | Duplicating the ~740-line shell violates the "reuse, don't duplicate" mandate and would immediately drift from the tripper form. XsedDropShell is a different, XSED-specific form. |
| Commission | No UI change — the active form has **no** commission field (`CapacityPricingStep`/`CapacityDurationStep` are dead; `commission` lives on `User`). The only behavioral commission change is in `reviews/route.ts`: RANDOMTRIP experiences yield `effectiveTripperId = null` (no tripper cut). | Add-then-hide a commission input for the admin path. | The locked "hide commission for admin" decision assumed a field that does not exist. Faithful implementation = ensure RANDOMTRIP rows attribute no tripper commission, which `source`-based attribution already achieves. |
| RANDOMTRIP pricing (see Open Questions) | The pricing step (`AdminReviewSlot`) lives in the review slot, which `adminCreate` never renders — so it is omitted automatically. To avoid publishing an unpriced row, derive `pricingByType` inside the `/submit` finalizer for RANDOMTRIP: for each non-XSED `type`, `pricingByType[t] = getBasePricePerPerson(t, level)`, with **no** commission add-on. Reuses the exact preset the admin review pre-fills. | (a) Leave `pricingByType: null` — genuinely unpriced. (b) Add a pricing tab to the `adminCreate` wizard so the admin types prices manually. (c) Compute price at read-time everywhere from `getBasePricePerPerson`. | Trippers never set price today, so parity says admin shouldn't type it either — the base config value IS the price. Commission is a tripper-only concept and is correctly excluded (consistent with `reviews/route.ts` giving RANDOMTRIP no tripper cut). (a) risks a live ACTIVE experience with no price (likely breaks checkout). (b) adds UI the tripper flow never had. (c) scatters pricing logic instead of persisting a stored value like the tripper path does. **Flagged: proposal did not specify RANDOMTRIP pricing — confirm before implementing.** |
| Reviews attribution | Replace `owner?.roles?.includes("TRIPPER")` with `experience.source === "TRIPPER"`; drop the now-unused `owner: { select: { roles: true } }` sub-select, replacing it with `source: true` (keep `ownerId: true`). | Keep the `owner.roles` join and also read `source`. | Nothing else in the route uses `owner.roles`; dropping the relation select removes a join and the exact class of drift being eliminated. |
| Admin nav entry | Add a "New Experience" tab to `buildAdminNavTabs` → `base("/experiences/new")`, icon `PackagePlus`, placed adjacent to the existing "Experiences" list tab. Keep the list tab non-exact. | Make the list tab `exact: true`; route the create page at a non-nested path like `/dashboard/admin/new-experience`. | `isActive` (DashboardNavTabs L26-31) prefix-matches, so on `/experiences/new` both the list and new tabs render active — acceptable section-highlight behavior. Making the list tab exact would drop its active state on `/experiences/[id]` review pages (regression). A non-nested route breaks parity with `/dashboard/tripper/experiences/new` and needs an extra heading mapping. |

## Interfaces / Contracts

### Prisma (`prisma/schema.prisma`)
```prisma
enum ExperienceSource {
  TRIPPER
  RANDOMTRIP
}

model Experience {
  id      String           @id @default(cuid())
  ownerId String
  status  ExperienceStatus @default(DRAFT)
  source  ExperienceSource @default(TRIPPER) // immutable ownership signal, server-derived at create
  // ...unchanged...
}
```

### `POST /api/tripper/experiences` (create) — role-aware delta
```ts
const isAdmin = getAppRoles(user).includes("admin"); // NOTE: hasRoleAccess(user,"tripper") is true for admins too — do NOT use it to branch
// guard stays hasRoleAccess(user, "tripper") (admins pass); body.source is ignored (not in ExperienceFormDraft)
const experience = await prisma.experience.create({
  data: {
    ownerId: user.id,
    createdById: user.id,
    status: "DRAFT",
    source: isAdmin ? "RANDOMTRIP" : "TRIPPER",
    // ...all existing fields unchanged...
  },
  select: { id: true },
});
```

### `POST /api/tripper/experiences/[id]/submit` — finalize delta
```ts
// after loading `experience` (add `source` to what is read) and running getExperienceCompleteness:
const isRandomtrip = experience.source === "RANDOMTRIP";
const targetStatus = isRandomtrip ? "ACTIVE" : "PENDING_REVIEW";
// RANDOMTRIP skips admin review (where pricingByType is normally set), so derive it here
// from the same fixed-config preset the admin review pre-fills — NO commission add-on.
// (Pending confirmation — see Open Questions.)
import { getBasePricePerPerson } from "@/lib/data/traveler-types";
const pricingByType = isRandomtrip
  ? Object.fromEntries(
      (experience.type as string[])
        .filter((t) => t !== "XSED")
        .map((t) => [t, getBasePricePerPerson(t, experience.level)]),
    )
  : undefined; // TRIPPER path leaves pricing to admin review
// update: status: targetStatus, reviewNote: null (unchanged),
//         ...(pricingByType && { pricingByType })
// send sendExperienceSubmitted(...) ONLY when targetStatus === "PENDING_REVIEW"
```

### `POST /api/reviews` — attribution delta (lines ~33-37, ~82)
```ts
// findUnique select.experience:  { ownerId: true, source: true }   // was { ownerId: true, owner: { select: { roles: true } } }
// ...
const ownerIsTripper = tripRequest.experience.source === "TRIPPER"; // was owner?.roles?.includes("TRIPPER")
```

### `NewExperienceShell` — new mode
```ts
export type ExperienceShellMode = "tripper" | "adminCreate" | "adminEdit" | "adminReadOnly";
```
Touch points inside `NewExperienceShell.tsx`:
- `handleRequestSubmit` (L417): `if (mode !== "tripper" && mode !== "adminCreate") return;`
- `confirmSubmit` (L493): redirect target becomes role-aware — `mode === "adminCreate" ? .../dashboard/admin/experiences : .../dashboard/tripper/experiences`.
- Finalize/submit CTA + confirm-modal copy: accept optional `finalizeCopy` override props (`submitLabel`, `confirmTitle`, `confirmBody`) so admin reads "Publish"/publish-confirm copy; hide the tripper-note textarea when `mode === "adminCreate"`.
- `persistDraft` / autosave: **no change** — `adminCreate` falls through to the existing tripper POST/PATCH branch (which now derives `source` server-side).
- `isReadOnly`: **no change** — `adminCreate` is not read-only.
- Pricing step (`AdminReviewSlot` / `admin-pricing` tab): **no shell change** — it renders only when `adminReviewSlot` is passed (the `ADMIN_TAB` guard at L110/L135). `adminCreate` never passes that prop, so the pricing step is omitted by construction. Pricing for RANDOMTRIP is instead derived server-side in `/submit` (see the submit delta + Decision "RANDOMTRIP pricing"). Do NOT add a pricing tab to the create wizard.

### Admin route (new file)
`src/app/[locale]/(secure)/dashboard/admin/experiences/new/page.tsx` — server component mirroring the tripper `new/page.tsx` + admin `xsed/new/page.tsx`:
```tsx
// requireAdmin: session + hasRoleAccess(user,"admin") else redirect to /dashboard
// locale via hasLocale(); dict = await getDictionary(locale)
return (
  <NewExperienceShell
    mode="adminCreate"
    dict={dict.tripperExperiences.form}
    finalizeCopy={dict.adminDashboard.newExperience}
    locale={locale}
    userBadgeLabels={dict.journey.userBadge}
  />
);
```

### Nav (`src/components/app/dashboard/config/adminNav.ts`)
Add after the `experiences` tab:
```ts
{ href: base("/experiences/new"), icon: PackagePlus, label: copy.newExperience },
```

### Dictionary types (`src/lib/types/dictionary.ts`, `AdminDashboardDict`)
```ts
nav: { /* ...existing... */ newExperience: string; }
pageHeadings: { /* ...existing... */ experiencesNew: { description: string; title: string }; }
newExperience: { submitLabel: string; confirmTitle: string; confirmBody: string };
```
And an `admin/experiences/new` entry in `adminHeadings` config (mirrors `xsedNew`).

### Dictionary strings (`src/dictionaries/es.json` + `en.json`, both required)
Under `adminDashboard`:
- `nav.newExperience` — es "Nueva experiencia" / en "New Experience"
- `pageHeadings.experiencesNew.{title,description}`
- `newExperience.submitLabel` — es "Publicar" / en "Publish"
- `newExperience.confirmTitle`, `newExperience.confirmBody` — publish confirmation copy

## Data Flow
```
admin clicks "New Experience" tab
  → /[locale]/dashboard/admin/experiences/new (server: requireAdmin, getDictionary)
    → <NewExperienceShell mode="adminCreate">
        autosave  → POST /api/tripper/experiences        (isAdmin ⇒ source=RANDOMTRIP, status=DRAFT)
                  → PATCH /api/tripper/experiences/[id]   (subsequent autosaves)
        Publish   → POST /api/tripper/experiences/[id]/submit
                     → getExperienceCompleteness (shared gate)
                     → source==="RANDOMTRIP" ⇒ status=ACTIVE (no email, no PENDING_REVIEW)
                        + derive pricingByType from getBasePricePerPerson(type,level)  [pending confirmation]
                  → router.push /[locale]/dashboard/admin/experiences

review submitted → POST /api/reviews
  → experience.source === "TRIPPER" ? effectiveTripperId = ownerId : null   (RANDOMTRIP ⇒ no tripper commission)
```

## File Changes
| File | Action | Notes |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add `enum ExperienceSource`; add `source` field after `status` on `Experience`. Apply via `npm run db:push`. |
| `scripts/backfill-experience-source.ts` | Create | One-time `updateMany` XSED → `RANDOMTRIP`; logs counts. |
| `package.json` | Modify | Add `"db:backfill-source": "npx tsx scripts/backfill-experience-source.ts"`. |
| `src/app/api/tripper/experiences/route.ts` | Modify | Derive `source` from `getAppRoles`; add to `create.data`. |
| `src/app/api/tripper/experiences/[id]/submit/route.ts` | Modify | Read `source` + `level`; branch target status; gate email; for RANDOMTRIP derive `pricingByType` via `getBasePricePerPerson` (pending confirmation — see Open Questions). |
| `src/lib/data/traveler-types/index.ts` | Read-only (import) | Source of `getBasePricePerPerson` (fixed base price per type/level); imported by the submit route for RANDOMTRIP pricing. No change. |
| `src/app/[locale]/(secure)/dashboard/admin/AdminReviewSlot.tsx` | No change | The live pricing step. Rendered only via `adminReviewSlot` (admin review of tripper submissions); NOT reached by `adminCreate`. Listed for clarity — must NOT be added to the create wizard. |
| `src/components/app/dashboard/tripper/experiences/steps/CapacityPricingStep.tsx` | No change (dead) | Confirmed unused (only renders `estimatedCost`, not wired into any tab). Not the live pricing step. Out of scope. |
| `src/app/api/reviews/route.ts` | Modify | Swap `owner.roles` select+check for `source`. |
| `src/components/app/dashboard/tripper/experiences/NewExperienceShell.tsx` | Modify | Add `adminCreate` mode + `finalizeCopy` props + redirect/gate/copy branches. |
| `src/app/[locale]/(secure)/dashboard/admin/experiences/new/page.tsx` | Create | Admin server page rendering the shell in `adminCreate` mode. |
| `src/components/app/dashboard/config/adminNav.ts` | Modify | Add "New Experience" tab (`PackagePlus`). |
| `src/components/app/dashboard/config/adminHeadings.ts` | Modify | Add `experiences/new` heading mapping. |
| `src/lib/types/dictionary.ts` | Modify | Extend `AdminDashboardDict` (`nav.newExperience`, `pageHeadings.experiencesNew`, `newExperience`). |
| `src/dictionaries/es.json` + `en.json` | Modify | New `adminDashboard` keys in both locales. |

## Testing Strategy
| Layer | What | Approach |
|---|---|---|
| Type | New enum + dict keys wire through; `ExperienceShellMode` union widens without breaking existing modes | `npm run typecheck` |
| Lint | No raw `<img>`, no inline styles, design-system compliance on new page | `npm run lint` |
| Backfill | Count of `type has XSED` matches count of `source=RANDOMTRIP` after run; re-run is a no-op | Log-and-verify before/after; run twice |
| Manual — admin | Create → autosave persists `DRAFT`/`RANDOMTRIP`; wizard shows NO pricing tab (only about/logistics/activities); Publish → `ACTIVE` with no `PENDING_REVIEW`; `pricingByType` set from base config per non-XSED type (if resolution confirmed); redirect to admin list; no commission field shown | QA at ≥360px + ≥1280px |
| Manual — tripper | Unchanged: `DRAFT`→`PENDING_REVIEW`, submitted email fires, approval pipeline intact | Regression pass |
| Manual — reviews | RANDOMTRIP-experience review ⇒ no tripper attribution; tripper-experience review ⇒ attribution preserved | Token-based submit for one of each |

## Migration / Rollout
1. Merge schema + code. 2. `npm run db:push` (additive, safe default). 3. `npm run db:backfill-source` once. Order-independent for correctness but run backfill after push. Rollback: revert commits; column is additive with a safe default so it can linger harmlessly, or drop via `db:push` after removing the field. Backfill reverse: same script with `source: "TRIPPER"`. Caveat (from proposal): reconcile any admin-created `RANDOMTRIP` generic rows before a full rollback, since reverting removes their distinguishing marker.

## Open Questions
- [ ] The `/submit` route change is not in the proposal's Affected-Areas table but is the mechanically necessary home for the locked "auto-publish DRAFT → ACTIVE" decision. Confirm `sdd-tasks` includes it (recommended) vs. a separate admin publish endpoint.
- [ ] Dual active-tab highlight on `/experiences/new` (both "Experiences" and "New Experience" light up) — accept as section highlighting, or add a dedicated non-nested route? Recommend accept.
- [ ] Commission is a UI no-op (no field exists). Confirm the locked "hide commission" success criterion is verified as "RANDOMTRIP attributes no tripper commission" (`reviews/route.ts`) rather than a hidden input.
- [ ] **RANDOMTRIP pricing (unresolved — proposal is silent):** RANDOMTRIP rows skip admin review, where `pricingByType` is normally set, so without action they publish `ACTIVE` with `pricingByType: null` (likely breaks checkout). Recommended: derive `pricingByType` in `/submit` from `getBasePricePerPerson(type, level)` per non-XSED type, no commission add-on — the same preset the admin review pre-fills. Confirm this vs. leaving it unpriced or adding a manual pricing tab to the create wizard. `sdd-tasks` must not proceed on the price behavior until this is chosen.
- [ ] `finalizeCopy` override plumbing vs. reusing existing `dict.submitConfirm*` keys with an admin variant — minor; `sdd-tasks` can pick the lighter option.
