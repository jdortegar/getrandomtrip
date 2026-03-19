/**
 * Journey filter option keys – single source for preference filter keys
 * (transport, climate, accommodationType, etc.).
 *
 * Labels and display values come from the dictionary:
 * journey.preferencesStep.filterOptions[filterKey].options (key + label per locale).
 * Use these keys to look up localized labels in the dictionary; do not duplicate
 * labels here.
 *
 * Filter cost (from product docs):
 * - Price per filter: $25 USD. "Power Pack" (3 filters): $60 USD.
 * - First "destino a evitar" included for all levels; second included for Explora+ and Bivouac;
 *   each additional avoid counts as one filter.
 * - Transport: free for Modo Explora, Explora+, Bivouac.
 * - Max travel time: free for Bivouac.
 * - Depart/arrive preference: free for Explora+ and Bivouac.
 */

/** Option key only; labels come from dictionary (journey.preferencesStep.filterOptions). */
export interface FilterOptionKey {
  key: string;
}

/** Option with label; use when you have dictionary labels (journey.preferencesStep.filterOptions). */
export interface FilterOption {
  key: string;
  label: string;
}

export const FILTER_OPTION_KEYS = {
  accommodationType: {
    options: [
      { key: 'any' },
      { key: 'hotel-style' },
      { key: 'home-style' },
      { key: 'nature-escape' },
      { key: 'hybrid-hub' },
      { key: 'glamping' },
    ],
  },
  arrivePref: {
    options: [
      { key: 'any' },
      { key: 'afternoon' },
      { key: 'morning' },
      { key: 'night' },
    ],
  },
  climate: {
    options: [
      { key: 'any' },
      { key: 'cold' },
      { key: 'mild' },
      { key: 'warm' },
    ],
  },
  departPref: {
    options: [
      { key: 'any' },
      { key: 'afternoon' },
      { key: 'morning' },
      { key: 'night' },
    ],
  },
  maxTravelTime: {
    options: [
      { key: 'no-limit' },
      { key: '3h' },
      { key: '5h' },
      { key: '8h' },
    ],
  },
  transport: {
    options: [
      { key: 'bus' },
      { key: 'plane' },
      { key: 'ship' },
      { key: 'train' },
    ],
  },
} as const;

export type JourneyFilterKey = keyof typeof FILTER_OPTION_KEYS;

/**
 * Filter option keys only. Labels come from dictionary (journey.preferencesStep.filterOptions).
 * In UI, resolve labels from dict or use key as fallback.
 */
export const FILTER_OPTIONS: Record<
  JourneyFilterKey,
  { options: FilterOptionKey[] }
> = {
  accommodationType: {
    options: [...FILTER_OPTION_KEYS.accommodationType.options],
  },
  arrivePref: {
    options: [...FILTER_OPTION_KEYS.arrivePref.options],
  },
  climate: {
    options: [...FILTER_OPTION_KEYS.climate.options],
  },
  departPref: {
    options: [...FILTER_OPTION_KEYS.departPref.options],
  },
  maxTravelTime: {
    options: [...FILTER_OPTION_KEYS.maxTravelTime.options],
  },
  transport: {
    options: [...FILTER_OPTION_KEYS.transport.options],
  },
};
