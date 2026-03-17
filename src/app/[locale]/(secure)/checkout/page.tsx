'use client';

import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, Loader2, MapPin } from 'lucide-react';

import LoadingSpinner from '@/components/layout/LoadingSpinner';
import ChatFab from '@/components/chrome/ChatFab';
import AuthModal from '@/components/auth/AuthModal';
import HeaderHero from '@/components/journey/HeaderHero';
import Img from '@/components/common/Img';
import {
  TRANSPORT_ICONS,
  TRANSPORT_OPTIONS,
} from '@/components/journey/TransportSelector';

import { useUserStore } from '@/store/slices/userStore';
import { ADDONS } from '@/lib/data/shared/addons-catalog';
import { FILTER_OPTIONS } from '@/store/slices/journeyStore';
import type { Logistics, Filters } from '@/store/slices/journeyStore';
import pricingCatalog from '@/data/pricing-catalog.json' assert { type: 'json' };
import { TRAVELER_TYPE_LABELS } from '@/lib/data/journey-labels';
import { initialTravellerTypes } from '@/lib/data/travelerTypes';
import { formatUSD } from '@/lib/format';
import { getExcuseOptions, getExcuseTitle } from '@/lib/helpers/excuse-helper';
import { getTravelerType } from '@/lib/data/traveler-types';
import { Button } from '@/components/ui/Button';
import { usePayment } from '@/hooks/usePayment';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { toast } from 'react-toastify';
import { hasLocale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { cn } from '@/lib/utils';
import CheckoutResultFailure from './CheckoutResultFailure';
import CheckoutResultPending from './CheckoutResultPending';
import CheckoutResultSuccess from './CheckoutResultSuccess';

const usd = (n: number) => `USD ${n.toFixed(2)}`;

const DEFAULT_PAX = 2;

type TravelerType =
  | 'couple'
  | 'solo'
  | 'family'
  | 'group'
  | 'honeymoon'
  | 'paws';

function normalizeLevelForCatalog(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const normalized = raw
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace('explora+', 'explora-plus');
  if (normalized === 'exploraplus') return 'explora-plus';
  if (normalized === 'modoexplora' || normalized === 'explora') return 'modo-explora';
  return normalized || undefined;
}

function getFilterLabel(
  group: keyof typeof FILTER_OPTIONS,
  key: string,
  filterOptions?: Record<string, { options: Array<{ key: string; label: string }> }>,
): string {
  const fromDict = filterOptions?.[group]?.options?.find((o) => o.key === key)?.label;
  return fromDict ?? key;
}

function formatDatesSummary(
  startDate: string,
  nights: number,
  template: string,
  monthsShort: string[],
): string {
  const [y, m, d] = startDate.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(start);
  end.setDate(end.getDate() + nights);
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = monthsShort[start.getMonth()] ?? '';
  const endMonth = monthsShort[end.getMonth()] ?? '';
  return template
    .replace('{startDay}', String(startDay))
    .replace('{endDay}', String(endDay))
    .replace('{startMonth}', startMonth)
    .replace('{endMonth}', endMonth);
}

function getBasePriceFromCatalog(
  travelType: string | null,
  experience: string | null,
): number {
  const type = (travelType || 'couple') as TravelerType;
  const level = normalizeLevelForCatalog(experience);
  if (!level) return 0;
  const byTraveller = (pricingCatalog as { byTraveller?: Record<string, Record<string, { base?: number }>> }).byTraveller;
  const tierPrices = byTraveller?.[type];
  const base = tierPrices?.[level]?.base;
  return typeof base === 'number' ? base : 0;
}

function logisticsFromParams(
  searchParams: URLSearchParams,
  storePax?: number,
): Logistics {
  const originCountry = searchParams.get('originCountry') ?? '';
  const originCity = searchParams.get('originCity') ?? '';
  const startDateRaw = searchParams.get('startDate');
  const nightsRaw = searchParams.get('nights');
  const nights = nightsRaw ? Math.max(1, parseInt(nightsRaw, 10) || 1) : 1;
  const pax = storePax ?? DEFAULT_PAX;

  let startDate: Date | undefined;
  let endDate: Date | undefined;
  if (startDateRaw) {
    startDate = new Date(startDateRaw);
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + nights);
  }

  return {
    city: originCity,
    country: originCountry,
    endDate,
    nights,
    pax,
    startDate,
  };
}

function filtersFromParams(searchParams: URLSearchParams): Filters {
  const accommodationType = searchParams.get('accommodationType') ?? 'indistinto';
  const transport = searchParams.get('transport') ?? 'avion';
  const climate = searchParams.get('climate') ?? 'indistinto';
  const maxTravelTime = searchParams.get('maxTravelTime') ?? 'sin-limite';
  const departPref = searchParams.get('departPref') ?? 'indistinto';
  const arrivePref = searchParams.get('arrivePref') ?? 'indistinto';
  const avoidRaw = searchParams.get('avoidDestinations');
  const avoidDestinations = avoidRaw
    ? avoidRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return {
    accommodationType,
    arrivePref,
    avoidDestinations,
    climate,
    departPref,
    maxTravelTime,
    transport,
  };
}

function addonsFromParams(searchParams: URLSearchParams): {
  selected: Array<{ id: string; qty: number }>;
} {
  const raw = searchParams.get('addons');
  if (!raw) return { selected: [] };
  const ids = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return {
    selected: ids.map((id) => ({ id, qty: 1 })),
  };
}

/** Trip from API (GET /api/trips/[id]). */
interface TripFromApi {
  id: string;
  type: string;
  level: string;
  originCountry: string;
  originCity: string;
  startDate: string | null;
  endDate: string | null;
  nights: number;
  pax: number;
  transport: string;
  climate: string;
  maxTravelTime: string;
  departPref: string;
  arrivePref: string;
  accommodationType?: string;
  avoidDestinations: string[];
  addons: Array<{ id: string; qty: number }> | null;
}

function logisticsFromTrip(trip: TripFromApi, paxOverride: number | null): Logistics {
  return {
    city: trip.originCity,
    country: trip.originCountry,
    endDate: trip.endDate ? new Date(trip.endDate) : undefined,
    nights: trip.nights,
    pax: paxOverride ?? trip.pax,
    startDate: trip.startDate ? new Date(trip.startDate) : undefined,
  };
}

function filtersFromTrip(trip: TripFromApi): Filters {
  return {
    accommodationType: trip.accommodationType ?? 'indistinto',
    arrivePref: trip.arrivePref,
    avoidDestinations: trip.avoidDestinations ?? [],
    climate: trip.climate,
    departPref: trip.departPref,
    maxTravelTime: trip.maxTravelTime,
    transport: trip.transport,
  };
}

function isMpSuccessReturn(searchParams: URLSearchParams): boolean {
  return !!(
    searchParams.get('payment_id') ||
    searchParams.get('collection_id') ||
    searchParams.get('external_reference')
  );
}

function CheckoutContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = searchParams.get('tripId');
  const result = searchParams.get('result');
  const hasMpSuccessParams = isMpSuccessReturn(searchParams);
  const locale = (params?.locale as string) ?? 'es';
  const resolvedLocale = hasLocale(locale) ? locale : 'es';

  const { data: session, status } = useSession();
  const { isAuthed, authModalOpen, closeAuth } = useUserStore();

  const [dict, setDict] = useState<Dictionary | null>(null);
  const [paxOverride, setPaxOverride] = useState<number | null>(null);
  const [trip, setTrip] = useState<TripFromApi | null>(null);
  const [tripError, setTripError] = useState<string | null>(null);
  const [tripLoading, setTripLoading] = useState(true);

  useEffect(() => {
    getDictionary(resolvedLocale).then(setDict);
  }, [resolvedLocale]);

  useEffect(() => {
    const inResultMode = result === 'failure' || result === 'pending' || result === 'success' || hasMpSuccessParams;
    if (!tripId && !inResultMode) {
      setTripLoading(false);
      router.replace(`/${locale}/journey`);
      return;
    }
    if (!tripId || inResultMode) {
      setTripLoading(false);
      return;
    }
    let cancelled = false;
    setTripLoading(true);
    setTripError(null);
    fetch(`/api/trips/${tripId}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error || !data.trip) {
          setTripError(data.error ?? 'Viaje no encontrado');
          setTrip(null);
          return;
        }
        setTrip(data.trip as TripFromApi);
      })
      .catch(() => {
        if (!cancelled) setTripError('Error al cargar el viaje');
      })
      .finally(() => {
        if (!cancelled) setTripLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tripId, locale, router]);

  const logistics = useMemo(
    () => (trip ? logisticsFromTrip(trip, paxOverride) : null),
    [trip, paxOverride],
  );
  const filters = useMemo(
    () => (trip ? filtersFromTrip(trip) : null),
    [trip],
  );
  const addons = useMemo(
    () => ({
      selected: Array.isArray(trip?.addons) ? trip!.addons! : [],
    }),
    [trip],
  );
  const basePriceUsd = useMemo(() => {
    if (!trip) return 0;
    return getBasePriceFromCatalog(trip.type, trip.level) || 0;
  }, [trip]);

  const avoidDestinations = filters?.avoidDestinations ?? [];

  const effectiveLogistics = useMemo(
    () =>
      logistics
        ? {
            ...logistics,
            pax: paxOverride ?? logistics.pax ?? 1,
          }
        : null,
    [logistics, paxOverride],
  );

  const { isProcessing, calculateTotals, initiatePayment } = usePayment(
    {
      addons,
      avoidCount: avoidDestinations.length,
      basePriceUsd,
      filters: filters ?? {
        accommodationType: 'indistinto',
        arrivePref: 'indistinto',
        avoidDestinations: [],
        climate: 'indistinto',
        departPref: 'indistinto',
        maxTravelTime: 'sin-limite',
        transport: 'avion',
      },
      logistics: effectiveLogistics ?? {
        city: '',
        country: '',
        nights: 1,
        pax: 1,
      },
    },
    { locale: resolvedLocale },
  );

  useEffect(() => {
    if (status === 'loading') return;
    if (!session && !isAuthed) {
      const { openAuth } = useUserStore.getState();
      openAuth('signin');
    }
  }, [session, isAuthed, status]);

  const pax = effectiveLogistics?.pax || 1;
  const { totalPerPax, totalTrip } = calculateTotals();

  const travelType = trip?.type ?? undefined;
  const experience = trip?.level ?? undefined;
  const excuse: string | undefined = undefined;
  const refineDetails: string[] = [];
  const startDateParamRaw = trip?.startDate ?? undefined;
  const startDateParam =
    typeof startDateParamRaw === 'string' && startDateParamRaw.includes('T')
      ? startDateParamRaw.slice(0, 10)
      : startDateParamRaw ?? undefined;
  const nightsNum = trip?.nights ?? 1;
  const transport = trip?.transport ?? undefined;
  const departPref = trip?.departPref ?? undefined;
  const arrivePref = trip?.arrivePref ?? undefined;
  const maxTravelTime = trip?.maxTravelTime ?? undefined;
  const climate = trip?.climate ?? undefined;

  const travelerTypeData = useMemo(
    () => (travelType ? getTravelerType(travelType, resolvedLocale) : null),
    [travelType, resolvedLocale],
  );
  const selectedLevel = useMemo(() => {
    if (!experience || !travelerTypeData) return null;
    const normalized = normalizeLevelForCatalog(experience);
    return (
      travelerTypeData.planner.levels.find((l) => l.id === experience) ??
      (normalized
        ? travelerTypeData.planner.levels.find((l) => l.id === normalized)
        : null)
    );
  }, [experience, travelerTypeData]);
  const selectedTravelTypeInfo = useMemo(() => {
    if (!travelType) return null;
    const travelerType = initialTravellerTypes.find(
      (t) => t.travelType.toLowerCase() === travelType.toLowerCase(),
    );
    return {
      image: travelerType?.imageUrl,
      label: TRAVELER_TYPE_LABELS[travelType] || travelType,
      price: selectedLevel ? formatUSD(selectedLevel.price) : undefined,
      rating: 7.0,
      reviews: 10,
    };
  }, [travelType, selectedLevel]);
  const selectedExperienceInfo = useMemo(() => {
    if (!selectedLevel) return null;
    const sum = dict?.journey?.summary;
    return {
      label: selectedLevel.name,
      price: sum
        ? `${formatUSD(selectedLevel.price)} ${sum.experiencePerPerson}`
        : `${formatUSD(selectedLevel.price)} por persona`,
    };
  }, [selectedLevel, dict?.journey?.summary]);
  const excuseTitleRes = useMemo(
    () => (excuse ? getExcuseTitle(excuse) : undefined),
    [excuse],
  );
  const refineDetailEntries = useMemo(() => {
    if (!excuse || refineDetails.length === 0) return [];
    const options = getExcuseOptions(excuse);
    return refineDetails.map((key) => ({
      key,
      label: options.find((o) => o.key === key)?.label ?? key,
    }));
  }, [excuse, refineDetails]);
  const transportLabel = useMemo(() => {
    if (!transport) return undefined;
    const sum = dict?.journey?.summary;
    const filterOpts = dict?.journey?.preferencesStep?.filterOptions;
    return (
      TRANSPORT_OPTIONS.find((o) => o.id === transport)?.label ??
      getFilterLabel('transport', transport, filterOpts)
    );
  }, [transport, dict?.journey?.summary, dict?.journey?.preferencesStep?.filterOptions]);
  const TransportIcon = transport
    ? (TRANSPORT_ICONS[transport] ?? TRANSPORT_ICONS.avion)
    : null;

  type FilterKind =
    | 'arrivePref'
    | 'avoid'
    | 'climate'
    | 'departPref'
    | 'maxTravelTime';
  const sumLabels = dict?.journey?.summary;
  const filterOpts = dict?.journey?.preferencesStep?.filterOptions;
  const activeFilters = useMemo(() => {
    const list: { id: string; kind: FilterKind; label: string; value?: string }[] = [];
    if (departPref && departPref !== 'indistinto') {
      list.push({
        id: `depart-${departPref}`,
        kind: 'departPref',
        label: `${sumLabels?.filterLabelDepart ?? 'Salida'}: ${getFilterLabel('departPref', departPref, filterOpts)}`,
      });
    }
    if (arrivePref && arrivePref !== 'indistinto') {
      list.push({
        id: `arrive-${arrivePref}`,
        kind: 'arrivePref',
        label: `${sumLabels?.filterLabelArrive ?? 'Llegada'}: ${getFilterLabel('arrivePref', arrivePref, filterOpts)}`,
      });
    }
    if (maxTravelTime && maxTravelTime !== 'sin-limite') {
      list.push({
        id: `time-${maxTravelTime}`,
        kind: 'maxTravelTime',
        label: `${sumLabels?.filterLabelTime ?? 'Tiempo máx.'}: ${getFilterLabel('maxTravelTime', maxTravelTime, filterOpts)}`,
      });
    }
    if (climate && climate !== 'indistinto') {
      list.push({
        id: `climate-${climate}`,
        kind: 'climate',
        label: `${sumLabels?.filterLabelClimate ?? 'Clima'}: ${getFilterLabel('climate', climate, filterOpts)}`,
      });
    }
    avoidDestinations.forEach((city) => {
      list.push({ id: `avoid-${city}`, kind: 'avoid', label: city, value: city });
    });
    return list;
  }, [
    arrivePref,
    avoidDestinations,
    climate,
    departPref,
    maxTravelTime,
    sumLabels,
    filterOpts,
  ]);

  const selectedAddons = useMemo(
    () =>
      addons.selected
        .map((s) => ADDONS.find((a) => a.id === s.id))
        .filter((a): a is (typeof ADDONS)[number] => Boolean(a)),
    [addons.selected],
  );

  const backToJourneyHref = `/${locale}/journey`;

  const payNow = async () => {
    if (!tripId || !trip) return;
    try {
      if (pax !== trip.pax) {
        const res = await fetch('/api/trip-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: tripId,
            from: 'journey',
            type: trip.type,
            level: trip.level,
            originCountry: trip.originCountry,
            originCity: trip.originCity,
            startDate: trip.startDate,
            endDate: trip.endDate,
            nights: trip.nights,
            pax,
            transport: trip.transport,
            accommodationType: trip.accommodationType ?? 'indistinto',
            climate: trip.climate,
            maxTravelTime: trip.maxTravelTime,
            departPref: trip.departPref,
            arrivePref: trip.arrivePref,
            avoidDestinations: trip.avoidDestinations ?? [],
            addons: addons.selected ?? [],
            status: 'DRAFT',
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error ?? 'No se pudo actualizar el viaje.');
          return;
        }
      }
      await initiatePayment(tripId);
    } catch (err) {
      console.error('Error initiating payment:', err);
      toast.error('Error de conexión. Intentá de nuevo.');
    }
  };

  const inResultMode =
    result === 'failure' ||
    result === 'pending' ||
    result === 'success' ||
    hasMpSuccessParams;

  if (status === 'loading' || tripLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!tripId && !inResultMode) {
    return null;
  }

  if (!inResultMode && (tripError || !trip)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4">
        <p className="text-center text-gray-700">
          {tripError ?? 'Viaje no encontrado'}
        </p>
        <Button asChild variant="secondary">
          <Link href={backToJourneyHref}>Volver al journey</Link>
        </Button>
      </div>
    );
  }

  const journey = dict?.journey;
  const summary = journey?.summary;
  const heroTitle = summary?.title ?? 'Resumen del viaje';
  const heroDescription = 'Revisá tu viaje y confirmá los detalles';

  const sectionTitleClass = 'text-lg font-bold text-gray-900';
  const detailClass = 'text-base font-normal text-gray-900';
  const captionClass = 'text-sm font-normal text-gray-500';

  if (!dict) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (result === 'failure') {
    return (
      <CheckoutResultFailure
        labels={dict.paymentFailure}
        locale={locale}
      />
    );
  }
  if (result === 'pending') {
    return (
      <CheckoutResultPending
        labels={dict.paymentPending}
        locale={locale}
      />
    );
  }
  if (result === 'success' || hasMpSuccessParams) {
    return (
      <CheckoutResultSuccess
        hero={dict.confirmation.hero}
        labels={dict.confirmation.page}
        locale={locale}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderHero
        description={heroDescription}
        fallbackImage="/images/bg-playa-mexico.jpg"
        subtitle=""
        title={heroTitle}
        videoSrc="/videos/hero-video.mp4"
      />

      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex w-full flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">{summary?.title ?? 'Resumen del viaje'}</h2>

          <div className="flex items-stretch justify-between gap-4 border-b border-gray-200 pb-4">
            <p className={cn('flex-shrink-0', sectionTitleClass)}>
              {summary?.travelTypeSection}
            </p>
            {selectedTravelTypeInfo ? (
              <div className="flex min-w-0 flex-1 justify-end gap-3">
                {selectedTravelTypeInfo.image && (
                  <div className="w-20 flex-shrink-0 overflow-hidden rounded-lg">
                    <Img
                      alt={selectedTravelTypeInfo.label}
                      className="h-full w-full object-cover"
                      height={48}
                      src={selectedTravelTypeInfo.image}
                      width={80}
                    />
                  </div>
                )}
                <div className="min-w-0 text-right">
                  <p className={detailClass}>{selectedTravelTypeInfo.label}</p>
                  {selectedTravelTypeInfo.rating != null && (
                    <p className={cn('mt-1', captionClass)}>
                      {summary?.favoriteAmongTravelers}
                      {selectedTravelTypeInfo.rating.toFixed(1)}
                      {selectedTravelTypeInfo.reviews != null &&
                        ` (${selectedTravelTypeInfo.reviews})`}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className={cn('text-right', detailClass)}>—</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <p className={cn('flex-shrink-0', sectionTitleClass)}>
              {summary?.experienceSection}
            </p>
            <div className="min-w-0 text-right">
              {selectedExperienceInfo ? (
                <>
                  <p className={detailClass}>{selectedExperienceInfo.label}</p>
                  {selectedExperienceInfo.price && (
                    <p className={captionClass}>{selectedExperienceInfo.price}</p>
                  )}
                </>
              ) : (
                <p className={detailClass}>—</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <p className={cn('flex-shrink-0', sectionTitleClass)}>
              {summary?.excuseSection}
            </p>
            <p className={cn('min-w-0 text-right', detailClass)}>
              {excuseTitleRes ?? '—'}
            </p>
          </div>

          <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
            <p className={cn('flex-shrink-0', sectionTitleClass)}>
              {summary?.detailsSection}
            </p>
            <div className="flex min-w-0 flex-wrap justify-end gap-2">
              {refineDetailEntries.length > 0 ? (
                refineDetailEntries.map(({ key, label }) => (
                  <div
                    className="inline-flex w-fit items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-sm font-normal text-gray-900"
                    key={key}
                  >
                    <span>{label}</span>
                  </div>
                ))
              ) : (
                <p className={detailClass}>{summary?.noDetails ?? 'Sin detalles adicionales.'}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <p className={cn('flex-shrink-0', sectionTitleClass)}>
              {summary?.originSection}
            </p>
            <div className="flex min-w-0 items-center justify-end gap-2">
              {logistics?.city && logistics?.country ? (
                <>
                  <MapPin className="h-4 w-4 flex-shrink-0 text-gray-900" />
                  <p className={detailClass}>
                    {logistics.city}, {logistics.country}.
                  </p>
                </>
              ) : (
                <p className={detailClass}>—</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <p className={cn('flex-shrink-0', sectionTitleClass)}>
              {summary?.datesSection}
            </p>
            <div className="flex min-w-0 items-center justify-end gap-2">
              {startDateParam && nightsNum > 0 ? (
                <>
                  <Calendar className="h-4 w-4 flex-shrink-0 text-gray-900" />
                  <p className={detailClass}>
                    {summary?.dateRangeTemplate && summary?.monthsShort
                      ? formatDatesSummary(
                          startDateParam,
                          nightsNum,
                          summary.dateRangeTemplate,
                          summary.monthsShort,
                        )
                      : `${startDateParam} — ${nightsNum} noches`}
                  </p>
                </>
              ) : (
                <p className={detailClass}>—</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <p className={cn('flex-shrink-0', sectionTitleClass)}>
              {summary?.transportSection}
            </p>
            <div className="flex min-w-0 items-center justify-end gap-2">
              {transportLabel && TransportIcon ? (
                <>
                  <TransportIcon className="h-4 w-4 flex-shrink-0 text-gray-900" />
                  <p className={detailClass}>
                    {transportLabel}
                    <span className="font-normal text-gray-500">
                      {summary?.transportOptionalNote}
                    </span>
                  </p>
                </>
              ) : (
                <p className={detailClass}>—</p>
              )}
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
            <p className={cn('flex-shrink-0', sectionTitleClass)}>
              {activeFilters.length > 0
                ? summary?.filtersSectionCount?.replace(
                    '{count}',
                    String(activeFilters.length),
                  ) ?? `Filtros (${activeFilters.length})`
                : summary?.filtersSection}
            </p>
            <div className="flex min-w-0 flex-wrap justify-end gap-2">
              {activeFilters.length > 0 ? (
                activeFilters.map(({ id, label }) => (
                  <div
                    className="inline-flex w-fit items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-sm font-normal text-gray-900"
                    key={id}
                  >
                    <span>{label}</span>
                  </div>
                ))
              ) : (
                <p className={detailClass}>{summary?.noFilters ?? 'Sin filtros adicionales.'}</p>
              )}
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
            <p className={cn('flex-shrink-0', sectionTitleClass)}>
              {selectedAddons.length > 0
                ? summary?.addonsSectionCount?.replace(
                    '{count}',
                    String(selectedAddons.length),
                  ) ?? `Extras (${selectedAddons.length})`
                : summary?.addonsSection}
            </p>
            <div className="flex min-w-0 flex-wrap justify-end gap-2">
              {selectedAddons.length > 0 ? (
                selectedAddons.map((addon) => (
                  <div
                    className="inline-flex w-fit items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-sm font-normal text-gray-900"
                    key={addon.id}
                  >
                    <span>
                      {journey?.addons?.[addon.id]?.title ?? addon.title}
                      {addon.priceType === 'currency'
                        ? ` — USD ${addon.price}`
                        : ` — ${addon.price}%`}
                    </span>
                  </div>
                ))
              ) : (
                <p className={detailClass}>{summary?.noAddons ?? 'No agregaste add-ons.'}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <p className={cn('flex-shrink-0', sectionTitleClass)}>Cantidad de viajeros</p>
            <div className="flex min-w-0 items-center justify-end gap-3">
              <label className="sr-only" htmlFor="summary-pax">
                Número de viajeros
              </label>
              <select
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                id="summary-pax"
                onChange={(e) =>
                  setPaxOverride(Math.max(1, Math.min(20, Number(e.target.value) || 1)))
                }
                value={pax}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'viajero' : 'viajeros'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xl font-bold text-gray-900">
                {summary?.totalUsd ?? 'Total'} <span className="underline">USD</span>
              </p>
              <p className={captionClass}>{summary?.perPerson ?? 'Por persona'}</p>
            </div>
            <p className="text-right text-xl font-bold text-gray-900">
              {usd(totalPerPax)} USD
            </p>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 pt-2">
            <p className={captionClass}>Total del viaje (×{pax} personas)</p>
            <p className="text-right text-lg font-bold text-gray-900">
              {usd(totalTrip)} USD
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="w-full sm:w-auto" variant="secondary">
              <Link href={backToJourneyHref}>← Volver a editar</Link>
            </Button>
            <Button
              className="w-full sm:w-auto"
              disabled={isProcessing}
              onClick={
                !session && !isAuthed
                  ? () => {
                      const { openAuth } = useUserStore.getState();
                      openAuth('signin');
                    }
                  : payNow
              }
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Procesando pago...
                </div>
              ) : !session && !isAuthed ? (
                'Inicia sesión para continuar'
              ) : (
                'Continuar a pago'
              )}
            </Button>
          </div>
        </div>

        <ChatFab />
      </div>

      <AuthModal
        defaultMode="login"
        isOpen={authModalOpen}
        onClose={closeAuth}
      />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CheckoutContent />
    </Suspense>
  );
}
