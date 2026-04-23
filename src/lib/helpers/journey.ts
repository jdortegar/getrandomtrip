import { paxDetailsFromTotalPax } from '@/lib/helpers/pax-details';
import type { PaxDetails } from '@/lib/types/PaxDetails';
import type { Filters } from '@/store/slices/journeyStore';
import {
  getPrimaryTransportIdFromOrderParam,
  normalizeJourneyFilterValue,
  normalizeMaxTravelTimeKey,
} from '@/lib/helpers/transport';
import { getLevelById } from '@/lib/utils/experiencesData';

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
  /** When set (from `tripRequestId` query on /journey), POST updates that draft instead of creating another. */
  id?: string;
  level: string;
  maxTravelTime: string;
  nights: number;
  originCity: string;
  originCountry: string;
  pax: number;
  paxDetails: PaxDetails;
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
  const travelTypeRaw = searchParams.get('travelType') || 'couple';
  const travelType = travelTypeRaw.trim().toLowerCase();
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

  const paxDetails = paxDetailsFromTotalPax(pax);

  const tripRequestIdRaw = searchParams.get('tripRequestId')?.trim();
  const id = tripRequestIdRaw && tripRequestIdRaw.length > 0 ? tripRequestIdRaw : undefined;

  return {
    from: options?.from ?? 'journey',
    ...(id != null ? { id } : {}),
    type: travelType,
    level,
    originCountry,
    originCity,
    startDate,
    endDate,
    nights: nightsNum,
    pax,
    paxDetails,
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

// ---------------------------------------------------------------------------
// Label helpers (pure — no React dependencies)
// ---------------------------------------------------------------------------

export function getTravelTypeLabel(
  travelType: string | undefined,
  localizedTravelerTypes: Array<{ key: string; title: string }> | undefined,
  placeholder: string,
): string {
  if (!travelType) return placeholder;
  const localized = localizedTravelerTypes?.find((t) => t.key === travelType);
  return localized?.title || travelType;
}

export function getExperienceLabel(
  travelType: string | undefined,
  experience: string | undefined,
  locale: string,
  placeholder: string,
): string {
  if (!experience || !travelType) return placeholder;
  const level = getLevelById(travelType, experience, locale);
  return level?.name ?? experience;
}

export function getExcuseLabel(
  excuse: string | undefined,
  excuses: Array<{ key: string; title: string }>,
  placeholder: string,
): string {
  if (!excuse) return placeholder;
  const found = excuses.find((e) => e.key === excuse);
  return found?.title || excuse;
}

export function getRefineDetailsLabel(
  refineDetails: string[],
  options: Array<{ key: string; label: string }>,
  oneSelectedStr: string,
  countSelectedStr: string,
  placeholder: string,
): string {
  if (refineDetails.length === 0) return placeholder;
  if (refineDetails.length === 1) {
    const option = options.find((o) => o.key === refineDetails[0]);
    return option?.label || oneSelectedStr;
  }
  return countSelectedStr.replace('{count}', String(refineDetails.length));
}

// ---------------------------------------------------------------------------
// Reset-param constants
// ---------------------------------------------------------------------------

export const PARAMS_TO_RESET_AFTER_TRAVEL_TYPE: Record<string, string | undefined> = {
  accommodationType: undefined,
  addons: undefined,
  arrivePref: undefined,
  avoidDestinations: undefined,
  climate: undefined,
  departPref: undefined,
  excuse: undefined,
  experience: undefined,
  maxTravelTime: undefined,
  nights: undefined,
  originCity: undefined,
  originCountry: undefined,
  refineDetails: undefined,
  startDate: undefined,
  transportOrder: undefined,
  tripRequestId: undefined,
};

export const PARAMS_TO_RESET_AFTER_EXPERIENCE: Record<string, string | undefined> = {
  accommodationType: undefined,
  addons: undefined,
  arrivePref: undefined,
  avoidDestinations: undefined,
  climate: undefined,
  departPref: undefined,
  excuse: undefined,
  maxTravelTime: undefined,
  nights: undefined,
  originCity: undefined,
  originCountry: undefined,
  refineDetails: undefined,
  startDate: undefined,
  transportOrder: undefined,
  tripRequestId: undefined,
};

// ---------------------------------------------------------------------------
// Step-logic helpers (pure — no React dependencies)
// ---------------------------------------------------------------------------

export interface JourneyStepValues {
  travelType: string | undefined;
  experience: string | undefined;
  excuse: string | undefined;
  refineDetails: string[];
  hasExcuseStep: boolean;
  effectiveOriginCountry: string;
  effectiveOriginCity: string;
  effectiveStartDate: string | undefined;
  effectiveNights: number;
  transport: string | undefined;
}

export function getNextTab(
  activeTab: string,
  hasExcuseStep: boolean,
): string | null {
  const tabs = hasExcuseStep
    ? ['budget', 'excuse', 'details', 'preferences']
    : ['budget', 'details', 'preferences'];
  const currentIndex = tabs.indexOf(activeTab);
  return currentIndex < tabs.length - 1 ? tabs[currentIndex + 1] : null;
}

export function isStepComplete(
  activeTab: string,
  v: JourneyStepValues,
): boolean {
  switch (activeTab) {
    case 'budget':
      return Boolean(v.travelType && v.experience);
    case 'excuse':
      return Boolean(
        v.travelType &&
          v.experience &&
          (v.excuse || !v.hasExcuseStep) &&
          (!v.hasExcuseStep || v.refineDetails.length > 0),
      );
    case 'details':
      return Boolean(
        v.effectiveOriginCountry &&
          v.effectiveOriginCity &&
          v.effectiveStartDate &&
          v.effectiveNights,
      );
    case 'preferences':
      return Boolean(v.transport);
    default:
      return true;
  }
}

export function checkAllComplete(v: JourneyStepValues): boolean {
  return Boolean(
    v.travelType &&
      v.experience &&
      (v.excuse || !v.hasExcuseStep) &&
      (!v.hasExcuseStep || v.refineDetails.length > 0) &&
      v.effectiveOriginCountry &&
      v.effectiveOriginCity &&
      v.effectiveStartDate &&
      v.effectiveNights &&
      v.transport,
  );
}
