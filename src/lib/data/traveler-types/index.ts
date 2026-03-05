/**
 * Central Registry for all Traveler Types
 *
 * Clean, structured data access without prefixes or string concatenation.
 * Each type exports content per locale (es, en).
 */

import { couple } from './couple';
import { solo } from './solo';
import { family } from './family';
import { group } from './group';
import { honeymoon } from './honeymoon';
import { paws } from './paws';
import type { TravelerTypeData } from '@/types/traveler-type';
import type { Locale } from '@/lib/i18n/config';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';
import { hasLocale } from '@/lib/i18n/config';

export type TravelerTypeSlug = 'couple' | 'solo' | 'family' | 'group' | 'honeymoon' | 'paws';

const BY_LOCALE: Record<TravelerTypeSlug, Record<Locale, TravelerTypeData>> = {
  couple,
  solo,
  family,
  group,
  honeymoon,
  paws,
};

function getBySlug(slugOrAlias: string): Record<Locale, TravelerTypeData> | null {
  const normalized = slugOrAlias.toLowerCase();
  for (const data of Object.values(BY_LOCALE)) {
    const esData = data.es;
    if (
      esData.meta.slug === normalized ||
      esData.meta.aliases.includes(normalized)
    ) {
      return data;
    }
  }
  return null;
}

/**
 * Get traveler type by slug or alias and locale.
 * Falls back to default locale (es) when locale is missing or invalid.
 */
export function getTravelerType(
  slugOrAlias: string,
  locale?: string
): TravelerTypeData | null {
  const byLocale = getBySlug(slugOrAlias);
  if (!byLocale) return null;
  const loc: Locale = locale && hasLocale(locale) ? (locale as Locale) : DEFAULT_LOCALE;
  return byLocale[loc] ?? byLocale[DEFAULT_LOCALE];
}

/** @deprecated Use getTravelerType(slug, locale) for locale-aware content */
export const TRAVELER_TYPES: Record<string, TravelerTypeData> = Object.fromEntries(
  (Object.entries(BY_LOCALE) as [TravelerTypeSlug, Record<Locale, TravelerTypeData>][]).map(
    ([key, data]) => [key, data[DEFAULT_LOCALE]]
  )
);

/**
 * Get all URL paths for static generation (slugs + aliases)
 */
export function getAllTravelerTypePaths(): string[] {
  const paths: string[] = [];
  for (const data of Object.values(BY_LOCALE)) {
    const meta = data.es.meta;
    paths.push(meta.slug);
    paths.push(...meta.aliases);
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
