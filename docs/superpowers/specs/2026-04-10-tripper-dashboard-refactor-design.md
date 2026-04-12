# Tripper Dashboard Refactor — Design Spec

**Date:** 2026-04-10
**Branch:** develop
**Scope:** `/dashboard/tripper` page — full UI/UX refactor to match client dashboard aesthetic, with component extraction

---

## Goal

Replace the current monolithic `page.tsx` (GlassCard + Hero, inline logic) with a clean, componentized layout that mirrors the visual language and structure of the client `/dashboard` page.

---

## Files Changed

### New files
```
src/components/app/dashboard/tripper/TripperStatsGrid.tsx
src/components/app/dashboard/tripper/RecentBookingsList.tsx
src/components/app/dashboard/tripper/TripperQuickActions.tsx
src/components/app/dashboard/tripper/TripperKeyMetrics.tsx
src/components/app/dashboard/tripper/TripperPackagesSummary.tsx
src/components/app/dashboard/tripper/TripperDashboardSkeleton.tsx
```

### Modified files
```
src/app/[locale]/dashboard/tripper/page.tsx     # thin orchestrator
src/types/tripper.ts                             # add TripperDashboardStats + RecentBooking
src/lib/types/dictionary.ts                      # add TripperDashboardDict to MarketingDictionary
src/dictionaries/es.json                         # add tripperDashboard key
src/dictionaries/en.json                         # add tripperDashboard key
```

No `index.ts` barrel file. Components are imported directly by path.

---

## Visual Style

All components adopt the client dashboard's white-card pattern:

- **Stat cards:** `rounded-2xl bg-white p-5 shadow-md ring-1 ring-gray-100`, value in `font-barlow-condensed font-bold text-4xl text-gray-900`, icon at right with `text-light-blue`
- **Panel cards:** `bg-white rounded-xl border border-gray-200 shadow-sm p-6`
- **Header:** `HeaderHero` component with tripper title/description, same video (`/videos/hero-video-1.mp4`) and fallback image as current
- **Status badges:** `px-2 py-0.5 text-xs rounded-full border` with color variants (green/purple/yellow matching existing status logic)
- **Buttons/links:** `<Button asChild>` from `@/components/ui/Button`, replacing inline colored `<Link>` blocks
- **No GlassCard usage** — fully replaced

---

## Layout

```
HeaderHero
Section > rt-container
  TripperDashboardSkeleton  (while loading)
  — or —
  TripperStatsGrid           (full width, 4 cols on lg)
  grid lg:grid-cols-3 gap-6
    RecentBookingsList       (col-span-2)
    sidebar div
      TripperQuickActions
      TripperKeyMetrics
  TripperPackagesSummary     (full width)
```

---

## Data & State

- `page.tsx` remains a **client component** (`"use client"`)
- Locale read from `useParams()`
- Dictionary: both JSON files imported statically, locale used to select at runtime (same sync pattern as `getDashboardCopy` in client dashboard — cannot use async `getDictionary()` in a client component); `tripperDashboard` slice passed as prop to each component
- Data fetched via `useEffect` → `GET /api/tripper/dashboard` → `{ stats, recentBookings }`
- Loading state: renders `TripperDashboardSkeleton` instead of `LoadingSpinner`
- Auth: `SecureRoute` + `TripperGuard` (via layout) remain unchanged

---

## Types

Added to `src/types/tripper.ts`:

```ts
export interface TripperDashboardStats {
  totalBookings: number;
  monthlyRevenue: number;
  averageRating: number;
  activePackages: number;
  totalClients: number;
  conversionRate: number;
}

export interface RecentBooking {
  id: string;
  clientName: string;
  clientEmail: string;
  package: string;
  packageId?: string;
  date: string;
  amount: number;
  status: string;
  paymentStatus: string;
}
```

---

## Dictionary Shape

Added to both `src/dictionaries/es.json` and `src/dictionaries/en.json` under key `tripperDashboard`:

```json
{
  "tripperDashboard": {
    "header": {
      "title": "Tripper OS",
      "description": "Gestiona tus paquetes de viaje y clientes"
    },
    "stats": {
      "totalBookings": "Reservas Totales",
      "monthlyRevenue": "Ingresos Mensuales",
      "averageRating": "Rating Promedio",
      "activePackages": "Paquetes Activos"
    },
    "recentBookings": {
      "title": "Reservas Recientes",
      "viewAll": "Ver todas",
      "empty": "No hay reservas recientes"
    },
    "quickActions": {
      "title": "Acciones Rápidas",
      "createPackage": "Crear Paquete",
      "createPackageSub": "Nueva oferta de viaje",
      "earnings": "Ver Ganancias",
      "earningsSub": "Análisis detallado",
      "reviews": "Reseñas & NPS",
      "reviewsSub": "Ver feedback",
      "blogs": "Mis Posts",
      "blogsSub": "Gestionar blog",
      "settings": "Configuración",
      "settingsSub": "Ajustes del perfil"
    },
    "keyMetrics": {
      "title": "Métricas Clave",
      "totalClients": "Clientes Totales",
      "conversionRate": "Tasa de Conversión",
      "growth": "Crecimiento"
    },
    "packages": {
      "title": "Mis Paquetes",
      "newPackage": "Nuevo Paquete",
      "empty": "No tienes paquetes activos aún",
      "emptyCta": "Crear tu primer paquete",
      "viewAll": "Ver todos →"
    },
    "status": {
      "confirmed": "Confirmado",
      "revealed": "Revelado",
      "completed": "Completado",
      "pending": "Pendiente"
    }
  }
}
```

`MarketingDictionary` in `src/lib/types/dictionary.ts` gets a corresponding `TripperDashboardDict` interface.

---

## Components

### TripperStatsGrid
- Props: `stats: TripperDashboardStats`, `copy: TripperDashboardDict['stats']`
- 4 stat cards in `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`
- Icons: `Users`, `DollarSign`, `Star`, `MapPin` — all `text-light-blue`

### RecentBookingsList
- Props: `bookings: RecentBooking[]`, `copy: TripperDashboardDict['recentBookings']`
- Each row: avatar initial circle, client name + package + date, amount + status badge
- Empty state: centered text from `copy.empty`

### TripperQuickActions
- Props: `copy: TripperDashboardDict['quickActions']`
- 5 `<Button asChild variant="ghost">` links with icon + title + subtitle
- Links: `/dashboard/tripper/packages`, `/dashboard/tripper/earnings`, `/dashboard/tripper/reviews`, `/dashboard/tripper/blogs`, `/trippers/profile`

### TripperKeyMetrics
- Props: `stats: TripperDashboardStats`, `copy: TripperDashboardDict['keyMetrics']`
- 3 rows: label/value pairs
- Crecimiento hardcoded `+12.5%` with `TrendingUp` icon (same as current — real data not available from API)

### TripperPackagesSummary
- Props: `activePackages: number`, `copy: TripperDashboardDict['packages']`
- Empty state: message + CTA button
- Non-empty: count text + "Ver todos" link + "Nuevo Paquete" button

### TripperDashboardSkeleton
- No props
- Skeleton pulses matching layout: 4 stat cards row, 2+1 panel row, 1 full-width panel

---

## Out of Scope

- No changes to sub-pages (`/earnings`, `/reviews`, `/blogs`, `/packages`)
- No changes to the API route `/api/tripper/dashboard`
- No dark mode variants
- No new routes or navigation items
