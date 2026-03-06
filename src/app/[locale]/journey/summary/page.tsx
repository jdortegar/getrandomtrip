'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, Loader2, MapPin, Sparkle } from 'lucide-react';

import LoadingSpinner from '@/components/layout/LoadingSpinner';
import ChatFab from '@/components/chrome/ChatFab';
import AuthModal from '@/components/auth/AuthModal';
import HeaderHero from '@/components/journey/HeaderHero';
import Img from '@/components/common/Img';
import {
  TRANSPORT_ICONS,
  TRANSPORT_OPTIONS,
} from '@/components/journey/TransportSelector';

import { useStore } from '@/store/store';
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
import { hasLocale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { cn } from '@/lib/utils';

const usd = (n: number) => `USD ${n.toFixed(2)}`;

const DEFAULT_PAX = 2;

type TravelerType =
  | 'couple'
  | 'solo'
  | 'family'
  | 'group'
  | 'honeymoon'
  | 'paws';

/** Normalize experience from URL to catalog/planner key (e.g. explora-plus, modo-explora). */
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
  if (fromDict) return fromDict;
  const opt = FILTER_OPTIONS[group]?.options?.find((o) => o.key === key);
  return opt?.label ?? key;
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

/** Get base price per person from pricing catalog by travelType and experience (level). */
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

/** Build logistics from URL params (and optional store fallback for pax). */
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

/** Build filters from URL params. */
function filtersFromParams(searchParams: URLSearchParams): Filters {
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
    arrivePref,
    avoidDestinations,
    climate,
    departPref,
    maxTravelTime,
    transport,
  };
}

/** Build addons.selected from URL param (comma-separated ids). */
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

function SummaryPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) ?? 'es';
  const resolvedLocale = hasLocale(locale) ? locale : 'es';

  const { data: session, status } = useSession();
  const { isAuthed, authModalOpen, closeAuth } = useUserStore();
  const storeLogistics = useStore((s) => s.logistics);
  const storeBasePriceUsd = useStore((s) => s.basePriceUsd);

  const [dict, setDict] = useState<Dictionary | null>(null);
  const [paxOverride, setPaxOverride] = useState<number | null>(null);

  useEffect(() => {
    getDictionary(resolvedLocale).then(setDict);
  }, [resolvedLocale]);

  const logistics = useMemo(
    () => logisticsFromParams(searchParams, storeLogistics?.pax),
    [searchParams, storeLogistics?.pax],
  );
  const filters = useMemo(
    () => filtersFromParams(searchParams),
    [searchParams],
  );
  const addons = useMemo(
    () => addonsFromParams(searchParams),
    [searchParams],
  );
  const basePriceUsd = useMemo(() => {
    const pbp = searchParams.get('pbp');
    if (pbp) {
      const n = Number(pbp);
      if (Number.isFinite(n)) return n;
    }
    const fromCatalog = getBasePriceFromCatalog(
      searchParams.get('travelType'),
      searchParams.get('experience'),
    );
    if (fromCatalog > 0) return fromCatalog;
    return storeBasePriceUsd || 0;
  }, [searchParams, storeBasePriceUsd]);

  const avoidDestinations = filters.avoidDestinations;

  const effectiveLogistics = useMemo(
    () => ({
      ...logistics,
      pax: paxOverride ?? logistics.pax ?? 1,
    }),
    [logistics, paxOverride],
  );

  const { isProcessing, calculateTotals, initiatePayment } = usePayment({
    addons,
    avoidCount: avoidDestinations.length,
    basePriceUsd,
    filters,
    logistics: effectiveLogistics,
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session && !isAuthed) {
      const { openAuth } = useUserStore.getState();
      openAuth('signin');
    }
  }, [session, isAuthed, status]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const pax = effectiveLogistics.pax || 1;
  const {
    basePerPax,
    filtersPerPax,
    addonsPerPax,
    cancelInsurancePerPax,
    totalPerPax,
    totalTrip,
  } = calculateTotals();

  const travelType = searchParams.get('travelType') || undefined;
  const experience = searchParams.get('experience') || undefined;
  const excuse = searchParams.get('excuse') || undefined;
  const refineDetailsRaw = searchParams.get('refineDetails');
  const refineDetails = useMemo(
    () => (refineDetailsRaw ? refineDetailsRaw.split(',').filter(Boolean) : []),
    [refineDetailsRaw],
  );
  const startDateParam = searchParams.get('startDate') || undefined;
  const nightsParam = searchParams.get('nights');
  const nightsNum = useMemo(() => {
    const n = nightsParam ? Number(nightsParam) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [nightsParam]);
  const transport = searchParams.get('transport') || undefined;
  const departPref = searchParams.get('departPref') || undefined;
  const arrivePref = searchParams.get('arrivePref') || undefined;
  const maxTravelTime = searchParams.get('maxTravelTime') || undefined;
  const climate = searchParams.get('climate') || undefined;

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

  const journeyQueryString = searchParams.toString();
  const backToJourneyHref = `/${locale}/journey${journeyQueryString ? `?${journeyQueryString}` : ''}`;

  const payNow = async () => {
    await initiatePayment(undefined);
  };

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

          {/* Tipo de viaje */}
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
                  <p className={detailClass}>
                    {selectedTravelTypeInfo.label}
                  </p>
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

          {/* Experiencia */}
          <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <p className={cn('flex-shrink-0', sectionTitleClass)}>
              {summary?.experienceSection}
            </p>
            <div className="min-w-0 text-right">
              {selectedExperienceInfo ? (
                <>
                  <p className={detailClass}>{selectedExperienceInfo.label}</p>
                  {selectedExperienceInfo.price && (
                    <p className={captionClass}>
                      {selectedExperienceInfo.price}
                    </p>
                  )}
                </>
              ) : (
                <p className={detailClass}>—</p>
              )}
            </div>
          </div>

          {/* Excusa */}
          <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <p className={cn('flex-shrink-0', sectionTitleClass)}>
              {summary?.excuseSection}
            </p>
            <p className={cn('min-w-0 text-right', detailClass)}>
              {excuseTitleRes ?? '—'}
            </p>
          </div>

          {/* Afinar detalles */}
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

          {/* Origen */}
          <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <p className={cn('flex-shrink-0', sectionTitleClass)}>
              {summary?.originSection}
            </p>
            <div className="flex min-w-0 items-center justify-end gap-2">
              {logistics.city && logistics.country ? (
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

          {/* Fechas */}
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

          {/* Transporte */}
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

          {/* Filtros */}
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

          {/* Add-ons */}
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

          {/* Cantidad de viajeros */}
          <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <p className={cn('flex-shrink-0', sectionTitleClass)}>
              Cantidad de viajeros
            </p>
            <div className="flex min-w-0 items-center justify-end gap-3">
              <label className="sr-only" htmlFor="summary-pax">
                Número de viajeros
              </label>
              <select
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                id="summary-pax"
                onChange={(e) => setPaxOverride(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
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

          {/* Total USD */}
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


          {/* Actions */}
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

export default function SummaryPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SummaryPageContent />
    </Suspense>
  );
}
