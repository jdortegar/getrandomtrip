# JourneyMainContent Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decompose `JourneyMainContent.tsx` (975 lines) into focused hooks, pure helpers, and one subcomponent, with no behavior changes.

**Architecture:** Extract URL-param reading into `useJourneySearchParams`, draft-state patterns into `useJourneyDraftDetails` and `useJourneyDraftPreferences`, accordion logic into `useJourneyAccordion`, pure derivation functions into `journey.ts`, and the action bar into `JourneyActionBar`. The main file becomes ~180 lines of orchestration.

**Tech Stack:** Next.js 14 App Router, React hooks, TypeScript strict, Tailwind CSS

---

## Files

| Action | Path | Responsibility |
|---|---|---|
| Modify | `src/lib/helpers/journey.ts` | Add label getters, reset-param consts, step-logic helpers |
| Create | `src/hooks/useJourneySearchParams.ts` | Read + normalize all 16 journey URL params |
| Create | `src/hooks/useJourneyDraftDetails.ts` | Draft state + sync/flush effects for details tab |
| Create | `src/hooks/useJourneyDraftPreferences.ts` | Draft state + sync effect for preferences tab |
| Create | `src/hooks/useJourneyAccordion.ts` | Controlled/uncontrolled accordion + auto-open effect |
| Create | `src/components/journey/JourneyActionBar.tsx` | Clear All / Continue / Checkout button bar |
| Modify | `src/components/journey/JourneyMainContent.tsx` | Consume all new pieces; remove extracted logic |

---

## Task 1: Add helpers to `src/lib/helpers/journey.ts`

**Files:**
- Modify: `src/lib/helpers/journey.ts`

- [ ] **Step 1: Add imports and types**

Append to the top of the imports block in `src/lib/helpers/journey.ts`:

```ts
import { getLevelById } from '@/lib/utils/experiencesData';
```

Then append the following exports after the existing `countOptionalFilters` function:

```ts
// ---------------------------------------------------------------------------
// Label helpers (pure — no React dependencies)
// ---------------------------------------------------------------------------

export function getTravelTypeLabel(
  travelType: string | undefined,
  localizedTravelerTypes: Array<{ key: string; title: string }> | undefined,
  placeholder: string,
): string {
  if (!travelType) return placeholder;
  const localized = localizedTravelerTypes?.find((t) => t.key === travelType);
  return localized?.title || travelType;
}

export function getExperienceLabel(
  travelType: string | undefined,
  experience: string | undefined,
  locale: string,
  placeholder: string,
): string {
  if (!experience || !travelType) return placeholder;
  const level = getLevelById(travelType, experience, locale);
  return level?.name ?? experience;
}

export function getExcuseLabel(
  excuse: string | undefined,
  excuses: Array<{ key: string; title: string }>,
  placeholder: string,
): string {
  if (!excuse) return placeholder;
  const found = excuses.find((e) => e.key === excuse);
  return found?.title || excuse;
}

export function getRefineDetailsLabel(
  refineDetails: string[],
  options: Array<{ key: string; label: string }>,
  oneSelectedStr: string,
  countSelectedStr: string,
  placeholder: string,
): string {
  if (refineDetails.length === 0) return placeholder;
  if (refineDetails.length === 1) {
    const option = options.find((o) => o.key === refineDetails[0]);
    return option?.label || oneSelectedStr;
  }
  return countSelectedStr.replace('{count}', String(refineDetails.length));
}

// ---------------------------------------------------------------------------
// Reset-param constants
// ---------------------------------------------------------------------------

export const PARAMS_TO_RESET_AFTER_TRAVEL_TYPE: Record<string, string | undefined> = {
  accommodationType: undefined,
  addons: undefined,
  arrivePref: undefined,
  avoidDestinations: undefined,
  climate: undefined,
  departPref: undefined,
  excuse: undefined,
  experience: undefined,
  maxTravelTime: undefined,
  nights: undefined,
  originCity: undefined,
  originCountry: undefined,
  refineDetails: undefined,
  startDate: undefined,
  transportOrder: undefined,
};

export const PARAMS_TO_RESET_AFTER_EXPERIENCE: Record<string, string | undefined> = {
  accommodationType: undefined,
  addons: undefined,
  arrivePref: undefined,
  avoidDestinations: undefined,
  climate: undefined,
  departPref: undefined,
  excuse: undefined,
  maxTravelTime: undefined,
  nights: undefined,
  originCity: undefined,
  originCountry: undefined,
  refineDetails: undefined,
  startDate: undefined,
  transportOrder: undefined,
};

// ---------------------------------------------------------------------------
// Step-logic helpers (pure — no React dependencies)
// ---------------------------------------------------------------------------

export interface JourneyStepValues {
  travelType: string | undefined;
  experience: string | undefined;
  excuse: string | undefined;
  hasExcuseStep: boolean;
  effectiveOriginCountry: string;
  effectiveOriginCity: string;
  effectiveStartDate: string | undefined;
  effectiveNights: number;
  transport: string | undefined;
}

export function getNextTab(
  activeTab: string,
  hasExcuseStep: boolean,
): string | null {
  const tabs = hasExcuseStep
    ? ['budget', 'excuse', 'details', 'preferences']
    : ['budget', 'details', 'preferences'];
  const currentIndex = tabs.indexOf(activeTab);
  return currentIndex < tabs.length - 1 ? tabs[currentIndex + 1] : null;
}

export function isStepComplete(
  activeTab: string,
  v: JourneyStepValues,
): boolean {
  switch (activeTab) {
    case 'budget':
      return Boolean(v.travelType && v.experience);
    case 'excuse':
      return Boolean(
        v.travelType && v.experience && (v.excuse || !v.hasExcuseStep),
      );
    case 'details':
      return Boolean(
        v.effectiveOriginCountry &&
          v.effectiveOriginCity &&
          v.effectiveStartDate &&
          v.effectiveNights,
      );
    case 'preferences':
      return Boolean(v.transport);
    default:
      return true;
  }
}

export function checkAllComplete(v: JourneyStepValues): boolean {
  return Boolean(
    v.travelType &&
      v.experience &&
      (v.excuse || !v.hasExcuseStep) &&
      v.effectiveOriginCountry &&
      v.effectiveOriginCity &&
      v.effectiveStartDate &&
      v.effectiveNights &&
      v.transport,
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

```bash
npm run typecheck 2>&1 | tail -20
```

Expected: zero new errors (existing errors, if any, are unchanged).

- [ ] **Step 3: Commit**

```bash
git add src/lib/helpers/journey.ts
git commit -m "feat: add label getters, reset params, and step-logic helpers to journey.ts"
```

---

## Task 2: Create `src/hooks/useJourneySearchParams.ts`

**Files:**
- Create: `src/hooks/useJourneySearchParams.ts`

- [ ] **Step 1: Create the hook**

```ts
'use client';

import { useMemo } from 'react';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import { DEFAULT_TRANSPORT_ORDER } from '@/components/journey/TransportSelector';
import {
  isCompleteTransportOrderParam,
  normalizeMaxTravelTimeKey,
  normalizeTransportId,
  normalizeJourneyFilterValue,
} from '@/lib/helpers/transport';

export interface JourneySearchParamsValues {
  travelType: string | undefined;
  experience: string | undefined;
  excuse: string | undefined;
  refineDetails: string[];
  originCountry: string;
  originCity: string;
  startDate: string | undefined;
  nights: number;
  transportOrder: string[];
  /** Primary transport id. Defined only when transportOrder is a complete 4-item param. */
  transport: string | undefined;
  departPref: string | undefined;
  arrivePref: string | undefined;
  maxTravelTime: string | undefined;
  climate: string | undefined;
  accommodationType: string | undefined;
  addons: string | undefined;
}

export function useJourneySearchParams(
  searchParams: ReadonlyURLSearchParams,
): JourneySearchParamsValues {
  const travelType = useMemo(
    () => searchParams.get('travelType') || undefined,
    [searchParams],
  );
  const experience = useMemo(
    () => searchParams.get('experience') || undefined,
    [searchParams],
  );
  const excuse = useMemo(
    () => searchParams.get('excuse') || undefined,
    [searchParams],
  );
  const refineDetails = useMemo(() => {
    const raw = searchParams.get('refineDetails');
    if (!raw) return [] as string[];
    return raw.split(',').filter(Boolean);
  }, [searchParams]);
  const originCountry = useMemo(
    () => searchParams.get('originCountry') || '',
    [searchParams],
  );
  const originCity = useMemo(
    () => searchParams.get('originCity') || '',
    [searchParams],
  );
  const startDate = useMemo(
    () => searchParams.get('startDate') || undefined,
    [searchParams],
  );
  const nights = useMemo(() => {
    const raw = searchParams.get('nights');
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }, [searchParams]);
  const transportOrder = useMemo(() => {
    const raw = searchParams.get('transportOrder');
    if (!raw) return DEFAULT_TRANSPORT_ORDER;
    const ids = raw
      .split(',')
      .map((s) => s.trim())
      .map((id) => normalizeTransportId(id))
      .filter((id): id is string => Boolean(id));
    return ids.length === 4 ? ids : DEFAULT_TRANSPORT_ORDER;
  }, [searchParams]);
  // transport is derived sequentially — must come after transportOrder
  const transport = isCompleteTransportOrderParam(
    searchParams.get('transportOrder'),
  )
    ? normalizeTransportId(transportOrder[0])
    : undefined;
  const departPref = useMemo(
    () => normalizeJourneyFilterValue(searchParams.get('departPref')) || undefined,
    [searchParams],
  );
  const arrivePref = useMemo(
    () => normalizeJourneyFilterValue(searchParams.get('arrivePref')) || undefined,
    [searchParams],
  );
  const maxTravelTime = useMemo(
    () => normalizeMaxTravelTimeKey(searchParams.get('maxTravelTime')) || undefined,
    [searchParams],
  );
  const climate = useMemo(
    () => normalizeJourneyFilterValue(searchParams.get('climate')) || undefined,
    [searchParams],
  );
  const accommodationType = useMemo(
    () => normalizeJourneyFilterValue(searchParams.get('accommodationType')) || undefined,
    [searchParams],
  );
  const addons = useMemo(
    () => searchParams.get('addons') || undefined,
    [searchParams],
  );

  return {
    travelType,
    experience,
    excuse,
    refineDetails,
    originCountry,
    originCity,
    startDate,
    nights,
    transportOrder,
    transport,
    departPref,
    arrivePref,
    maxTravelTime,
    climate,
    accommodationType,
    addons,
  };
}
```

- [ ] **Step 2: Verify typecheck passes**

```bash
npm run typecheck 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useJourneySearchParams.ts
git commit -m "feat: add useJourneySearchParams hook"
```

---

## Task 3: Create `src/hooks/useJourneyDraftDetails.ts`

**Files:**
- Create: `src/hooks/useJourneyDraftDetails.ts`

**Key design decisions:**
- `prevActiveTabRef` is internal — both the sync and flush effects share it here.
- `updateQuery` is captured in a `useRef` to avoid it appearing in the flush effect's deps. `useQuerySync` returns a new function every render; including it in deps would re-fire the flush effect on every render, potentially double-flushing. The ref holds the latest version without causing extra effect runs.

- [ ] **Step 1: Create the hook**

```ts
'use client';

import { useState, useEffect, useRef } from 'react';
import { DEFAULT_TRANSPORT_ORDER } from '@/components/journey/TransportSelector';

type UpdateQuery = (patch: Record<string, string | string[] | undefined>) => void;

interface DraftDetailsUrlValues {
  originCountry: string;
  originCity: string;
  startDate: string | undefined;
  nights: number;
  transportOrder: string[];
}

export interface JourneyDraftDetailsResult {
  draftOriginCountry: string;
  draftOriginCity: string;
  draftStartDate: string | undefined;
  draftNights: number;
  draftTransportOrder: string[];
  setDraftOriginCountry: (v: string) => void;
  setDraftOriginCity: (v: string) => void;
  setDraftStartDate: (v: string | undefined) => void;
  setDraftNights: (v: number) => void;
  setDraftTransportOrder: (v: string[]) => void;
  effectiveOriginCountry: string;
  effectiveOriginCity: string;
  effectiveStartDate: string | undefined;
  effectiveNights: number;
  effectiveTransportOrder: string[];
}

/**
 * Manages draft state for the journey details tab.
 *
 * On entering the details tab: syncs URL values into local draft state.
 * On leaving the details tab: flushes draft values back to the URL.
 * While on the details tab: returns draft values as "effective" values.
 * On any other tab: returns committed URL values as "effective" values.
 */
export function useJourneyDraftDetails(
  activeTab: string,
  urlValues: DraftDetailsUrlValues,
  updateQuery: UpdateQuery,
): JourneyDraftDetailsResult {
  const [draftOriginCountry, setDraftOriginCountry] = useState('');
  const [draftOriginCity, setDraftOriginCity] = useState('');
  const [draftStartDate, setDraftStartDate] = useState<string | undefined>(undefined);
  const [draftNights, setDraftNights] = useState(1);
  const [draftTransportOrder, setDraftTransportOrder] = useState<string[]>(DEFAULT_TRANSPORT_ORDER);

  // Stable ref so the flush effect can call updateQuery without it being a dep.
  // useQuerySync returns a new function every render; listing it as a dep would
  // re-fire the flush effect on every render and risk double-flushing.
  const updateQueryRef = useRef(updateQuery);
  useEffect(() => {
    updateQueryRef.current = updateQuery;
  });

  const prevActiveTabRef = useRef(activeTab);

  // Sync URL -> draft when entering details step
  useEffect(() => {
    if (activeTab === 'details') {
      setDraftOriginCountry(urlValues.originCountry);
      setDraftOriginCity(urlValues.originCity);
      setDraftStartDate(urlValues.startDate);
      setDraftNights(urlValues.nights);
      setDraftTransportOrder(urlValues.transportOrder);
      prevActiveTabRef.current = activeTab;
    }
  }, [
    activeTab,
    urlValues.originCity,
    urlValues.originCountry,
    urlValues.nights,
    urlValues.startDate,
    urlValues.transportOrder,
  ]);

  // Flush draft -> URL when leaving details step
  useEffect(() => {
    if (prevActiveTabRef.current === 'details' && activeTab !== 'details') {
      updateQueryRef.current({
        nights: String(draftNights),
        originCity: draftOriginCity || undefined,
        originCountry: draftOriginCountry || undefined,
        startDate: draftStartDate ?? undefined,
        transportOrder:
          draftTransportOrder.length === 4
            ? draftTransportOrder.join(',')
            : undefined,
      });
    }
    prevActiveTabRef.current = activeTab;
  }, [
    activeTab,
    draftOriginCity,
    draftOriginCountry,
    draftNights,
    draftStartDate,
    draftTransportOrder,
  ]);

  const effectiveOriginCountry =
    activeTab === 'details' ? draftOriginCountry : urlValues.originCountry;
  const effectiveOriginCity =
    activeTab === 'details' ? draftOriginCity : urlValues.originCity;
  const effectiveStartDate =
    activeTab === 'details' ? draftStartDate : urlValues.startDate;
  const effectiveNights =
    activeTab === 'details' ? draftNights : urlValues.nights;
  const effectiveTransportOrder =
    activeTab === 'details' ? draftTransportOrder : urlValues.transportOrder;

  return {
    draftOriginCountry,
    draftOriginCity,
    draftStartDate,
    draftNights,
    draftTransportOrder,
    setDraftOriginCountry,
    setDraftOriginCity,
    setDraftStartDate,
    setDraftNights,
    setDraftTransportOrder,
    effectiveOriginCountry,
    effectiveOriginCity,
    effectiveStartDate,
    effectiveNights,
    effectiveTransportOrder,
  };
}
```

- [ ] **Step 2: Verify typecheck passes**

```bash
npm run typecheck 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useJourneyDraftDetails.ts
git commit -m "feat: add useJourneyDraftDetails hook"
```

---

## Task 4: Create `src/hooks/useJourneyDraftPreferences.ts`

**Files:**
- Create: `src/hooks/useJourneyDraftPreferences.ts`

**Note:** Preferences use a sync-on-enter pattern only (no flush-on-leave). Changes are committed explicitly via `handleSaveFilters` in the component.

- [ ] **Step 1: Create the hook**

```ts
'use client';

import { useState, useEffect } from 'react';

interface DraftPreferencesUrlValues {
  departPref: string | undefined;
  arrivePref: string | undefined;
  climate: string | undefined;
  maxTravelTime: string | undefined;
  accommodationType: string | undefined;
}

export interface JourneyDraftPreferencesResult {
  draftDepartPref: string;
  draftArrivePref: string;
  draftClimate: string;
  draftMaxTravelTime: string;
  draftAccommodationType: string;
  setDraftDepartPref: (v: string) => void;
  setDraftArrivePref: (v: string) => void;
  setDraftClimate: (v: string) => void;
  setDraftMaxTravelTime: (v: string) => void;
  setDraftAccommodationType: (v: string) => void;
  effectiveDepartPref: string;
  effectiveArrivePref: string;
  effectiveClimate: string;
  effectiveMaxTravelTime: string;
  effectiveAccommodationType: string;
}

/**
 * Manages draft state for the journey preferences tab.
 *
 * On entering the preferences tab: syncs URL values into local draft state.
 * Draft is committed to the URL only when the parent calls handleSaveFilters
 * (via updateQuery) — there is no automatic flush on tab leave.
 */
export function useJourneyDraftPreferences(
  activeTab: string,
  urlValues: DraftPreferencesUrlValues,
): JourneyDraftPreferencesResult {
  const [draftDepartPref, setDraftDepartPref] = useState<string>('any');
  const [draftArrivePref, setDraftArrivePref] = useState<string>('any');
  const [draftClimate, setDraftClimate] = useState<string>('any');
  const [draftMaxTravelTime, setDraftMaxTravelTime] = useState<string>('no-limit');
  const [draftAccommodationType, setDraftAccommodationType] = useState<string>('any');

  // Sync URL -> draft when entering preferences step
  useEffect(() => {
    if (activeTab === 'preferences') {
      setDraftDepartPref(urlValues.departPref ?? 'any');
      setDraftArrivePref(urlValues.arrivePref ?? 'any');
      setDraftClimate(urlValues.climate ?? 'any');
      setDraftMaxTravelTime(urlValues.maxTravelTime ?? 'no-limit');
      setDraftAccommodationType(urlValues.accommodationType ?? 'any');
    }
  }, [
    activeTab,
    urlValues.accommodationType,
    urlValues.arrivePref,
    urlValues.climate,
    urlValues.departPref,
    urlValues.maxTravelTime,
  ]);

  const effectiveDepartPref =
    activeTab === 'preferences' ? draftDepartPref : (urlValues.departPref ?? 'any');
  const effectiveArrivePref =
    activeTab === 'preferences' ? draftArrivePref : (urlValues.arrivePref ?? 'any');
  const effectiveClimate =
    activeTab === 'preferences' ? draftClimate : (urlValues.climate ?? 'any');
  const effectiveMaxTravelTime =
    activeTab === 'preferences'
      ? draftMaxTravelTime
      : (urlValues.maxTravelTime ?? 'no-limit');
  const effectiveAccommodationType =
    activeTab === 'preferences'
      ? draftAccommodationType
      : (urlValues.accommodationType ?? 'any');

  return {
    draftDepartPref,
    draftArrivePref,
    draftClimate,
    draftMaxTravelTime,
    draftAccommodationType,
    setDraftDepartPref,
    setDraftArrivePref,
    setDraftClimate,
    setDraftMaxTravelTime,
    setDraftAccommodationType,
    effectiveDepartPref,
    effectiveArrivePref,
    effectiveClimate,
    effectiveMaxTravelTime,
    effectiveAccommodationType,
  };
}
```

- [ ] **Step 2: Verify typecheck passes**

```bash
npm run typecheck 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useJourneyDraftPreferences.ts
git commit -m "feat: add useJourneyDraftPreferences hook"
```

---

## Task 5: Create `src/hooks/useJourneyAccordion.ts`

**Files:**
- Create: `src/hooks/useJourneyAccordion.ts`

- [ ] **Step 1: Create the hook**

```ts
'use client';

import { useState, useEffect } from 'react';
import { JOURNEY_ADDONS_ENABLED } from 'config/journey-features';

export interface JourneyAccordionResult {
  accordionValue: string;
  setAccordionValue: (v: string) => void;
}

/**
 * Manages accordion open/close state for the journey flow.
 *
 * Supports both controlled mode (openSectionId + onOpenSection provided by parent)
 * and uncontrolled mode (internal state).
 *
 * Automatically opens the appropriate section when the active tab changes.
 */
export function useJourneyAccordion(
  activeTab: string,
  openSectionId: string | undefined,
  onOpenSection: ((sectionId: string) => void) | undefined,
): JourneyAccordionResult {
  const [internalAccordion, setInternalAccordion] = useState<string>('');
  const isControlled = openSectionId !== undefined && onOpenSection !== undefined;
  const accordionValue = isControlled ? (openSectionId ?? '') : internalAccordion;
  const setAccordionValue = isControlled ? onOpenSection! : setInternalAccordion;

  // Auto-open the first section of each tab when the tab changes
  useEffect(() => {
    if (
      activeTab === 'budget' &&
      accordionValue !== 'travel-type' &&
      accordionValue !== 'experience'
    ) {
      setAccordionValue('travel-type');
    } else if (
      activeTab === 'excuse' &&
      accordionValue !== 'excuse' &&
      accordionValue !== 'refine-details'
    ) {
      setAccordionValue('excuse');
    } else if (
      activeTab === 'details' &&
      accordionValue !== 'dates' &&
      accordionValue !== 'origin' &&
      accordionValue !== 'transport'
    ) {
      setAccordionValue('origin');
    } else if (
      activeTab === 'preferences' &&
      accordionValue !== '' &&
      accordionValue !== 'filters' &&
      !(JOURNEY_ADDONS_ENABLED && accordionValue === 'addons')
    ) {
      setAccordionValue('filters');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, accordionValue]);

  return { accordionValue, setAccordionValue };
}
```

> **Note on eslint-disable:** `setAccordionValue` is intentionally omitted from deps. It is either `setInternalAccordion` (stable React setState) or `onOpenSection` (parent callback that may not be memoized). Including it could cause the effect to re-run on every parent render. The conditions inside the effect prevent any infinite loops.

- [ ] **Step 2: Verify typecheck passes**

```bash
npm run typecheck 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useJourneyAccordion.ts
git commit -m "feat: add useJourneyAccordion hook"
```

---

## Task 6: Create `src/components/journey/JourneyActionBar.tsx`

**Files:**
- Create: `src/components/journey/JourneyActionBar.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';

import { Button } from '@/components/ui/Button';

interface JourneyActionBarLabels {
  clearAll: string;
  next: string;
  viewCheckout: string;
}

interface JourneyActionBarProps {
  canContinue: boolean;
  isAllStepsComplete: boolean;
  isSavingAndRedirecting: boolean;
  labels: JourneyActionBarLabels;
  onClearAll: () => void;
  onContinue: () => void;
  onGoToCheckout: () => void;
}

export function JourneyActionBar({
  canContinue,
  isAllStepsComplete,
  isSavingAndRedirecting,
  labels,
  onClearAll,
  onContinue,
  onGoToCheckout,
}: JourneyActionBarProps) {
  return (
    <div className="flex items-center justify-center gap-10 mt-8 pt-6 border-t border-gray-200">
      <button
        className="text-gray-900 underline hover:no-underline text-sm font-medium"
        onClick={onClearAll}
        type="button"
      >
        {labels.clearAll}
      </button>

      {canContinue && (
        <Button
          className="text-sm font-normal normal-case"
          onClick={onContinue}
          size="md"
          variant="default"
        >
          {labels.next}
        </Button>
      )}

      {isAllStepsComplete && !canContinue && (
        <Button
          className="text-sm font-normal normal-case"
          disabled={isSavingAndRedirecting}
          onClick={onGoToCheckout}
          size="md"
          variant="default"
        >
          {isSavingAndRedirecting ? 'Guardando...' : labels.viewCheckout}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

```bash
npm run typecheck 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/journey/JourneyActionBar.tsx
git commit -m "feat: add JourneyActionBar subcomponent"
```

---

## Task 7: Refactor `src/components/journey/JourneyMainContent.tsx`

**Files:**
- Modify: `src/components/journey/JourneyMainContent.tsx`

**What is removed:**
- 15 individual `useMemo(() => searchParams.get(...))` calls → replaced by `useJourneySearchParams`
- 5 draft detail state vars + 2 effects + `prevActiveTabRef` → replaced by `useJourneyDraftDetails`
- 5 draft preference state vars + 1 effect → replaced by `useJourneyDraftPreferences`
- `internalAccordion` state + `isControlled` logic + auto-open effect → replaced by `useJourneyAccordion`
- 4 label getter functions → replaced by helpers from `journey.ts`
- 2 `useMemo`-wrapped reset-param objects → replaced by constants from `journey.ts`
- `getNextTab` and `isCurrentStepComplete` functions → replaced by helpers
- Dead code: `selectedExperienceLevel`, `hasSelections` (computed but never used)
- Action bar JSX → replaced by `<JourneyActionBar />`

**What stays:**
- `handleGoToCheckout` (needs `locale`, `router`, `session`, `sessionStatus`)
- `handleOriginCountryChange`, `handleOriginCityChange` (call both draft setters and `setPartial`)
- All other event handlers (short glue code, not worth abstracting)
- `hasExcuseStep`, `excuses`, `refineDetailsOptions` useMemos (component-level, use props)
- `renderContent()` switch

- [ ] **Step 1: Replace `JourneyMainContent.tsx` with the refactored version**

```tsx
'use client';

import { useCallback, useMemo, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import BudgetStep from '@/components/journey/BudgetStep';
import ExcuseStep from '@/components/journey/ExcuseStep';
import { JourneyDetailsStep } from '@/components/journey/JourneyDetailsStep';
import type { JourneyDetailsStepLabels } from '@/components/journey/JourneyDetailsStep';
import { DEFAULT_TRANSPORT_ORDER } from '@/components/journey/TransportSelector';
import { JourneyPreferencesStep } from '@/components/journey/JourneyPreferencesStep';
import type { JourneyPreferencesStepLabels } from '@/components/journey/JourneyPreferencesStep';
import { JourneyActionBar } from '@/components/journey/JourneyActionBar';
import {
  getExcusesByTypeAndLevel,
  getExcuseOptions,
  getHasExcuseStep,
} from '@/lib/helpers/excuse-helper';
import {
  buildTripRequestPayloadFromSearchParams,
  checkAllComplete,
  getExcuseLabel,
  getExperienceLabel,
  getNextTab,
  getRefineDetailsLabel,
  getTravelTypeLabel,
  isStepComplete,
  PARAMS_TO_RESET_AFTER_EXPERIENCE,
  PARAMS_TO_RESET_AFTER_TRAVEL_TYPE,
} from '@/lib/helpers/journey';
import { useJourneyAccordion } from '@/hooks/useJourneyAccordion';
import { useJourneyDraftDetails } from '@/hooks/useJourneyDraftDetails';
import { useJourneyDraftPreferences } from '@/hooks/useJourneyDraftPreferences';
import { useJourneySearchParams } from '@/hooks/useJourneySearchParams';
import { useQuerySync } from '@/hooks/useQuerySync';
import { useStore } from '@/store/store';
import { useUserStore } from '@/store/slices/userStore';
import { cn } from '@/lib/utils';
import type { TravelerTypeSlug } from '@/lib/data/traveler-types';
import { JOURNEY_ADDONS_ENABLED } from 'config/journey-features';

interface JourneyMainContentLabels {
  clearAll: string;
  completeBudgetAndExcuse: string;
  completeBudgetFirst: string;
  completeOriginFirst: string;
  customTripNoExcuseMessage: string;
  excuseLabel: string;
  excusePlaceholder: string;
  excuseCardCta: string;
  excuseStepDescription: string;
  experienceLabel: string;
  experiencePlaceholder: string;
  experienceStepDescription: string;
  extrasTabDescription: string;
  extrasTabTitle: string;
  next: string;
  refineDetailsLabel: string;
  refineDetailsPlaceholder: string;
  refineDetailsOneSelected: string;
  refineDetailsCountSelected: string;
  refineDetailsStepDescription: string;
  travelTypeLabel: string;
  travelTypePlaceholder: string;
  viewCheckout: string;
  viewSummary?: string;
}

interface JourneyMainContentProps {
  activeTab: string;
  /** Localized addon copy keyed by addon id (journey.addons). */
  addonLabels?: Record<
    string,
    {
      category: string;
      longDescription: string;
      shortDescription: string;
      title: string;
    }
  >;
  className?: string;
  /** Localized excuse titles/descriptions (journey.excuses). */
  localizedExcuses?: Array<{ key: string; title: string; description: string }>;
  /** Localized label/desc for refine-detail options, keyed by travelType then excuse key (journey.refineDetailOptions). */
  localizedRefineOptions?: Record<
    string,
    Record<string, Array<{ key: string; label: string; desc: string }>>
  >;
  /** Localized traveler type labels from dictionary (home.exploration.travelerTypes). */
  localizedTravelerTypes?: Array<{
    description: string;
    key: string;
    title: string;
  }>;
  /** Labels for dropdowns and step copy (journey.mainContent). */
  mainContentLabels: JourneyMainContentLabels;
  /** Labels for details step (journey.detailsStep). */
  detailsStepLabels?: JourneyDetailsStepLabels;
  /** Labels for preferences step (journey.preferencesStep). */
  preferencesStepLabels: JourneyPreferencesStepLabels;
  onOpenSection?: (sectionId: string) => void;
  onTabChange?: (tabId: string) => void;
  openSectionId?: string;
}

export default function JourneyMainContent({
  activeTab,
  addonLabels,
  className,
  detailsStepLabels,
  localizedExcuses,
  localizedRefineOptions,
  localizedTravelerTypes,
  mainContentLabels,
  onOpenSection,
  onTabChange,
  openSectionId,
  preferencesStepLabels,
}: JourneyMainContentProps) {
  const labels = mainContentLabels;
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) ?? 'es';
  const { data: session, status: sessionStatus } = useSession();
  const [isSavingAndRedirecting, setIsSavingAndRedirecting] = useState(false);
  const updateQuery = useQuerySync();
  const { filters, setPartial } = useStore();

  const url = useJourneySearchParams(searchParams);
  const draftDetails = useJourneyDraftDetails(
    activeTab,
    {
      originCountry: url.originCountry,
      originCity: url.originCity,
      startDate: url.startDate,
      nights: url.nights,
      transportOrder: url.transportOrder,
    },
    updateQuery,
  );
  const draftPrefs = useJourneyDraftPreferences(activeTab, {
    departPref: url.departPref,
    arrivePref: url.arrivePref,
    climate: url.climate,
    maxTravelTime: url.maxTravelTime,
    accommodationType: url.accommodationType,
  });
  const { accordionValue, setAccordionValue } = useJourneyAccordion(
    activeTab,
    openSectionId,
    onOpenSection,
  );

  const hasExcuseStep = useMemo(
    () => getHasExcuseStep(url.travelType ?? '', url.experience),
    [url.travelType, url.experience],
  );

  const excuses = useMemo(() => {
    if (!url.travelType) return [];
    return getExcusesByTypeAndLevel(url.travelType, url.experience);
  }, [url.travelType, url.experience]);

  const refineDetailsOptions = useMemo(() => {
    if (!url.excuse) return [];
    const options = getExcuseOptions(url.excuse);
    const byType = localizedRefineOptions?.[url.travelType ?? ''];
    const localized = byType?.[url.excuse];
    if (!localized?.length) return options;
    return options.map((opt) => {
      const over = localized.find((o) => o.key === opt.key);
      return over ? { ...opt, label: over.label, desc: over.desc } : opt;
    });
  }, [url.excuse, url.travelType, localizedRefineOptions]);

  const stepValues = {
    travelType: url.travelType,
    experience: url.experience,
    excuse: url.excuse,
    hasExcuseStep,
    effectiveOriginCountry: draftDetails.effectiveOriginCountry,
    effectiveOriginCity: draftDetails.effectiveOriginCity,
    effectiveStartDate: draftDetails.effectiveStartDate,
    effectiveNights: draftDetails.effectiveNights,
    transport: url.transport,
  };

  const scrollToActions = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById('journey-actions')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    });
  };

  const handleGoToCheckout = useCallback(async () => {
    const tripPayload = buildTripRequestPayloadFromSearchParams(searchParams);
    const { originCountry, originCity } = tripPayload;
    if (!originCountry || !originCity) {
      toast.error('Completá ciudad y país de origen para continuar.');
      return;
    }
    if (sessionStatus === 'loading') {
      toast.info('Cargando sesión…');
      return;
    }
    if (!session?.user?.email) {
      const { openAuth } = useUserStore.getState();
      openAuth('signin');
      toast.info('Iniciá sesión para continuar al checkout.');
      return;
    }
    setIsSavingAndRedirecting(true);
    try {
      const res = await fetch('/api/trip-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripPayload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          const { openAuth } = useUserStore.getState();
          openAuth('signin');
          toast.info('Iniciá sesión para continuar al checkout.');
        } else {
          toast.error(data.error ?? 'No se pudo guardar el viaje. Intentá de nuevo.');
        }
        return;
      }
      router.push(`/${locale}/checkout?tripId=${data.tripRequest.id}`);
    } catch (err) {
      console.error('Error saving trip:', err);
      toast.error('Error de conexión. Intentá de nuevo.');
    } finally {
      setIsSavingAndRedirecting(false);
    }
  }, [locale, router, searchParams, session?.user?.email, sessionStatus]);

  const handleTravelTypeSelect = (slug: string) => {
    updateQuery({ ...PARAMS_TO_RESET_AFTER_TRAVEL_TYPE, travelType: slug });
    setAccordionValue('experience');
  };

  const handleExperienceSelect = (levelId: string) => {
    updateQuery({ ...PARAMS_TO_RESET_AFTER_EXPERIENCE, experience: levelId });
    // NOTE: uses levelId (the just-selected value), not the memoized hasExcuseStep
    // which still reflects the previous experience value at this point.
    const hasExcuseStepForSelection = getHasExcuseStep(url.travelType ?? '', levelId);
    if (onTabChange)
      onTabChange(hasExcuseStepForSelection ? 'excuse' : 'details');
    setAccordionValue(hasExcuseStepForSelection ? 'excuse' : 'origin');
  };

  const handleExcuseSelect = (excuseKey: string) => {
    updateQuery({ excuse: excuseKey, refineDetails: undefined });
    setAccordionValue('refine-details');
  };

  const handleRefineDetailsSelect = (optionKey: string) => {
    const currentDetails = [...url.refineDetails];
    const index = currentDetails.indexOf(optionKey);
    if (index > -1) {
      currentDetails.splice(index, 1);
    } else {
      currentDetails.push(optionKey);
    }
    updateQuery({
      refineDetails:
        currentDetails.length > 0 ? currentDetails.join(',') : undefined,
    });
  };

  const handleOriginCountryChange = (value: string) => {
    if (activeTab === 'details') {
      draftDetails.setDraftOriginCountry(value);
      draftDetails.setDraftOriginCity('');
      draftDetails.setDraftStartDate(undefined);
      draftDetails.setDraftNights(1);
      draftDetails.setDraftTransportOrder(DEFAULT_TRANSPORT_ORDER);
      setPartial({ filters: { ...filters, avoidDestinations: [] } });
      updateQuery({ avoidDestinations: undefined });
    } else {
      updateQuery({
        avoidDestinations: undefined,
        nights: undefined,
        originCity: undefined,
        originCountry: value || undefined,
        startDate: undefined,
        transportOrder: undefined,
      });
      setPartial({ filters: { ...filters, avoidDestinations: [] } });
    }
  };

  const handleOriginCityChange = (value: string) => {
    if (activeTab === 'details') {
      draftDetails.setDraftOriginCity(value);
      draftDetails.setDraftStartDate(undefined);
      draftDetails.setDraftNights(1);
      draftDetails.setDraftTransportOrder(DEFAULT_TRANSPORT_ORDER);
      setPartial({ filters: { ...filters, avoidDestinations: [] } });
      updateQuery({ avoidDestinations: undefined });
    } else {
      updateQuery({
        avoidDestinations: undefined,
        nights: undefined,
        originCity: value || undefined,
        startDate: undefined,
        transportOrder: undefined,
      });
      setPartial({ filters: { ...filters, avoidDestinations: [] } });
    }
  };

  const handleStartDateChange = (value: string | undefined) => {
    if (activeTab === 'details') {
      draftDetails.setDraftStartDate(value);
    } else {
      updateQuery({ startDate: value });
    }
  };

  const handleNightsChange = (value: number) => {
    if (activeTab === 'details') {
      draftDetails.setDraftNights(value);
    } else {
      updateQuery({ nights: String(value) });
    }
  };

  const handleRangeChange = (startDate: string | undefined, nights: number) => {
    if (activeTab === 'details') {
      draftDetails.setDraftStartDate(startDate);
      draftDetails.setDraftNights(nights);
    } else {
      updateQuery({ nights: String(nights), startDate: startDate ?? undefined });
    }
  };

  const handleTransportOrderChange = (orderedIds: string[]) => {
    if (activeTab === 'details') {
      draftDetails.setDraftTransportOrder(orderedIds);
    } else {
      updateQuery({
        transportOrder:
          orderedIds.length === 4 ? orderedIds.join(',') : undefined,
      });
    }
  };

  const handleDepartPrefChange = (value: string) => {
    if (activeTab === 'preferences') draftPrefs.setDraftDepartPref(value);
    else updateQuery({ departPref: value });
  };

  const handleArrivePrefChange = (value: string) => {
    if (activeTab === 'preferences') draftPrefs.setDraftArrivePref(value);
    else updateQuery({ arrivePref: value });
  };

  const handleMaxTravelTimeChange = (value: string) => {
    if (activeTab === 'preferences') draftPrefs.setDraftMaxTravelTime(value);
    else updateQuery({ maxTravelTime: value });
  };

  const handleClimateChange = (value: string) => {
    if (activeTab === 'preferences') draftPrefs.setDraftClimate(value);
    else updateQuery({ climate: value });
  };

  const handleAccommodationTypeChange = (value: string) => {
    if (activeTab === 'preferences') draftPrefs.setDraftAccommodationType(value);
    else updateQuery({ accommodationType: value });
  };

  const handleSaveFilters = () => {
    updateQuery({
      accommodationType: draftPrefs.draftAccommodationType,
      arrivePref: draftPrefs.draftArrivePref,
      climate: draftPrefs.draftClimate,
      departPref: draftPrefs.draftDepartPref,
      maxTravelTime: draftPrefs.draftMaxTravelTime,
    });
    setAccordionValue(JOURNEY_ADDONS_ENABLED ? 'addons' : '');
    scrollToActions();
  };

  const handleClearFilters = () => {
    draftPrefs.setDraftAccommodationType('any');
    draftPrefs.setDraftArrivePref('any');
    draftPrefs.setDraftClimate('any');
    draftPrefs.setDraftDepartPref('any');
    draftPrefs.setDraftMaxTravelTime('no-limit');
    updateQuery({
      accommodationType: 'any',
      arrivePref: 'any',
      avoidDestinations: undefined,
      climate: 'any',
      departPref: 'any',
      maxTravelTime: 'no-limit',
    });
    setPartial({
      filters: {
        ...filters,
        accommodationType: 'any',
        arrivePref: 'any',
        climate: 'any',
        departPref: 'any',
        maxTravelTime: 'no-limit',
      },
    });
  };

  const handleAddonsChange = (value: string | undefined) => {
    updateQuery({ addons: value });
  };

  const handleClearRefineDetails = () => {
    updateQuery({ refineDetails: undefined });
  };

  const handleClearAll = () => {
    updateQuery({
      accommodationType: undefined,
      addons: undefined,
      arrivePref: undefined,
      avoidDestinations: undefined,
      climate: undefined,
      departPref: undefined,
      experience: undefined,
      excuse: undefined,
      maxTravelTime: undefined,
      nights: undefined,
      originCity: undefined,
      originCountry: undefined,
      refineDetails: undefined,
      startDate: undefined,
      transportOrder: undefined,
      travelType: undefined,
    });
    setAccordionValue('');
    if (onTabChange) onTabChange('budget');
  };

  const handleContinue = () => {
    const nextTab = getNextTab(activeTab, hasExcuseStep);
    if (nextTab && onTabChange) {
      onTabChange(nextTab);
      if (nextTab === 'details') setAccordionValue('origin');
      if (nextTab === 'preferences') setAccordionValue('filters');
      scrollToActions();
    }
  };

  const nextTab = getNextTab(activeTab, hasExcuseStep);
  const canContinue = isStepComplete(activeTab, stepValues) && Boolean(nextTab);
  const isAllStepsComplete = checkAllComplete(stepValues);

  const renderContent = () => {
    switch (activeTab) {
      case 'budget':
        return (
          <BudgetStep
            accordionValue={accordionValue}
            experienceContent={getExperienceLabel(
              url.travelType,
              url.experience,
              locale,
              labels.experiencePlaceholder,
            )}
            fullViewportWidth={false}
            handleExperienceSelect={handleExperienceSelect}
            handleTravelTypeSelect={handleTravelTypeSelect}
            labels={{
              experienceLabel: labels.experienceLabel,
              experienceStepDescription: labels.experienceStepDescription,
              travelTypeLabel: labels.travelTypeLabel,
            }}
            locale={locale}
            localizedTravelerTypes={localizedTravelerTypes}
            minimizeAllFeatures
            onAccordionValueChange={setAccordionValue}
            selectedExperienceLevel={url.experience}
            selectedTravelType={url.travelType as TravelerTypeSlug}
            travelerType={url.travelType as TravelerTypeSlug}
            travelTypeContent={getTravelTypeLabel(
              url.travelType,
              localizedTravelerTypes,
              labels.travelTypePlaceholder,
            )}
          />
        );
      case 'excuse':
        if (!hasExcuseStep) return null;
        return (
          <ExcuseStep
            accordionValue={accordionValue}
            onAccordionValueChange={setAccordionValue}
            onTabChange={onTabChange}
            travelType={url.travelType as TravelerTypeSlug | undefined}
            experience={url.experience}
            excuse={url.excuse}
            hasExcuseStep={hasExcuseStep}
            excuses={excuses}
            localizedExcuses={localizedExcuses}
            onSelectExcuse={handleExcuseSelect}
            refineDetailsOptions={refineDetailsOptions}
            refineDetails={url.refineDetails}
            onSelectRefineDetails={handleRefineDetailsSelect}
            onClearRefineDetails={handleClearRefineDetails}
            getExcuseLabel={getExcuseLabel(
              url.excuse,
              excuses,
              labels.excusePlaceholder,
            )}
            getRefineDetailsLabel={getRefineDetailsLabel(
              url.refineDetails,
              refineDetailsOptions,
              labels.refineDetailsOneSelected,
              labels.refineDetailsCountSelected,
              labels.refineDetailsPlaceholder,
            )}
            labels={{
              clearAll: labels.clearAll,
              completeBudgetFirst: labels.completeBudgetFirst,
              customTripNoExcuseMessage: labels.customTripNoExcuseMessage,
              excuseCardCta: labels.excuseCardCta,
              excuseLabel: labels.excuseLabel,
              excuseStepDescription: labels.excuseStepDescription,
              next: labels.next,
              refineDetailsLabel: labels.refineDetailsLabel,
              refineDetailsPlaceholder: labels.refineDetailsPlaceholder,
              refineDetailsStepDescription: labels.refineDetailsStepDescription,
            }}
          />
        );
      case 'details':
        if (!url.travelType || !url.experience || (hasExcuseStep && !url.excuse)) {
          return (
            <div className="py-12 text-center">
              <p className="text-gray-500">{labels.completeBudgetAndExcuse}</p>
            </div>
          );
        }
        return (
          <JourneyDetailsStep
            experience={url.experience}
            labels={detailsStepLabels}
            nights={draftDetails.effectiveNights}
            onNightsChange={handleNightsChange}
            onOpenSection={setAccordionValue}
            onOriginCityChange={handleOriginCityChange}
            onOriginCountryChange={handleOriginCountryChange}
            onRangeChange={handleRangeChange}
            onStartDateChange={handleStartDateChange}
            onTransportOrderChange={handleTransportOrderChange}
            openSectionId={accordionValue || 'origin'}
            originCity={draftDetails.effectiveOriginCity}
            originCountry={draftDetails.effectiveOriginCountry}
            startDate={draftDetails.effectiveStartDate}
            transportOrder={draftDetails.effectiveTransportOrder}
            travelType={url.travelType}
          />
        );
      case 'preferences':
        if (!url.originCountry || !url.originCity || !url.startDate) {
          return (
            <div className="py-12 text-center">
              <p className="text-gray-500">{labels.completeOriginFirst}</p>
            </div>
          );
        }
        return (
          <JourneyPreferencesStep
            accommodationType={draftPrefs.effectiveAccommodationType}
            addons={url.addons}
            addonLabels={addonLabels}
            arrivePref={draftPrefs.effectiveArrivePref}
            climate={draftPrefs.effectiveClimate}
            departPref={draftPrefs.effectiveDepartPref}
            experience={url.experience}
            labels={preferencesStepLabels}
            maxTravelTime={draftPrefs.effectiveMaxTravelTime}
            onAccommodationTypeChange={handleAccommodationTypeChange}
            onAddonsChange={handleAddonsChange}
            onAfterAddonsSave={scrollToActions}
            onArrivePrefChange={handleArrivePrefChange}
            onClearFilters={handleClearFilters}
            onClimateChange={handleClimateChange}
            onDepartPrefChange={handleDepartPrefChange}
            onMaxTravelTimeChange={handleMaxTravelTimeChange}
            onOpenSection={setAccordionValue}
            onSaveFilters={handleSaveFilters}
            openSectionId={accordionValue}
            originCity={url.originCity}
            originCountry={url.originCountry}
            transport={url.transport}
          />
        );
      case 'extras':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {labels.extrasTabTitle}
            </h2>
            <p className="text-gray-600">{labels.extrasTabDescription}</p>
            {/* Placeholder for extras components */}
            Here
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn('flex-1 min-h-0 flex flex-col', className)}>
      <div className="flex-1" id="journey-actions">
        {renderContent()}
      </div>
      <JourneyActionBar
        canContinue={canContinue}
        isAllStepsComplete={isAllStepsComplete}
        isSavingAndRedirecting={isSavingAndRedirecting}
        labels={{
          clearAll: labels.clearAll,
          next: labels.next,
          viewCheckout: labels.viewCheckout,
        }}
        onClearAll={handleClearAll}
        onContinue={handleContinue}
        onGoToCheckout={handleGoToCheckout}
      />
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck — must pass with zero errors**

```bash
npm run typecheck 2>&1 | tail -30
```

Expected: no errors.

- [ ] **Step 3: Run lint**

```bash
npm run lint 2>&1 | tail -20
```

Expected: no new errors (the `eslint-disable` comment in `useJourneyAccordion.ts` silences the exhaustive-deps warning there).

- [ ] **Step 4: Commit**

```bash
git add src/components/journey/JourneyMainContent.tsx
git commit -m "refactor: decompose JourneyMainContent into hooks, helpers, and JourneyActionBar"
```

---

## Self-Review

**Spec coverage:**
- ✅ `useJourneySearchParams` — Task 2
- ✅ `useJourneyDraftDetails` with `prevActiveTabRef` internal + `updateQuery` ref guard — Task 3
- ✅ `useJourneyDraftPreferences` — Task 4
- ✅ `useJourneyAccordion` — Task 5
- ✅ Label getters, reset consts, step logic in `journey.ts` — Task 1
- ✅ `JourneyActionBar` subcomponent — Task 6
- ✅ Main file refactored — Task 7
- ✅ Bug fix: `handleExperienceSelect` uses `levelId` not memoized `hasExcuseStep` — preserved in Task 7
- ✅ `isStepComplete` receives effective values from draft hooks — Task 7 `stepValues` object
- ✅ Dead code removed: `selectedExperienceLevel`, `hasSelections` — Task 7

**Placeholder scan:** No TBDs, no "implement later", all code blocks are complete.

**Type consistency:**
- `JourneyStepValues` defined in Task 1, consumed in Task 7 via `stepValues` object — ✅
- `JourneyDraftDetailsResult` setters used in Task 7 handlers — ✅
- `JourneyDraftPreferencesResult` setters used in `handleClearFilters` and pref handlers — ✅
- `PARAMS_TO_RESET_AFTER_TRAVEL_TYPE` typed as `Record<string, string | undefined>`, spread into `updateQuery` which accepts `Record<string, string | string[] | undefined>` — compatible ✅
