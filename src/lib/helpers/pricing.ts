/**
 * Pricing helper – single source of truth: lib/data/traveler-types (PRICE_BY_TYPE_AND_LEVEL).
 * Use these functions for any base or per-person price in checkout, journey init, and display.
 */

import {
  getBasePricePerPerson,
  getPricePerPerson,
  type TravelerTypeSlug,
  type PriceLevelId,
} from '@/lib/data/traveler-types';

export type { TravelerTypeSlug, PriceLevelId };

export { getBasePricePerPerson, getPricePerPerson };

/** Catalog-shaped object for code that still expects byTraveller[type][level].base. Keys: essenza, modo-explora, explora-plus, bivouac, atelier. */
const CATALOG_LEVEL_KEYS = [
  'essenza',
  'modo-explora',
  'explora-plus',
  'bivouac',
  'atelier',
] as const;

function buildVirtualCatalog(): Record<
  string,
  Record<string, { base: number }>
> {
  const types: TravelerTypeSlug[] = [
    'solo',
    'couple',
    'family',
    'group',
    'honeymoon',
    'paws',
  ];
  const byTraveller: Record<string, Record<string, { base: number }>> = {};
  for (const type of types) {
    byTraveller[type] = {};
    for (const catalogKey of CATALOG_LEVEL_KEYS) {
      byTraveller[type][catalogKey] = {
        base: getBasePricePerPerson(type, catalogKey),
      };
    }
  }
  return byTraveller;
}

let cachedCatalog: Record<string, Record<string, { base: number }>> | null =
  null;

/** Virtual pricing catalog derived from traveler-types. Use getBasePricePerPerson / getPricePerPerson when possible. */
export function getPricingCatalog(): Record<
  string,
  Record<string, { base: number }>
> {
  if (!cachedCatalog) cachedCatalog = buildVirtualCatalog();
  return cachedCatalog;
}
