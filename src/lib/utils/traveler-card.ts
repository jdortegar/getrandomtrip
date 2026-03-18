/**
 * Card helpers – single source: lib/data/traveler-types.
 * Pictures and labels for traveler type cards (journey, tripper planner, carousel).
 */

import {
  getTravelerTypeOptions,
  getTravelerType,
  type TravelerTypeSlug,
} from '@/lib/data/traveler-types';

export type { TravelerTypeSlug };

export interface TravelerTypeCardData {
  img: string;
  key: string;
  subtitle: string;
  title: string;
}

/**
 * All card options for type selection (locale-aware labels).
 */
export function getCardOptions(locale?: string): TravelerTypeCardData[] {
  return getTravelerTypeOptions(locale);
}

/**
 * Card data (img, subtitle, title) for one traveler type by slug or alias.
 */
export function getCardForType(
  slugOrAlias: string,
  locale?: string,
): TravelerTypeCardData | null {
  const data = getTravelerType(slugOrAlias, locale);
  if (!data) return null;
  const options = getTravelerTypeOptions(locale);
  const opt = options.find((o) => o.key === data.meta.slug);
  if (!opt) return null;
  return {
    img: opt.img,
    key: opt.key,
    subtitle: opt.subtitle,
    title: opt.title,
  };
}

/** Localized labels for merging with card data (e.g. from dictionary). */
export interface LocalizedTravelerTypeLabel {
  description: string;
  key: string;
  title: string;
}

/**
 * Base cards for locale, optionally merged with localized labels or overridden.
 */
export function getCarouselCardOptions(
  locale: string,
  options?: {
    localizedTravelerTypes?: LocalizedTravelerTypeLabel[];
    travelerTypes?: TravelerTypeCardData[];
  },
): TravelerTypeCardData[] {
  const cards = getCardOptions(locale);
  if (options?.travelerTypes?.length) return options.travelerTypes;
  if (options?.localizedTravelerTypes?.length) {
    const byKey = Object.fromEntries(
      options.localizedTravelerTypes.map((t) => [t.key.toLowerCase(), t]),
    );
    return cards.map((card) => {
      const loc = byKey[card.key.toLowerCase()];
      return loc
        ? { ...card, subtitle: loc.description, title: loc.title }
        : card;
    });
  }
  return cards;
}

/**
 * Filter cards for display: in tripper context only show availableTypes; otherwise show all (or filter by availableTypes if set).
 */
export function filterCarouselCards(
  cards: TravelerTypeCardData[],
  options: {
    availableTypes?: string[];
    tripperContext: boolean;
  },
): TravelerTypeCardData[] {
  const { availableTypes, tripperContext } = options;
  if (!availableTypes?.length) return cards;
  const allowed = new Set(
    availableTypes.map((t) => String(t).toLowerCase().trim()),
  );
  if (tripperContext && allowed.size === 0) return [];
  return cards.filter((t) => allowed.has(t.key.toLowerCase()));
}

/** Shape TravelerTypeCard expects for its item prop. */
export interface TravelerTypeCardItemShape {
  description: string;
  enabled: boolean;
  imageUrl: string;
  query: string;
  title: string;
  travelType: string;
}

export function cardDataToCardItem(
  t: TravelerTypeCardData,
): TravelerTypeCardItemShape {
  return {
    description: t.subtitle,
    enabled: true,
    imageUrl: t.img,
    query: '',
    title: t.title,
    travelType: t.key,
  };
}

/** Legacy shape for components that expect TravelerType (travelType, title, description, imageUrl). */
export interface TravelerTypeLegacy {
  description: string;
  enabled: boolean;
  imageUrl: string;
  query: string;
  title: string;
  travelType: string;
}

/**
 * All traveler types in legacy shape (for checkout, etc.).
 * Single source: lib/data/traveler-types.
 */
export function getTravelerTypesLegacy(locale?: string): TravelerTypeLegacy[] {
  return getTravelerTypeOptions(locale).map((opt) => ({
    description: opt.subtitle,
    enabled: true,
    imageUrl: opt.img,
    query: '',
    title: opt.title,
    travelType: opt.key,
  }));
}
