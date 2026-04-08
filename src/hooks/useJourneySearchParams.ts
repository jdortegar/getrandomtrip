'use client';

import { useMemo } from 'react';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import { DEFAULT_TRANSPORT_ORDER } from '@/components/journey/TransportSelector';
import {
  isCompleteTransportOrderParam,
  normalizeMaxTravelTimeKey,
  normalizeTransportId,
  normalizeJourneyFilterValue,
} from '@/lib/helpers/transport';

export interface JourneySearchParamsValues {
  travelType: string | undefined;
  experience: string | undefined;
  excuse: string | undefined;
  refineDetails: string[];
  originCountry: string;
  originCity: string;
  startDate: string | undefined;
  nights: number;
  transportOrder: string[];
  /** Primary transport id. Defined only when transportOrder is a complete 4-item param. */
  transport: string | undefined;
  departPref: string | undefined;
  arrivePref: string | undefined;
  maxTravelTime: string | undefined;
  climate: string | undefined;
  accommodationType: string | undefined;
  addons: string | undefined;
}

export function useJourneySearchParams(
  searchParams: ReadonlyURLSearchParams,
): JourneySearchParamsValues {
  const travelType = useMemo(
    () => searchParams.get('travelType') || undefined,
    [searchParams],
  );
  const experience = useMemo(
    () => searchParams.get('experience') || undefined,
    [searchParams],
  );
  const excuse = useMemo(
    () => searchParams.get('excuse') || undefined,
    [searchParams],
  );
  const refineDetails = useMemo(() => {
    const raw = searchParams.get('refineDetails');
    if (!raw) return [] as string[];
    return raw.split(',').filter(Boolean);
  }, [searchParams]);
  const originCountry = useMemo(
    () => searchParams.get('originCountry') || '',
    [searchParams],
  );
  const originCity = useMemo(
    () => searchParams.get('originCity') || '',
    [searchParams],
  );
  const startDate = useMemo(
    () => searchParams.get('startDate') || undefined,
    [searchParams],
  );
  const nights = useMemo(() => {
    const raw = searchParams.get('nights');
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }, [searchParams]);
  const transportOrder = useMemo(() => {
    const raw = searchParams.get('transportOrder');
    if (!raw) return DEFAULT_TRANSPORT_ORDER;
    const ids = raw
      .split(',')
      .map((s) => s.trim())
      .map((id) => normalizeTransportId(id))
      .filter((id): id is string => Boolean(id));
    return ids.length === 4 ? ids : DEFAULT_TRANSPORT_ORDER;
  }, [searchParams]);
  // transport is derived sequentially — must come after transportOrder
  const transport = isCompleteTransportOrderParam(
    searchParams.get('transportOrder'),
  )
    ? normalizeTransportId(transportOrder[0])
    : undefined;
  const departPref = useMemo(
    () => normalizeJourneyFilterValue(searchParams.get('departPref')) || undefined,
    [searchParams],
  );
  const arrivePref = useMemo(
    () => normalizeJourneyFilterValue(searchParams.get('arrivePref')) || undefined,
    [searchParams],
  );
  const maxTravelTime = useMemo(
    () => normalizeMaxTravelTimeKey(searchParams.get('maxTravelTime')) || undefined,
    [searchParams],
  );
  const climate = useMemo(
    () => normalizeJourneyFilterValue(searchParams.get('climate')) || undefined,
    [searchParams],
  );
  const accommodationType = useMemo(
    () => normalizeJourneyFilterValue(searchParams.get('accommodationType')) || undefined,
    [searchParams],
  );
  const addons = useMemo(
    () => searchParams.get('addons') || undefined,
    [searchParams],
  );

  return {
    travelType,
    experience,
    excuse,
    refineDetails,
    originCountry,
    originCity,
    startDate,
    nights,
    transportOrder,
    transport,
    departPref,
    arrivePref,
    maxTravelTime,
    climate,
    accommodationType,
    addons,
  };
}
