// frontend/src/lib/usePricingCatalog.ts
'use client';

import { getPricingCatalog } from '@/lib/helpers/pricing';

export type PricingCatalog = {
  currency: string;
  byTraveller: Record<string, Record<string, { base: number }>>;
  trippers?: Record<string, Record<string, { base: number }>>;
};

/** Returns catalog derived from single source of truth (traveler-types). Use getBasePricePerPerson when possible. */
export function usePricingCatalog(): PricingCatalog {
  return {
    currency: 'USD',
    byTraveller: getPricingCatalog(),
  };
}
