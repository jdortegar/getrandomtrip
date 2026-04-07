# Admin Dashboard Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-file 38-column admin data dump with a structured shell — persistent left sidebar, KPI strip, filter bar, focused trips table, and a slide-over edit panel — all using existing app design tokens.

**Architecture:** Admin layout wraps pages with `SecureRoute + HeaderHero + AdminSidebar`. Trip Requests page owns all data state via `useTripRequests` hook. Slide-over renders conditionally when `selectedTripId` is set; no second fetch needed since it receives the full trip object from the already-loaded list.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, NextAuth `SecureRoute`, Lucide icons, Vitest for util tests.

---

## File Map

| File | Responsibility |
|---|---|
| `src/lib/admin/types.ts` | Shared types: `AdminTripRequest`, `StatusFilterValue`, etc. |
| `src/lib/admin/trip-status.ts` | Status color maps, ordered flow, `countTripsByStatus` |
| `src/lib/admin/format.ts` | `formatAdminDate`, `formatAdminAmount` |
| `src/hooks/useTripRequests.ts` | Data fetch hook: `{ trips, loading, error, refresh }` |
| `src/components/app/admin/StatusBadge.tsx` | Colored pill using status color maps |
| `src/components/app/admin/AdminSidebarLink.tsx` | Single nav item (icon + label + optional badge) |
| `src/components/app/admin/AdminSidebar.tsx` | 6-link sidebar using `usePathname` for active state |
| `src/components/app/admin/AdminKPICard.tsx` | Single stat card (label + count) |
| `src/components/app/admin/TripRequestsKPIStrip.tsx` | 4 KPI cards derived from trips list |
| `src/components/app/admin/TripRequestsFilterBar.tsx` | Status filter pills + section title |
| `src/components/app/admin/TripRequestDetails.tsx` | Read-only key/value trip detail rows |
| `src/components/app/admin/TripStatusTimeline.tsx` | Status progress dots |
| `src/components/app/admin/TripRequestsTableRow.tsx` | Single table row |
| `src/components/app/admin/TripRequestsTable.tsx` | Table header + row map |
| `src/components/app/admin/TripRequestSlideOver.tsx` | Edit panel: draft state + PATCH call |
| `src/app/[locale]/dashboard/admin/AdminLayoutClient.tsx` | Client layout: SecureRoute + HeaderHero + flex shell |
| `src/app/[locale]/dashboard/admin/layout.tsx` | Server layout shell (force-dynamic) |
| `src/app/[locale]/dashboard/admin/page.tsx` | Trip Requests page (full rewrite) |
| `src/app/[locale]/dashboard/admin/users/page.tsx` | Placeholder |
| `src/app/[locale]/dashboard/admin/packages/page.tsx` | Placeholder |
| `src/app/[locale]/dashboard/admin/payments/page.tsx` | Placeholder |
| `src/app/[locale]/dashboard/admin/reviews/page.tsx` | Placeholder |
| `src/app/[locale]/dashboard/admin/waitlist/page.tsx` | Placeholder |
| `vitest.config.ts` | Test config (new) |
| `src/lib/admin/__tests__/trip-status.test.ts` | Tests for `countTripsByStatus` |
| `src/lib/admin/__tests__/format.test.ts` | Tests for `formatAdminDate`, `formatAdminAmount` |

---

## Task 1: Vitest config + `trip-status.ts` utils

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/admin/trip-status.ts`
- Create: `src/lib/admin/__tests__/trip-status.test.ts`

- [ ] **Step 1: Create vitest config**

```ts
// vitest.config.ts
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
  },
});
```

- [ ] **Step 2: Update test script in `package.json`**

Replace the `"test"` script line:
```json
"test": "vitest run"
```

- [ ] **Step 3: Write failing tests**

```ts
// src/lib/admin/__tests__/trip-status.test.ts
import { describe, expect, it } from 'vitest';
import { countTripsByStatus, TRIP_STATUS_FLOW } from '../trip-status';

describe('TRIP_STATUS_FLOW', () => {
  it('contains CONFIRMED before REVEALED before COMPLETED', () => {
    const confirmed = TRIP_STATUS_FLOW.indexOf('CONFIRMED');
    const revealed = TRIP_STATUS_FLOW.indexOf('REVEALED');
    const completed = TRIP_STATUS_FLOW.indexOf('COMPLETED');
    expect(confirmed).toBeLessThan(revealed);
    expect(revealed).toBeLessThan(completed);
  });
});

describe('countTripsByStatus', () => {
  it('counts trips by status', () => {
    const trips = [
      { status: 'CONFIRMED' as const },
      { status: 'CONFIRMED' as const },
      { status: 'REVEALED' as const },
    ];
    const counts = countTripsByStatus(trips);
    expect(counts.CONFIRMED).toBe(2);
    expect(counts.REVEALED).toBe(1);
    expect(counts.COMPLETED).toBe(0);
  });

  it('ignores unknown statuses', () => {
    const trips = [{ status: 'CONFIRMED' as const }];
    const counts = countTripsByStatus(trips);
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(1);
  });
});
```

- [ ] **Step 4: Run tests — expect FAIL**

```bash
npm test
```
Expected: `Cannot find module '../trip-status'`

- [ ] **Step 5: Create `src/lib/admin/trip-status.ts`**

```ts
export type TripRequestStatus =
  | 'DRAFT'
  | 'SAVED'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'REVEALED'
  | 'COMPLETED'
  | 'CANCELLED';

export const TRIP_STATUS_FLOW: TripRequestStatus[] = [
  'DRAFT',
  'SAVED',
  'PENDING_PAYMENT',
  'CONFIRMED',
  'REVEALED',
  'COMPLETED',
];

export interface StatusColors {
  bg: string;
  border: string;
  text: string;
}

export const TRIP_STATUS_COLORS: Record<TripRequestStatus, StatusColors> = {
  CANCELLED:       { bg: 'bg-red-100',    border: 'border-red-200',    text: 'text-red-800'    },
  COMPLETED:       { bg: 'bg-green-100',  border: 'border-green-200',  text: 'text-green-800'  },
  CONFIRMED:       { bg: 'bg-green-100',  border: 'border-green-200',  text: 'text-green-800'  },
  DRAFT:           { bg: 'bg-gray-100',   border: 'border-gray-200',   text: 'text-gray-700'   },
  PENDING_PAYMENT: { bg: 'bg-yellow-100', border: 'border-yellow-200', text: 'text-yellow-800' },
  REVEALED:        { bg: 'bg-blue-100',   border: 'border-blue-200',   text: 'text-blue-800'   },
  SAVED:           { bg: 'bg-gray-100',   border: 'border-gray-200',   text: 'text-gray-700'   },
};

export const PAYMENT_STATUS_COLORS: Record<string, StatusColors> = {
  APPROVED:   { bg: 'bg-green-100',  border: 'border-green-200',  text: 'text-green-800'  },
  CANCELLED:  { bg: 'bg-gray-100',   border: 'border-gray-200',   text: 'text-gray-700'   },
  COMPLETED:  { bg: 'bg-green-100',  border: 'border-green-200',  text: 'text-green-800'  },
  FAILED:     { bg: 'bg-red-100',    border: 'border-red-200',    text: 'text-red-800'    },
  PENDING:    { bg: 'bg-yellow-100', border: 'border-yellow-200', text: 'text-yellow-800' },
  REFUNDED:   { bg: 'bg-gray-100',   border: 'border-gray-200',   text: 'text-gray-700'   },
};

export function countTripsByStatus(
  trips: { status: TripRequestStatus }[],
): Record<TripRequestStatus, number> {
  const all: TripRequestStatus[] = [...TRIP_STATUS_FLOW, 'CANCELLED'];
  const counts = Object.fromEntries(all.map((s) => [s, 0])) as Record<TripRequestStatus, number>;
  for (const trip of trips) {
    if (trip.status in counts) counts[trip.status]++;
  }
  return counts;
}
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
npm test
```
Expected: all 3 tests pass.

---

## Task 2: `format.ts` utils

**Files:**
- Create: `src/lib/admin/format.ts`
- Create: `src/lib/admin/__tests__/format.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/admin/__tests__/format.test.ts
import { describe, expect, it } from 'vitest';
import { formatAdminAmount, formatAdminDate } from '../format';

describe('formatAdminDate', () => {
  it('formats an ISO date string', () => {
    expect(formatAdminDate('2026-03-10T00:00:00.000Z')).toMatch(/Mar \d+, 2026/);
  });

  it('returns em-dash for null', () => {
    expect(formatAdminDate(null)).toBe('—');
  });
});

describe('formatAdminAmount', () => {
  it('formats amount with currency prefix', () => {
    expect(formatAdminAmount(450000, 'ARS')).toBe('ARS 450,000');
  });

  it('formats small amounts without extra commas', () => {
    expect(formatAdminAmount(100, 'USD')).toBe('USD 100');
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test
```
Expected: `Cannot find module '../format'`

- [ ] **Step 3: Create `src/lib/admin/format.ts`**

```ts
export function formatAdminDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatAdminAmount(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('en-US')}`;
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test
```
Expected: all 5 tests pass.

---

## Task 3: Shared types

**Files:**
- Create: `src/lib/admin/types.ts`

- [ ] **Step 1: Create types file**

```ts
// src/lib/admin/types.ts
import type { TripRequestStatus } from './trip-status';

export type { TripRequestStatus };

export type StatusFilterValue = TripRequestStatus | 'ALL';

export interface AdminTripPackage {
  excuseKey: string | null;
  id: string;
  level: string;
  title: string;
  type: string;
}

export interface AdminTripPayment {
  amount: number;
  currency: string;
  status: string;
}

export interface AdminTripUser {
  email: string;
  id: string;
  name: string;
}

export interface AdminTripRequest {
  accommodationType: string;
  actualDestination: string | null;
  addons: unknown;
  arrivePref: string;
  avoidDestinations: string[];
  climate: string;
  completedAt: string | null;
  createdAt: string;
  customerFeedback: string | null;
  customerRating: number | null;
  departPref: string;
  destinationRevealedAt: string | null;
  endDate: string | null;
  from: string;
  id: string;
  level: string;
  maxTravelTime: string;
  nights: number;
  originCity: string;
  originCountry: string;
  package: AdminTripPackage | null;
  pax: number;
  paxDetails: unknown;
  payment: AdminTripPayment | null;
  startDate: string | null;
  status: TripRequestStatus;
  transport: string;
  tripPhotos: unknown;
  type: string;
  updatedAt: string;
  user: AdminTripUser;
}
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```
Expected: exits 0.

---

## Task 4: `StatusBadge` component

**Files:**
- Create: `src/components/app/admin/StatusBadge.tsx`

- [ ] **Step 1: Create component**

```tsx
// src/components/app/admin/StatusBadge.tsx
import { cn } from '@/lib/utils';
import {
  PAYMENT_STATUS_COLORS,
  TRIP_STATUS_COLORS,
} from '@/lib/admin/trip-status';

interface StatusBadgeProps {
  status: string;
  variant?: 'payment' | 'trip';
}

const FALLBACK = {
  bg: 'bg-gray-100',
  border: 'border-gray-200',
  text: 'text-gray-700',
};

export function StatusBadge({ status, variant = 'trip' }: StatusBadgeProps) {
  const map = variant === 'payment' ? PAYMENT_STATUS_COLORS : TRIP_STATUS_COLORS;
  const colors = map[status] ?? FALLBACK;
  return (
    <span
      className={cn(
        'inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold',
        colors.bg,
        colors.border,
        colors.text,
      )}
    >
      {status}
    </span>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```
Expected: exits 0.

---

## Task 5: `AdminSidebarLink` + `AdminSidebar`

**Files:**
- Create: `src/components/app/admin/AdminSidebarLink.tsx`
- Create: `src/components/app/admin/AdminSidebar.tsx`

- [ ] **Step 1: Create `AdminSidebarLink`**

```tsx
// src/components/app/admin/AdminSidebarLink.tsx
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSidebarLinkProps {
  badge?: number;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  label: string;
}

export function AdminSidebarLink({
  badge,
  href,
  icon: Icon,
  isActive,
  label,
}: AdminSidebarLinkProps) {
  return (
    <Link
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
        isActive
          ? 'bg-gray-100 font-bold text-gray-900'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700',
      )}
      href={href}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-gray-900 px-1.5 py-px text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
```

- [ ] **Step 2: Create `AdminSidebar`**

```tsx
// src/components/app/admin/AdminSidebar.tsx
'use client';

import { useParams, usePathname } from 'next/navigation';
import {
  Briefcase,
  CreditCard,
  Mail,
  Package,
  Star,
  Users,
} from 'lucide-react';
import { AdminSidebarLink } from './AdminSidebarLink';

export function AdminSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'es';

  function base(path: string) {
    return `/${locale}/dashboard/admin${path}`;
  }

  function isActive(href: string) {
    const root = base('');
    if (href === root) return pathname === root;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const links = [
    { href: base(''),          icon: Briefcase,  label: 'Trip Requests' },
    { href: base('/users'),    icon: Users,       label: 'Users'         },
    { href: base('/packages'), icon: Package,     label: 'Packages'      },
    { href: base('/payments'), icon: CreditCard,  label: 'Payments'      },
    { href: base('/reviews'),  icon: Star,        label: 'Reviews'       },
    { href: base('/waitlist'), icon: Mail,        label: 'Waitlist'      },
  ];

  return (
    <aside className="flex w-48 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-5">
        <p className="font-barlow-condensed text-sm font-extrabold uppercase tracking-widest text-gray-900">
          Admin Panel
        </p>
        <p className="mt-0.5 text-xs text-gray-400">GetRandomTrip</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {links.map((link) => (
          <AdminSidebarLink
            key={link.href}
            href={link.href}
            icon={link.icon}
            isActive={isActive(link.href)}
            label={link.label}
          />
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```
Expected: exits 0.

---

## Task 6: Admin layout

**Files:**
- Create: `src/app/[locale]/dashboard/admin/AdminLayoutClient.tsx`
- Create: `src/app/[locale]/dashboard/admin/layout.tsx`

- [ ] **Step 1: Create `AdminLayoutClient.tsx`**

```tsx
// src/app/[locale]/dashboard/admin/AdminLayoutClient.tsx
'use client';

import SecureRoute from '@/components/auth/SecureRoute';
import HeaderHero from '@/components/journey/HeaderHero';
import { AdminSidebar } from '@/components/app/admin/AdminSidebar';

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SecureRoute requiredRole="admin">
      <HeaderHero
        className="!min-h-[30vh]"
        description="Manage trip requests, users, packages and payments."
        fallbackImage="/images/hero-image-1.jpeg"
        subtitle="ADMIN DASHBOARD"
        title="Admin"
        videoSrc="/videos/hero-video-1.mp4"
      />
      <div className="flex">
        <AdminSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </SecureRoute>
  );
}
```

- [ ] **Step 2: Create `layout.tsx`**

```tsx
// src/app/[locale]/dashboard/admin/layout.tsx
export const dynamic = 'force-dynamic';

import AdminLayoutClient from './AdminLayoutClient';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```
Expected: exits 0.

---

## Task 7: Placeholder section pages

**Files:**
- Create: `src/app/[locale]/dashboard/admin/users/page.tsx`
- Create: `src/app/[locale]/dashboard/admin/packages/page.tsx`
- Create: `src/app/[locale]/dashboard/admin/payments/page.tsx`
- Create: `src/app/[locale]/dashboard/admin/reviews/page.tsx`
- Create: `src/app/[locale]/dashboard/admin/waitlist/page.tsx`

- [ ] **Step 1: Create all 5 placeholders**

Each file follows this pattern (swap the label):

```tsx
// users/page.tsx
export default function AdminUsersPage() {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center">
      <p className="font-barlow-condensed text-2xl font-bold uppercase tracking-wide text-gray-300">
        Users
      </p>
      <p className="mt-2 text-sm text-gray-400">Coming soon</p>
    </div>
  );
}
```

Use the same structure for `packages/page.tsx`, `payments/page.tsx`, `reviews/page.tsx`, `waitlist/page.tsx` — just change the label string.

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```
Expected: exits 0.

---

## Task 8: `useTripRequests` hook

**Files:**
- Create: `src/hooks/useTripRequests.ts`

- [ ] **Step 1: Create hook**

```ts
// src/hooks/useTripRequests.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AdminTripRequest } from '@/lib/admin/types';

interface UseTripRequestsResult {
  error: string | null;
  loading: boolean;
  refresh: () => void;
  trips: AdminTripRequest[];
}

export function useTripRequests(): UseTripRequestsResult {
  const [trips, setTrips] = useState<AdminTripRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/admin/trip-requests');
    const data = (await res.json()) as { error?: string; tripRequests?: AdminTripRequest[] };
    if (!res.ok) {
      setError(data.error ?? 'Failed to load trip requests.');
      setLoading(false);
      return;
    }
    setTrips(data.tripRequests ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { error, loading, refresh: load, trips };
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```
Expected: exits 0.

---

## Task 9: `AdminKPICard` + `TripRequestsKPIStrip`

**Files:**
- Create: `src/components/app/admin/AdminKPICard.tsx`
- Create: `src/components/app/admin/TripRequestsKPIStrip.tsx`

- [ ] **Step 1: Create `AdminKPICard`**

```tsx
// src/components/app/admin/AdminKPICard.tsx
interface AdminKPICardProps {
  count: number;
  label: string;
}

export function AdminKPICard({ count, label }: AdminKPICardProps) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 font-barlow-condensed text-2xl font-extrabold text-gray-900">{count}</p>
    </div>
  );
}
```

- [ ] **Step 2: Create `TripRequestsKPIStrip`**

```tsx
// src/components/app/admin/TripRequestsKPIStrip.tsx
import { countTripsByStatus } from '@/lib/admin/trip-status';
import type { AdminTripRequest } from '@/lib/admin/types';
import { AdminKPICard } from './AdminKPICard';

interface TripRequestsKPIStripProps {
  trips: AdminTripRequest[];
}

export function TripRequestsKPIStrip({ trips }: TripRequestsKPIStripProps) {
  const counts = countTripsByStatus(trips);
  return (
    <div className="grid grid-cols-4 gap-3 border-b border-gray-200 bg-gray-50 px-5 py-3">
      <AdminKPICard label="Confirmed"  count={counts.CONFIRMED}       />
      <AdminKPICard label="Pending"    count={counts.PENDING_PAYMENT} />
      <AdminKPICard label="Revealed"   count={counts.REVEALED}        />
      <AdminKPICard label="Completed"  count={counts.COMPLETED}       />
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```
Expected: exits 0.

---

## Task 10: `TripRequestsFilterBar`

**Files:**
- Create: `src/components/app/admin/TripRequestsFilterBar.tsx`

- [ ] **Step 1: Create component**

```tsx
// src/components/app/admin/TripRequestsFilterBar.tsx
import { cn } from '@/lib/utils';
import type { StatusFilterValue } from '@/lib/admin/types';

const FILTERS: { label: string; value: StatusFilterValue }[] = [
  { label: 'All',       value: 'ALL'             },
  { label: 'Pending',   value: 'PENDING_PAYMENT' },
  { label: 'Confirmed', value: 'CONFIRMED'        },
  { label: 'Revealed',  value: 'REVEALED'         },
  { label: 'Completed', value: 'COMPLETED'        },
  { label: 'Cancelled', value: 'CANCELLED'        },
];

interface TripRequestsFilterBarProps {
  activeFilter: StatusFilterValue;
  onFilterChange: (value: StatusFilterValue) => void;
}

export function TripRequestsFilterBar({
  activeFilter,
  onFilterChange,
}: TripRequestsFilterBarProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
      <p className="font-barlow-condensed text-base font-bold uppercase tracking-wide text-gray-900">
        Trip Requests
      </p>
      <div className="flex gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
              activeFilter === f.value
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300',
            )}
            onClick={() => onFilterChange(f.value)}
            type="button"
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```
Expected: exits 0.

---

## Task 11: `TripRequestDetails` + `TripStatusTimeline`

**Files:**
- Create: `src/components/app/admin/TripRequestDetails.tsx`
- Create: `src/components/app/admin/TripStatusTimeline.tsx`

- [ ] **Step 1: Create `TripRequestDetails`**

```tsx
// src/components/app/admin/TripRequestDetails.tsx
import { formatAdminDate, formatAdminAmount } from '@/lib/admin/format';
import type { AdminTripRequest } from '@/lib/admin/types';

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-xs font-semibold text-gray-700">{value}</span>
    </div>
  );
}

interface TripRequestDetailsProps {
  trip: AdminTripRequest;
}

export function TripRequestDetails({ trip }: TripRequestDetailsProps) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-gray-100 px-4 py-3">
      <DetailRow
        label="Origin"
        value={`${trip.originCity}, ${trip.originCountry}`}
      />
      <DetailRow
        label="Dates"
        value={`${formatAdminDate(trip.startDate)} — ${formatAdminDate(trip.endDate)}`}
      />
      <DetailRow
        label="Nights / Pax"
        value={`${trip.nights}n · ${trip.pax} pax`}
      />
      <DetailRow label="Transport" value={trip.transport} />
      {trip.payment && (
        <DetailRow
          label="Payment"
          value={formatAdminAmount(trip.payment.amount, trip.payment.currency)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `TripStatusTimeline`**

```tsx
// src/components/app/admin/TripStatusTimeline.tsx
import { cn } from '@/lib/utils';
import { TRIP_STATUS_FLOW } from '@/lib/admin/trip-status';
import { formatAdminDate } from '@/lib/admin/format';
import type { AdminTripRequest, TripRequestStatus } from '@/lib/admin/types';

const TIMELINE_STATUSES: TripRequestStatus[] = ['CONFIRMED', 'REVEALED', 'COMPLETED'];

const STATUS_DATE_FIELD: Partial<Record<TripRequestStatus, keyof AdminTripRequest>> = {
  COMPLETED: 'completedAt',
  CONFIRMED: 'updatedAt',
  REVEALED:  'destinationRevealedAt',
};

interface TripStatusTimelineProps {
  currentStatus: TripRequestStatus;
  trip: AdminTripRequest;
}

export function TripStatusTimeline({ currentStatus, trip }: TripStatusTimelineProps) {
  const currentIndex = TRIP_STATUS_FLOW.indexOf(currentStatus);
  return (
    <div className="px-4 py-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
        Status Timeline
      </p>
      <div className="flex flex-col gap-2">
        {TIMELINE_STATUSES.map((status) => {
          const statusIndex = TRIP_STATUS_FLOW.indexOf(status);
          const isPast = statusIndex <= currentIndex;
          const dateField = STATUS_DATE_FIELD[status];
          const dateValue = dateField ? (trip[dateField] as string | null) : null;
          return (
            <div key={status} className="flex items-center gap-2">
              <div
                className={cn(
                  'h-2 w-2 shrink-0 rounded-full',
                  isPast ? 'bg-green-500' : 'bg-gray-200',
                )}
              />
              <span
                className={cn(
                  'text-xs font-semibold',
                  isPast ? 'text-gray-700' : 'text-gray-400',
                )}
              >
                {status}
              </span>
              {isPast && dateValue && (
                <span className="ml-auto text-xs text-gray-400">
                  {formatAdminDate(dateValue)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```
Expected: exits 0.

---

## Task 12: `TripRequestsTableRow` + `TripRequestsTable`

**Files:**
- Create: `src/components/app/admin/TripRequestsTableRow.tsx`
- Create: `src/components/app/admin/TripRequestsTable.tsx`

- [ ] **Step 1: Create `TripRequestsTableRow`**

```tsx
// src/components/app/admin/TripRequestsTableRow.tsx
import { cn } from '@/lib/utils';
import type { AdminTripRequest } from '@/lib/admin/types';
import { StatusBadge } from './StatusBadge';

interface TripRequestsTableRowProps {
  isSelected: boolean;
  onEdit: (id: string) => void;
  trip: AdminTripRequest;
}

export function TripRequestsTableRow({
  isSelected,
  onEdit,
  trip,
}: TripRequestsTableRowProps) {
  return (
    <tr
      className={cn(
        'border-b border-gray-100 last:border-0',
        isSelected && 'border-l-2 border-l-gray-900 bg-blue-50',
      )}
    >
      <td className="px-4 py-2.5">
        <p className="text-sm font-bold text-gray-900">{trip.user.name}</p>
        <p className="text-xs text-gray-400">{trip.user.email}</p>
      </td>
      <td className="px-4 py-2.5 text-sm text-gray-600">
        {trip.originCity}, {trip.originCountry}
      </td>
      <td className="px-4 py-2.5">
        <p className="text-sm text-gray-700">{trip.type}</p>
        <p className="text-xs text-gray-400">{trip.level}</p>
      </td>
      <td className="px-4 py-2.5">
        <StatusBadge status={trip.status} variant="trip" />
      </td>
      <td className="px-4 py-2.5">
        {trip.payment ? (
          <StatusBadge status={trip.payment.status} variant="payment" />
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-2.5 text-right">
        <button
          className="text-xs font-semibold text-gray-600 hover:text-gray-900"
          onClick={() => onEdit(trip.id)}
          type="button"
        >
          {isSelected ? 'editing' : 'Edit'}
        </button>
      </td>
    </tr>
  );
}
```

- [ ] **Step 2: Create `TripRequestsTable`**

```tsx
// src/components/app/admin/TripRequestsTable.tsx
import type { AdminTripRequest } from '@/lib/admin/types';
import { TripRequestsTableRow } from './TripRequestsTableRow';

const HEADERS = ['Traveler', 'Origin', 'Type / Level', 'Status', 'Payment', ''];

interface TripRequestsTableProps {
  onEdit: (id: string) => void;
  selectedId: string | null;
  trips: AdminTripRequest[];
}

export function TripRequestsTable({
  onEdit,
  selectedId,
  trips,
}: TripRequestsTableProps) {
  return (
    <div className="mx-5 my-4 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {HEADERS.map((h) => (
              <th
                key={h}
                className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-gray-400 last:text-right"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trips.map((trip) => (
            <TripRequestsTableRow
              key={trip.id}
              isSelected={selectedId === trip.id}
              onEdit={onEdit}
              trip={trip}
            />
          ))}
        </tbody>
      </table>
      {trips.length === 0 && (
        <p className="py-10 text-center text-sm text-gray-400">No trips found.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```
Expected: exits 0.

---

## Task 13: `TripRequestSlideOver`

**Files:**
- Create: `src/components/app/admin/TripRequestSlideOver.tsx`

- [ ] **Step 1: Create component**

```tsx
// src/components/app/admin/TripRequestSlideOver.tsx
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField, FormSelectField } from '@/components/ui/FormField';
import type { AdminTripRequest, TripRequestStatus } from '@/lib/admin/types';
import { StatusBadge } from './StatusBadge';
import { TripRequestDetails } from './TripRequestDetails';
import { TripStatusTimeline } from './TripStatusTimeline';

const STATUS_OPTIONS: TripRequestStatus[] = [
  'DRAFT',
  'SAVED',
  'PENDING_PAYMENT',
  'CONFIRMED',
  'REVEALED',
  'COMPLETED',
  'CANCELLED',
];

interface Draft {
  actualDestination: string;
  status: TripRequestStatus;
}

interface TripRequestSlideOverProps {
  onClose: () => void;
  onSaved: () => void;
  trip: AdminTripRequest;
}

export function TripRequestSlideOver({
  onClose,
  onSaved,
  trip,
}: TripRequestSlideOverProps) {
  const [draft, setDraft] = useState<Draft>({
    actualDestination: trip.actualDestination ?? '',
    status: trip.status,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/admin/trip-requests/${trip.id}`, {
      body: JSON.stringify({
        actualDestination: draft.actualDestination,
        status: draft.status,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    });
    setSaving(false);
    if (res.ok) {
      onSaved();
      onClose();
    }
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-l border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-100 px-4 py-3.5">
        <div>
          <p className="font-barlow-condensed text-sm font-extrabold uppercase tracking-wide text-gray-900">
            {trip.user.name}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">{trip.user.email}</p>
        </div>
        <button
          aria-label="Close panel"
          className="rounded bg-gray-100 p-1 text-gray-400 hover:text-gray-700"
          onClick={onClose}
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 border-b border-gray-100 px-4 py-2.5">
        <span className="inline-block rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700">
          {trip.type}
        </span>
        <StatusBadge status={trip.status} variant="trip" />
        <span className="inline-block rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700">
          {trip.level}
        </span>
        {trip.payment && (
          <StatusBadge status={trip.payment.status} variant="payment" />
        )}
      </div>

      {/* Read-only details */}
      <TripRequestDetails trip={trip} />

      {/* Edit fields */}
      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3">
        <FormField
          id="slide-destination"
          label="Set Destination"
          onChange={(e) =>
            setDraft((d) => ({ ...d, actualDestination: e.target.value }))
          }
          placeholder="e.g. Lisbon, Portugal"
          type="text"
          value={draft.actualDestination}
        />
        <FormSelectField
          id="slide-status"
          label="Trip Status"
          onChange={(e) =>
            setDraft((d) => ({ ...d, status: e.target.value as TripRequestStatus }))
          }
          value={draft.status}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </FormSelectField>
      </div>

      {/* Timeline */}
      <TripStatusTimeline currentStatus={draft.status} trip={trip} />

      {/* Actions */}
      <div className="mt-auto flex flex-col gap-2 border-t border-gray-100 px-4 py-3">
        <Button
          disabled={saving}
          onClick={() => void handleSave()}
          size="sm"
          type="button"
          variant="default"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button onClick={onClose} size="sm" type="button" variant="secondary">
          Cancel
        </Button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```
Expected: exits 0.

---

## Task 14: Rewrite `page.tsx`

**Files:**
- Modify: `src/app/[locale]/dashboard/admin/page.tsx`

- [ ] **Step 1: Replace entire file**

```tsx
// src/app/[locale]/dashboard/admin/page.tsx
'use client';

import { useState } from 'react';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { TripRequestsFilterBar } from '@/components/app/admin/TripRequestsFilterBar';
import { TripRequestsKPIStrip } from '@/components/app/admin/TripRequestsKPIStrip';
import { TripRequestsTable } from '@/components/app/admin/TripRequestsTable';
import { TripRequestSlideOver } from '@/components/app/admin/TripRequestSlideOver';
import { useTripRequests } from '@/hooks/useTripRequests';
import type { AdminTripRequest, StatusFilterValue } from '@/lib/admin/types';

function applyFilter(
  trips: AdminTripRequest[],
  filter: StatusFilterValue,
): AdminTripRequest[] {
  if (filter === 'ALL') return trips;
  return trips.filter((t) => t.status === filter);
}

export default function AdminTripRequestsPage() {
  const { error, loading, refresh, trips } = useTripRequests();
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('ALL');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const visibleTrips = applyFilter(trips, statusFilter);
  const selectedTrip = selectedTripId
    ? trips.find((t) => t.id === selectedTripId)
    : null;

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="p-8 text-center text-sm text-red-600">{error}</div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        <TripRequestsFilterBar
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />
        <TripRequestsKPIStrip trips={trips} />
        <div className="flex-1 overflow-y-auto">
          <TripRequestsTable
            onEdit={setSelectedTripId}
            selectedId={selectedTripId}
            trips={visibleTrips}
          />
        </div>
      </div>
      {selectedTrip && (
        <TripRequestSlideOver
          onClose={() => setSelectedTripId(null)}
          onSaved={refresh}
          trip={selectedTrip}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```
Expected: exits 0.

- [ ] **Step 3: Run tests**

```bash
npm test
```
Expected: all 5 tests pass.

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Navigate to `http://localhost:3010/es/dashboard/admin` (sign in as admin first).

Verify:
- Navbar + HeaderHero appear full-width
- Sidebar renders with 6 links, "Trip Requests" active
- KPI strip shows counts
- Table shows trips with status + payment badges
- Clicking "Edit" on a row opens the slide-over panel on the right
- Changing status/destination and saving calls the API and refreshes the list
- Clicking other sidebar links navigates to placeholder pages without remounting the sidebar
