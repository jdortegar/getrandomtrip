import type { Filters } from '@/store/slices/journeyStore';

/**
 * Count the number of optional filters selected
 * Excludes transport (which is mandatory) and only counts non-default values
 */
export function countOptionalFilters(f: Filters): number {
  let n = 0;
  if (f.climate !== 'indistinto') n++;
  if (f.maxTravelTime !== 'sin-limite') n++;
  if (f.departPref !== 'indistinto') n++;
  if (f.arrivePref !== 'indistinto') n++;
  n += f.avoidDestinations?.length ?? 0; // cada destino suma 1
  return n;
}
