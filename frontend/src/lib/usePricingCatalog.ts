// frontend/src/lib/usePricingCatalog.ts
'use client';

import catalogJson from '@/data/pricing-catalog.json' assert { type: 'json' };

export type PricingCatalog = {
  version?: string;
  currency: string;
  byTraveller: Record<string, Record<string, { base: number }>>;
  trippers?: Record<string, Record<string, { base: number }>>;
};

/** Hook muy simple: devuelve el catálogo ya cargado (sin fetch). */
export function usePricingCatalog(): PricingCatalog | null {
  return catalogJson as PricingCatalog;
}
