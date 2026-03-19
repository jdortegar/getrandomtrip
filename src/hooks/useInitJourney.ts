'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useStore } from '@/store/store';
import { getBasePricePerPerson } from '@/lib/data/traveler-types';

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

// Get price from single source of truth (traveler-types)
function getPriceFromCatalog(type: TravelerType, level: TierType | undefined): number {
  if (!level) return 0;
  return getBasePricePerPerson(type, level);
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
        transport: 'plane',
        climate: 'any',
        maxTravelTime: 'no-limit',
        departPref: 'any',
        arrivePref: 'any',
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

      // Priority 1: Explicit priceKey (e.g. "byTraveller.couple.explora-plus" -> type couple, level explora-plus)
      if (priceKey) {
        const parts = priceKey.split('.');
        if (parts[0] === 'byTraveller' && parts[1] && parts[2]) {
          const price = getBasePricePerPerson(parts[1], parts[2]);
          if (price > 0) {
            setPartial(
              buildStateUpdate(
                { ...params, type: parts[1] as TravelerType, level: parts[2] as TierType },
                price,
                logistics,
                isFromTypePlanner,
              ),
            );
            isUpdating.current = false;
            return;
          }
        }
      }

      // Priority 2: Tripper-specific: fallback to standard type/level (single source of truth has no tripper-specific prices yet)
      if (tripperId && level) {
        const price = getPriceFromCatalog(type, level);
        if (price > 0) {
          setPartial(
            buildStateUpdate(params, price, logistics, isFromTypePlanner),
          );
          isUpdating.current = false;
          return;
        }
      }

      // Priority 3: Standard traveler type + level
      if (level) {
        const price = getPriceFromCatalog(type, level);
        if (price > 0) {
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
