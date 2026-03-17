/**
 * Utilities for reading specific data from traveler-types.
 * Single entry point for type data, meta, labels, options, and sections (hero, planner, blog, etc.).
 */

import {
  getTravelerType,
  getTravelerTypeOptions,
  getTypeLabel,
  TRAVELER_TYPE_SLUGS,
  type TravelerTypeOption,
  type TravelerTypeSlug,
} from '@/lib/data/traveler-types';
import type { TravelerTypeData } from '@/types/traveler-type';

export type { TravelerTypeOption, TravelerTypeSlug };

/** All valid slugs in display order. */
export const TRAVELER_TYPE_SLUGS_LIST = TRAVELER_TYPE_SLUGS;

/**
 * Full traveler type data by slug or alias and locale.
 */
export function getTravelerTypeData(
  slugOrAlias: string,
  locale?: string,
): TravelerTypeData | null {
  return getTravelerType(slugOrAlias, locale);
}

/**
 * Meta only (slug, label, aliases, pageTitle).
 */
export function getTravelerTypeMeta(
  slugOrAlias: string,
  locale?: string,
): TravelerTypeData['meta'] | null {
  const data = getTravelerType(slugOrAlias, locale);
  return data?.meta ?? null;
}

/**
 * Display label for the type (locale-aware).
 */
export function getTravelerTypeLabel(
  slugOrAlias: string,
  locale?: string,
): string {
  return getTypeLabel(slugOrAlias, locale);
}

/**
 * Options for type selection (step 1 / tripper planner).
 */
export function getTravelerTypeOptionsList(
  locale?: string,
): TravelerTypeOption[] {
  return getTravelerTypeOptions(locale);
}

/**
 * Card display data (img, subtitle, title) for a slug or alias.
 */
export function getTravelerTypeCard(
  slugOrAlias: string,
  locale?: string,
): { img: string; subtitle: string; title: string } | null {
  const slug = getTravelerType(slugOrAlias)?.meta.slug;
  if (!slug) return null;
  const options = getTravelerTypeOptions(locale);
  const opt = options.find((o) => o.key === slug);
  if (!opt) return null;
  return {
    img: opt.img,
    subtitle: opt.subtitle,
    title: opt.title,
  };
}

/**
 * Planner content (levels, title, subtitle) for the type.
 */
export function getTravelerTypePlanner(
  slugOrAlias: string,
  locale?: string,
): TravelerTypeData['planner'] | null {
  const data = getTravelerType(slugOrAlias, locale);
  return data?.planner ?? null;
}

/**
 * Hero content for the type page.
 */
export function getTravelerTypeHero(
  slugOrAlias: string,
  locale?: string,
): TravelerTypeData['content']['hero'] | null {
  const data = getTravelerType(slugOrAlias, locale);
  return data?.content?.hero ?? null;
}

/**
 * Story (paragraph) content for the type page.
 */
export function getTravelerTypeStory(
  slugOrAlias: string,
  locale?: string,
): TravelerTypeData['content']['story'] | null {
  const data = getTravelerType(slugOrAlias, locale);
  return data?.content?.story ?? null;
}

/**
 * Blog section (title, subtitle, posts, viewAll).
 */
export function getTravelerTypeBlog(
  slugOrAlias: string,
  locale?: string,
): TravelerTypeData['blog'] | null {
  const data = getTravelerType(slugOrAlias, locale);
  return data?.blog ?? null;
}

/**
 * Testimonials section.
 */
export function getTravelerTypeTestimonials(
  slugOrAlias: string,
  locale?: string,
): TravelerTypeData['testimonials'] | null {
  const data = getTravelerType(slugOrAlias, locale);
  return data?.testimonials ?? null;
}

/**
 * Type guard: true if the string is a valid traveler type slug.
 */
export function isTravelerTypeSlug(value: string): value is TravelerTypeSlug {
  return TRAVELER_TYPE_SLUGS.includes(value as TravelerTypeSlug);
}

/**
 * Normalize alias to canonical slug, or null if unknown.
 */
export function toTravelerTypeSlug(slugOrAlias: string): TravelerTypeSlug | null {
  const data = getTravelerType(slugOrAlias);
  return data ? (data.meta.slug as TravelerTypeSlug) : null;
}
