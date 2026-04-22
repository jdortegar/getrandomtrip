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

/** Level ids used for pricing (align with planner level ids: explora = Modo Explora, atelier = Atelier Getaway). */
export type PriceLevelId =
  | 'essenza'
  | 'explora'
  | 'explora-plus'
  | 'bivouac'
  | 'atelier';

/**
 * Single source of truth for base price per person (USD) by traveler type and level.
 * Plan: BOND/KIN/CREW 350,550,850,1200,1200 | SOLUM 450,650,1100,1550,1550 | PAWS 490,700,1190,1680,1680 | NUPTIA only atelier 1800.
 */
export const PRICE_BY_TYPE_AND_LEVEL: Record<
  TravelerTypeSlug,
  Record<PriceLevelId, number>
> = {
  couple: { essenza: 350, explora: 550, 'explora-plus': 850, bivouac: 1200, atelier: 1200 },
  family: { essenza: 350, explora: 550, 'explora-plus': 850, bivouac: 1200, atelier: 1200 },
  group: { essenza: 350, explora: 550, 'explora-plus': 850, bivouac: 1200, atelier: 1200 },
  solo: { essenza: 450, explora: 650, 'explora-plus': 1100, bivouac: 1550, atelier: 1550 },
  paws: { essenza: 490, explora: 700, 'explora-plus': 1190, bivouac: 1680, atelier: 1680 },
  honeymoon: { essenza: 0, explora: 0, 'explora-plus': 0, bivouac: 0, atelier: 1800 },
};

/** Normalize level id from URL/planner (modo-explora -> explora, atelier-getaway -> atelier). */
export function normalizePriceLevelId(levelId: string | null | undefined): PriceLevelId | null {
  if (!levelId) return null;
  const n = levelId.toLowerCase().replace(/\s+/g, '-').replace('explora+', 'explora-plus');
  if (n === 'exploraplus') return 'explora-plus';
  if (n === 'modoexplora' || n === 'modo-explora' || n === 'explora') return 'explora';
  if (n === 'atelier-getaway' || n === 'atelier') return 'atelier';
  if (n === 'essenza' || n === 'explora-plus' || n === 'bivouac') return n as PriceLevelId;
  return null;
}

/**
 * Base price per person (USD) for the given type and level. Returns 0 if type/level not in catalog.
 */
export function getBasePricePerPerson(
  type: TravelerTypeSlug | string,
  levelId: string | null | undefined,
): number {
  const slug = type as TravelerTypeSlug;
  if (!TRAVELER_TYPE_SLUGS.includes(slug)) return 0;
  const level = normalizePriceLevelId(levelId);
  if (!level) return 0;
  return PRICE_BY_TYPE_AND_LEVEL[slug][level] ?? 0;
}

/** PAWS +20% single (pax 1) or triple (pax 3+). Other types and pax 2 use base. */
const PAWS_PAX_MULTIPLIER = 1.2;

/**
 * Price per person (USD) for checkout/totals. Applies PAWS +20% for single/triple when pax !== 2.
 */
export function getPricePerPerson(
  type: TravelerTypeSlug | string,
  levelId: string | null | undefined,
  pax?: number,
): number {
  const base = getBasePricePerPerson(type, levelId);
  if (base === 0) return 0;
  if (type !== 'paws') return base;
  const p = pax ?? 2;
  if (p === 2) return base;
  return Math.round(base * PAWS_PAX_MULTIPLIER);
}

/** All traveler type slugs in display order (used for options list and maps). */
export const TRAVELER_TYPE_SLUGS: TravelerTypeSlug[] = [
  'solo',
  'couple',
  'group',
  'family',
  'honeymoon',
  'paws',
];

/** Card display data (subtitle, img) per slug for journey/tripper type selection. */
const CARD_BY_SLUG: Record<
  TravelerTypeSlug,
  { img: string; subtitle: string }
> = {
  couple: {
    img: '/images/journey-types/couple-traveler.png',
    subtitle: 'Creen recuerdos juntos',
  },
  family: {
    img: '/images/journey-types/family-traveler.jpg',
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
