# Packages Dashboard Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the 3 tripper package pages to use the dashboard design system, convert to server components, add i18n, expose all matching fields with a sidebar-nav form layout, and fix the API GET bug.

**Architecture:** Server component page shells fetch data via Prisma and pass typed props to "use client" components. A single `PackageFormClient` handles both create and edit modes. Constants and types are extracted to shared files.

**Tech Stack:** Next.js 14 App Router, Prisma 7, TypeScript 5, Tailwind CSS 4, react-hook-form not used (controlled state), Sonner toasts, lucide-react icons

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| **Create** | `src/lib/constants/packages.ts` | `EXCUSE_KEYS_BY_TYPE`, `MAX_NIGHTS_BY_LEVEL`, all select option arrays |
| **Modify** | `prisma/schema.prisma` | Add 6 matching fields to Package model |
| **Modify** | `src/types/tripper.ts` | Add `PackageHotel`, `PackageActivity`, `PackageItineraryDay`, `PackageFormData`, `PackageListItem` |
| **Modify** | `src/lib/types/dictionary.ts` | Add `PackagesDict` interface, reference in `MarketingDictionary` |
| **Modify** | `src/dictionaries/es.json` | Add `packages` section |
| **Modify** | `src/dictionaries/en.json` | Add `packages` section |
| **Modify** | `src/app/api/packages/route.ts` | Accept 6 new matching fields in POST |
| **Modify** | `src/app/api/tripper/packages/[id]/route.ts` | Fix GET select (add 5 JSON + 6 matching fields); add 6 new fields to PATCH |
| **Replace** | `src/app/[locale]/dashboard/tripper/packages/page.tsx` | Server component shell → passes data to `PackagesPageClient` |
| **Replace** | `src/app/[locale]/dashboard/tripper/packages/new/page.tsx` | Server component shell → renders `PackageFormClient mode="create"` |
| **Replace** | `src/app/[locale]/dashboard/tripper/packages/[id]/page.tsx` | Server component shell → fetches package, renders `PackageFormClient mode="edit"` |
| **Create** | `src/components/app/dashboard/tripper/packages/PackagesPageClient.tsx` | "use client" list page UI |
| **Create** | `src/components/app/dashboard/tripper/packages/PackageFormNav.tsx` | Sticky sidebar nav with section links |
| **Create** | `src/components/app/dashboard/tripper/packages/PackageFormClient.tsx` | Shared create/edit form, all 10 sections |

---

## Task 1: Constants file

**Files:**
- Create: `src/lib/constants/packages.ts`

- [ ] **Step 1: Create the constants file**

```ts
// src/lib/constants/packages.ts

export const PACKAGE_TYPES = [
  { value: 'couple', label: 'Pareja (BOND©)' },
  { value: 'family', label: 'Familia (KIN©)' },
  { value: 'group', label: 'Grupo (CREW©)' },
  { value: 'solo', label: 'Solo (SOLUM©)' },
  { value: 'honeymoon', label: 'Luna de Miel (NUPTIA©)' },
  { value: 'paws', label: 'Con Mascotas (PAWS©)' },
] as const;

export const PACKAGE_LEVELS = [
  { value: 'essenza', label: 'Essenza' },
  { value: 'modo-explora', label: 'Modo Explora' },
  { value: 'explora-plus', label: 'Explora+' },
  { value: 'bivouac', label: 'Bivouac' },
  { value: 'atelier-getaway', label: 'Atelier Getaway' },
] as const;

export const PACKAGE_STATUSES = [
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
  { value: 'ARCHIVED', label: 'Archivado' },
] as const;

export const ACCOMMODATION_TYPES = [
  { value: 'any', label: 'Indistinto' },
  { value: 'hotel-style', label: 'Hotel' },
  { value: 'home-style', label: 'Apartamento / Casa' },
  { value: 'nature-escape', label: 'Naturaleza' },
  { value: 'hybrid-hub', label: 'Híbrido' },
  { value: 'glamping', label: 'Glamping' },
] as const;

export const TRANSPORT_MODES = [
  { value: 'any', label: 'Indistinto' },
  { value: 'plane', label: 'Avión' },
  { value: 'bus', label: 'Bus' },
  { value: 'train', label: 'Tren' },
  { value: 'ship', label: 'Barco / Ferry' },
] as const;

export const CLIMATE_OPTIONS = [
  { value: 'any', label: 'Indistinto' },
  { value: 'warm', label: 'Cálido' },
  { value: 'cold', label: 'Frío' },
  { value: 'mild', label: 'Templado' },
] as const;

export const MAX_TRAVEL_TIME_OPTIONS = [
  { value: 'no-limit', label: 'Sin límite' },
  { value: '3h', label: 'Hasta 3 horas' },
  { value: '5h', label: 'Hasta 5 horas' },
  { value: '8h', label: 'Hasta 8 horas' },
] as const;

export const TIME_PREFERENCES = [
  { value: 'any', label: 'Indistinto' },
  { value: 'morning', label: 'Mañana' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'night', label: 'Noche' },
] as const;

export const EXCUSE_KEYS_BY_TYPE: Record<string, string[]> = {
  couple: [
    'Escapada Romántica',
    'Dúo de Aventura',
    'Foodie Lovers',
    'Cultura & Tradición',
    'Wellness Retreat',
    'Celebraciones',
    'Playa & Dunas',
    'Escapada Urbana',
  ],
  solo: [
    'Get Lost',
    'Búsqueda Interior',
    'Aventura & Desafío',
    'Exploración Cultural',
    'Fotografía & Narrativa Visual',
    'Literatura Arte & Talleres Locales',
    'Música & Sonidos',
    'Tribe Encounters',
  ],
  family: [
    'Aventura en familia',
    'Naturaleza & fauna',
    'Cultura & tradiciones',
    'Playas & dunas',
    'Graduaciones & celebraciones',
    'Escapadas Madre-hij@ / Padre-hij@',
  ],
  honeymoon: [],
  paws: [
    'Senderos & Naturaleza',
    'Playas Dog-Friendly',
    'Ciudades Pet Lovers',
    'Aventura Outdoor',
    'Relax & Bienestar',
    'Escapadas Gastronómicas',
    'Trips Rurales & Granja',
    'Dog Events & Comunidades',
  ],
  group: [
    'Narradores Visuales',
    'Yoga & Bienestar',
    'Religioso o Espiritual',
    'Gastronómico',
    'Historias & Fantasía',
    'Naturaleza & Aventura',
    'Amigos',
    'Negocios',
    'Estudiantes',
    'Música & Festivales',
  ],
};

export const MAX_NIGHTS_BY_LEVEL: Record<string, number | null> = {
  'essenza': 2,
  'modo-explora': 3,
  'explora-plus': 4,
  'bivouac': 5,
  'atelier-getaway': null,
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/constants/packages.ts
git commit -m "feat: add packages constants (excuse keys, level limits, select options)"
```

---

## Task 2: Schema migration — add 6 matching fields

**Files:**
- Modify: `prisma/schema.prisma:121-177`

- [ ] **Step 1: Add 6 fields to the Package model**

Open `prisma/schema.prisma`. After line `basePriceUsd Float  @default(0)` (currently line 159), add:

```prisma
  // Compatibility matching (mirrors TripRequest filter fields)
  accommodationType String @default("any") // hotel-style | home-style | nature-escape | hybrid-hub | glamping | any
  transport         String @default("any") // plane | bus | train | ship | any
  climate           String @default("any") // warm | cold | mild | any
  maxTravelTime     String @default("no-limit") // no-limit | 3h | 5h | 8h
  departPref        String @default("any") // morning | afternoon | night | any
  arrivePref        String @default("any") // morning | afternoon | night | any
```

The block from `basePriceUsd` through `displayPrice` in the Package model should read:

```prisma
  // Pricing
  basePriceUsd Float  @default(0)
  displayPrice String @default("")

  // Compatibility matching (mirrors TripRequest filter fields)
  accommodationType String @default("any")
  transport         String @default("any")
  climate           String @default("any")
  maxTravelTime     String @default("no-limit")
  departPref        String @default("any")
  arrivePref        String @default("any")
```

- [ ] **Step 2: Run the migration**

```bash
npm run db:migrate
```

When prompted for a migration name, enter: `add_package_matching_fields`

Expected: Migration created and applied successfully.

- [ ] **Step 3: Regenerate the Prisma client**

```bash
npm run db:generate
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add 6 matching fields to Package schema (accommodationType, transport, climate, maxTravelTime, departPref, arrivePref)"
```

---

## Task 3: Types — add package-specific types to tripper.ts

**Files:**
- Modify: `src/types/tripper.ts`

- [ ] **Step 1: Read the current file to find the insertion point**

Read `src/types/tripper.ts` to see the end of the file.

- [ ] **Step 2: Append the new types**

Add to the end of `src/types/tripper.ts`:

```ts
// ─── Package Types ────────────────────────────────────────────────────────────

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

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/tripper.ts
git commit -m "feat: add PackageFormData, PackageListItem, and JSON sub-types to tripper types"
```

---

## Task 4: i18n — PackagesDict interface + dictionary strings

**Files:**
- Modify: `src/lib/types/dictionary.ts`
- Modify: `src/dictionaries/es.json`
- Modify: `src/dictionaries/en.json`

- [ ] **Step 1: Add PackagesDict to dictionary.ts**

Read `src/lib/types/dictionary.ts` to find the `MarketingDictionary` interface. Add before it:

```ts
export interface PackagesDict {
  title: string;
  description: string;
  newPackage: string;
  back: string;
  filters: {
    allStatuses: string;
    allLevels: string;
  };
  table: {
    package: string;
    typeLevel: string;
    status: string;
    price: string;
    updated: string;
    edit: string;
  };
  emptyState: {
    noPackages: string;
    noMatch: string;
    createFirst: string;
  };
  status: {
    ACTIVE: string;
    DRAFT: string;
    INACTIVE: string;
    ARCHIVED: string;
  };
  form: {
    createTitle: string;
    editTitle: string;
    createSubmit: string;
    editSubmit: string;
    cancel: string;
    saving: string;
    nav: {
      sections: string;
    };
    sections: {
      basic: string;
      destination: string;
      capacityPricing: string;
      compatibility: string;
      accommodation: string;
      activities: string;
      itinerary: string;
      inclusions: string;
      tagsMedia: string;
      visibility: string;
    };
    fields: {
      title: string;
      type: string;
      level: string;
      status: string;
      teaser: string;
      teaserHint: string;
      description: string;
      country: string;
      city: string;
      excuseKey: string;
      excuseKeyHint: string;
      minNights: string;
      maxNights: string;
      maxNightsHint: string;
      minPax: string;
      maxPax: string;
      basePriceUsd: string;
      basePriceUsdHint: string;
      displayPrice: string;
      displayPriceHint: string;
      accommodationType: string;
      transport: string;
      climate: string;
      maxTravelTime: string;
      departPref: string;
      arrivePref: string;
      compatibilityHint: string;
      hotelName: string;
      hotelStars: string;
      hotelLocation: string;
      hotelCheckIn: string;
      hotelCheckOut: string;
      addHotel: string;
      noHotels: string;
      activityName: string;
      activityDuration: string;
      activityDesc: string;
      addActivity: string;
      noActivities: string;
      itineraryTitle: string;
      itineraryDesc: string;
      addDay: string;
      noItinerary: string;
      inclusions: string;
      addInclusion: string;
      exclusions: string;
      addExclusion: string;
      tags: string;
      tagInput: string;
      highlights: string;
      highlightInput: string;
      heroImage: string;
      heroImageHint: string;
      isActive: string;
      isActiveHint: string;
      isFeatured: string;
      isFeaturedHint: string;
    };
  };
}
```

Then add `packages: PackagesDict;` as a field inside `MarketingDictionary`.

- [ ] **Step 2: Add Spanish strings to es.json**

Add at the root level of `src/dictionaries/es.json`:

```json
"packages": {
  "title": "MIS PAQUETES",
  "description": "Gestiona tus ofertas de viaje y mantén tu catálogo actualizado.",
  "newPackage": "Nuevo Paquete",
  "back": "Volver a Mis Paquetes",
  "filters": {
    "allStatuses": "Todos los estados",
    "allLevels": "Todos los niveles"
  },
  "table": {
    "package": "Paquete",
    "typeLevel": "Tipo / Nivel",
    "status": "Estado",
    "price": "Precio / persona",
    "updated": "Actualizado",
    "edit": "Editar"
  },
  "emptyState": {
    "noPackages": "Aún no tienes paquetes.",
    "noMatch": "Ningún paquete coincide con los filtros.",
    "createFirst": "Crear mi primer paquete"
  },
  "status": {
    "ACTIVE": "Activo",
    "DRAFT": "Borrador",
    "INACTIVE": "Inactivo",
    "ARCHIVED": "Archivado"
  },
  "form": {
    "createTitle": "CREAR PAQUETE",
    "editTitle": "EDITAR PAQUETE",
    "createSubmit": "Crear Paquete",
    "editSubmit": "Guardar Cambios",
    "cancel": "Cancelar",
    "saving": "Guardando...",
    "nav": {
      "sections": "Secciones"
    },
    "sections": {
      "basic": "Básico",
      "destination": "Destino",
      "capacityPricing": "Capacidad & Precio",
      "compatibility": "Compatibilidad",
      "accommodation": "Alojamiento",
      "activities": "Actividades",
      "itinerary": "Itinerario",
      "inclusions": "Incluye / No incluye",
      "tagsMedia": "Tags, Highlights & Media",
      "visibility": "Visibilidad"
    },
    "fields": {
      "title": "Título",
      "type": "Tipo de viaje",
      "level": "Nivel",
      "status": "Estado",
      "teaser": "Teaser",
      "teaserHint": "Descripción corta que aparece en las tarjetas (máx. 150 caracteres)",
      "description": "Descripción completa",
      "country": "País de destino",
      "city": "Ciudad de destino",
      "excuseKey": "Excusa del viaje",
      "excuseKeyHint": "La excusa que el cliente usa para justificar el viaje ante terceros",
      "minNights": "Noches mínimas",
      "maxNights": "Noches máximas",
      "maxNightsHint": "Este nivel admite máx. {n} noches",
      "minPax": "Viajeros mínimos",
      "maxPax": "Viajeros máximos",
      "basePriceUsd": "Precio base por persona (USD)",
      "basePriceUsdHint": "Precio por persona, en dólares",
      "displayPrice": "Precio de visualización",
      "displayPriceHint": "Texto libre que aparece en la tarjeta pública. Ej: Desde USD 450",
      "accommodationType": "Tipo de alojamiento",
      "transport": "Transporte principal",
      "climate": "Clima del destino",
      "maxTravelTime": "Tiempo máximo de viaje",
      "departPref": "Preferencia de salida",
      "arrivePref": "Preferencia de llegada",
      "compatibilityHint": "Estos campos ayudan al algoritmo a hacer matching con solicitudes de clientes.",
      "hotelName": "Nombre del hotel",
      "hotelStars": "Estrellas",
      "hotelLocation": "Ubicación",
      "hotelCheckIn": "Check-in",
      "hotelCheckOut": "Check-out",
      "addHotel": "Agregar Hotel",
      "noHotels": "No has agregado hoteles aún.",
      "activityName": "Nombre de la actividad",
      "activityDuration": "Duración",
      "activityDesc": "Descripción",
      "addActivity": "Agregar Actividad",
      "noActivities": "No has agregado actividades aún.",
      "itineraryTitle": "Título del día",
      "itineraryDesc": "Descripción del día",
      "addDay": "Agregar Día",
      "noItinerary": "No has agregado días al itinerario aún.",
      "inclusions": "¿Qué incluye?",
      "addInclusion": "Agregar inclusión",
      "exclusions": "¿Qué no incluye?",
      "addExclusion": "Agregar exclusión",
      "tags": "Tags",
      "tagInput": "Nuevo tag (Enter para agregar)",
      "highlights": "Highlights",
      "highlightInput": "Nuevo highlight (Enter para agregar)",
      "heroImage": "Imagen hero (URL)",
      "heroImageHint": "URL de la imagen principal del paquete",
      "isActive": "Paquete activo",
      "isActiveHint": "Visible para matching con clientes",
      "isFeatured": "Destacado",
      "isFeaturedHint": "Aparece en la sección destacada"
    }
  }
}
```

- [ ] **Step 3: Add English strings to en.json**

Add at the root level of `src/dictionaries/en.json`:

```json
"packages": {
  "title": "MY PACKAGES",
  "description": "Manage your travel offers and keep your catalog up to date.",
  "newPackage": "New Package",
  "back": "Back to My Packages",
  "filters": {
    "allStatuses": "All statuses",
    "allLevels": "All levels"
  },
  "table": {
    "package": "Package",
    "typeLevel": "Type / Level",
    "status": "Status",
    "price": "Price / person",
    "updated": "Updated",
    "edit": "Edit"
  },
  "emptyState": {
    "noPackages": "You don't have any packages yet.",
    "noMatch": "No packages match the current filters.",
    "createFirst": "Create my first package"
  },
  "status": {
    "ACTIVE": "Active",
    "DRAFT": "Draft",
    "INACTIVE": "Inactive",
    "ARCHIVED": "Archived"
  },
  "form": {
    "createTitle": "CREATE PACKAGE",
    "editTitle": "EDIT PACKAGE",
    "createSubmit": "Create Package",
    "editSubmit": "Save Changes",
    "cancel": "Cancel",
    "saving": "Saving...",
    "nav": {
      "sections": "Sections"
    },
    "sections": {
      "basic": "Basic",
      "destination": "Destination",
      "capacityPricing": "Capacity & Pricing",
      "compatibility": "Compatibility",
      "accommodation": "Accommodation",
      "activities": "Activities",
      "itinerary": "Itinerary",
      "inclusions": "Inclusions / Exclusions",
      "tagsMedia": "Tags, Highlights & Media",
      "visibility": "Visibility"
    },
    "fields": {
      "title": "Title",
      "type": "Trip type",
      "level": "Level",
      "status": "Status",
      "teaser": "Teaser",
      "teaserHint": "Short description shown on cards (max 150 characters)",
      "description": "Full description",
      "country": "Destination country",
      "city": "Destination city",
      "excuseKey": "Trip excuse",
      "excuseKeyHint": "The excuse the client uses to justify the trip",
      "minNights": "Minimum nights",
      "maxNights": "Maximum nights",
      "maxNightsHint": "This level supports max {n} nights",
      "minPax": "Minimum travelers",
      "maxPax": "Maximum travelers",
      "basePriceUsd": "Base price per person (USD)",
      "basePriceUsdHint": "Price per person, in USD",
      "displayPrice": "Display price",
      "displayPriceHint": "Free text shown on the public card. E.g.: From USD 450",
      "accommodationType": "Accommodation type",
      "transport": "Main transport",
      "climate": "Destination climate",
      "maxTravelTime": "Max travel time",
      "departPref": "Departure preference",
      "arrivePref": "Arrival preference",
      "compatibilityHint": "These fields help the matching algorithm pair your package with client requests.",
      "hotelName": "Hotel name",
      "hotelStars": "Stars",
      "hotelLocation": "Location",
      "hotelCheckIn": "Check-in",
      "hotelCheckOut": "Check-out",
      "addHotel": "Add Hotel",
      "noHotels": "No hotels added yet.",
      "activityName": "Activity name",
      "activityDuration": "Duration",
      "activityDesc": "Description",
      "addActivity": "Add Activity",
      "noActivities": "No activities added yet.",
      "itineraryTitle": "Day title",
      "itineraryDesc": "Day description",
      "addDay": "Add Day",
      "noItinerary": "No itinerary days added yet.",
      "inclusions": "What's included?",
      "addInclusion": "Add inclusion",
      "exclusions": "What's not included?",
      "addExclusion": "Add exclusion",
      "tags": "Tags",
      "tagInput": "New tag (Enter to add)",
      "highlights": "Highlights",
      "highlightInput": "New highlight (Enter to add)",
      "heroImage": "Hero image (URL)",
      "heroImageHint": "URL of the package's main image",
      "isActive": "Package active",
      "isActiveHint": "Visible for matching with clients",
      "isFeatured": "Featured",
      "isFeaturedHint": "Appears in the featured section"
    }
  }
}
```

- [ ] **Step 4: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/types/dictionary.ts src/dictionaries/es.json src/dictionaries/en.json
git commit -m "feat: add PackagesDict interface and i18n strings for packages flow"
```

---

## Task 5: Fix API — GET bug + add 6 new fields to GET/PATCH/POST

**Files:**
- Modify: `src/app/api/tripper/packages/[id]/route.ts`
- Modify: `src/app/api/packages/route.ts`

- [ ] **Step 1: Fix the GET select in /api/tripper/packages/[id]/route.ts**

In the GET handler `select` object (lines 44–68), add after `updatedAt: true`:

```ts
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

- [ ] **Step 2: Add 6 new fields to the PATCH destructure + data object**

In the PATCH handler, add to the destructure block (after `exclusions`):

```ts
      accommodationType,
      transport,
      climate,
      maxTravelTime,
      departPref,
      arrivePref,
```

And add to the `prisma.package.update` data block (after the exclusions spread):

```ts
        accommodationType: accommodationType ?? 'any',
        transport: transport ?? 'any',
        climate: climate ?? 'any',
        maxTravelTime: maxTravelTime ?? 'no-limit',
        departPref: departPref ?? 'any',
        arrivePref: arrivePref ?? 'any',
```

- [ ] **Step 3: Add 6 new fields to the POST in /api/packages/route.ts**

In the POST handler, add to the destructure block (after `displayPrice`):

```ts
      accommodationType,
      transport,
      climate,
      maxTravelTime,
      departPref,
      arrivePref,
      excuseKey,
      isActive,
      isFeatured,
```

And in `packageData`, add after `displayPrice: displayPrice || ''`:

```ts
      excuseKey: excuseKey || null,
      isActive: isActive ?? true,
      isFeatured: isFeatured ?? false,
      accommodationType: accommodationType || 'any',
      transport: transport || 'any',
      climate: climate || 'any',
      maxTravelTime: maxTravelTime || 'no-limit',
      departPref: departPref || 'any',
      arrivePref: arrivePref || 'any',
```

- [ ] **Step 4: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/tripper/packages/[id]/route.ts src/app/api/packages/route.ts
git commit -m "fix: add missing JSON fields to GET select; add 6 matching fields to GET/PATCH/POST"
```

---

## Task 6: PackagesPageClient component

**Files:**
- Create: `src/components/app/dashboard/tripper/packages/PackagesPageClient.tsx`

- [ ] **Step 1: Create the list page client component**

```tsx
// src/components/app/dashboard/tripper/packages/PackagesPageClient.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import type { PackageListItem } from "@/types/tripper";
import type { PackagesDict } from "@/lib/types/dictionary";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  DRAFT: "bg-yellow-100 text-yellow-800 border-yellow-200",
  INACTIVE: "bg-red-100 text-red-800 border-red-200",
  ARCHIVED: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

interface PackagesPageClientProps {
  packages: PackageListItem[];
  copy: PackagesDict;
  locale: string;
}

export default function PackagesPageClient({
  packages,
  copy,
  locale,
}: PackagesPageClientProps) {
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");

  const filtered = useMemo(() => {
    return packages.filter((pkg) => {
      const statusMatch = selectedStatus === "all" || pkg.status === selectedStatus;
      const levelMatch = selectedLevel === "all" || pkg.level === selectedLevel;
      return statusMatch && levelMatch;
    });
  }, [packages, selectedStatus, selectedLevel]);

  const levels = useMemo(() => {
    return Array.from(new Set(packages.map((p) => p.level))).sort();
  }, [packages]);

  const basePath = `/${locale}/dashboard/tripper/packages`;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] font-semibold text-neutral-500 mb-2">
            Tripper OS
          </p>
          <h1 className="font-barlow-condensed font-bold text-5xl text-neutral-900 uppercase">
            {copy.title}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">{copy.description}</p>
        </div>
        <Button asChild>
          <Link href={`${basePath}/new`}>
            <Plus className="h-4 w-4 mr-2" />
            {copy.newPackage}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900"
        >
          <option value="all">{copy.filters.allStatuses}</option>
          {(["ACTIVE", "DRAFT", "INACTIVE", "ARCHIVED"] as const).map((s) => (
            <option key={s} value={s}>{copy.status[s]}</option>
          ))}
        </select>

        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900"
        >
          <option value="all">{copy.filters.allLevels}</option>
          {levels.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      {/* Table panel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-neutral-500 mb-4">
              {packages.length === 0 ? copy.emptyState.noPackages : copy.emptyState.noMatch}
            </p>
            {packages.length === 0 && (
              <Button asChild size="sm">
                <Link href={`${basePath}/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  {copy.emptyState.createFirst}
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {copy.table.package}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {copy.table.typeLevel}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {copy.table.status}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {copy.table.price}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {copy.table.updated}
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-neutral-900">{pkg.title}</div>
                      <div className="text-xs text-neutral-500">
                        {pkg.destinationCity}, {pkg.destinationCountry}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-neutral-700 capitalize">{pkg.type}</div>
                      <div className="text-xs text-neutral-500 capitalize">{pkg.level}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full border ${
                          STATUS_COLORS[pkg.status] ?? STATUS_COLORS.DRAFT
                        }`}
                      >
                        {copy.status[pkg.status as keyof typeof copy.status] ?? pkg.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-700">
                      {pkg.displayPrice || `USD ${pkg.basePriceUsd.toLocaleString()}`}
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-500">
                      {new Date(pkg.updatedAt).toLocaleDateString(
                        locale.startsWith("en") ? "en-US" : "es-ES",
                        { day: "numeric", month: "short", year: "numeric" }
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`${basePath}/${pkg.id}`}>{copy.table.edit}</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/app/dashboard/tripper/packages/PackagesPageClient.tsx
git commit -m "feat: add PackagesPageClient list component with filters and table"
```

---

## Task 7: Replace packages/page.tsx with server component

**Files:**
- Replace: `src/app/[locale]/dashboard/tripper/packages/page.tsx`

- [ ] **Step 1: Replace the page with a server component**

```tsx
// src/app/[locale]/dashboard/tripper/packages/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getDictionary } from "@/lib/i18n";
import Section from "@/components/layout/Section";
import PackagesPageClient from "@/components/app/dashboard/tripper/packages/PackagesPageClient";
import type { PackageListItem } from "@/types/tripper";

export default async function TripperPackagesPage({
  params,
}: {
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/${params.locale}/login`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user || !hasRoleAccess(user.role, "tripper")) {
    redirect(`/${params.locale}/dashboard`);
  }

  const rawPackages = await prisma.package.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      type: true,
      level: true,
      status: true,
      isActive: true,
      basePriceUsd: true,
      displayPrice: true,
      destinationCountry: true,
      destinationCity: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const packages: PackageListItem[] = rawPackages.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const dict = await getDictionary(params.locale);

  return (
    <Section>
      <div className="rt-container py-8">
        <PackagesPageClient
          packages={packages}
          copy={dict.packages}
          locale={params.locale}
        />
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors. If `getDictionary` is not the right import, check `src/lib/i18n/` for the server-side dict loader — pattern used in `blogs/page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/dashboard/tripper/packages/page.tsx
git commit -m "feat: convert packages list page to server component"
```

---

## Task 8: PackageFormNav component

**Files:**
- Create: `src/components/app/dashboard/tripper/packages/PackageFormNav.tsx`

- [ ] **Step 1: Create the sidebar nav component**

```tsx
// src/components/app/dashboard/tripper/packages/PackageFormNav.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface NavSection {
  id: string;
  label: string;
}

interface PackageFormNavProps {
  sections: NavSection[];
  activeSection: string;
  onSectionClick: (id: string) => void;
  mode: "create" | "edit";
  loading: boolean;
  onCancel: () => void;
  submitLabel: string;
  cancelLabel: string;
}

export default function PackageFormNav({
  sections,
  activeSection,
  onSectionClick,
  mode,
  loading,
  onCancel,
  submitLabel,
  cancelLabel,
}: PackageFormNavProps) {
  return (
    <div className="sticky top-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-1">
      {sections.map((section) => {
        const isActive = activeSection === section.id;
        return (
          <a
            key={section.id}
            href={`#section-${section.id}`}
            onClick={() => onSectionClick(section.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? "bg-neutral-100 text-neutral-900 font-medium"
                : "text-neutral-500 hover:text-neutral-700 hover:bg-gray-50"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                isActive ? "bg-neutral-900" : "bg-neutral-300"
              }`}
            />
            {section.label}
          </a>
        );
      })}

      <div className="pt-4 space-y-2 border-t border-gray-100 mt-2">
        <Button type="submit" className="w-full" disabled={loading} form="package-form">
          {loading ? "..." : submitLabel}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onCancel}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/app/dashboard/tripper/packages/PackageFormNav.tsx
git commit -m "feat: add PackageFormNav sticky sidebar with section links and save/cancel"
```

---

## Task 9: PackageFormClient — sections 1–4 (Básico, Destino, Capacidad & Precio, Compatibilidad)

**Files:**
- Create: `src/components/app/dashboard/tripper/packages/PackageFormClient.tsx`

- [ ] **Step 1: Create PackageFormClient with sections 1–4**

```tsx
// src/components/app/dashboard/tripper/packages/PackageFormClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import PackageFormNav from "./PackageFormNav";
import type { PackageFormData } from "@/types/tripper";
import type { PackagesDict } from "@/lib/types/dictionary";
import {
  PACKAGE_TYPES,
  PACKAGE_LEVELS,
  PACKAGE_STATUSES,
  ACCOMMODATION_TYPES,
  TRANSPORT_MODES,
  CLIMATE_OPTIONS,
  MAX_TRAVEL_TIME_OPTIONS,
  TIME_PREFERENCES,
  EXCUSE_KEYS_BY_TYPE,
  MAX_NIGHTS_BY_LEVEL,
} from "@/lib/constants/packages";

const EMPTY_FORM: PackageFormData = {
  type: "couple",
  level: "essenza",
  title: "",
  status: "DRAFT",
  teaser: "",
  description: "",
  heroImage: "",
  destinationCountry: "",
  destinationCity: "",
  excuseKey: "",
  minNights: 1,
  maxNights: 2,
  minPax: 1,
  maxPax: 8,
  basePriceUsd: 0,
  displayPrice: "",
  accommodationType: "any",
  transport: "any",
  climate: "any",
  maxTravelTime: "no-limit",
  departPref: "any",
  arrivePref: "any",
  hotels: [],
  activities: [],
  itinerary: [],
  inclusions: [],
  exclusions: [],
  tags: [],
  highlights: [],
  isActive: true,
  isFeatured: false,
};

interface PackageFormClientProps {
  mode: "create" | "edit";
  initialData?: PackageFormData;
  packageId?: string;
  copy: PackagesDict["form"];
  locale: string;
}

const SECTION_IDS = [
  "basic",
  "destination",
  "capacity",
  "compatibility",
  "accommodation",
  "activities",
  "itinerary",
  "inclusions",
  "tags-media",
  "visibility",
] as const;

// ─── helper: pill token list ──────────────────────────────────────────────────
function TokenList({
  items,
  onRemove,
  color = "neutral",
}: {
  items: string[];
  onRemove: (item: string) => void;
  color?: "neutral" | "green" | "red";
}) {
  const cls = {
    neutral: "bg-neutral-100 text-neutral-700 border-neutral-200",
    green: "bg-green-50 text-green-800 border-green-200",
    red: "bg-red-50 text-red-800 border-red-200",
  }[color];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded-full border ${cls}`}
        >
          {item}
          <button
            type="button"
            onClick={() => onRemove(item)}
            className="opacity-60 hover:opacity-100 leading-none"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

// ─── helper: token input ──────────────────────────────────────────────────────
function TokenInput({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (value: string) => void;
}) {
  const [val, setVal] = useState("");
  const submit = () => {
    if (val.trim()) {
      onAdd(val.trim());
      setVal("");
    }
  };
  return (
    <div className="flex gap-2">
      <Input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        className="text-sm"
      />
      <Button type="button" variant="outline" size="sm" onClick={submit}>
        +
      </Button>
    </div>
  );
}

export default function PackageFormClient({
  mode,
  initialData,
  packageId,
  copy,
  locale,
}: PackageFormClientProps) {
  const router = useRouter();
  const [form, setForm] = useState<PackageFormData>(initialData ?? EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(SECTION_IDS[0]);

  const basePath = `/${locale}/dashboard/tripper/packages`;

  const sections = [
    { id: "basic", label: copy.sections.basic },
    { id: "destination", label: copy.sections.destination },
    { id: "capacity", label: copy.sections.capacityPricing },
    { id: "compatibility", label: copy.sections.compatibility },
    { id: "accommodation", label: copy.sections.accommodation },
    { id: "activities", label: copy.sections.activities },
    { id: "itinerary", label: copy.sections.itinerary },
    { id: "inclusions", label: copy.sections.inclusions },
    { id: "tags-media", label: copy.sections.tagsMedia },
    { id: "visibility", label: copy.sections.visibility },
  ];

  const maxNightsLimit = MAX_NIGHTS_BY_LEVEL[form.level] ?? null;
  const excuseOptions = EXCUSE_KEYS_BY_TYPE[form.type] ?? [];
  const showExcuse =
    form.level === "explora-plus" || form.level === "bivouac";

  const set = <K extends keyof PackageFormData>(key: K, value: PackageFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleTypeChange = (value: string) => {
    setForm((prev) => ({ ...prev, type: value, excuseKey: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (maxNightsLimit !== null && form.maxNights > maxNightsLimit) {
      toast.error(
        copy.fields.maxNightsHint.replace("{n}", String(maxNightsLimit))
      );
      return;
    }

    setLoading(true);

    try {
      const url =
        mode === "create"
          ? "/api/packages"
          : `/api/tripper/packages/${packageId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          mode === "create" ? "Paquete creado" : "Cambios guardados"
        );
        router.push(basePath);
      } else {
        toast.error(data.error ?? "Error al guardar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900";
  const labelClass = "block text-sm font-medium text-neutral-700 mb-1.5";
  const hintClass = "text-xs text-neutral-400 mt-1";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Button asChild variant="ghost" className="-ml-2 mb-4">
          <a href={basePath}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {copy.cancel}
          </a>
        </Button>
        <p className="text-xs uppercase tracking-[0.18em] font-semibold text-neutral-500 mb-2">
          Tripper OS
        </p>
        <h1 className="font-barlow-condensed font-bold text-5xl text-neutral-900 uppercase">
          {mode === "create" ? copy.createTitle : (initialData?.title?.toUpperCase() ?? copy.editTitle)}
        </h1>
      </div>

      {/* Layout: sidebar nav + scrollable form */}
      <div className="grid grid-cols-[200px_1fr] gap-6 items-start">
        {/* Sidebar */}
        <PackageFormNav
          sections={sections}
          activeSection={activeSection}
          onSectionClick={setActiveSection}
          mode={mode}
          loading={loading}
          onCancel={() => router.push(basePath)}
          submitLabel={loading ? copy.saving : mode === "create" ? copy.createSubmit : copy.editSubmit}
          cancelLabel={copy.cancel}
        />

        {/* Form sections */}
        <form id="package-form" onSubmit={handleSubmit} className="space-y-6">

          {/* Section 1: Básico */}
          <div
            id="section-basic"
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              {copy.sections.basic}
            </h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>
                  {copy.fields.title} <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Ej: Aventura Urbana Misteriosa"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    {copy.fields.type} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className={fieldClass}
                    required
                  >
                    {PACKAGE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    {copy.fields.level} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.level}
                    onChange={(e) => set("level", e.target.value)}
                    className={fieldClass}
                    required
                  >
                    {PACKAGE_LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {mode === "edit" && (
                <div>
                  <label className={labelClass}>{copy.fields.status}</label>
                  <select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value)}
                    className={fieldClass}
                  >
                    {PACKAGE_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={labelClass}>{copy.fields.teaser}</label>
                <Input
                  value={form.teaser}
                  onChange={(e) => set("teaser", e.target.value)}
                  placeholder="Una descripción breve para las tarjetas"
                  maxLength={150}
                />
                <p className={hintClass}>{copy.fields.teaserHint}</p>
              </div>

              <div>
                <label className={labelClass}>{copy.fields.description}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={5}
                  className={fieldClass}
                  placeholder="Describe tu paquete en detalle..."
                />
              </div>
            </div>
          </div>

          {/* Section 2: Destino */}
          <div
            id="section-destination"
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              {copy.sections.destination}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    {copy.fields.country} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={form.destinationCountry}
                    onChange={(e) => set("destinationCountry", e.target.value)}
                    placeholder="Ej: Argentina"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    {copy.fields.city} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={form.destinationCity}
                    onChange={(e) => set("destinationCity", e.target.value)}
                    placeholder="Ej: Buenos Aires"
                    required
                  />
                </div>
              </div>

              {showExcuse && excuseOptions.length > 0 && (
                <div>
                  <label className={labelClass}>{copy.fields.excuseKey}</label>
                  <select
                    value={form.excuseKey}
                    onChange={(e) => set("excuseKey", e.target.value)}
                    className={fieldClass}
                  >
                    <option value="">— Seleccionar excusa —</option>
                    {excuseOptions.map((key) => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                  <p className={hintClass}>{copy.fields.excuseKeyHint}</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Capacidad & Precio */}
          <div
            id="section-capacity"
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              {copy.sections.capacityPricing}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className={labelClass}>{copy.fields.minNights}</label>
                  <Input
                    type="number"
                    min={1}
                    value={form.minNights}
                    onChange={(e) => set("minNights", parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label className={labelClass}>{copy.fields.maxNights}</label>
                  <Input
                    type="number"
                    min={1}
                    max={maxNightsLimit ?? undefined}
                    value={form.maxNights}
                    onChange={(e) => set("maxNights", parseInt(e.target.value) || 1)}
                  />
                  {maxNightsLimit !== null && (
                    <p className={hintClass}>
                      {copy.fields.maxNightsHint.replace("{n}", String(maxNightsLimit))}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>{copy.fields.minPax}</label>
                  <Input
                    type="number"
                    min={1}
                    value={form.minPax}
                    onChange={(e) => set("minPax", parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label className={labelClass}>{copy.fields.maxPax}</label>
                  <Input
                    type="number"
                    min={1}
                    value={form.maxPax}
                    onChange={(e) => set("maxPax", parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{copy.fields.basePriceUsd}</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.basePriceUsd}
                    onChange={(e) => set("basePriceUsd", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  <p className={hintClass}>{copy.fields.basePriceUsdHint}</p>
                </div>
                <div>
                  <label className={labelClass}>{copy.fields.displayPrice}</label>
                  <Input
                    value={form.displayPrice}
                    onChange={(e) => set("displayPrice", e.target.value)}
                    placeholder="Ej: Desde USD 450"
                  />
                  <p className={hintClass}>{copy.fields.displayPriceHint}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Compatibilidad */}
          <div
            id="section-compatibility"
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-neutral-900 mb-1">
              {copy.sections.compatibility}
            </h2>
            <p className="text-xs text-neutral-500 mb-4">{copy.fields.compatibilityHint}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(
                [
                  { key: "accommodationType", opts: ACCOMMODATION_TYPES, label: copy.fields.accommodationType },
                  { key: "transport", opts: TRANSPORT_MODES, label: copy.fields.transport },
                  { key: "climate", opts: CLIMATE_OPTIONS, label: copy.fields.climate },
                  { key: "maxTravelTime", opts: MAX_TRAVEL_TIME_OPTIONS, label: copy.fields.maxTravelTime },
                  { key: "departPref", opts: TIME_PREFERENCES, label: copy.fields.departPref },
                  { key: "arrivePref", opts: TIME_PREFERENCES, label: copy.fields.arrivePref },
                ] as const
              ).map(({ key, opts, label }) => (
                <div key={key}>
                  <label className={labelClass}>{label}</label>
                  <select
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    className={fieldClass}
                  >
                    {opts.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Sections 5–10 added in Task 10 */}
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/app/dashboard/tripper/packages/PackageFormClient.tsx
git commit -m "feat: add PackageFormClient sections 1-4 (Básico, Destino, Capacidad, Compatibilidad)"
```

---

## Task 10: PackageFormClient — sections 5–10 (JSON editors + Tags/Media + Visibility)

**Files:**
- Modify: `src/components/app/dashboard/tripper/packages/PackageFormClient.tsx`

- [ ] **Step 1: Add sections 5–10 inside the form, after the section-compatibility div**

Replace the comment `{/* Sections 5–10 added in Task 10 */}` with:

```tsx
          {/* Section 5: Alojamiento */}
          <div
            id="section-accommodation"
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              {copy.sections.accommodation}
            </h2>
            <div className="space-y-3">
              {form.hotels.length === 0 && (
                <p className="text-sm text-neutral-400">{copy.fields.noHotels}</p>
              )}
              {form.hotels.map((hotel, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-neutral-700">
                      Hotel {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "hotels",
                          form.hotels.filter((_, idx) => idx !== i)
                        )
                      }
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className={labelClass}>{copy.fields.hotelName} *</label>
                      <Input
                        value={hotel.name}
                        onChange={(e) => {
                          const updated = [...form.hotels];
                          updated[i] = { ...updated[i], name: e.target.value };
                          set("hotels", updated);
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{copy.fields.hotelStars}</label>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={hotel.stars ?? ""}
                        onChange={(e) => {
                          const updated = [...form.hotels];
                          updated[i] = {
                            ...updated[i],
                            stars: e.target.value ? parseInt(e.target.value) : undefined,
                          };
                          set("hotels", updated);
                        }}
                        placeholder="1-5"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{copy.fields.hotelLocation}</label>
                      <Input
                        value={hotel.location ?? ""}
                        onChange={(e) => {
                          const updated = [...form.hotels];
                          updated[i] = { ...updated[i], location: e.target.value };
                          set("hotels", updated);
                        }}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{copy.fields.hotelCheckIn}</label>
                      <Input
                        value={hotel.checkIn ?? ""}
                        onChange={(e) => {
                          const updated = [...form.hotels];
                          updated[i] = { ...updated[i], checkIn: e.target.value };
                          set("hotels", updated);
                        }}
                        placeholder="Día 1"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{copy.fields.hotelCheckOut}</label>
                      <Input
                        value={hotel.checkOut ?? ""}
                        onChange={(e) => {
                          const updated = [...form.hotels];
                          updated[i] = { ...updated[i], checkOut: e.target.value };
                          set("hotels", updated);
                        }}
                        placeholder="Día 3"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  set("hotels", [...form.hotels, { name: "" }])
                }
                className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-neutral-500 hover:border-gray-300 hover:text-neutral-700 transition-colors"
              >
                + {copy.fields.addHotel}
              </button>
            </div>
          </div>

          {/* Section 6: Actividades */}
          <div
            id="section-activities"
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              {copy.sections.activities}
            </h2>
            <div className="space-y-3">
              {form.activities.length === 0 && (
                <p className="text-sm text-neutral-400">{copy.fields.noActivities}</p>
              )}
              {form.activities.map((activity, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-neutral-700">
                      Actividad {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "activities",
                          form.activities.filter((_, idx) => idx !== i)
                        )
                      }
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                  <div>
                    <label className={labelClass}>{copy.fields.activityName} *</label>
                    <Input
                      value={activity.name}
                      onChange={(e) => {
                        const updated = [...form.activities];
                        updated[i] = { ...updated[i], name: e.target.value };
                        set("activities", updated);
                      }}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>{copy.fields.activityDuration}</label>
                      <Input
                        value={activity.duration ?? ""}
                        onChange={(e) => {
                          const updated = [...form.activities];
                          updated[i] = { ...updated[i], duration: e.target.value };
                          set("activities", updated);
                        }}
                        placeholder="Ej: 3h"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>{copy.fields.activityDesc}</label>
                    <textarea
                      value={activity.description ?? ""}
                      onChange={(e) => {
                        const updated = [...form.activities];
                        updated[i] = { ...updated[i], description: e.target.value };
                        set("activities", updated);
                      }}
                      rows={2}
                      className={fieldClass}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  set("activities", [...form.activities, { name: "" }])
                }
                className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-neutral-500 hover:border-gray-300 hover:text-neutral-700 transition-colors"
              >
                + {copy.fields.addActivity}
              </button>
            </div>
          </div>

          {/* Section 7: Itinerario */}
          <div
            id="section-itinerary"
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              {copy.sections.itinerary}
            </h2>
            <div className="space-y-3">
              {form.itinerary.length === 0 && (
                <p className="text-sm text-neutral-400">{copy.fields.noItinerary}</p>
              )}
              {form.itinerary.map((day, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-neutral-700">
                      Día {day.day}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = form.itinerary
                          .filter((_, idx) => idx !== i)
                          .map((d, idx) => ({ ...d, day: idx + 1 }));
                        set("itinerary", updated);
                      }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                  <div>
                    <label className={labelClass}>{copy.fields.itineraryTitle} *</label>
                    <Input
                      value={day.title}
                      onChange={(e) => {
                        const updated = [...form.itinerary];
                        updated[i] = { ...updated[i], title: e.target.value };
                        set("itinerary", updated);
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{copy.fields.itineraryDesc} *</label>
                    <textarea
                      value={day.description}
                      onChange={(e) => {
                        const updated = [...form.itinerary];
                        updated[i] = { ...updated[i], description: e.target.value };
                        set("itinerary", updated);
                      }}
                      rows={3}
                      className={fieldClass}
                      required
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  set("itinerary", [
                    ...form.itinerary,
                    { day: form.itinerary.length + 1, title: "", description: "" },
                  ])
                }
                className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-neutral-500 hover:border-gray-300 hover:text-neutral-700 transition-colors"
              >
                + {copy.fields.addDay}
              </button>
            </div>
          </div>

          {/* Section 8: Incluye / No Incluye */}
          <div
            id="section-inclusions"
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              {copy.sections.inclusions}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-neutral-700">
                  {copy.fields.inclusions}
                </h3>
                <TokenInput
                  placeholder={copy.fields.addInclusion}
                  onAdd={(val) => set("inclusions", [...form.inclusions, val])}
                />
                <TokenList
                  items={form.inclusions}
                  onRemove={(val) =>
                    set("inclusions", form.inclusions.filter((x) => x !== val))
                  }
                  color="green"
                />
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-neutral-700">
                  {copy.fields.exclusions}
                </h3>
                <TokenInput
                  placeholder={copy.fields.addExclusion}
                  onAdd={(val) => set("exclusions", [...form.exclusions, val])}
                />
                <TokenList
                  items={form.exclusions}
                  onRemove={(val) =>
                    set("exclusions", form.exclusions.filter((x) => x !== val))
                  }
                  color="red"
                />
              </div>
            </div>
          </div>

          {/* Section 9: Tags, Highlights & Media */}
          <div
            id="section-tags-media"
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              {copy.sections.tagsMedia}
            </h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className={labelClass}>{copy.fields.tags}</label>
                <TokenInput
                  placeholder={copy.fields.tagInput}
                  onAdd={(val) => {
                    if (!form.tags.includes(val))
                      set("tags", [...form.tags, val]);
                  }}
                />
                <TokenList
                  items={form.tags}
                  onRemove={(val) => set("tags", form.tags.filter((t) => t !== val))}
                />
              </div>

              <div className="space-y-2">
                <label className={labelClass}>{copy.fields.highlights}</label>
                <TokenInput
                  placeholder={copy.fields.highlightInput}
                  onAdd={(val) => {
                    if (!form.highlights.includes(val))
                      set("highlights", [...form.highlights, val]);
                  }}
                />
                <TokenList
                  items={form.highlights}
                  onRemove={(val) =>
                    set("highlights", form.highlights.filter((h) => h !== val))
                  }
                />
              </div>

              <div>
                <label className={labelClass}>{copy.fields.heroImage}</label>
                <Input
                  type="url"
                  value={form.heroImage}
                  onChange={(e) => set("heroImage", e.target.value)}
                  placeholder="https://..."
                />
                <p className={hintClass}>{copy.fields.heroImageHint}</p>
              </div>
            </div>
          </div>

          {/* Section 10: Visibilidad */}
          <div
            id="section-visibility"
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              {copy.sections.visibility}
            </h2>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => set("isActive", e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-neutral-900"
                />
                <div>
                  <span className="text-sm font-medium text-neutral-700">
                    {copy.fields.isActive}
                  </span>
                  <p className={hintClass}>{copy.fields.isActiveHint}</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => set("isFeatured", e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-neutral-900"
                />
                <div>
                  <span className="text-sm font-medium text-neutral-700">
                    {copy.fields.isFeatured}
                  </span>
                  <p className={hintClass}>{copy.fields.isFeaturedHint}</p>
                </div>
              </label>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/app/dashboard/tripper/packages/PackageFormClient.tsx
git commit -m "feat: add PackageFormClient sections 5-10 (JSON editors, tags, media, visibility)"
```

---

## Task 11: Server page shells — new + [id]

**Files:**
- Replace: `src/app/[locale]/dashboard/tripper/packages/new/page.tsx`
- Replace: `src/app/[locale]/dashboard/tripper/packages/[id]/page.tsx`

- [ ] **Step 1: Replace packages/new/page.tsx**

First, check what server-side i18n import pattern is used in a nearby server component:

```bash
grep -r "getDictionary\|getServerDictionary" src/app/[locale]/dashboard --include="*.tsx" -l | head -3
```

Then replace the file:

```tsx
// src/app/[locale]/dashboard/tripper/packages/new/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getDictionary } from "@/lib/i18n";
import Section from "@/components/layout/Section";
import PackageFormClient from "@/components/app/dashboard/tripper/packages/PackageFormClient";

export default async function NewPackagePage({
  params,
}: {
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/${params.locale}/login`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user || !hasRoleAccess(user.role, "tripper")) {
    redirect(`/${params.locale}/dashboard`);
  }

  const dict = await getDictionary(params.locale);

  return (
    <Section>
      <div className="rt-container py-8">
        <PackageFormClient
          mode="create"
          copy={dict.packages.form}
          locale={params.locale}
        />
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: Replace packages/[id]/page.tsx**

```tsx
// src/app/[locale]/dashboard/tripper/packages/[id]/page.tsx
import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getDictionary } from "@/lib/i18n";
import Section from "@/components/layout/Section";
import PackageFormClient from "@/components/app/dashboard/tripper/packages/PackageFormClient";
import type { PackageFormData } from "@/types/tripper";

export default async function EditPackagePage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/${params.locale}/login`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user || !hasRoleAccess(user.role, "tripper")) {
    redirect(`/${params.locale}/dashboard`);
  }

  const pkg = await prisma.package.findFirst({
    where: { id: params.id, ownerId: user.id },
  });

  if (!pkg) {
    notFound();
  }

  const initialData: PackageFormData = {
    type: pkg.type,
    level: pkg.level,
    title: pkg.title,
    status: pkg.status,
    teaser: pkg.teaser,
    description: pkg.description,
    heroImage: pkg.heroImage,
    destinationCountry: pkg.destinationCountry,
    destinationCity: pkg.destinationCity,
    excuseKey: pkg.excuseKey ?? "",
    minNights: pkg.minNights,
    maxNights: pkg.maxNights,
    minPax: pkg.minPax,
    maxPax: pkg.maxPax,
    basePriceUsd: pkg.basePriceUsd,
    displayPrice: pkg.displayPrice,
    accommodationType: pkg.accommodationType,
    transport: pkg.transport,
    climate: pkg.climate,
    maxTravelTime: pkg.maxTravelTime,
    departPref: pkg.departPref,
    arrivePref: pkg.arrivePref,
    hotels: Array.isArray(pkg.hotels) ? (pkg.hotels as any[]) : [],
    activities: Array.isArray(pkg.activities) ? (pkg.activities as any[]) : [],
    itinerary: Array.isArray(pkg.itinerary) ? (pkg.itinerary as any[]) : [],
    inclusions: Array.isArray(pkg.inclusions) ? (pkg.inclusions as string[]) : [],
    exclusions: Array.isArray(pkg.exclusions) ? (pkg.exclusions as string[]) : [],
    tags: pkg.tags,
    highlights: pkg.highlights,
    isActive: pkg.isActive,
    isFeatured: pkg.isFeatured,
  };

  const dict = await getDictionary(params.locale);

  return (
    <Section>
      <div className="rt-container py-8">
        <PackageFormClient
          mode="edit"
          initialData={initialData}
          packageId={pkg.id}
          copy={dict.packages.form}
          locale={params.locale}
        />
      </div>
    </Section>
  );
}
```

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors. If `getDictionary` import path is wrong, check `src/lib/i18n/index.ts` or look at another dashboard page for the correct import.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/dashboard/tripper/packages/new/page.tsx" "src/app/[locale]/dashboard/tripper/packages/[id]/page.tsx"
git commit -m "feat: convert package new/edit pages to server components"
```

---

## Task 12: Final QA — typecheck, lint, and smoke test

**Files:** None (verification only)

- [ ] **Step 1: Full typecheck**

```bash
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: 0 errors. Fix any raw `<img>` warnings or other lint errors before proceeding.

- [ ] **Step 3: Dev server smoke test**

```bash
npm run dev
```

Open `http://localhost:3010/es/dashboard/tripper/packages`. Verify:
1. Page loads with dashboard header (no Hero, no GlassCard)
2. Packages table shows (or empty state)
3. "Nuevo Paquete" button navigates to the form
4. Form page shows sidebar nav with 10 sections
5. Clicking a nav item scrolls to that section
6. Type select changes excuseKey options (only shows for explora-plus/bivouac)
7. Level select shows maxNights hint
8. Adding a hotel, activity, and itinerary day works
9. Inclusions/exclusions add and remove correctly
10. Tags and highlights add and remove correctly
11. Save button triggers API call and redirects on success
12. Edit page loads existing package data into all fields

- [ ] **Step 4: Final commit**

```bash
git add -p  # stage any lint fixes
git commit -m "fix: lint cleanup after packages dashboard refactor"
```
