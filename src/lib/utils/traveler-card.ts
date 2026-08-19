/**
 * Card helpers – single source: lib/data/traveler-types.
 * Pictures and labels for traveler type cards (journey, tripper planner, carousel).
 */

import {
  getTravelerTypeOptions,
  getTravelerType,
  type TravelerTypeSlug,
} from "@/lib/data/traveler-types";
import { getXsedCard } from "@/lib/data/xsed-catalog";
import type { CarouselCard } from "@/types/tripper";

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
  if (slugOrAlias.toLowerCase() === "xsed") return getXsedCard(locale);
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
 * Normalized "does this tripper offer this type" check — single source of
 * truth shared by `filterCarouselCards` (below) and the by-type page's
 * price-override gate (`experiences/by-type/[type]/page.tsx`). Both call
 * sites compare the same kind of data (`Experience.type`, a Prisma
 * `String[]` that can mix casing, against a lowercase traveler-type slug),
 * so both MUST use the identical lowercase+trim comparison — a
 * case-sensitive check on one side and a normalized one on the other lets
 * the carousel and the by-type page disagree about whether a type is
 * "offered" (bug: carousel review finding #1).
 */
export function isTypeOffered(
  allowedTypes: string[] | undefined | null,
  slug: string,
): boolean {
  const normalizedSlug = slug.toLowerCase().trim();
  return (allowedTypes ?? []).some(
    (t) => String(t).toLowerCase().trim() === normalizedSlug,
  );
}

/**
 * Flags every card with `availableFromTripper` — never drops a card from the
 * list (design "traveler-card.ts — flag, do not drop"; spec "Carousel
 * Attribution-Aware Fallback Cards"). Non-tripper context: every card is
 * flagged `true` (identity behaviour preserved — the carousel renders
 * exactly as it always did outside a tripper's context). Tripper context:
 * each card is flagged by whether its key is in `availableTypes`; an empty
 * or missing `availableTypes` flags every card `false` rather than emptying
 * the list, so the carousel can still render a full row of fallback cards.
 */
export function filterCarouselCards(
  cards: TravelerTypeCardData[],
  options: {
    availableTypes?: string[];
    tripperContext: boolean;
  },
): CarouselCard[] {
  const { availableTypes, tripperContext } = options;
  if (!tripperContext) {
    return cards.map((card) => ({ ...card, availableFromTripper: true }));
  }
  return cards.map((card) => ({
    ...card,
    availableFromTripper: isTypeOffered(availableTypes, card.key),
  }));
}

/**
 * Per-card carousel href (design ADR-8):
 * - coming-soon types never link (`undefined`, blocks interaction).
 * - available types keep `?tripper={slug}` when a slug is known, so a
 *   copied/shared link self-heals attribution even if the cookie was
 *   cleared — the proxy re-affirms the same value, not a second source of
 *   truth.
 * - unavailable types (tripper context only — `filterCarouselCards` never
 *   flags a card unavailable outside tripper context) fall back to
 *   `?catalog=randomtrip`, a per-request, reversible opt-out read by the
 *   `by-type` page, never by the proxy — the cookie itself is left
 *   untouched.
 */
export function resolveCarouselCardHref(
  slug: string,
  options: {
    isComingSoon: boolean;
    availableFromTripper: boolean;
    tripperSlug?: string;
  },
): string | undefined {
  const { isComingSoon, availableFromTripper, tripperSlug } = options;
  if (isComingSoon) return undefined;
  const base = `/experiences/by-type/${slug}`;
  if (!availableFromTripper) return `${base}?catalog=randomtrip`;
  return tripperSlug
    ? `${base}?tripper=${encodeURIComponent(tripperSlug)}`
    : base;
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
    query: "",
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
    query: "",
    title: opt.title,
    travelType: opt.key,
  }));
}
