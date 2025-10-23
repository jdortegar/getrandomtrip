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
): any {
  const { type, level, from } = params;
  return {
    from: from || '',
    type,
    level: level || 'modo-explora',
    displayPrice: price > 0 ? `USD ${price.toFixed(0)}` : '',
    basePriceUsd: price,
    logistics: {
      ...logistics,
      pax: getPaxCount(type),
    },
  };
}

export function useInitJourney(searchParams: Record<string, string>) {
  const setPartial = useStore((s) => s.setPartial);
  const logistics = useStore((s) => s.logistics);
  const initialized = useRef(false);

  const params = useMemo<ParsedParams>(() => {
    const sp = new URLSearchParams(searchParams as any);

    const from = sp.get('from') || '';
    const type = (sp.get('type') || from || 'couple') as TravelerType;
    const levelRaw = sp.get('level') || sp.get('tier') || undefined;
    const level = normalizeTier(levelRaw);
    const tripperId = sp.get('tripperId') || undefined;
    const priceKey = sp.get('priceKey') || undefined;

    return { from, type, level, tripperId, priceKey };
  }, [searchParams]);

  useEffect(() => {
    // Only initialize once
    if (initialized.current) return;
    initialized.current = true;

    const { type, level, tripperId, priceKey } = params;

    // Priority 1: Explicit priceKey
    if (priceKey) {
      const [root, ...rest] = priceKey.split('.');
      const catalog =
        root === 'trippers' && tripperId
          ? (pricingCatalog.trippers as any)?.[tripperId]
          : (pricingCatalog as any)?.[root];

      const price = extractPrice(catalog, rest);
      if (price) {
        setPartial(buildStateUpdate(params, price, logistics));
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
        setPartial(buildStateUpdate(params, price, logistics));
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
        setPartial(buildStateUpdate(params, price, logistics));
        return;
      }
    }

    // Fallback: No price found
    setPartial(buildStateUpdate(params, 0, logistics));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
