# Packages Dashboard Refactor — Design Spec

**Date:** 2026-04-22
**Scope:** Tripper dashboard packages flow — list, create, edit pages + schema migration for matching fields

---

## Overview

Refactor the three tripper packages pages to match the dashboard design system and architecture patterns used in the tripper main dashboard. This includes removing `Hero`/`GlassCard`, converting to server components, extracting reusable client components, adding i18n, and — critically — exposing ALL matching fields the algorithm needs so a tripper-created package can be properly matched against a client's TripRequest.

---

## Goals

- Remove `Hero` and `GlassCard` — not used on internal dashboard pages
- Apply design system: white panel cards, dashboard page header style, `Button` primitives
- Convert list and edit pages to server components (data fetched server-side via Prisma)
- Create/edit form: sidebar nav layout (sticky left nav + scrollable form sections on right)
- Extract all UI into focused client components under `src/components/app/dashboard/tripper/packages/`
- Add i18n: `packages` dictionary section in `es.json`/`en.json` with `PackagesDict` type
- **Schema migration**: add 6 matching fields to `Package` (`accommodationType`, `transport`, `climate`, `maxTravelTime`, `departPref`, `arrivePref`)
- **API fix**: GET `/api/tripper/packages/[id]` currently drops all JSON fields — fix the `select`
- **Full JSON field UI**: expose `hotels`, `activities`, `itinerary`, `inclusions`, `exclusions` as structured editors
- **Product-aware form**: `excuseKey` as controlled select per type (only for `explora-plus`/`bivouac`); capacity validated against level limits

---

## Pages in Scope

| File | Current state | After refactor |
|------|--------------|----------------|
| `packages/page.tsx` | "use client", `useEffect` fetch, `Hero` + `GlassCard` | Server component, passes data to `PackagesPageClient` |
| `packages/new/page.tsx` | "use client" monolith | Server component shell, renders `PackageFormClient` in create mode |
| `packages/[id]/page.tsx` | "use client", `useEffect` fetch, `Hero` + `GlassCard` | Server component, fetches package via Prisma, passes to `PackageFormClient` in edit mode |

---

## Schema Migration

Add 6 fields to the `Package` model in `prisma/schema.prisma`. All are Strings with defaults so the migration is non-destructive.

```prisma
// Matching fields (mirror TripRequest filter fields)
accommodationType String @default("any") // hotel-style | home-style | nature-escape | hybrid-hub | glamping | any
transport         String @default("any") // plane | bus | train | ship | any
climate           String @default("any") // warm | cold | mild | any
maxTravelTime     String @default("no-limit") // no-limit | 3h | 5h | 8h
departPref        String @default("any") // morning | afternoon | night | any
arrivePref        String @default("any") // morning | afternoon | night | any
```

Run `npm run db:migrate` to generate and apply the migration.

**Note on `maxTravelTime`**: this is approximate on the Package side since travel time depends on the client's origin. The tripper sets the typical max travel time from regional departure points.

---

## API Changes

### Fix: GET `/api/tripper/packages/[id]`

The `select` clause currently omits all JSON fields. Add them:

```ts
// Add to the select object:
hotels: true,
activities: true,
itinerary: true,
inclusions: true,
exclusions: true,
accommodationType: true,
transport: true,
climate: true,
maxTravelTime: true,
departPref: true,
arrivePref: true,
```

### Update: PATCH `/api/tripper/packages/[id]`

Accept and persist the 6 new matching fields in the `data` object.

### Update: POST `/api/packages`

Accept and persist the 6 new matching fields.

---

## Component Architecture

### New components

All under `src/components/app/dashboard/tripper/packages/`:

```
PackagesPageClient.tsx     # "use client" — list page UI, filters, table
PackageFormClient.tsx      # "use client" — shared create/edit form, mode prop
PackageFormNav.tsx         # sticky sidebar nav with section links + save/cancel buttons
```

### Server page shells

**`packages/page.tsx`** (server):
- `getServerSession(authOptions)` → redirect to `/login` if no session, 403 if not TRIPPER
- `prisma.package.findMany({ where: { ownerId: user.id }, orderBy: { updatedAt: 'desc' } })`
- Pass typed `Package[]` + dict slice to `PackagesPageClient`

**`packages/new/page.tsx`** (server):
- Auth check only — no data fetch
- Render `PackageFormClient` with `mode="create"` and no `initialData`

**`packages/[id]/page.tsx`** (server):
- Auth check + `prisma.package.findFirst({ where: { id, ownerId: user.id } })`
- 404 if not found or not owned by this tripper
- Pass full package (all fields including JSON) as `initialData` to `PackageFormClient` with `mode="edit"`

### PackageFormClient

Props:
```ts
interface PackageFormClientProps {
  mode: "create" | "edit";
  initialData?: PackageFormData;
  packageId?: string;        // required when mode="edit"
  copy: PackagesDict["form"];
  locale: string;
}
```

- `mode="create"`: POSTs to `/api/packages`, redirects to `/dashboard/tripper/packages` on success
- `mode="edit"`: PATCHes to `/api/tripper/packages/[packageId]`, same redirect on success
- Renders `PackageFormNav` + all form section cards

### PackageFormNav

Props:
```ts
interface PackageFormNavProps {
  sections: Array<{ id: string; label: string }>;
  mode: "create" | "edit";
  loading: boolean;
  copy: PackagesDict["form"]["nav"];
}
```

- Sticky sidebar (`sticky top-6`)
- Each nav item: anchor `href="#section-{id}"` — browser native scroll, no JS
- Active section: click sets active state, dot fills `bg-neutral-900`; inactive: `bg-neutral-300`
- Save + Cancel buttons at the bottom of the sidebar panel

---

## List Page Design

**Page header** — matches tripper dashboard pattern (no Hero):
```tsx
<div className="mb-8">
  <p className="text-xs uppercase tracking-[0.18em] font-semibold text-neutral-500 mb-3">
    Tripper OS
  </p>
  <h1 className="font-barlow-condensed font-bold text-5xl text-neutral-900 uppercase">
    {copy.title}
  </h1>
  <p className="mt-2 text-sm text-neutral-600">{copy.description}</p>
</div>
```

**Action bar** — filters left, CTA right:
```tsx
<Button asChild>
  <Link href="/dashboard/tripper/packages/new">{copy.newPackage}</Link>
</Button>
```

**Table panel** — `rounded-xl border border-gray-200 shadow-sm bg-white`:
- Columns: Paquete (title + city/country subtitle), Tipo/Nivel (stacked), Estado (badge), Precio/persona, Actualizado, Edit button
- Status badges: `ACTIVE`→green, `DRAFT`→yellow, `INACTIVE`→red, `ARCHIVED`→neutral
- Edit: `<Button asChild variant="ghost" size="sm"><Link href={...}>Editar</Link></Button>`

**Empty state** — centered microcopy + CTA inside the panel card.

---

## Form Page Design

**Page header** — dashboard style, no Hero:
- Create: "CREAR PAQUETE"
- Edit: package title uppercased

**Back link** — `<Button asChild variant="ghost">← {copy.back}</Button>`

**Layout** — `grid grid-cols-[200px_1fr] gap-6 items-start`

### Sidebar nav — 10 sections

1. Básico
2. Destino
3. Capacidad & Precio
4. Compatibilidad
5. Alojamiento
6. Actividades
7. Itinerario
8. Incluye / No incluye
9. Tags, Highlights & Media
10. Visibilidad

Save/cancel buttons below the nav.

### Section cards

Each section: `<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm" id="section-{slug}">`

Section heading: `<h2 className="text-lg font-semibold text-neutral-900 mb-4">`

---

### Section 1 — Básico

Fields: `title`*, `type`*, `level`*, `status` (edit only), `teaser` (maxLength 150), `description`

**type** — `<select>`: couple, family, group, solo, honeymoon, paws

**level** — `<select>`: essenza, modo-explora, explora-plus, bivouac, atelier-getaway

**status** — `<select>` (edit only): DRAFT, ACTIVE, INACTIVE, ARCHIVED. Hidden on create (defaults to DRAFT).

**Behavior**: changing `type` clears `excuseKey` (in Section 2). Changing `level` updates the max nights hint in Section 3.

---

### Section 2 — Destino

Fields: `destinationCountry`*, `destinationCity`*, `excuseKey` (conditional)

**excuseKey** — only rendered when `level === 'explora-plus' || level === 'bivouac'`. Rendered as a `<select>` with options filtered by `type`:

```ts
const EXCUSE_KEYS_BY_TYPE: Record<string, string[]> = {
  couple: [
    'Escapada Romántica', 'Dúo de Aventura', 'Foodie Lovers',
    'Cultura & Tradición', 'Wellness Retreat', 'Celebraciones',
    'Playa & Dunas', 'Escapada Urbana',
  ],
  solo: [
    'Get Lost', 'Búsqueda Interior', 'Aventura & Desafío',
    'Exploración Cultural', 'Fotografía & Narrativa Visual',
    'Literatura Arte & Talleres Locales', 'Música & Sonidos', 'Tribe Encounters',
  ],
  family: [
    'Aventura en familia', 'Naturaleza & fauna', 'Cultura & tradiciones',
    'Playas & dunas', 'Graduaciones & celebraciones', 'Escapadas Madre-hij@ / Padre-hij@',
  ],
  honeymoon: [], // NUPTIA is Atelier-only, no standard excuses
  paws: [
    'Senderos & Naturaleza', 'Playas Dog-Friendly', 'Ciudades Pet Lovers',
    'Aventura Outdoor', 'Relax & Bienestar', 'Escapadas Gastronómicas',
    'Trips Rurales & Granja', 'Dog Events & Comunidades',
  ],
  group: [
    'Narradores Visuales', 'Yoga & Bienestar', 'Religioso o Espiritual',
    'Gastronómico', 'Historias & Fantasía', 'Naturaleza & Aventura',
    'Amigos', 'Negocios', 'Estudiantes', 'Música & Festivales',
  ],
};
```

---

### Section 3 — Capacidad & Precio

**Capacity fields**: `minNights`, `maxNights`, `minPax`, `maxPax`

Level-aware max nights hint shown below the `maxNights` input:

```ts
const MAX_NIGHTS_BY_LEVEL: Record<string, number | null> = {
  'essenza': 2,
  'modo-explora': 3,
  'explora-plus': 4,
  'bivouac': 5,
  'atelier-getaway': null, // flexible
};
```

Helper text: `"Este nivel admite máx. {n} noches"`. Submit validation rejects if `maxNights > limit`.

**Pricing fields**: `basePriceUsd`, `displayPrice`

`basePriceUsd` label: "Precio base por persona (USD)". Helper shows product reference:

```ts
// Example reference prices from product maps (BOND):
// essenza: 350, modo-explora: 550, explora-plus: 850, bivouac: 1200
```

Show reference as: `"Referencia {product}: USD {amount} por persona"` — informational only, not a constraint.

---

### Section 4 — Compatibilidad

These 6 fields mirror the client's TripRequest filter fields. The tripper declares the package's characteristics so the matching algorithm can use them. All are `<select>` with an "Indistinto / Sin preferencia" default option (`any` / `no-limit`).

| Field | Options |
|---|---|
| `accommodationType` | any, hotel-style, home-style, nature-escape, hybrid-hub, glamping |
| `transport` | any, plane, bus, train, ship |
| `climate` | any, warm, cold, mild |
| `maxTravelTime` | no-limit, 3h, 5h, 8h |
| `departPref` | any, morning, afternoon, night |
| `arrivePref` | any, morning, afternoon, night |

Labels and option text are defined in the `packages` dictionary section (do not cross-reference `journeyFilters` — those belong to the client-facing flow). The values (e.g. `hotel-style`, `plane`) are the same canonical keys used in TripRequest.

---

### Section 5 — Alojamiento

`hotels` JSON field — array of hotel objects: `{ name: string; stars?: number; location?: string; checkIn?: string; checkOut?: string }[]`

UI: add/remove hotel cards. Each card has:
- Name (text input, required)
- Stars (number input 1–5, optional)
- Location (text input, optional)
- Check-in / Check-out (text inputs, free text like "Día 1" / "Día 3", optional)

Empty state: "No has agregado hoteles aún." + "Agregar Hotel" dashed button.

---

### Section 6 — Actividades

`activities` JSON field — array: `{ name: string; duration?: string; description?: string }[]`

UI: add/remove activity cards. Each card has:
- Name (text input, required)
- Duration (text input, optional, e.g. "3h")
- Description (textarea, optional)

---

### Section 7 — Itinerario

`itinerary` JSON field — array: `{ day: number; title: string; description: string }[]`

UI: numbered day cards (day number auto-increments). Each card has:
- Title (text input, required)
- Description (textarea, required)

Add Day button appends a new card. Days are always ordered 1..n.

---

### Section 8 — Incluye / No Incluye

`inclusions` and `exclusions` — both `string[]`. Two-column layout (on md+), stacked on mobile.

**Inclusions** — green list items (`bg-green-50 border-green-200 text-green-800`). Add via input + Enter/button. Remove via × button.

**Exclusions** — red list items (`bg-red-50 border-red-200 text-red-800`). Same interaction.

---

### Section 10 — Visibilidad

`isActive` — checkbox. Helper: "Visible para matching con clientes".
`isFeatured` — checkbox. Helper: "Aparece en la sección destacada".

---

### Section 9 — Tags, Highlights & Media

**Tags** (`string[]`) — neutral pill tokens. Add via input + Enter. Remove via ×.

**Highlights** (`string[]`) — same pattern as tags, separate list.

**heroImage** — URL input. Shows `<Img>` thumbnail preview (via `next/image`) once URL is set and valid, rendered below the input. No upload in this iteration.

---

## excuseKey Constant Location

Define `EXCUSE_KEYS_BY_TYPE` and `MAX_NIGHTS_BY_LEVEL` as constants in:
```
src/lib/constants/packages.ts
```

These are reused by both `PackageFormClient` (form validation) and any future matching algorithm.

---

## i18n

Add `packages` section to `src/dictionaries/es.json` and `src/dictionaries/en.json`.

Add `PackagesDict` interface to `src/lib/types/dictionary.ts` and reference in `MarketingDictionary`.

```ts
export interface PackagesDict {
  title: string;
  description: string;
  newPackage: string;
  back: string;
  filters: { allStatuses: string; allLevels: string };
  table: {
    package: string; typeLevel: string; status: string;
    price: string; updated: string; edit: string;
  };
  emptyState: { noPackages: string; noMatch: string; createFirst: string };
  status: { ACTIVE: string; DRAFT: string; INACTIVE: string; ARCHIVED: string };
  form: {
    createTitle: string;
    editTitle: string;
    createSubmit: string;
    editSubmit: string;
    cancel: string;
    saving: string;
    nav: { sections: string };
    sections: {
      basic: string; destination: string; capacityPricing: string;
      compatibility: string; accommodation: string; activities: string;
      itinerary: string; inclusions: string; tagsMedia: string;
    };
    fields: {
      title: string; type: string; level: string; status: string;
      teaser: string; teaserHint: string; description: string;
      country: string; city: string;
      excuseKey: string; excuseKeyHint: string;
      minNights: string; maxNights: string; maxNightsHint: string;
      minPax: string; maxPax: string;
      basePriceUsd: string; basePriceUsdHint: string; priceReference: string;
      displayPrice: string; displayPriceHint: string;
      accommodationType: string; transport: string; climate: string;
      maxTravelTime: string; departPref: string; arrivePref: string;
      compatibilityHint: string;
      hotelName: string; hotelStars: string; hotelLocation: string;
      hotelCheckIn: string; hotelCheckOut: string; addHotel: string;
      activityName: string; activityDuration: string; activityDesc: string;
      addActivity: string;
      itineraryTitle: string; itineraryDesc: string; addDay: string;
      inclusions: string; addInclusion: string;
      exclusions: string; addExclusion: string;
      tags: string; tagInput: string;
      highlights: string; highlightInput: string;
      heroImage: string; heroImageHint: string;
      isActive: string; isActiveHint: string;
      isFeatured: string; isFeaturedHint: string;
    };
  };
}
```

---

## Types

Add to `src/types/tripper.ts`:

```ts
export interface PackageHotel {
  name: string;
  stars?: number;
  location?: string;
  checkIn?: string;
  checkOut?: string;
}

export interface PackageActivity {
  name: string;
  duration?: string;
  description?: string;
}

export interface PackageItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface PackageFormData {
  // Identity
  type: string;
  level: string;
  title: string;
  status: string;

  // Display
  teaser: string;
  description: string;
  heroImage: string;

  // Destination
  destinationCountry: string;
  destinationCity: string;
  excuseKey: string;

  // Capacity
  minNights: number;
  maxNights: number;
  minPax: number;
  maxPax: number;

  // Pricing
  basePriceUsd: number;
  displayPrice: string;

  // Matching (mirrors TripRequest filters)
  accommodationType: string;
  transport: string;
  climate: string;
  maxTravelTime: string;
  departPref: string;
  arrivePref: string;

  // Content
  hotels: PackageHotel[];
  activities: PackageActivity[];
  itinerary: PackageItineraryDay[];
  inclusions: string[];
  exclusions: string[];

  // Discovery
  tags: string[];
  highlights: string[];

  // Visibility
  isActive: boolean;
  isFeatured: boolean;
}

export interface PackageListItem {
  id: string;
  title: string;
  type: string;
  level: string;
  status: string;
  isActive: boolean;
  basePriceUsd: number;
  displayPrice: string;
  destinationCountry: string;
  destinationCity: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## Affected Files

**Schema:**
- `prisma/schema.prisma` — add 6 matching fields to Package model
- Run `npm run db:migrate`

**API:**
- `src/app/api/packages/route.ts` — accept 6 new fields on POST
- `src/app/api/tripper/packages/[id]/route.ts` — fix GET select; accept 6 new fields on PATCH

**App pages:**
- `src/app/[locale]/dashboard/tripper/packages/page.tsx`
- `src/app/[locale]/dashboard/tripper/packages/new/page.tsx`
- `src/app/[locale]/dashboard/tripper/packages/[id]/page.tsx`

**Dictionary + types:**
- `src/dictionaries/es.json`
- `src/dictionaries/en.json`
- `src/lib/types/dictionary.ts`
- `src/types/tripper.ts`

**New files:**
- `src/components/app/dashboard/tripper/packages/PackagesPageClient.tsx`
- `src/components/app/dashboard/tripper/packages/PackageFormClient.tsx`
- `src/components/app/dashboard/tripper/packages/PackageFormNav.tsx`
- `src/lib/constants/packages.ts`

---

## Out of Scope

- Public-facing package display pages
- Upload/storage for hero images (URL input only for now)
- Matching algorithm implementation — this refactor enables it by capturing the right data
- Add-ons (`addons` field on TripRequest) — no corresponding field on Package yet
