# Tripper Dashboard Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `/dashboard/tripper/page.tsx` from a monolithic GlassCard+Hero component into a clean, componentized layout matching the client dashboard's white-card aesthetic.

**Architecture:** Client component (`"use client"`) that fetches data via `useEffect` and passes typed props to isolated presentational components. All user-visible strings come from the main `src/dictionaries/*.json` files. Components live in `src/components/app/dashboard/tripper/`, imported directly (no barrel file).

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS 4, Lucide React, shadcn/ui `Button`, `Skeleton`

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `src/types/tripper.ts` | Add `TripperDashboardStats` + `RecentBooking` interfaces |
| Modify | `src/lib/types/dictionary.ts` | Add `TripperDashboardDict` interface + `tripperDashboard` field to `MarketingDictionary` |
| Modify | `src/dictionaries/es.json` | Add `tripperDashboard` key with ES strings |
| Modify | `src/dictionaries/en.json` | Add `tripperDashboard` key with EN strings |
| Create | `src/components/app/dashboard/tripper/TripperDashboardSkeleton.tsx` | Loading skeleton matching layout |
| Create | `src/components/app/dashboard/tripper/TripperStatsGrid.tsx` | 4 stat cards row |
| Create | `src/components/app/dashboard/tripper/RecentBookingsList.tsx` | Recent bookings panel |
| Create | `src/components/app/dashboard/tripper/TripperQuickActions.tsx` | Quick action links panel |
| Create | `src/components/app/dashboard/tripper/TripperKeyMetrics.tsx` | Key metrics panel |
| Create | `src/components/app/dashboard/tripper/TripperPackagesSummary.tsx` | Packages summary panel |
| Modify | `src/app/[locale]/dashboard/tripper/page.tsx` | Thin orchestrator using all above |

---

## Task 1: Add types to `src/types/tripper.ts`

**Files:**
- Modify: `src/types/tripper.ts`

- [ ] **Step 1: Add the two new interfaces at the end of the file**

Append to `src/types/tripper.ts` (after the last export, before end of file):

```ts
// Tripper Dashboard
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

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: No errors.

---

## Task 2: Add `TripperDashboardDict` to `src/lib/types/dictionary.ts`

**Files:**
- Modify: `src/lib/types/dictionary.ts`

- [ ] **Step 1: Add the `TripperDashboardDict` interface**

Add this interface before the closing `}` of the file (before the final `}`):

```ts
export interface TripperDashboardDict {
  header: {
    title: string;
    description: string;
  };
  stats: {
    totalBookings: string;
    monthlyRevenue: string;
    averageRating: string;
    activePackages: string;
  };
  recentBookings: {
    title: string;
    viewAll: string;
    empty: string;
  };
  quickActions: {
    title: string;
    createPackage: string;
    createPackageSub: string;
    earnings: string;
    earningsSub: string;
    reviews: string;
    reviewsSub: string;
    blogs: string;
    blogsSub: string;
    settings: string;
    settingsSub: string;
  };
  keyMetrics: {
    title: string;
    totalClients: string;
    conversionRate: string;
    growth: string;
  };
  packages: {
    title: string;
    newPackage: string;
    empty: string;
    emptyCta: string;
    viewAll: string;
  };
  status: {
    confirmed: string;
    revealed: string;
    completed: string;
    pending: string;
  };
}
```

- [ ] **Step 2: Add `tripperDashboard` field to `MarketingDictionary`**

The `MarketingDictionary` interface is in the same file. Find the closing `}` of `MarketingDictionary` (it is the outermost closing brace of the interface, at line 781). Add this field before that closing brace:

```ts
  tripperDashboard: TripperDashboardDict;
```

- [ ] **Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: Errors about missing `tripperDashboard` key in the JSON files — that's expected and will be fixed in the next task.

---

## Task 3: Add `tripperDashboard` key to dictionaries

**Files:**
- Modify: `src/dictionaries/es.json`
- Modify: `src/dictionaries/en.json`

- [ ] **Step 1: Add to `src/dictionaries/es.json`**

The JSON file currently has 24 top-level keys. Add `tripperDashboard` as a new key before the final `}`. The last existing key is `emailSignatures`. Insert after it:

```json
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
```

- [ ] **Step 2: Add to `src/dictionaries/en.json`**

Same structure, English strings:

```json
  "tripperDashboard": {
    "header": {
      "title": "Tripper OS",
      "description": "Manage your travel packages and clients"
    },
    "stats": {
      "totalBookings": "Total Bookings",
      "monthlyRevenue": "Monthly Revenue",
      "averageRating": "Average Rating",
      "activePackages": "Active Packages"
    },
    "recentBookings": {
      "title": "Recent Bookings",
      "viewAll": "View all",
      "empty": "No recent bookings"
    },
    "quickActions": {
      "title": "Quick Actions",
      "createPackage": "Create Package",
      "createPackageSub": "New travel offer",
      "earnings": "View Earnings",
      "earningsSub": "Detailed analytics",
      "reviews": "Reviews & NPS",
      "reviewsSub": "View feedback",
      "blogs": "My Posts",
      "blogsSub": "Manage blog",
      "settings": "Settings",
      "settingsSub": "Profile settings"
    },
    "keyMetrics": {
      "title": "Key Metrics",
      "totalClients": "Total Clients",
      "conversionRate": "Conversion Rate",
      "growth": "Growth"
    },
    "packages": {
      "title": "My Packages",
      "newPackage": "New Package",
      "empty": "You have no active packages yet",
      "emptyCta": "Create your first package",
      "viewAll": "View all →"
    },
    "status": {
      "confirmed": "Confirmed",
      "revealed": "Revealed",
      "completed": "Completed",
      "pending": "Pending"
    }
  }
```

- [ ] **Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: No errors.

---

## Task 4: Create `TripperDashboardSkeleton`

**Files:**
- Create: `src/components/app/dashboard/tripper/TripperDashboardSkeleton.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { Skeleton } from '@/components/ui/Skeleton';

function StatCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-md ring-1 ring-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
}

function PanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <Skeleton className="h-5 w-40" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2 p-4 bg-gray-50 rounded-lg">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function TripperDashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Main + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PanelSkeleton rows={4} />
        </div>
        <div className="space-y-6">
          <PanelSkeleton rows={5} />
          <PanelSkeleton rows={3} />
        </div>
      </div>

      {/* Packages panel */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: No errors.

---

## Task 5: Create `TripperStatsGrid`

**Files:**
- Create: `src/components/app/dashboard/tripper/TripperStatsGrid.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { Users, DollarSign, Star, MapPin } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TripperDashboardStats } from '@/types/tripper';
import type { TripperDashboardDict } from '@/lib/types/dictionary';

interface TripperStatsGridProps {
  stats: TripperDashboardStats;
  copy: TripperDashboardDict['stats'];
}

export function TripperStatsGrid({ stats, copy }: TripperStatsGridProps) {
  const cards: Array<{
    icon: LucideIcon;
    key: string;
    label: string;
    value: string | number;
  }> = [
    {
      icon: Users,
      key: 'total-bookings',
      label: copy.totalBookings,
      value: stats.totalBookings,
    },
    {
      icon: DollarSign,
      key: 'monthly-revenue',
      label: copy.monthlyRevenue,
      value: `$${stats.monthlyRevenue.toLocaleString('es-AR')}`,
    },
    {
      icon: Star,
      key: 'average-rating',
      label: copy.averageRating,
      value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—',
    },
    {
      icon: MapPin,
      key: 'active-packages',
      label: copy.activePackages,
      value: stats.activePackages,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-md ring-1 ring-gray-100"
            key={card.key}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-neutral-500">
                  {card.label}
                </p>
                <p className="font-barlow-condensed font-bold text-4xl text-gray-900">
                  {card.value}
                </p>
              </div>
              <Icon className="h-10 w-10 text-light-blue" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: No errors.

---

## Task 6: Create `RecentBookingsList`

**Files:**
- Create: `src/components/app/dashboard/tripper/RecentBookingsList.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { Calendar } from 'lucide-react';
import Link from 'next/link';
import type { RecentBooking } from '@/types/tripper';
import type { TripperDashboardDict } from '@/lib/types/dictionary';

interface RecentBookingsListProps {
  bookings: RecentBooking[];
  copy: TripperDashboardDict['recentBookings'] & TripperDashboardDict['status'];
}

function getStatusColor(status: string): string {
  if (status === 'confirmed' || status === 'completed') {
    return 'bg-green-100 text-green-800 border-green-200';
  }
  if (status === 'revealed') {
    return 'bg-purple-100 text-purple-800 border-purple-200';
  }
  return 'bg-yellow-100 text-yellow-800 border-yellow-200';
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function RecentBookingsList({ bookings, copy }: RecentBookingsListProps) {
  return (
    <div className="lg:col-span-2">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">
            {copy.title}
          </h2>
          <Link
            href="/dashboard/tripper/bookings"
            className="text-sm font-medium text-sky-600 hover:text-sky-700"
          >
            {copy.viewAll}
          </Link>
        </div>

        <div className="space-y-3">
          {bookings.length === 0 ? (
            <p className="text-center text-neutral-500 py-8">{copy.empty}</p>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shrink-0">
                    {booking.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">
                      {booking.clientName}
                    </p>
                    <p className="text-sm text-neutral-600">{booking.package}</p>
                    <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {formatDate(booking.date)}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-neutral-900">
                    ${booking.amount.toLocaleString('es-AR')}
                  </p>
                  <span
                    className={`mt-1 inline-block px-2 py-0.5 text-xs rounded-full border ${getStatusColor(booking.status)}`}
                  >
                    {copy[booking.status as keyof TripperDashboardDict['status']] ?? booking.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: No errors.

---

## Task 7: Create `TripperQuickActions`

**Files:**
- Create: `src/components/app/dashboard/tripper/TripperQuickActions.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Link from 'next/link';
import { Plus, BarChart3, Star, BookOpen, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { TripperDashboardDict } from '@/lib/types/dictionary';

interface TripperQuickActionsProps {
  copy: TripperDashboardDict['quickActions'];
}

export function TripperQuickActions({ copy }: TripperQuickActionsProps) {
  const actions = [
    {
      href: '/dashboard/tripper/packages',
      icon: Plus,
      key: 'packages',
      label: copy.createPackage,
      sub: copy.createPackageSub,
    },
    {
      href: '/dashboard/tripper/earnings',
      icon: BarChart3,
      key: 'earnings',
      label: copy.earnings,
      sub: copy.earningsSub,
    },
    {
      href: '/dashboard/tripper/reviews',
      icon: Star,
      key: 'reviews',
      label: copy.reviews,
      sub: copy.reviewsSub,
    },
    {
      href: '/dashboard/tripper/blogs',
      icon: BookOpen,
      key: 'blogs',
      label: copy.blogs,
      sub: copy.blogsSub,
    },
    {
      href: '/trippers/profile',
      icon: Settings,
      key: 'settings',
      label: copy.settings,
      sub: copy.settingsSub,
    },
  ];

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        {copy.title}
      </h3>
      <div className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              asChild
              className="w-full justify-start h-auto py-2"
              key={action.key}
              variant="ghost"
            >
              <Link href={action.href}>
                <Icon className="h-4 w-4 shrink-0" />
                <div className="text-left ml-1">
                  <div className="font-medium text-sm">{action.label}</div>
                  <div className="text-xs text-neutral-500">{action.sub}</div>
                </div>
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: No errors.

---

## Task 8: Create `TripperKeyMetrics`

**Files:**
- Create: `src/components/app/dashboard/tripper/TripperKeyMetrics.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { TrendingUp } from 'lucide-react';
import type { TripperDashboardStats } from '@/types/tripper';
import type { TripperDashboardDict } from '@/lib/types/dictionary';

interface TripperKeyMetricsProps {
  stats: TripperDashboardStats;
  copy: TripperDashboardDict['keyMetrics'];
}

export function TripperKeyMetrics({ stats, copy }: TripperKeyMetricsProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        {copy.title}
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <span className="text-sm text-neutral-600">{copy.totalClients}</span>
          <span className="font-bold text-neutral-900">{stats.totalClients}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <span className="text-sm text-neutral-600">{copy.conversionRate}</span>
          <span className="font-bold text-neutral-900">{stats.conversionRate}%</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <span className="text-sm text-neutral-600">{copy.growth}</span>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="font-bold text-green-600">+12.5%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: No errors.

---

## Task 9: Create `TripperPackagesSummary`

**Files:**
- Create: `src/components/app/dashboard/tripper/TripperPackagesSummary.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { TripperDashboardDict } from '@/lib/types/dictionary';

interface TripperPackagesSummaryProps {
  activePackages: number;
  copy: TripperDashboardDict['packages'];
}

export function TripperPackagesSummary({ activePackages, copy }: TripperPackagesSummaryProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-neutral-900">{copy.title}</h2>
        <Button asChild size="sm">
          <Link href="/dashboard/tripper/packages">
            <Plus className="h-4 w-4" />
            {copy.newPackage}
          </Link>
        </Button>
      </div>

      {activePackages === 0 ? (
        <div className="text-center py-8">
          <p className="text-neutral-500 mb-4">{copy.empty}</p>
          <Button asChild variant="outline">
            <Link href="/dashboard/tripper/packages">
              <Plus className="h-4 w-4" />
              {copy.emptyCta}
            </Link>
          </Button>
        </div>
      ) : (
        <p className="text-sm text-neutral-600">
          {activePackages} paquete{activePackages !== 1 ? 's' : ''} activo{activePackages !== 1 ? 's' : ''}.{' '}
          <Link
            href="/dashboard/tripper/packages"
            className="text-sky-600 hover:underline"
          >
            {copy.viewAll}
          </Link>
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: No errors.

---

## Task 10: Refactor `page.tsx`

**Files:**
- Modify: `src/app/[locale]/dashboard/tripper/page.tsx`

- [ ] **Step 1: Replace the entire file contents**

```tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useUserStore } from "@/store/slices/userStore";
import SecureRoute from "@/components/auth/SecureRoute";
import Section from "@/components/layout/Section";
import HeaderHero from "@/components/journey/HeaderHero";
import { TripperDashboardSkeleton } from "@/components/app/dashboard/tripper/TripperDashboardSkeleton";
import { TripperStatsGrid } from "@/components/app/dashboard/tripper/TripperStatsGrid";
import { RecentBookingsList } from "@/components/app/dashboard/tripper/RecentBookingsList";
import { TripperQuickActions } from "@/components/app/dashboard/tripper/TripperQuickActions";
import { TripperKeyMetrics } from "@/components/app/dashboard/tripper/TripperKeyMetrics";
import { TripperPackagesSummary } from "@/components/app/dashboard/tripper/TripperPackagesSummary";
import type { TripperDashboardStats, RecentBooking } from "@/types/tripper";
import esCopy from "@/dictionaries/es.json";
import enCopy from "@/dictionaries/en.json";

function getTripperCopy(locale: string) {
  return locale.startsWith("en")
    ? enCopy.tripperDashboard
    : esCopy.tripperDashboard;
}

const EMPTY_STATS: TripperDashboardStats = {
  totalBookings: 0,
  monthlyRevenue: 0,
  averageRating: 0,
  activePackages: 0,
  totalClients: 0,
  conversionRate: 0,
};

function TripperContent() {
  const { data: session } = useSession();
  const { user } = useUserStore();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const copy = getTripperCopy(locale);

  const currentUser = session?.user || user;

  const [stats, setStats] = useState<TripperDashboardStats>(EMPTY_STATS);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.id) return;

    let cancelled = false;

    async function fetchDashboardData() {
      try {
        setLoading(true);
        const response = await fetch("/api/tripper/dashboard");
        const data = await response.json();

        if (cancelled) return;

        if (response.ok && data.stats && data.recentBookings) {
          setStats(data.stats);
          setRecentBookings(data.recentBookings);
        } else {
          console.error("Error fetching tripper dashboard data:", data.error);
        }
      } catch (error) {
        console.error("Error fetching tripper dashboard data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  return (
    <>
      <HeaderHero
        title={copy.header.title}
        description={copy.header.description}
        videoSrc="/videos/hero-video-1.mp4"
        fallbackImage="/images/bg-playa-mexico.jpg"
      />

      <Section>
        <div className="rt-container">
          {loading ? (
            <TripperDashboardSkeleton />
          ) : (
            <div className="space-y-8">
              <TripperStatsGrid stats={stats} copy={copy.stats} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <RecentBookingsList
                  bookings={recentBookings}
                  copy={{ ...copy.recentBookings, ...copy.status }}
                />
                <div className="space-y-6">
                  <TripperQuickActions copy={copy.quickActions} />
                  <TripperKeyMetrics stats={stats} copy={copy.keyMetrics} />
                </div>
              </div>

              <TripperPackagesSummary
                activePackages={stats.activePackages}
                copy={copy.packages}
              />
            </div>
          )}
        </div>
      </Section>
    </>
  );
}

const TripperPage = dynamic(() => Promise.resolve(TripperPageComponent), {
  ssr: false,
});

function TripperPageComponent() {
  return (
    <SecureRoute requiredRole="tripper">
      <TripperContent />
    </SecureRoute>
  );
}

export default TripperPage;
```

- [ ] **Step 2: Run typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: No errors.

- [ ] **Step 3: Start dev server and verify the page**

Run: `npm run dev`

Check:
- Navigate to `/es/dashboard/tripper` as a tripper user
- Stats cards render with white-card style (no glass morphism)
- Header uses `HeaderHero` (not the old `Hero`)
- Loading state shows skeleton
- Recent bookings list renders correctly
- Quick actions use `Button` component
- Key metrics shows 3 rows
- Packages summary shows empty state or count

---

## Self-Review Notes

- All types defined in Task 1 are consistently used in Tasks 5–10: `TripperDashboardStats` and `RecentBooking` from `@/types/tripper`
- `TripperDashboardDict` defined in Task 2 is the prop type for all components in Tasks 5–9
- `RecentBookingsList` spreads `copy.recentBookings` and `copy.status` together — this avoids a wrapper object and keeps the prop type clear
- `getTripperCopy` in `page.tsx` returns the `tripperDashboard` slice directly, typed as the inferred JSON type which matches `TripperDashboardDict` structurally
- The `cancelled` flag pattern in `useEffect` matches the existing client dashboard pattern exactly
- No changes to layout.tsx, sub-pages, or the API route
