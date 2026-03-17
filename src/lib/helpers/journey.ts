import type { Filters } from '@/store/slices/journeyStore';

/**
 * Count the number of optional filters selected
 * Excludes transport (which is mandatory) and only counts non-default values.
 * avoidCount is from URL (avoidDestinations query param) and is not in store.
 */
export function countOptionalFilters(f: Filters, avoidCount = 0): number {
  let n = 0;
  if (f.accommodationType !== 'indistinto') n++;
  if (f.climate !== 'indistinto') n++;
  if (f.maxTravelTime !== 'sin-limite') n++;
  if (f.departPref !== 'indistinto') n++;
  if (f.arrivePref !== 'indistinto') n++;
  n += avoidCount;
  return n;
}
