import type { Filters } from '@/store/slices/journeyStore';
import {
  getPrimaryTransportIdFromOrderParam,
  normalizeJourneyFilterValue,
  normalizeMaxTravelTimeKey,
} from '@/lib/helpers/transport';

/** Payload shape for POST /api/trip-requests when creating from journey URL params. */
export interface TripRequestPayloadFromJourney {
  addons: Array<{ id: string; qty: number }>;
  arrivePref: string;
  avoidDestinations: string[];
  accommodationType: string;
  climate: string;
  departPref: string;
  endDate: string | null;
  from: 'journey';
  level: string;
  maxTravelTime: string;
  nights: number;
  originCity: string;
  originCountry: string;
  pax: number;
  startDate: string | null;
  status: 'DRAFT';
  transport: string;
  type: string;
}

/**
 * Normalize experience/level from URL or form (e.g. "Explora+", "modoexplora") to slug.
 * Defaults to 'explora-plus' when raw is empty.
 */
export function normalizeExperienceLevel(
  raw: string | null | undefined,
): string {
  if (!raw) return 'explora-plus';
  const n = raw
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace('explora+', 'explora-plus');
  if (n === 'exploraplus') return 'explora-plus';
  if (n === 'modoexplora' || n === 'explora') return 'modo-explora';
  return n || 'explora-plus';
}

/**
 * Build trip request payload from journey URL search params.
 * Used by handleGoToCheckout and any other flow that POSTs to /api/trip-requests from journey state.
 */
export function buildTripRequestPayloadFromSearchParams(
  searchParams: URLSearchParams,
  options?: { from?: 'journey' },
): TripRequestPayloadFromJourney {
  const experience = searchParams.get('experience');
  const level = normalizeExperienceLevel(experience);
  const travelType = searchParams.get('travelType') || 'couple';
  const originCountry = searchParams.get('originCountry')?.trim() ?? '';
  const originCity = searchParams.get('originCity')?.trim() ?? '';
  const startDateRaw = searchParams.get('startDate');
  const nightsNum = Math.max(
    1,
    parseInt(searchParams.get('nights') ?? '1', 10) || 1,
  );
  let startDate: string | null = null;
  let endDate: string | null = null;
  if (startDateRaw) {
    const start = new Date(startDateRaw);
    startDate = start.toISOString();
    const end = new Date(start);
    end.setDate(end.getDate() + nightsNum);
    endDate = end.toISOString();
  }
  const pax = Math.max(
    1,
    Math.min(20, parseInt(searchParams.get('pax') ?? '2', 10) || 2),
  );
  const avoidRaw = searchParams.get('avoidDestinations');
  const avoidDestinations = avoidRaw
    ? avoidRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const addonsRaw = searchParams.get('addons');
  const addonsSelected = addonsRaw
    ? addonsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((id) => ({ id, qty: 1 }))
    : [];

  return {
    from: options?.from ?? 'journey',
    type: travelType,
    level,
    originCountry,
    originCity,
    startDate,
    endDate,
    nights: nightsNum,
    pax,
    transport: getPrimaryTransportIdFromOrderParam(
      searchParams.get('transportOrder'),
    ),
    accommodationType:
      normalizeJourneyFilterValue(searchParams.get('accommodationType')) ??
      'any',
    climate:
      normalizeJourneyFilterValue(searchParams.get('climate')) ?? 'any',
    maxTravelTime:
      normalizeMaxTravelTimeKey(searchParams.get('maxTravelTime')) ?? 'no-limit',
    departPref:
      normalizeJourneyFilterValue(searchParams.get('departPref')) ?? 'any',
    arrivePref:
      normalizeJourneyFilterValue(searchParams.get('arrivePref')) ?? 'any',
    avoidDestinations,
    addons: addonsSelected,
    status: 'DRAFT',
  };
}

/**
 * Count the number of optional filters selected
 * Excludes transport (which is mandatory) and only counts non-default values.
 * avoidCount is from URL (avoidDestinations query param) and is not in store.
 */
export function countOptionalFilters(f: Filters, avoidCount = 0): number {
  let n = 0;
  if (f.accommodationType !== 'any') n++;
  if (f.climate !== 'any') n++;
  if (f.maxTravelTime !== 'no-limit') n++;
  if (f.departPref !== 'any') n++;
  if (f.arrivePref !== 'any') n++;
  n += avoidCount;
  return n;
}
