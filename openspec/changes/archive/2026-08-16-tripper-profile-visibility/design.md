# Design: Tripper Profile Visibility

## Technical Approach

Two independent predicates (`tripperSlug != null`, `isActive = true`) applied at every **User-resolution** step. The only non-mechanical work is turning `getTripperBySlug`'s `TripperProfile | null` into a three-way result and threading the resulting "unavailable" state through two surfaces. Everything else is a `where` addition, one new route, one Switch row, and dictionary keys. See `spec.md` for the normative requirements.

Three findings not in the proposal, resolved below: **(a)** the repo has **no Prisma migrations** — `prisma/migrations/` holds only `.gitkeep` and `db:migrate` is aliased to `prisma db push` (`package.json:18`); **(b)** `getTripperBySlug` has a **fourth consumer** the proposal did not list — `src/app/[locale]/experiences/by-tripper/[tripper]/page.tsx:61,92`, which is deliberately excluded from this change's behavioral scope (see Out of Scope); **(c)** `GET /api/user/tripper` does not `select` `isActive`, so the toggle has nothing to hydrate from.

## Architecture Decisions

### Decision: Discriminated result object for `getTripperBySlug`

**Choice**: one function returning a tagged union.

```ts
// src/lib/db/tripper-queries.ts
export type TripperLookupResult =
  | { status: "not_found" }
  | { status: "inactive"; name: string }
  | { status: "ok"; tripper: TripperProfile };

export async function getTripperBySlug(slug: string): Promise<TripperLookupResult>
```

| Option | Tradeoff | Verdict |
|---|---|---|
| Tagged union (one call) | Exhaustive `switch`; one query; TS forces every consumer to handle `inactive` | **Chosen** |
| Two functions (`getTripperBySlug` + `isTripperActive`) | Two round-trips, two sources of truth, callers can forget the second call — reproduces today's bug shape | Rejected |
| Typed throw (`TripperInactiveError`) | Control flow via exceptions for an *expected* domain outcome; invisible in the type signature | Rejected |

`inactive` carries `name` (already `nickname ?? name`) so the copy can be personalized; the proposal accepts the enumeration tradeoff explicitly. It does **not** carry the full `TripperProfile` — an inactive profile must not be able to leak a full payload into a render by accident.

Implementation: add `isActive: true` to the existing `select`, drop the `!tripper.tripperSlug` guard into the `not_found` branch, and return before the second (`Experience`) query when inactive — an inactive tripper's packages are never fetched.

### Decision: A genuine DB error rethrows instead of collapsing to not-found

**Choice**: `catch (error) { console.error(...); throw error; }` in `getTripperBySlug` only.

A transient DB failure currently renders a **404** on a live profile. 404 is a *semantic claim that the resource does not exist* and crawlers cache it — a blip can de-index a real tripper. A root error boundary already exists (`src/app/error.tsx`), so rethrowing surfaces an honest 500 with UI. Rejected: a fourth `{ status: "error" }` variant — every consumer would branch on an outcome whose only sane rendering is the boundary Next already gives us for free. Other helpers (`getTripperFeaturedTrips`, `getTripperJourneyContext`, `getAllTrippers`) keep their `[] / null` catch: they are *supplementary* data, not page identity.

### Decision: journey-context API answers `410 Gone` for inactive

| Option | Tradeoff | Verdict |
|---|---|---|
| `410 Gone` + `{ error: "tripper_inactive", name }` | `res.ok` stays false, so the existing `if (!res.ok) return null` **fails closed** (no branding) even before the explicit branch lands; unambiguous discriminator | **Chosen** |
| `200` + `{ status: "inactive" }` | Any consumer that only checks `res.ok` silently renders the branded journey — precisely the silent degrade decision #8 rejected | Rejected |
| Reuse `404` | Cannot distinguish "no such slug" from "inactive"; the client needs both | Rejected |

`404` stays for an unknown slug. `getTripperJourneyContext` mirrors the profile lookup shape:
`Promise<{ status: "not_found" } | { status: "inactive"; name: string } | { status: "ok"; context: TripperJourneyContext }>`.

### Decision: one shared presentational component + one shared copy key set

`src/components/tripper/TripperUnavailableNotice.tsx` — **no `"use client"`**, no hooks, props only. That is what lets the *server* profile page and the *client* `JourneyPageClient` render the identical markup:

```tsx
interface TripperUnavailableNoticeProps {
  copy: MarketingDictionary["trippers"]["unavailable"]; // title, description ({name}), ctaLabel
  ctaHref: string;      // pathForLocale(locale, "/trippers")
  tripperName?: string; // interpolated into description when known
}
```

Copy lives once at `dict.trippers.unavailable` (top level, next to the existing `trippers.hero` / `trippers.grid`), **not** duplicated under `journey.*`.

### Decision: `owner.isActive` on `/api/admin/experiences` is opt-in via `?ownerActive=true`

`GET /api/admin/experiences` has two consumers: `TripRequestModal.tsx:91` (assignment — must exclude inactive owners) and `AdminExperiencesPageClient.tsx:155` (admin catalog browsing). An unconditional `owner: { isActive: true }` would hide inactive trippers' experiences from the admin catalog, which the proposal puts **out of scope** ("no admin-side display of `isActive`"). So the route reads the flag and only `TripRequestModal` sends it. This is exactly why the proposal pairs those two files.

**Param name `ownerActive=true`** — user-confirmed. It matches the flat, one-concept-per-key style this route already uses (`status=`, `tripperId=`, `level=`, `type=`, `search=`). Rejected: `excludeInactiveOwners=true` — negated-verb-phrase naming appears nowhere in the codebase's query params and reads as a directive rather than a filter value.

### Decision: schema push, not a migration file

The repo has never used `prisma migrate` (`prisma/migrations/` = `.gitkeep` only; `db:migrate` → `prisma db push`). Running `prisma migrate dev` now would baseline the *entire* schema into a first migration — a large, risky, out-of-scope diff. Follow the established path: edit `prisma/schema.prisma`, then `npm run db:push && npm run db:generate`.

**No index.** `isActive` is a two-value boolean and is never the sole predicate: it is always ANDed with `tripperSlug` (already `@unique`) or `roles`. Postgres will not use a standalone boolean index at this selectivity. This matches the precedent for `Experience.isActive` (`schema.prisma:257`) and `BlogPost.isActive` (`:436`), neither indexed.

**Ordering is enforced by the compiler**: until `db:push` + `db:generate` run, every one of the ~9 `where` additions is a Prisma type error. Schema physically cannot land second.

## Data Flow

```
                        ┌─ getAllTrippers()  where: roles + tripperSlug != null + isActive
   /trippers ───────────┤       (single source)                    │
   /api/trippers ───────┘                                          └─→ TripperListItem[] (slug: string)
                                                                        └─→ TopTrippersGrid / TripperSearchModal
                                                                             href={tripper.tripperSlug}   (no synthesis)

   /trippers/[slug] ──→ getTripperBySlug ──┬─ not_found ──→ notFound()
                                           ├─ inactive ───→ <TripperUnavailableNotice>
                                           └─ ok ─────────→ profile render
                                              (throw on DB error → app/error.tsx)

   /journey?tripper=x ─→ GET journey-context ─┬─ 404 ─→ { status:"none" }  (generic journey)
                                              ├─ 410 ─→ { status:"unavailable" } → <TripperUnavailableNotice>
                                              └─ 200 ─→ { status:"ok", context } → branded journey

   settings page ──(profile.tripperSlug)──→ Switch ──PATCH /api/user/tripper/status──→ User.isActive
```

## File Changes

### 1. Schema

| File | Action |
|---|---|
| `prisma/schema.prisma` | Add to `User` (after `availableTypes`, line 36): `isActive Boolean @default(true) // tripper self-service visibility; excludes from listing + matching, keeps URL resolvable` |

Then `npm run db:push && npm run db:generate`. No backfill (default applies to existing rows), no lock of consequence.

### 2. `getTripperBySlug` + its four consumers

`src/lib/db/tripper-queries.ts:23-83`:

```diff
-): Promise<TripperProfile | null> {
+): Promise<TripperLookupResult> {
   try {
     const tripper = await prisma.user.findUnique({
       where: { tripperSlug: slug, roles: { has: "TRIPPER" } },
-      select: { id: true, name: true, nickname: true, /* … */ },
+      select: { id: true, name: true, nickname: true, isActive: true, /* … */ },
     });
-    if (!tripper || !tripper.tripperSlug) return null;
+    if (!tripper || !tripper.tripperSlug) return { status: "not_found" };
+    if (!tripper.isActive) {
+      return { status: "inactive", name: tripper.nickname || tripper.name };
+    }
     const packages = await prisma.experience.findMany({ /* unchanged */ });
     …
-    return { …tripperRest, … } as TripperProfile;
+    return { status: "ok", tripper: { …tripperRest, … } as TripperProfile };
   } catch (error) {
     console.error("Error fetching tripper by slug:", error);
-    return null;
+    throw error;
   }
```

Destructure `isActive` out alongside `roles, nickname` so it does not leak into the `TripperProfile` spread.

**`src/app/[locale]/trippers/[tripper]/page.tsx`** — `generateMetadata` (43-45):

```diff
-  const dbTripper = await getTripperBySlug(params.tripper);
-  if (!dbTripper) return { title: "Randomtrip" };
+  const result = await getTripperBySlug(params.tripper);
+  if (result.status !== "ok") return { title: "Randomtrip" };
+  const dbTripper = result.tripper;
```

An inactive profile deliberately gets the generic title — no OG payload for a paused profile.

Page body (76-84):

```diff
-  const tripperData = await getTripperBySlug(params.tripper);
-  const featuredTrips = await getTripperFeaturedTrips(params.tripper, 3);
-
-  // Must have database tripper data
-  if (!tripperData) return notFound();
+  const lookup = await getTripperBySlug(params.tripper);
+
+  if (lookup.status === "not_found") return notFound();
+  if (lookup.status === "inactive") {
+    return (
+      <TripperUnavailableNotice
+        copy={dict.trippers.unavailable}
+        ctaHref={pathForLocale(locale, "/trippers")}
+        tripperName={lookup.name}
+      />
+    );
+  }
+  const tripperData = lookup.tripper;
+  const featuredTrips = await getTripperFeaturedTrips(params.tripper, 3);
```

Note the reorder: `getTripperFeaturedTrips` moves *below* the branch so an inactive profile issues no follow-up queries. `dict`/`locale` are already resolved at 68-69, above this block.

**`src/app/[locale]/experiences/by-tripper/[tripper]/page.tsx`** (not in the proposal) — **out of behavioral scope by user decision.** This page is a candidate for outright removal in a future change (see Out of Scope), so it receives **no** unavailable state, **no** i18n remediation, and nothing is changed in `getTripperExperiencesByTypeAndLevel` / `getTripperAvailableTypesAndLevels` on its account. It keeps bare-404 behavior.

It cannot, however, be literally zero-diff: the union is always a truthy object, so the existing `if (!dbTripper)` at `:63`/`:95` becomes dead code and `dbTripper.name` stops typechecking. A **compile-only** adaptation is type-forced at both call sites — three lines each, no behavior authored, no copy touched:

```diff
-  const dbTripper = await getTripperBySlug(params.tripper);
-  if (!dbTripper) return notFound();          // :95 (and `return { title: "Randomtrip" }` at :63)
+  const lookup = await getTripperBySlug(params.tripper);
+  if (lookup.status !== "ok") return notFound();
+  const dbTripper = lookup.tripper;
```

`status !== "ok"` deliberately lumps `inactive` in with `not_found` — that is what "bare 404, no unavailable state here" means concretely. Rejected alternative: a backward-compatible `getActiveTripperBySlug(slug): Promise<TripperProfile | null>` wrapper to keep the file byte-identical. It would leave zero diff on a page slated for deletion, but it adds a second exported lookup that outlives the page and gives future callers a way to bypass the union — the indirection costs more than six mechanical lines.

**`src/app/[locale]/trippers/[tripper]/__tests__/metadata.test.ts`** — a **required** edit, not optional: its four `mockResolvedValue({...})` / `mockResolvedValue(null)` calls (lines 79, 92, 106, 120) no longer typecheck. They become `{ status: "ok", tripper: {...} }` and `{ status: "not_found" }`.

### 3. Listing filter + slug-synthesis removal

`tripper-queries.ts:189-213`:

```diff
     const trippers = await prisma.user.findMany({
-      where: { roles: { has: "TRIPPER" } },
+      where: { roles: { has: "TRIPPER" }, tripperSlug: { not: null }, isActive: true },
```

Make the type honest instead of asserting with `!`, using the narrowing-filter idiom already in this file (`getTripperPublishedBlogs`, `:969-972`):

```diff
-    return trippers.map((tripper) => ({
+    return trippers
+      .filter((t): t is typeof t & { tripperSlug: string } => t.tripperSlug !== null)
+      .map((tripper) => ({
```

Then `TripperListItem.tripperSlug` (`src/types/tripper.ts:146`) and `TripperSearchItem.tripperSlug` (`TripperSearchModal.tsx:13`) narrow `string | null` → `string`. Narrowing only widens what consumers may rely on, so `HomePageClient`, `about-us/page.tsx:48`, and `blog-filters.ts` all keep compiling (`about-us`'s `.filter((t) => t.tripperSlug)` becomes redundant — leave it, it is harmless and self-documenting).

`TopTrippersGrid.tsx:32-40`:

```diff
-              href={tripper.tripperSlug ?? tripper.name.toLowerCase().replace(/\s+/g, "-")}
+              href={tripper.tripperSlug}
-              instagramUrl={tripper.tripperSlug ?? tripper.name.toLowerCase().replace(/\s+/g, "-")}
+              instagramUrl={tripper.tripperSlug}
```

(The proposal cites 32-35; the *same* synthesis also appears at 37-40 for `instagramUrl` — both go.)

`TripperSearchModal.tsx:160-162`:

```diff
-                  const slug = tripper.tripperSlug || tripper.name.toLowerCase().replace(/\s+/g, "-");
+                  const slug = tripper.tripperSlug;
```

### 4. Matching exclusion — all 9 sites

**User-lookup sites** (⚠️ the filter must land here; on the later `Experience` query it silently no-ops):

| # | File:line | Diff |
|---|---|---|
| 1 | `api/trip-requests/route.ts:411-417` | `where: { tripperSlug: tripperSlug.trim(), roles: { has: "TRIPPER" },` **`isActive: true`** `}` — ⚠️ User lookup |
| 2 | `tripper-queries.ts:396-407` (`getTripperJourneyContext`) | `where: { tripperSlug: slug, roles: { has: "TRIPPER" } }` → add **`isActive: true`**; also add `isActive`/`name` handling for the 410 shape — ⚠️ User lookup |
| 3 | `tripper-queries.ts:122-124` (`getTripperFeaturedTrips`) | `where: { tripperSlug, roles: { has: "TRIPPER" },` **`isActive: true`** `}` — ⚠️ User lookup, **not** the `experience.findMany` at 129 |
| 4 | `tripper-queries.ts:321-329` (`getTripperExperiencesByTypeAndLevel`) | ⚠️ Takes a `tripperId` and has **no User lookup at all**. Add one *before* the Experience query: `const owner = await prisma.user.findFirst({ where: { id: tripperId, isActive: true }, select: { id: true } }); if (!owner) return {};` Adding `isActive: true` to the `experience.findMany` where would filter `Experience.isActive`, which already exists and means something else entirely — the exact defect in the spec's last scenario. |
| 5-8 | `lib/data/tripper-trips.ts:10-20`, `45-52`, `70-79`, `99-109` | ⚠️ Same shape as #4 — all four take `tripperId` and query `Experience` directly, and all four already pass `isActive: true` meaning *`Experience.isActive`*. Each needs a preceding `prisma.user.findFirst({ where: { id: tripperId, isActive: true }, select: { id: true } })` guard returning the existing empty value (`[]` / `false` / `[]` / `[]`). Extract one local helper `async function isOwnerActive(tripperId: string)` in this module rather than repeating the query four times. |

**Relation-filter sites** (`Experience` query joining to `owner`):

| # | File:line | Diff |
|---|---|---|
| 9a | `api/experiences/route.ts:24-27` | `const where: any = { isActive: true, ownerId: tripperId,` **`owner: { isActive: true }`** `};` — `owner` is already in the `include`, so no select change |
| 9b | `api/admin/experiences/route.ts:44-49` | after the existing filters: `if (searchParams.get("ownerActive") === "true") where.owner = { isActive: true };` |
| 9b | `components/app/admin/TripRequestModal.tsx:87` | `const params = new URLSearchParams({ status: "ACTIVE",` **`ownerActive: "true"`** `});` |
| 9c | `api/admin/trip-requests/[id]/route.ts:93-118` | See below — needs a reorder, not just a filter |

**9c ordering bug**: today the `tripRequest.update` (line 97) persists `experienceId` **before** the experience is ever looked up (line 105). A filter added at 105 would reject *after* the write. The owner-active check must become a pre-update guard, and it can absorb the destination lookup so the query count stays flat:

```diff
   if (experienceId !== undefined) {
+    if (experienceId) {
+      assignedExperience = await prisma.experience.findFirst({
+        where: { id: experienceId, owner: { isActive: true } },
+        select: { destinationCity: true, destinationCountry: true },
+      });
+      if (!assignedExperience) {
+        return NextResponse.json(
+          { error: "Experience not assignable: owner is inactive" },
+          { status: 400 },
+        );
+      }
+    }
     data.experienceId = experienceId || null;
   }
```
…then the block at 104-118 reuses `assignedExperience` instead of re-querying.

### 5. `PATCH /api/user/tripper/status` (new)

`src/app/api/user/tripper/status/route.ts` — mirrors the session pattern of `api/user/tripper/route.ts:53-59`:

```ts
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isActive } = await request.json();
    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      select: { tripperSlug: true },
      where: { id: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!existing.tripperSlug) {
      return NextResponse.json(
        { error: "Tripper profile incomplete: no public URL yet" },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      data: { isActive },                       // ← the ONLY field written
      select: { isActive: true, tripperSlug: true },
      where: { id: session.user.id },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error updating tripper visibility:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

| Aspect | Contract |
|---|---|
| Body | `{ isActive: boolean }` — anything else ignored; no `tripperSlug`, `availableTypes`, or `commission` read |
| 200 | `{ user: { isActive, tripperSlug } }` (slug echoed so the client can assert immutability) |
| 400 | non-boolean `isActive`, or caller's `tripperSlug === null` |
| 401 / 404 / 500 | no session / user row missing / unexpected |
| Role check | none needed beyond the slug guard — a non-tripper has no `tripperSlug`, so the 400 covers it |

`data: { isActive }` is a literal single-key object, so `tripperSlug` is structurally unreachable — this is what makes success criterion "flipping the toggle never changes `tripperSlug`" true by construction rather than by test.

### 6. Hydration path (not in the proposal)

| File | Change |
|---|---|
| `api/user/tripper/route.ts:20-31` | add `isActive: true` to the GET `select` — otherwise the toggle has no current value |
| `src/types/tripper.ts:90-101` | `TripperSessionExtras` += `isActive?: boolean` |
| settings `page.tsx:33-46` | `normalizeExtras` += `isActive: extras.isActive ?? true`; same key in the `useState` initializer at 77-88 |

`isActive` is **not** added to `TripperSettingsFormState` — it is not part of the batched Save form (decision #11); it lives in `profile`, which the toggle handler updates directly.

### 7. UI

**`TripperSettingsPublicUrlCard.tsx`** props:

```diff
 interface TripperSettingsPublicUrlCardProps {
   copy: TripperDashboardDict["settingsProfile"]["publicUrl"];
   locale: Locale;
   slug: string;
   isEditing: boolean;
   onSlugChange: (slug: string) => void;
+  /** Current persisted visibility. */
+  isActive: boolean;
+  /** False until a tripperSlug is actually persisted — mirrors the API's 400 guard. */
+  canToggleVisibility: boolean;
+  isTogglingVisibility?: boolean;
+  onToggleVisibility: (next: boolean) => void;
 }
```

JSX: the toggle row goes **between** the eyebrow/heading block (ends line 58) and the domain+slug block (starts line 60):

```tsx
<div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
  <div>
    <label className="text-sm font-medium text-neutral-900" htmlFor="tripper-visibility">
      {copy.visibilityLabel}
    </label>
    {!canToggleVisibility && (
      <p className="mt-1 text-xs text-neutral-500">{copy.visibilityHintDisabled}</p>
    )}
  </div>
  <Switch
    checked={isActive}
    disabled={!canToggleVisibility || isTogglingVisibility}
    id="tripper-visibility"
    onCheckedChange={onToggleVisibility}
  />
</div>
```

⚠️ **`canToggleVisibility` must come from `profile.tripperSlug`, not `formData.tripperSlug`.** While `isEditing`, `formData.tripperSlug` can hold a slug the user typed but never saved — gating on it would enable the switch while the API still 400s. Call site (`settings/page.tsx:357-365`):

```diff
   <TripperSettingsPublicUrlCard
+    canToggleVisibility={Boolean(profile.tripperSlug)}
     copy={copy.publicUrl}
+    isActive={profile.isActive ?? true}
     isEditing={isEditing}
+    isTogglingVisibility={isTogglingVisibility}
     locale={locale}
     onSlugChange={(slug) => setFormData((prev) => ({ ...prev, tripperSlug: slug }))}
+    onToggleVisibility={handleToggleVisibility}
     slug={formData.tripperSlug}
   />
```

`handleToggleVisibility` (new, in the page): `PATCH` → on `res.ok` `setProfile((p) => ({ ...p, isActive: next }))`; on failure `toast.error(copy.publicUrl.visibilityError)` and leave the switch where it was (no optimistic flip — the switch reads from `profile`, so a failed call simply never moves it). Uses the `sonner` `toast` already imported at `page.tsx:6`.

### 8. i18n

`publicUrl` already exists in both dictionaries (`es.json:3760-3768`) and in `dictionary.ts:321-329` — **extend it**, no new section:

| Key | es | en |
|---|---|---|
| `tripperDashboard.settingsProfile.publicUrl.visibilityLabel` | `"Perfil visible"` | `"Profile visible"` |
| `…publicUrl.visibilityHintDisabled` | `"Completá tu perfil y publicá tu URL para poder ocultarlo."` | `"Complete your profile and publish your URL before you can hide it."` |
| `…publicUrl.visibilityError` | `"No pudimos actualizar la visibilidad de tu perfil."` | `"We couldn't update your profile visibility."` |

The shared unavailable copy extends the existing top-level `trippers` section (`es.json:1125`, `dictionary.ts:2009`) — **one** key set for both surfaces:

| Key | es | en |
|---|---|---|
| `trippers.unavailable.title` | `"Este perfil no está disponible"` | `"This profile isn't available"` |
| `trippers.unavailable.description` | `"{name} pausó su perfil por ahora. Podés explorar otros trippers mientras tanto."` | `"{name} has paused their profile for now. You can explore other trippers in the meantime."` |
| `trippers.unavailable.ctaLabel` | `"Ver todos los trippers"` | `"See all trippers"` |

`{name}` interpolation follows the existing `blogPage.backToProfile` precedent; the component falls back to a name-less sentence when `tripperName` is undefined (the journey 410 body carries `name`, so in practice it is always present).

### 9. Journey flow

`api/trippers/[slug]/journey-context/route.ts`:

```diff
-  const context = await getTripperJourneyContext(slug);
-  if (!context) {
-    return NextResponse.json({ error: "Tripper not found" }, { status: 404 });
-  }
-  return NextResponse.json(context);
+  const result = await getTripperJourneyContext(slug);
+  if (result.status === "not_found") {
+    return NextResponse.json({ error: "Tripper not found" }, { status: 404 });
+  }
+  if (result.status === "inactive") {
+    return NextResponse.json(
+      { error: "tripper_inactive", name: result.name },
+      { status: 410 },
+    );
+  }
+  return NextResponse.json(result.context);
```

`JourneyPageClient.tsx:86-87, 129-150`: replace the nullable context with explicit state, so "no tripper in the URL" and "tripper unavailable" can never be confused:

```ts
type TripperContextState =
  | { status: "none" }
  | { status: "ok"; context: TripperJourneyContext }
  | { status: "unavailable"; name?: string };
```

Fetch branch: `res.status === 410` → `{ status: "unavailable", name: (await res.json()).name }`; `res.ok` → `{ status: "ok", context }`; anything else → `{ status: "none" }` (unknown slug keeps today's generic-journey behavior). Render: right after the `if (!dict)` guard at 204, `if (tripperState.status === "unavailable") return <TripperUnavailableNotice … />` — the shared notice replaces the journey rather than banner-ing over a flow that can no longer be completed with that tripper. The three existing reads (`tripperContext?.allowedTypes` at 265, `allowedLevelsByType` at 266, and the two `tripperBadge` props at 229/277) become `tripperState.status === "ok" ? … : undefined`.

## Testing Strategy

Strict TDD is active. Vitest + happy-dom, `vi.mock("@/lib/prisma")`, asserting on `mock.calls[0][0].where` — the exact idiom in `src/lib/db/__tests__/tripper-queries.getTripperPublishedBlogs.test.ts`.

| Layer | What | Where |
|---|---|---|
| Unit (query) | `getAllTrippers` where contains `tripperSlug: { not: null }` **and** `isActive: true`; null-slug rows filtered from the mapped result | `src/lib/db/__tests__/tripper-queries.getAllTrippers.test.ts` |
| Unit (query) | `getTripperBySlug` returns each of the 3 variants; rethrows on `findUnique` rejection; skips the Experience query when inactive | `…/tripper-queries.getTripperBySlug.test.ts` |
| Unit (pattern A — two-step) | `getTripperExperiencesByTypeAndLevel` and one `tripper-trips.ts` fn return empty when the **User** lookup misses, proving the guard is on `User` not `Experience` | `…/tripper-queries.matching.test.ts`, `src/lib/data/__tests__/tripper-trips.test.ts` |
| Unit (pattern B — relation) | `GET /api/experiences` where includes `owner: { isActive: true }`; `admin/experiences` adds it **only** with `?ownerActive=true` | `src/app/api/experiences/__tests__/route.test.ts`, extend existing `api/admin/experiences/__tests__/route.test.ts` |
| Unit (route) | status endpoint: 401 no session, 400 non-boolean, 400 null slug, 200 writes only `isActive`, `update` called with `data` whose keys are exactly `["isActive"]` | `src/app/api/user/tripper/status/__tests__/route.test.ts` |
| Unit (route) | `admin/trip-requests/[id]` 400s on an inactive-owner `experienceId` **and** performs no `tripRequest.update` | extend existing `…/[id]/__tests__/route.test.ts` |
| Component | toggle disabled + hint when `canToggleVisibility` false; enabled and reflecting `isActive` otherwise | `src/components/app/dashboard/tripper/settings/__tests__/TripperSettingsPublicUrlCard.test.tsx` |
| Regression (must fix) | `trippers/[tripper]/__tests__/metadata.test.ts` — 4 mock returns migrate to the union | existing file |

## Migration / Rollout

1. `prisma/schema.prisma` + `npm run db:push && npm run db:generate` — must land first; the compiler enforces it.
2. Code lands in the proposal's three slices: **(A)** listing filter + synthesis removal + type narrowing; **(B)** schema + endpoint + toggle + i18n; **(C)** three-way lookup + unavailable notice + 9 matching sites. A must not merge before the schema if A and B are split, since A's `where` references `isActive`.
3. No backfill, no feature flag: `@default(true)` makes deploy a no-op for every existing tripper.
4. Rollback: revert code, **keep the column** (per the proposal) so nobody who deactivated is silently republished.

## Out of Scope (design-level additions)

Beyond the proposal's Out of Scope list:

- **`src/app/[locale]/experiences/by-tripper/[tripper]/page.tsx` is out of behavioral scope.** It gets the compile-only union adaptation described above and nothing else: no unavailable state, no i18n remediation of its hardcoded Spanish, and no change to `getTripperExperiencesByTypeAndLevel` or `getTripperAvailableTypesAndLevels` on its account (those two are still modified — but only for the matching-exclusion requirement, which is what the rest of the platform needs from them). An inactive tripper's URL there 404s, same as an unknown slug.

  > **Future cleanup candidate — informational, not a task for this change.** This page lists a tripper's packages and types openly, by name, on a public URL. That runs against the platform's core mystery-trip premise, where the experience stays concealed until reveal. It may well be vestigial. Whether it should be deleted (along with its unused `getTripperAvailableTypesAndLevels` import at `:7`) belongs in its own change, with its own proposal — do not let it expand this one. Flagged here so `sdd-verify` reads the untouched i18n violation and the surviving 404 path as intentional, not as gaps.

## Open Questions

None — both prior open questions were resolved by the user: the `by-tripper` page stays out of behavioral scope (above), and the admin filter param is `ownerActive=true`.

> Exceeds the skill's 800-word soft budget. Accepted deliberately: the launch brief asked for exact before/after diffs at all ~9 matching sites plus the full lookup/endpoint/UI contracts, and the proposal's own top risk is a filter landing on the wrong query — collapsing that detail is what would cause the defect.
