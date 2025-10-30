'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useStore } from '@/store/store';
import pricingCatalog from '@/data/pricing-catalog.json' assert { type: 'json' };

type TierType =
  | 'essenza'
  | 'modo-explora'
  | 'explora-plus'
  | 'bivouac'
  | 'atelier';
type TravelerType =
  | 'couple'
  | 'solo'
  | 'family'
  | 'group'
  | 'honeymoon'
  | 'paws';

interface ParsedParams {
  from: string;
  type: TravelerType;
  level?: TierType;
  tripperId?: string;
  priceKey?: string;
  originCity?: string;
  originCountry?: string;
}

// Normalize tier string
function normalizeTier(raw?: string): TierType | undefined {
  if (!raw) return undefined;
  return raw
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace('explora+', 'explora-plus') as TierType;
}

// Get pax count based on traveler type
function getPaxCount(type: TravelerType): number {
  const paxMap: Record<TravelerType, number> = {
    couple: 2,
    solo: 1,
    family: 1,
    group: 1,
    honeymoon: 2,
    paws: 1,
  };
  return paxMap[type] || 1;
}

// Extract price from pricing catalog
function extractPrice(catalog: any, path: string[]): number | undefined {
  const value = path.reduce((acc, key) => acc?.[key], catalog);
  return typeof value === 'number' ? value : undefined;
}

// Build journey state update payload
function buildStateUpdate(
  params: ParsedParams,
  price: number,
  logistics: any,
  clearFormData: boolean = false,
): any {
  const { type, level, from, tripperId, originCity, originCountry } = params;
  
  // Read package destinations from sessionStorage (hidden from URL)
  let packageDestinations: Array<{ city: string; country: string }> = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('tripperPackageDestinations');
      if (stored) {
        packageDestinations = JSON.parse(stored);
        // Clear after reading to avoid stale data on next navigation
        sessionStorage.removeItem('tripperPackageDestinations');
      }
    } catch (e) {
      console.error('Error parsing tripperPackageDestinations from sessionStorage:', e);
    }
  }
  
  // Check if origin came from URL params (should be locked)
  const hasOriginFromURL = Boolean(originCity && originCountry);
  
  return {
    from: from || '',
    type,
    level: level || 'modo-explora',
    displayPrice: price > 0 ? `USD ${price.toFixed(0)}` : '',
    basePriceUsd: price,
    tripperId,
    logistics: {
      ...logistics,
      city: originCity || logistics.city || '',
      country: originCountry || logistics.country || '',
      pax: getPaxCount(type),
    },
    // Store package destinations for filtering avoidDestinations (hidden from user)
    ...(packageDestinations.length > 0 && {
      _tripperPackageDestinations: packageDestinations,
    }),
    // Mark origin as locked when coming from URL params
    ...(hasOriginFromURL && {
      _originLocked: true,
    }),
    // Clear form data when coming from TypePlanner
    ...(clearFormData && {
      filters: {
        transport: 'avion',
        climate: 'indistinto',
        maxTravelTime: 'sin-limite',
        departPref: 'indistinto',
        arrivePref: 'indistinto',
        avoidDestinations: [],
      },
      addons: { selected: [] },
      filtersCostUsd: 0,
      addonsCostUsd: 0,
      totalPerPaxUsd: 0,
    }),
  };
}

export function useInitJourney(searchParams: Record<string, string>) {
  const setPartial = useStore((s) => s.setPartial);
  const resetJourney = useStore((s) => s.resetJourney);
  const logistics = useStore((s) => s.logistics);
  const initialized = useRef(false);
  const lastParams = useRef<string>('');
  const isUpdating = useRef(false);

  const params = useMemo<ParsedParams>(() => {
    const sp = new URLSearchParams(searchParams as any);

    const from = sp.get('from') || '';
    const type = (sp.get('type') || from || 'couple') as TravelerType;
    const levelRaw = sp.get('level') || sp.get('tier') || undefined;
    const level = normalizeTier(levelRaw);
    const tripperId = sp.get('tripperId') || undefined;
    const priceKey = sp.get('priceKey') || undefined;
    const originCity = sp.get('originCity') || undefined;
    const originCountry = sp.get('originCountry') || undefined;

    return { from, type, level, tripperId, priceKey, originCity, originCountry };
  }, [searchParams]);

  // Create a string representation of current params for comparison
  const currentParamsString = useMemo(() => {
    return JSON.stringify({
      from: params.from,
      type: params.type,
      level: params.level,
      tripperId: params.tripperId,
    });
  }, [params]);

  useEffect(() => {
    // Prevent infinite loops
    if (isUpdating.current) return;

    // Check if params have changed significantly
    const hasParamsChanged = lastParams.current !== currentParamsString;

    // If params changed or this is a fresh load, reset and initialize
    if (hasParamsChanged || !initialized.current) {
      isUpdating.current = true;

      // Clear existing state when params change
      if (initialized.current && hasParamsChanged) {
        resetJourney();
      }

      lastParams.current = currentParamsString;
      initialized.current = true;

      const { type, level, tripperId, priceKey } = params;

      // Check if coming from TypePlanner (has type and level params)
      const isFromTypePlanner = Boolean(
        searchParams.type && searchParams.level,
      );

      // Priority 1: Explicit priceKey
      if (priceKey) {
        const [root, ...rest] = priceKey.split('.');
        const catalog =
          root === 'trippers' && tripperId
            ? (pricingCatalog.trippers as any)?.[tripperId]
            : (pricingCatalog as any)?.[root];

        const price = extractPrice(catalog, rest);
        if (price) {
          setPartial(
            buildStateUpdate(params, price, logistics, isFromTypePlanner),
          );
          isUpdating.current = false;
          return;
        }
      }

      // Priority 2: Tripper-specific pricing
      if (tripperId && level) {
        const price = extractPrice(
          (pricingCatalog.trippers as any)?.[tripperId],
          [level, 'base'],
        );
        if (price) {
          setPartial(
            buildStateUpdate(params, price, logistics, isFromTypePlanner),
          );
          isUpdating.current = false;
          return;
        }
      }

      // Priority 3: Standard traveler type pricing
      if (level) {
        const price = extractPrice(pricingCatalog.byTraveller, [
          type,
          level,
          'base',
        ]);
        if (price) {
          setPartial(
            buildStateUpdate(params, price, logistics, isFromTypePlanner),
          );
          isUpdating.current = false;
          return;
        }
      }

      // Fallback: No price found
      setPartial(buildStateUpdate(params, 0, logistics, isFromTypePlanner));
      isUpdating.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentParamsString]);
}
