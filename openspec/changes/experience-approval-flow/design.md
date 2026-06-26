# Design: Experience Approval Flow

## Approach

This change adds an editorial gate to the experience lifecycle without introducing a new
service layer. It stays inside the existing architecture: thin App Router route handlers per
action, Prisma as the single source of truth for status, and client components that read a
status field to switch UX modes. No state machine library, no workflow engine — the
lifecycle is three enum values and three guarded transitions, each enforced at its own API
boundary.

Three architectural decisions drive the rest of the design:

1. **One route handler per transition (verb-as-resource), not a generic PATCH.** Submit,
   approve, and reject each have distinct auth (tripper-owns vs admin), distinct preconditions
   (source status), and distinct side effects (completeness check vs pricing write vs note
   write). Folding them into the existing PATCH would force a soup of conditional auth and
   validation. Each gets its own `POST .../[id]/{action}` endpoint. This mirrors the existing
   admin pattern (`/api/admin/xsed`) where actions are explicit endpoints with a local
   `requireAdmin()` guard.

2. **Status is the single UX driver on the tripper side.** The form does not gain a separate
   "locked" flag. `status === "PENDING_REVIEW"` derives read-only; `status === "DRAFT" &&
   reviewNote` derives the rejection banner. State stays in one field, so there is no risk of
   a "locked but DRAFT" or "editable but PENDING" contradiction.

3. **`pricingByType` is admin-owned, validated at the boundary.** Because Prisma cannot
   enforce the shape of a `Json` column, the approve endpoint is the gate: it rejects any
   payload whose keys do not exactly match the experience's `type[]` array. This keeps the
   "no schema enforcement on Json" risk contained to one validated function instead of
   spreading optimistic trust across readers.

Pattern: **layered guard → precondition → mutation** inside each handler, identical structure
across the three new endpoints so they read the same and fail the same way.

## Schema Changes

`prisma/schema.prisma`

### Enum

```prisma
enum ExperienceStatus {
  DRAFT
  PENDING_REVIEW   // NEW — submitted by tripper, awaiting admin decision
  ACTIVE
  INACTIVE
  ARCHIVED
}
```

`PENDING_REVIEW` is inserted after `DRAFT` to read in lifecycle order. Enum value ordering is
cosmetic in PostgreSQL but keeps the file self-documenting.

### Experience model

Remove:

```prisma
basePrice    Float  @default(0)
displayPrice String @default("")
```

Add (in the Pricing block, keeping `currency`):

```prisma
// Pricing — admin-owned, set at approval. Shape: Record<typeKey, number>
// keyed by the experience's selected type[] values (e.g. { "couple": 1200, "family": 1800 }).
pricingByType Json?

// Editorial feedback — populated by admin on rejection, cleared on resubmit.
reviewNote String? @db.Text
```

`pricingByType` shape (TypeScript contract, not DB-enforced):

```ts
// Keys are members of the experience's type[] (TravellerType minus 'XSED').
// Value is price-per-person in the experience currency (USD default), integer or float.
export type PricingByType = Record<string, number>;
```

### Migration

Clean migration — no data migration (proposal §Out of Scope, clean-migration decision):

```bash
npm run db:push   # dev: apply enum + field changes directly
# or, for a tracked migration file:
npm run db:migrate -- --name experience_approval_flow
```

Because `basePrice`/`displayPrice` are dropped and `pricingByType` is nullable, existing rows
(if any in dev) survive with `pricingByType = NULL`; XSED rows lose `basePrice`. **XSED
dependency note:** `/api/admin/xsed` writes `basePrice` (route.ts line 147) and
`AdminXsedExperience.basePrice` reads it. Dropping `basePrice` breaks XSED. See Risk R1 — the
migration must be paired with an XSED pricing decision in the tasks phase (either keep
`basePrice` for XSED-only use, or migrate XSED to `pricingByType` with an `"XSED"` key). The
**recommended** path for this change: **keep `basePrice` for XSED only** and drop only
`displayPrice`, because XSED is out of scope and re-pricing it is a separate concern. This
narrows the schema change to: drop `displayPrice`, add `pricingByType` + `reviewNote`, keep
`basePrice`. This is the safer, smaller migration and is the design's chosen approach.

**Decision D1 — keep `basePrice`, drop only `displayPrice`.**
- Rationale: `basePrice` is load-bearing for XSED (admin xsed create/edit, `xsed.ts` data
  layer, public drop pricing). The proposal's intent is to remove *tripper self-pricing*,
  which is `displayPrice` (the human string shown on cards) plus the tripper's ability to set
  `basePrice` via the form. Tripper experiences will stop reading/writing `basePrice`;
  pricing comes from `pricingByType`. XSED keeps `basePrice`.
- Rejected alternative: drop both and add `"XSED"` to every `pricingByType`. Rejected because
  it forces XSED rework that the proposal explicitly defers, and XSED has a single price (no
  per-traveller-type axis), so `pricingByType` is the wrong shape for it.

## Type Changes

### `src/types/tripper.ts`

`ExperienceFormDraft` — drop pricing self-entry, add admin-owned pricing (read-only on tripper
side but present so the form can display it post-approval):

```ts
export interface ExperienceFormDraft {
  // ...
  // Pricing
  // REMOVED: basePrice: number;
  // REMOVED: displayPrice: string;
  pricingByType?: Record<string, number> | null;  // admin-set, read-only for tripper
  estimatedCost: string;   // unchanged — tripper's internal estimate, not the sell price
  season: string[];
  // ...
  reviewNote?: string | null;   // NEW — populated when rejected back to DRAFT
}
```

`ExperienceListItem` — drop price strings, surface review state for the badge:

```ts
export interface ExperienceListItem {
  id: string;
  title: string;
  type: string[];
  level: string | null;
  status: string;          // now includes "PENDING_REVIEW"
  isActive: boolean;
  // REMOVED: basePrice: number;
  // REMOVED: displayPrice: string;
  pricingByType?: Record<string, number> | null;
  reviewNote?: string | null;
  destinationCountry: string;
  destinationCity: string;
  minNights: number;
  maxNights: number;
  minPax: number;
  maxPax: number;
  createdAt: string;
  updatedAt: string;
}
```

`TripperOwnExperienceListItem` — drop `displayPrice`, add `status` for the badge if not
already derivable:

```ts
export interface TripperOwnExperienceListItem {
  // REMOVED: displayPrice: string;
  id: string;
  isActive: boolean;
  status: string;          // NEW — drives the "Pending review" badge
  level: string;
  // ...
  type: string[];
}
```

Add a shared status union (avoid raw `string` per project type rules; mirror Prisma enum):

```ts
export type ExperienceStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "ACTIVE"
  | "INACTIVE"
  | "ARCHIVED";
```

Apply `ExperienceStatus` to the `status` fields above where touched.

### `src/lib/admin/types.ts`

`AdminExperience` — drop `displayPrice`, add review + pricing fields and the per-type axis the
panel needs:

```ts
export interface AdminExperience {
  createdAt: string;
  // REMOVED: displayPrice: string;
  id: string;
  isActive: boolean;
  isFeatured: boolean;
  owner: AdminExperienceOwner;
  status: string;            // includes "PENDING_REVIEW"
  title: string;
  type: string[];            // NEW — needed to render one price input per type
  level: string | null;      // NEW — panel read-only info
  destinationCountry: string;// NEW — panel read-only info
  destinationCity: string;   // NEW — panel read-only info
  teaser: string;            // NEW — panel read-only info
  description: string;       // NEW — panel read-only info
  heroImage: string;         // NEW — panel read-only info
  minPax: number;            // NEW — panel read-only info (capacity)
  maxPax: number;            // NEW
  pricingByType: Record<string, number> | null;  // NEW
  reviewNote: string | null; // NEW
  updatedAt: string;
}
```

## API Design

All three endpoints follow the identical skeleton: resolve session → load caller roles →
guard → load experience with ownership/precondition → mutate → return updated row. Each
returns `{ experience }` on success and `{ error }` with the appropriate status otherwise.

### `POST /api/tripper/experiences/[id]/submit`

New file: `src/app/api/tripper/experiences/[id]/submit/route.ts`

```
Auth:        getServerSession + hasRoleAccess(user, "tripper")
Ownership:   experience.ownerId === user.id  (else 404)
Precondition: experience.status === "DRAFT"   (else 409 invalid_state)
Validation:  server-side completeness — title, teaser, description,
             destinationCountry, destinationCity, type.length > 0,
             at least one activity name. Reuse the same rules as
             isExperienceTabComplete (extract to a shared validator so client
             and server agree — see Component Design "shared validator").
             On incomplete → 422 { error: "incomplete", missing: string[] }.
Mutation:    status = "PENDING_REVIEW", reviewNote = null (clear stale note).
Response:    200 { experience: { id, status } }
```

Notes:
- No body required; this is a pure transition on an already-persisted draft. The client
  autosaves before calling submit, so the row is current.
- Clearing `reviewNote` on submit ensures a resubmitted (previously rejected) experience does
  not carry a stale rejection banner.

### `POST /api/admin/experiences/[id]/approve`

New file: `src/app/api/admin/experiences/[id]/approve/route.ts`

```
Auth:        requireAdmin() (local guard, mirrors /api/admin/xsed)
Precondition: experience.status === "PENDING_REVIEW"  (else 409 invalid_state)
Body:        { pricingByType: Record<string, number> }
Validation:  - pricingByType is a plain object
             - Object.keys(pricingByType) set-equals experience.type[]
               (exclude "XSED"); reject extra or missing keys → 400 pricing_keys_mismatch
             - every value is a finite number > 0 → 400 pricing_invalid
Mutation:    status = "ACTIVE", pricingByType = <validated>, isActive = true,
             reviewNote = null
Response:    200 { experience }
```

Validation helper (new, colocated or in `src/lib/admin/experience-pricing.ts`):

```ts
export function validatePricingByType(
  input: unknown,
  types: string[],
): { ok: true; value: Record<string, number> } | { ok: false; error: string } {
  if (typeof input !== "object" || input === null || Array.isArray(input))
    return { ok: false, error: "pricing_invalid" };
  const expected = new Set(types.filter((t) => t !== "XSED"));
  const got = new Set(Object.keys(input));
  if (expected.size !== got.size || [...expected].some((k) => !got.has(k)))
    return { ok: false, error: "pricing_keys_mismatch" };
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(input)) {
    if (typeof v !== "number" || !Number.isFinite(v) || v <= 0)
      return { ok: false, error: "pricing_invalid" };
    out[k] = v;
  }
  return { ok: true, value: out };
}
```

Setting `isActive = true` on approve makes the experience immediately visible (the existing
catalog filters on `isActive`/`status === "ACTIVE"`). The admin can later toggle via the
existing PATCH.

### `POST /api/admin/experiences/[id]/reject`

New file: `src/app/api/admin/experiences/[id]/reject/route.ts`

```
Auth:        requireAdmin()
Precondition: experience.status === "PENDING_REVIEW"  (else 409 invalid_state)
Body:        { reviewNote: string }
Validation:  reviewNote is a non-empty trimmed string → else 400 note_required
Mutation:    status = "DRAFT", reviewNote = <trimmed>, isActive = false
Response:    200 { experience }
```

### Modified existing endpoints

- `GET /api/admin/experiences/route.ts` — add `type`, `level`, `destinationCountry`,
  `destinationCity`, `teaser`, `description`, `heroImage`, `minPax`, `maxPax`,
  `pricingByType`, `reviewNote` to the `select`; remove `displayPrice`. The list page filters
  `PENDING_REVIEW` client-side from this single fetch (no separate endpoint needed).
- `src/app/api/tripper/experiences/[id]/route.ts` (PATCH + GET) — remove `basePrice` and
  `displayPrice` from the destructure, `data`, and `select`; add `pricingByType` to GET select
  (read-only display) and `reviewNote` to GET select. The tripper PATCH must **not** allow
  writing `status`, `pricingByType`, or `reviewNote` (strip them from the accepted body) so a
  tripper cannot self-approve or self-price by crafting a PATCH. Today PATCH accepts `status`
  from the body (line 178, 237) — this must be removed; status changes only flow through the
  dedicated transition endpoints.
- `src/app/api/tripper/experiences/route.ts` (POST/create) — remove `basePrice`/`displayPrice`
  writes; new drafts are created with `pricingByType = null`.

**Decision D2 — strip privileged fields from tripper PATCH.**
- Rationale: the whole point of the gate is that the tripper cannot set price or status. Today
  PATCH trusts `status` from the body. Leaving that open would let a tripper PATCH
  `status: "ACTIVE"` and bypass review. Status transitions move exclusively to the three
  guarded endpoints.
- Rejected alternative: keep PATCH permissive and rely on UI to never send those fields.
  Rejected — never trust the client for an authorization-relevant field.

## Component Design

### Shared validator (refactor)

Extract the completeness rules so the submit endpoint and the client agree. Add to
`src/lib/helpers/experience-form.ts`:

```ts
export function getExperienceCompleteness(form): { complete: boolean; missing: string[] }
```

`isExperienceTabComplete` and `getMissingFields` already encode the rules; the new function
composes them across all tabs. The submit route imports this (it is pure, no client deps) to
run the same validation server-side against the persisted row mapped to the draft shape.

### Tripper read-only gate — `NewExperienceShell.tsx`

Single derived flag drives everything:

```ts
const isReadOnly = form.status === "PENDING_REVIEW";
```

1. **Autosave gate.** In the autosave `useEffect` (line 205), bail when read-only:
   ```ts
   if (isReadOnly) return;            // no autosave while pending review
   if (isFirstRender.current) { ... }
   ```
   Also short-circuit `persistDraft` defensively. This prevents the form from PATCHing a
   PENDING_REVIEW row (which the server would also reject for status writes, but we stop it
   client-side to avoid noise).

2. **Input disabling.** Thread `isReadOnly` down through `ExperienceFormContent` →
   `resolveStepContent` → each step component as a `disabled` prop. Rather than touch every
   input in every step (high churn, error-prone), wrap the form body in a
   `<fieldset disabled={isReadOnly} className="contents">`. A disabled `<fieldset>` natively
   disables all descendant form controls (inputs, selects, buttons, textareas) with zero
   per-field changes. The `class="contents"` keeps layout intact. This is the lowest-risk
   way to make the entire form read-only.
   - Caveat: custom non-`<button>`/`<input>` controls (e.g. div-based toggles, the
     `JourneyDropdown` accordion) are not auto-disabled by `<fieldset>`. Navigation between
     read-only sections stays allowed (desirable). Custom interactive controls that mutate
     `form` must additionally check `isReadOnly` before calling `onChange`. Audit the step
     components for non-native controls during apply.

3. **Action bar.** When `isReadOnly`, `ExperienceFormContent` replaces the submit/next bar
   with a static "Pending review" status notice (new branch before `<JourneyActionBar>`),
   so there is no submit button to click.

### Submit-for-review — `VisibilityStep.tsx` + action bar

The "Submit for review" action lives in the final-tab action bar, not inside VisibilityStep's
body (VisibilityStep is a substep panel; the submit affordance belongs to the form-level
action bar that already renders on the last tab via `JourneyActionBar`'s
`isAllStepsComplete`/`onGoToCheckout`). Concretely:

- `NewExperienceShell.handleSubmit` is repurposed: after the final autosave/flush, instead of
  (or in addition to) the current create/redirect, it calls
  `POST /api/tripper/experiences/{id}/submit`. On 200 it routes to the experiences list (where
  the row now shows the "Pending review" badge). On 422 it surfaces the `missing` list inline.
- The action bar's submit label changes from a generic "submit" to a "submitForReview" key.
- Gating: the button stays disabled until `allTabsComplete` (already computed in
  `ExperienceFormContent`, line 122) — same completeness the server re-checks.

**Rejection banner.** Lives at the top of the form content, rendered by `NewExperienceShell`
above `<JourneyContentNavigation>` (or at the top of `ExperienceFormContent`), shown when
`form.status === "DRAFT" && form.reviewNote`. Dismissible via local component state
(`useState` `bannerDismissed`) — dismissal is **view-only and not persisted** (proposal scopes
out persistence/notifications). On the next load the banner reappears until the experience
leaves DRAFT, which is acceptable and keeps feedback visible until resubmitted. Style: amber
alert card matching the existing `missingFields` banner pattern in `ExperienceFormContent`
(line 150) for visual consistency.

### Tripper list badge

In `ExperiencesPageClient.tsx` (and/or the list card), render a "Pending review" badge when
`status === "PENDING_REVIEW"`, using the existing status badge convention from
`.claude/rules/design-system.md`:

```
pending → bg-yellow-100 text-yellow-800 border-yellow-200
```

Map `PENDING_REVIEW` to the pending color. Rejected experiences appear as normal DRAFT rows
(the banner inside the form carries the feedback).

### Admin Pending Review tab + side panel

`AdminExperiencesPageClient.tsx` — add a tab control above the table:

```ts
type Tab = "all" | "pending";
const [tab, setTab] = useState<Tab>("pending");   // default to the actionable queue
const visible = tab === "pending"
  ? experiences.filter((e) => e.status === "PENDING_REVIEW")
  : experiences;
```

Tabs render as two buttons (count badge on "pending"). The existing single fetch already
returns everything; no new list endpoint. Clicking a row opens the side panel for that
experience.

**New component:** `src/app/[locale]/(secure)/dashboard/admin/ExperienceReviewPanel.tsx`

- **Container:** use shadcn/ui `Sheet` (slide-over from the right). Check
  `src/components/ui/` for an existing `sheet`/`dialog` primitive; if `Sheet` exists, use it —
  it is the idiomatic shadcn slide-over and gives focus trapping + overlay for free. If only
  `Dialog` exists, use `Dialog` with right-aligned content. **Do not** hand-roll a slide-over.
  (Apply phase verifies which primitive is installed via `components.json` / `src/components/ui`.)
- **Props:**
  ```ts
  interface ExperienceReviewPanelProps {
    experience: AdminExperience | null;   // null = closed
    copy: AdminPagesDict["experiences"]["review"];   // new copy slice
    onClose: () => void;
    onApprove: (id: string, pricingByType: Record<string, number>) => Promise<void>;
    onReject: (id: string, reviewNote: string) => Promise<void>;
    saving: boolean;
  }
  ```
- **Read-only info block:** title, type(s), level, destination (city/country), capacity
  (min/max pax), description, hero image (`<Img>` wrapper per project rule — no raw `<img>`).
- **Per-type price inputs:** derive from `experience.type.filter(t => t !== "XSED")`. Render
  one labelled number input per type. Local state:
  ```ts
  const [prices, setPrices] = useState<Record<string, string>>(
    () => Object.fromEntries(types.map((t) => [t, ""])),
  );
  ```
  Approve disabled until every type has a positive numeric value. On approve, map to numbers
  and call `onApprove`.
- **Reject:** a `reviewNote` textarea + Reject button; Reject disabled until note is non-empty.
- **Submit flow — wait for response, then refetch (not optimistic).** Rationale: approve/reject
  removes the row from the pending queue and the server validates pricing keys (can 400).
  Optimistic removal followed by a server rejection would desync the queue. Keep the existing
  `AdminExperiencesPageClient` pattern: call the endpoint, on success `await fetchExperiences()`
  and close the panel; on error show an inline error in the panel and keep it open. This
  matches `updateExperience` already in the file (line 37).

**Decision D3 — Sheet/Dialog over custom slide-over.**
- Rationale: focus management, escape-to-close, overlay, and a11y come free; the design-system
  rules and `components.json` already commit the project to shadcn primitives. A custom panel
  would re-implement a11y poorly.
- Rejected alternative: bespoke `fixed inset-y-0 right-0` div. Rejected for a11y and consistency.

**Decision D4 — single fetch + client filter for the pending tab.**
- Rationale: the admin list is small and already fully fetched; a dedicated
  `?status=PENDING_REVIEW` endpoint adds surface for no benefit at this scale. The tab is a
  client filter.
- Rejected alternative: server-side filtered endpoint. Defer until the list grows large enough
  to need pagination.

## i18n Keys

Add to both `src/dictionaries/es.json` and `src/dictionaries/en.json`, and mirror the types in
`src/lib/types/dictionary.ts`.

### `TripperExperiencesDict` (form area) — new keys

```
form.actionBar.submitForReview        "Enviar a revisión" / "Submit for review"
form.review.pendingTitle              "En revisión" / "Pending review"
form.review.pendingBody               "Tu experiencia está en revisión..." / "Your experience is under review..."
form.review.rejectedTitle             "Cambios solicitados" / "Changes requested"
form.review.rejectedDismiss           "Entendido" / "Got it"
form.review.submitError               "Faltan campos obligatorios" / "Required fields missing"
form.statusBadge.pendingReview        "En revisión" / "Pending review"
```

### `AdminPagesDict.experiences` — new keys

```
experiences.tabs.all                  "Todas" / "All"
experiences.tabs.pending              "Pendientes de revisión" / "Pending review"
experiences.status.pendingReview      "En revisión" / "Pending review"
experiences.review.title              "Revisar experiencia" / "Review experience"
experiences.review.infoHeading        "Información" / "Details"
experiences.review.pricingHeading     "Precio por tipo (por persona)" / "Price per type (per person)"
experiences.review.pricePlaceholder   "USD" / "USD"
experiences.review.approve            "Aprobar y publicar" / "Approve & publish"
experiences.review.reject             "Rechazar" / "Reject"
experiences.review.noteLabel          "Nota para el tripper" / "Note to tripper"
experiences.review.notePlaceholder    "Explicá qué cambiar..." / "Explain what to change..."
experiences.review.close              "Cerrar" / "Close"
experiences.review.errorApprove       "No se pudo aprobar" / "Could not approve"
experiences.review.errorReject        "No se pudo rechazar" / "Could not reject"
experiences.review.errorPricing       "Completá el precio de cada tipo" / "Set a price for every type"
```

Type additions in `dictionary.ts`: extend the `experiences` interface inside `AdminPagesDict`
(line 860) with `tabs`, a `pendingReview` status field, and a `review` sub-object; extend
`TripperExperiencesDict.form` with `review`, `statusBadge`, and the `actionBar.submitForReview`
key.

## Migration Plan

Ordered so each step compiles against the previous (dependency: schema before readers):

1. **Schema** — edit `prisma/schema.prisma` (enum + drop `displayPrice` + add `pricingByType`,
   `reviewNote`; keep `basePrice` per D1). Run `npm run db:push` then `npm run db:generate`.
2. **Types** — update `src/types/tripper.ts` and `src/lib/admin/types.ts`. Run `npm run
   typecheck` to surface every reader of the removed `displayPrice` (the 32-file grep set —
   most are XSED/`basePrice` and untouched by D1; the real breakers are the experience list,
   admin experiences page, and tripper experience page that read `displayPrice`).
3. **API — transitions** — add the three new route handlers and the pricing validator + the
   shared completeness validator. Lock down tripper PATCH (D2).
4. **API — list/read** — update admin `GET` select and tripper GET/PATCH/POST selects/writes.
5. **Tripper UI** — `EMPTY_DRAFT` (drop price fields), read-only gate, submit-for-review,
   rejection banner, list badge.
6. **Admin UI** — Pending Review tab + `ExperienceReviewPanel`.
7. **i18n** — add keys to both dictionaries + types; `npm run typecheck` must pass.
8. **Verify** — `npm run typecheck` + `npm run lint` clean; no references to `displayPrice` on
   experiences; manual QA of the full DRAFT → PENDING_REVIEW → ACTIVE / reject → DRAFT loop.

**Rollback:** revert the migration (table can be recreated cleanly per proposal) and revert
code. No production data dependency.

## File Manifest

### Created

| Path | Purpose |
|------|---------|
| `src/app/api/tripper/experiences/[id]/submit/route.ts` | Tripper submit-for-review transition |
| `src/app/api/admin/experiences/[id]/approve/route.ts` | Admin approve + set pricingByType |
| `src/app/api/admin/experiences/[id]/reject/route.ts` | Admin reject + set reviewNote |
| `src/lib/admin/experience-pricing.ts` | `validatePricingByType` boundary validator |
| `src/app/[locale]/(secure)/dashboard/admin/ExperienceReviewPanel.tsx` | Admin review side panel (Sheet) |

### Modified

| Path | Change |
|------|--------|
| `prisma/schema.prisma` | `PENDING_REVIEW` enum value; drop `displayPrice`; add `pricingByType`, `reviewNote`; keep `basePrice` (D1) |
| `src/types/tripper.ts` | `ExperienceFormDraft`, `ExperienceListItem`, `TripperOwnExperienceListItem`; add `ExperienceStatus` union |
| `src/lib/admin/types.ts` | `AdminExperience` — drop `displayPrice`, add review/pricing/info fields |
| `src/lib/helpers/experience-form.ts` | Add shared `getExperienceCompleteness` validator |
| `src/app/api/admin/experiences/route.ts` | GET select: add new fields, drop `displayPrice` |
| `src/app/api/tripper/experiences/[id]/route.ts` | Drop price fields; strip `status`/`pricingByType`/`reviewNote` from PATCH (D2); add `pricingByType`/`reviewNote` to GET select |
| `src/app/api/tripper/experiences/route.ts` | Drop `basePrice`/`displayPrice` on create |
| `src/components/app/dashboard/tripper/experiences/NewExperienceShell.tsx` | `EMPTY_DRAFT`, read-only gate, submit-for-review, rejection banner |
| `src/components/app/dashboard/tripper/experiences/ExperienceFormContent.tsx` | `disabled` fieldset wrap, pending notice, submit label |
| `src/components/app/dashboard/tripper/experiences/steps/VisibilityStep.tsx` | Read-only awareness for custom controls (if any) |
| `src/components/app/dashboard/tripper/experiences/ExperiencesPageClient.tsx` | "Pending review" badge |
| `src/app/[locale]/(secure)/dashboard/admin/AdminExperiencesPageClient.tsx` | Pending Review tab + panel wiring; drop `displayPrice` cell |
| `src/dictionaries/es.json`, `src/dictionaries/en.json` | New tripper + admin copy keys |
| `src/lib/types/dictionary.ts` | Extend `TripperExperiencesDict.form` and `AdminPagesDict.experiences` |

### Investigate during apply (not certain to change)

| Path | Why |
|------|-----|
| `src/app/[locale]/(secure)/dashboard/tripper/experiences/page.tsx` | Likely reads `displayPrice` for list — must migrate to `pricingByType` or drop |
| `src/app/[locale]/(secure)/dashboard/tripper/experiences/[id]/page.tsx` | Maps experience → `ExperienceFormDraft`; drop price fields |
| `src/components/app/dashboard/tripper/experiences/steps/CapacityPricingStep.tsx` | Contains tripper price inputs — must remove `basePrice`/`displayPrice` entry (tripper no longer prices) |
| `src/lib/db/tripper-queries.ts` | May select `displayPrice` for tripper-facing lists |
| `src/components/app/tripper/tripper-profile/TripperProfileExperiencesPanel.tsx` | Public profile price rendering — route through `pricingByType` |
| `src/app/api/experiences/route.ts` | Public catalog endpoint — price source swap (Risk R1) |
| XSED files (`xsed.ts`, `xsed/route.ts`, etc.) | Confirm untouched under D1 (keep `basePrice`) |

## Architectural Risks

| ID | Risk | Mitigation |
|----|------|------------|
| R1 | Dropping `displayPrice` breaks public catalog / tripper profile price rendering | D1 keeps `basePrice`; for tripper experiences, readers must derive a display price from `pricingByType` (e.g. min of values) or hide price pre-approval. The completeness-grep + typecheck in step 2 surfaces all readers before UI work. **Open decision deferred to tasks: how the public card renders price from `pricingByType`.** |
| R2 | `pricingByType` Json has no DB shape enforcement | `validatePricingByType` at the approve boundary; keys must set-equal `type[]`. Readers should treat missing keys defensively. |
| R3 | Tripper bypasses review via permissive PATCH (`status` writable today) | D2 strips `status`/`pricingByType`/`reviewNote` from tripper PATCH; transitions only via guarded endpoints. |
| R4 | `<fieldset disabled>` does not disable custom div-based controls | Audit step components for non-native interactive controls; add `isReadOnly` guard before `onChange` in those. CapacityPricingStep and JourneyDropdown are the prime suspects. |
| R5 | XSED shares the Experience table/status enum | `PENDING_REVIEW` is additive; XSED stays on `DRAFT`/`ACTIVE` and never enters the tripper submit flow (submit endpoint is tripper-owned, XSED is admin-owned). No XSED behavior change under D1. |

## Open Decisions (resolve in tasks/apply)

1. **Public price rendering from `pricingByType`** (R1): which value to show on a card with
   multiple types — min, range, or per-selected-type. Not an architecture decision; a product
   copy decision. Flagged for tasks.
2. **XSED `basePrice` long-term**: D1 keeps it; if the team later unifies pricing, that is a
   separate SDD.
