// Blog filter options for TravelType and Excuse. Trippers come from DB via /api/trippers.
// Aligns with journey/tripper domain: Package has type + excuseKey; User is tripper.
// Travel type labels from lib/data/traveler-types.

import { getTravelerTypeOptions } from "@/lib/data/traveler-types";
import { allExcuses, type ExcuseData } from "@/lib/data/shared/excuses";

// -----------------------------------------------------------------------------
// Travel type (Tipo de viaje) – keys and labels from traveler-types
// -----------------------------------------------------------------------------

export interface TravelTypeOption {
  key: string;
  label: string;
}

export function getBlogTravelTypeOptions(locale?: string): TravelTypeOption[] {
  return getTravelerTypeOptions(locale).map((opt) => ({
    key: opt.key,
    label: opt.title,
  }));
}

// -----------------------------------------------------------------------------
// Excuse – key + label for filter pill/dropdown (from shared excuses)
// -----------------------------------------------------------------------------

export interface ExcuseFilterOption {
  key: string;
  label: string;
}

/**
 * `allExcuses` titles (src/lib/data/shared/excuses.ts) are Spanish-only —
 * that dataset also drives the deep journey/excuse-configurator content
 * (descriptions, per-option copy), which is a much larger translation
 * effort than this filter needs. This map covers only the short title
 * shown as a filter label/option, for `en`.
 */
const EXCUSE_TITLE_EN: Record<string, string> = {
  "solo-get-lost": "Get Lost",
  "solo-busqueda-interior": "Inner Search",
  "solo-aventura-desafio": "Adventure & Challenge",
  "solo-exploracion-cultural": "Cultural Exploration",
  "solo-fotografia-narrativa-visual": "Photography & Visual Storytelling",
  "solo-literatura-arte-talleres": "Literature, Art & Local Workshops",
  "solo-musica-sonidos": "Music & Sounds",
  "solo-tribe-encounters": "Tribe Encounters",
  "escapada-romantica": "Romantic Getaway",
  "duo-aventura": "Adventure Duo",
  "foodie-lovers": "Foodie Lovers",
  "cultura-tradicion": "Culture & Tradition",
  "wellness-retreat": "Wellness Retreat",
  celebraciones: "Celebrations",
  "playa-dunas": "Beach & Dunes",
  "escapada-urbana": "Urban Getaway",
  "family-adventure": "Family Adventure",
  "group-aventura-familia": "Family Adventure",
  "group-naturaleza-fauna": "Nature & Wildlife",
  "group-cultura-tradiciones": "Culture & Traditions",
  "group-playas-dunas": "Beaches & Dunes",
  "group-graduaciones-celebraciones": "Graduations & Celebrations",
  "group-escapada-padres-hijos": "Parent-Child Getaways",
  "honeymoon-luxury": "Luxury Honeymoon",
  "paws-adventure": "Pet-Friendly Adventure",
};

function excuseToFilterOption(e: ExcuseData, locale?: string): ExcuseFilterOption {
  const label =
    locale === "en" ? (EXCUSE_TITLE_EN[e.key] ?? e.title) : e.title;
  return { key: e.key, label };
}

export function getBlogExcuseOptions(locale?: string): ExcuseFilterOption[] {
  return allExcuses.map((e) => excuseToFilterOption(e, locale));
}

// -----------------------------------------------------------------------------
// Tripper – shape for "By Tripper" filter (id, name, slug, avatarUrl).
// Data is loaded from GET /api/trippers (getAllTrippers); map tripperSlug → slug.
// -----------------------------------------------------------------------------

export interface TripperFilterOption {
  avatarUrl: string | null;
  id: string;
  name: string;
  slug: string;
}
