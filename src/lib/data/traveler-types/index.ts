/**
 * Central Registry for all Traveler Types
 *
 * Clean, structured data access without prefixes or string concatenation
 */

import { couple } from './couple';
import { solo } from './solo';
import { family } from './family';
import { group } from './group';
import { honeymoon } from './honeymoon';
import { paws } from './paws';
import type { TravelerTypeData } from '@/types/traveler-type';

export const TRAVELER_TYPES: Record<string, TravelerTypeData> = {
  couple,
  solo,
  family,
  group,
  honeymoon,
  paws,
};

export type TravelerTypeSlug = keyof typeof TRAVELER_TYPES;

/**
 * Get traveler type by slug or alias
 */
export function getTravelerType(slugOrAlias: string): TravelerTypeData | null {
  const normalized = slugOrAlias.toLowerCase();

  // Check direct slug match
  if (TRAVELER_TYPES[normalized]) {
    return TRAVELER_TYPES[normalized];
  }

  // Check aliases
  for (const typeData of Object.values(TRAVELER_TYPES)) {
    if (
      typeData.meta.slug === normalized ||
      typeData.meta.aliases.includes(normalized)
    ) {
      return typeData;
    }
  }

  return null;
}

/**
 * Get all URL paths for static generation (slugs + aliases)
 */
export function getAllTravelerTypePaths(): string[] {
  const paths: string[] = [];

  for (const typeData of Object.values(TRAVELER_TYPES)) {
    paths.push(typeData.meta.slug);
    paths.push(...typeData.meta.aliases);
  }

  return paths;
}

// Re-export for convenience
export * from './couple';
export * from './solo';
export * from './family';
export * from './group';
export * from './honeymoon';
export * from './paws';
