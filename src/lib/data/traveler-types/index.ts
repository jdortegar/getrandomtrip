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

/** All traveler type slugs in display order (used for options list and maps). */
export const TRAVELER_TYPE_SLUGS: TravelerTypeSlug[] = [
  'solo',
  'couple',
  'family',
  'group',
  'honeymoon',
  'paws',
];

/** Card display data (subtitle, img) per slug for journey/tripper type selection. */
const CARD_BY_SLUG: Record<
  TravelerTypeSlug,
  { img: string; subtitle: string }
> = {
  couple: {
    img: '/images/journey-types/couple-hetero.png',
    subtitle: 'Creen recuerdos juntos',
  },
  family: {
    img: '/images/journey-types/family-vacation.jpg',
    subtitle: 'Aventuras para todos',
  },
  group: {
    img: '/images/journey-types/friends-group.jpg',
    subtitle: 'Experiencias compartidas',
  },
  honeymoon: {
    img: '/images/journey-types/honeymoon-same-sex.jpg',
    subtitle: 'El comienzo perfecto',
  },
  paws: {
    img: '/images/journey-types/paws-card.jpg',
    subtitle: 'Con tu mascota de viaje',
  },
  solo: {
    img: '/images/journey-types/solo-traveler.png',
    subtitle: 'Descubre el mundo a tu ritmo',
  },
};

export interface TravelerTypeOption {
  img: string;
  key: string;
  subtitle: string;
  title: string;
}

/**
 * Options for traveler type selection (step 1 / tripper planner).
 * Uses labels from each type's meta for the given locale.
 */
export function getTravelerTypeOptions(locale?: string): TravelerTypeOption[] {
  return TRAVELER_TYPE_SLUGS.map((slug) => {
    const data = getTravelerType(slug, locale);
    const card = CARD_BY_SLUG[slug];
    return {
      key: slug,
      title: data?.meta.label ?? slug,
      subtitle: card.subtitle,
      img: card.img,
    };
  });
}

/**
 * Label for a traveler type key (slug or alias). Uses type's meta.label for the given locale.
 */
export function getTypeLabel(type: string, locale?: string): string {
  const data = getTravelerType(type, locale);
  return data?.meta.label ?? type;
}

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
