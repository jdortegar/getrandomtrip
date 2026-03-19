'use client';

import { Calendar, MapPin, Sparkle, X } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuerySync } from '@/hooks/useQuerySync';
import Img from '@/components/common/Img';
import { TRAVELER_TYPE_LABELS } from '@/lib/data/journey-labels';
import { formatUSD } from '@/lib/format';
import { useParams } from 'next/navigation';
import { getBasePricePerPerson } from '@/lib/data/traveler-types';
import { getCardForType, getLevelById } from '@/lib/utils/experiencesData';
import {
  getExcuseOptions,
  getExcuseTitle,
  getHasExcuseStep,
} from '@/lib/helpers/excuse-helper';
import { FILTER_OPTIONS } from '@/store/slices/journeyStore';
import { ADDONS } from '@/lib/data/shared/addons-catalog';
import {
  TRANSPORT_ICONS,
  TRANSPORT_OPTIONS,
} from '@/components/journey/TransportSelector';
import { cn } from '@/lib/utils';
import type { MarketingDictionary } from '@/lib/types/dictionary';

type JourneySummaryDict = MarketingDictionary['journey']['summary'];

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

function getFilterLabel(
  group: keyof typeof FILTER_OPTIONS,
  key: string,
  filterOptions?: JourneySummaryProps['filterOptions'],
): string {
  const fo = filterOptions as
    | Record<string, { options: Array<{ key: string; label: string }> }>
    | undefined;
  const fromDict = fo?.[group]?.options?.find((o) => o.key === key)?.label;
  return fromDict ?? key;
}

interface JourneySummaryProps {
  /** Localized addon copy keyed by addon id (journey.addons). */
  addonLabels?: Record<
    string,
    {
      category: string;
      longDescription: string;
      shortDescription: string;
      title: string;
    }
  >;
  className?: string;
  /** Localized filter option labels (e.g. journey.preferencesStep.filterOptions). */
  filterOptions?: {
    accommodationType: {
      label: string;
      options: Array<{ key: string; label: string }>;
    };
    arrivePref: {
      label: string;
      options: Array<{ key: string; label: string }>;
    };
    climate: { label: string; options: Array<{ key: string; label: string }> };
    departPref: {
      label: string;
      options: Array<{ key: string; label: string }>;
    };
    maxTravelTime: {
      label: string;
      options: Array<{ key: string; label: string }>;
    };
    transport: {
      label: string;
      options: Array<{ key: string; label: string }>;
    };
  };
  onDetailRemove?: (detail: string) => void;
  onEdit?: (section: string) => void;
  /** Localized excuse titles/descriptions (journey.excuses). Used for excuse section label. */
  localizedExcuses?: Array<{ key: string; title: string; description: string }>;
  /** Localized refine-detail option labels (journey.refineDetailOptions). Keyed by travelType then excuse key. */
  refineDetailOptions?: Record<
    string,
    Record<string, Array<{ key: string; label: string; desc: string }>>
  >;
  summary: JourneySummaryDict;
}

export default function JourneySummary({
  addonLabels,
  className,
  filterOptions,
  localizedExcuses,
  onDetailRemove,
  onEdit,
  refineDetailOptions,
  summary,
}: JourneySummaryProps) {
  const searchParams = useSearchParams();
  const updateQuery = useQuerySync();

  const handleRemoveDetail = useCallback(
    (keyToRemove: string) => {
      const raw = searchParams.get('refineDetails');
      const current = raw
        ? raw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const next = current.filter((k) => k !== keyToRemove);
      updateQuery({ refineDetails: next.length > 0 ? next : undefined });
      onDetailRemove?.(keyToRemove);
    },
    [onDetailRemove, searchParams, updateQuery],
  );

  const travelType = searchParams.get('travelType') || undefined;
  const experience = searchParams.get('experience') || undefined;
  const excuse = searchParams.get('excuse') || undefined;
  const hasExcuseStep = useMemo(
    () => getHasExcuseStep(travelType ?? '', experience),
    [experience, travelType],
  );
  const refineDetailsRaw = searchParams.get('refineDetails');
  const refineDetails = useMemo(
    () => (refineDetailsRaw ? refineDetailsRaw.split(',').filter(Boolean) : []),
    [refineDetailsRaw],
  );
  const originCountry = searchParams.get('originCountry') || '';
  const originCity = searchParams.get('originCity') || '';
  const startDate = searchParams.get('startDate') || undefined;
  const nightsParam = searchParams.get('nights');
  const nights = useMemo(() => {
    const n = nightsParam ? Number(nightsParam) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [nightsParam]);
  const transport = searchParams.get('transport') || undefined;
  const accommodationType = searchParams.get('accommodationType') || undefined;
  const departPref = searchParams.get('departPref') || undefined;
  const arrivePref = searchParams.get('arrivePref') || undefined;
  const maxTravelTime = searchParams.get('maxTravelTime') || undefined;
  const climate = searchParams.get('climate') || undefined;
  const avoidDestinationsRaw = searchParams.get('avoidDestinations');
  const avoidDestinations = useMemo(
    () =>
      avoidDestinationsRaw
        ? avoidDestinationsRaw.split(',').filter(Boolean)
        : [],
    [avoidDestinationsRaw],
  );
  const addonsRaw = searchParams.get('addons');
  const addonIds = useMemo(
    () =>
      addonsRaw
        ? addonsRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    [addonsRaw],
  );

  const params = useParams();
  const locale = (params?.locale as string) ?? 'es';
  const selectedLevel = useMemo(() => {
    if (!experience || !travelType) return null;
    return getLevelById(travelType, experience, locale) ?? null;
  }, [experience, travelType, locale]);

  const selectedTravelTypeInfo = useMemo(() => {
    if (!travelType) return null;
    const card = getCardForType(travelType, locale);
    const price = selectedLevel
      ? getBasePricePerPerson(travelType, selectedLevel.id)
      : 0;
    return {
      image: card?.img,
      label: TRAVELER_TYPE_LABELS[travelType] || card?.title || travelType,
      price: selectedLevel ? formatUSD(price) : undefined,
      rating: 7.0,
      reviews: 10,
    };
  }, [travelType, selectedLevel, locale]);

  const selectedExperienceInfo = useMemo(() => {
    if (!selectedLevel) return null;
    return {
      label: selectedLevel.name,
      price: `${formatUSD(selectedLevel.price)} ${summary.experiencePerPerson}`,
    };
  }, [selectedLevel, summary.experiencePerPerson]);

  const excuseTitle = useMemo(() => {
    if (!hasExcuseStep) return undefined;
    if (!excuse) return undefined;
    return (
      localizedExcuses?.find((e) => e.key === excuse)?.title ??
      getExcuseTitle(excuse)
    );
  }, [excuse, hasExcuseStep, localizedExcuses]);

  const refineDetailEntries = useMemo(() => {
    if (!hasExcuseStep) return [];
    if (!excuse || refineDetails.length === 0) return [];
    const fallbackOptions = getExcuseOptions(excuse);
    const travelType = (searchParams.get('travelType') || '').toLowerCase();
    const byExcuse = refineDetailOptions?.[travelType]?.[excuse];
    return refineDetails.map((key) => {
      const localized = byExcuse?.find((o) => o.key === key)?.label;
      const fallback = fallbackOptions.find((o) => o.key === key)?.label ?? key;
      return { key, label: localized ?? fallback };
    });
  }, [excuse, hasExcuseStep, refineDetails, refineDetailOptions, searchParams]);

  const transportLabel = useMemo(() => {
    if (!transport) return undefined;
    return (
      TRANSPORT_OPTIONS.find((o) => o.id === transport)?.label ??
      getFilterLabel('transport', transport, filterOptions)
    );
  }, [transport]);

  const TransportIcon = transport
    ? (TRANSPORT_ICONS[transport] ?? TRANSPORT_ICONS.plane)
    : null;

  type FilterKind =
    | 'accommodationType'
    | 'arrivePref'
    | 'avoid'
    | 'climate'
    | 'departPref'
    | 'maxTravelTime';

  const activeFilters = useMemo(() => {
    const list: {
      id: string;
      kind: FilterKind;
      label: string;
      value?: string;
    }[] = [];
    if (accommodationType && accommodationType !== 'any') {
      list.push({
        id: `accommodationType-${accommodationType}`,
        kind: 'accommodationType',
        label: `${summary.filterLabelAccommodation}: ${getFilterLabel('accommodationType', accommodationType, filterOptions)}`,
      });
    }
    if (departPref && departPref !== 'any') {
      list.push({
        id: `depart-${departPref}`,
        kind: 'departPref',
        label: `${summary.filterLabelDepart}: ${getFilterLabel('departPref', departPref, filterOptions)}`,
      });
    }
    if (arrivePref && arrivePref !== 'any') {
      list.push({
        id: `arrive-${arrivePref}`,
        kind: 'arrivePref',
        label: `${summary.filterLabelArrive}: ${getFilterLabel('arrivePref', arrivePref, filterOptions)}`,
      });
    }
    if (maxTravelTime && maxTravelTime !== 'no-limit') {
      list.push({
        id: `time-${maxTravelTime}`,
        kind: 'maxTravelTime',
        label: `${summary.filterLabelTime}: ${getFilterLabel('maxTravelTime', maxTravelTime, filterOptions)}`,
      });
    }
    if (climate && climate !== 'any') {
      list.push({
        id: `climate-${climate}`,
        kind: 'climate',
        label: `${summary.filterLabelClimate}: ${getFilterLabel('climate', climate, filterOptions)}`,
      });
    }
    avoidDestinations.forEach((city) => {
      list.push({
        id: `avoid-${city}`,
        kind: 'avoid',
        label: `${summary.filterLabelAvoid}: ${city}`,
        value: city,
      });
    });
    return list;
  }, [
    accommodationType,
    arrivePref,
    avoidDestinations,
    climate,
    departPref,
    filterOptions,
    maxTravelTime,
    summary.filterLabelAccommodation,
    summary.filterLabelArrive,
    summary.filterLabelAvoid,
    summary.filterLabelClimate,
    summary.filterLabelDepart,
    summary.filterLabelTime,
  ]);

  const handleRemoveFilter = useCallback(
    (kind: FilterKind, value?: string) => {
      if (kind === 'avoid' && value != null) {
        const next = avoidDestinations.filter(
          (c) => c.toLowerCase() !== value.toLowerCase(),
        );
        updateQuery({
          avoidDestinations: next.length > 0 ? next : undefined,
        });
      } else {
        const patch: Record<string, string | undefined> = {};
        if (kind === 'accommodationType') patch.accommodationType = undefined;
        if (kind === 'departPref') patch.departPref = undefined;
        if (kind === 'arrivePref') patch.arrivePref = undefined;
        if (kind === 'maxTravelTime') patch.maxTravelTime = undefined;
        if (kind === 'climate') patch.climate = undefined;
        if (Object.keys(patch).length > 0) updateQuery(patch);
      }
    },
    [avoidDestinations, updateQuery],
  );

  const handleRemoveAddon = useCallback(
    (addonId: string) => {
      const raw = searchParams.get('addons');
      const current = raw
        ? raw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const next = current.filter((id) => id !== addonId);
      updateQuery({ addons: next.length > 0 ? next : undefined });
    },
    [searchParams, updateQuery],
  );

  const selectedAddons = useMemo(() => {
    return addonIds
      .map((id) => ADDONS.find((a) => a.id === id))
      .filter((a): a is (typeof ADDONS)[number] => Boolean(a));
  }, [addonIds]);

  const filterCost = useMemo(() => {
    const n = activeFilters.length;
    if (n <= 1) return 0;
    if (n === 2) return 18;
    if (n === 3) return 18 + 18;
    return 18 + 18 + (n - 3) * 25;
  }, [activeFilters.length]);

  const totalPrice = useMemo(() => {
    let base = selectedLevel?.price ?? 0;
    base += filterCost;
    selectedAddons.forEach((addon) => {
      if (addon.priceType === 'currency') {
        base += addon.price;
      } else {
        base += (base * addon.price) / 100;
      }
    });
    return formatUSD(Math.round(base));
  }, [filterCost, selectedLevel, selectedAddons]);

  const hasAnySummary =
    selectedTravelTypeInfo ||
    selectedExperienceInfo ||
    excuseTitle ||
    refineDetailEntries.length > 0 ||
    (originCity && originCountry) ||
    (startDate && nights) ||
    transportLabel ||
    activeFilters.length > 0 ||
    selectedAddons.length > 0;

  const sectionTitleClass = 'text-base font-bold text-gray-900';
  const detailClass = 'text-sm font-normal text-gray-900';
  const captionClass = 'text-xs font-normal text-gray-500';
  const priceClass = 'text-lg font-bold text-gray-900';
  const actionButtonClass =
    'flex-shrink-0 rounded-md bg-gray-100 px-3 py-1.5 text-sm font-normal text-gray-900 hover:bg-gray-200';

  return (
    <aside
      className={cn(
        'flex w-full flex-shrink-0 flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-8 lg:self-start lg:w-80',
        className,
      )}
    >
      <h2 className="text-xl font-bold text-gray-900">{summary.title}</h2>

      {/* Tipo de viaje */}
      <div className="flex items-stretch justify-between gap-3 border-b border-gray-200 pb-4">
        {selectedTravelTypeInfo ? (
          <div className="flex min-w-0 flex-1 items-stretch gap-3">
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
            <div className="min-w-0 flex-1">
              <p className={cn('mb-1', sectionTitleClass)}>
                {summary.travelTypeSection} | {selectedTravelTypeInfo.label}
              </p>
              <div className="flex items-center justify-between">
                {selectedTravelTypeInfo.rating != null && (
                  <p className={cn('mt-1', captionClass)}>
                    {summary.favoriteAmongTravelers}
                    {selectedTravelTypeInfo.rating.toFixed(1)}
                    {selectedTravelTypeInfo.reviews != null &&
                      ` (${selectedTravelTypeInfo.reviews})`}
                  </p>
                )}
                <button
                  className={actionButtonClass}
                  onClick={() => onEdit?.('travel-type')}
                  type="button"
                >
                  {summary.change}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <p className={cn('min-w-0 flex-1', sectionTitleClass)}>
              {summary.travelTypeSection}
            </p>
            <button
              className={cn(actionButtonClass, 'flex-shrink-0')}
              onClick={() => onEdit?.('travel-type')}
              type="button"
            >
              {summary.add}
            </button>
          </div>
        )}
      </div>

      {/* Experiencia */}
      <div className="border-b border-gray-200 pb-4">
        <p className={cn('w-full', sectionTitleClass)}>
          {summary.experienceSection}
        </p>
        <div className="mt-2 flex items-center justify-between">
          {selectedExperienceInfo ? (
            <>
              <div>
                <p className={detailClass}>{selectedExperienceInfo.label}</p>
                {selectedExperienceInfo.price && (
                  <p className="text-sm font-normal text-gray-500">
                    {selectedExperienceInfo.price}
                  </p>
                )}
              </div>
              <button
                className={actionButtonClass}
                onClick={() => onEdit?.('experience')}
                type="button"
              >
                {summary.change}
              </button>
            </>
          ) : (
            <div className="flex w-full justify-end">
              <button
                className={actionButtonClass}
                onClick={() => onEdit?.('experience')}
                type="button"
              >
                {summary.add}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Excuse section – labels from summary.excuseSection */}
      {hasExcuseStep && (
        <>
          <div className="border-b border-gray-200 pb-4">
            <p className={cn('w-full', sectionTitleClass)}>
              {summary.excuseSection}
            </p>
            <div className="mt-2 flex items-center justify-between">
              {excuseTitle ? (
                <>
                  <p className={detailClass}>{excuseTitle}</p>
                  <button
                    className={actionButtonClass}
                    onClick={() => onEdit?.('excuse')}
                    type="button"
                  >
                    {summary.change}
                  </button>
                </>
              ) : (
                <div className="flex w-full justify-end">
                  <button
                    className={actionButtonClass}
                    onClick={() => onEdit?.('excuse')}
                    type="button"
                  >
                    {summary.add}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Refine details section – labels from summary.detailsSection */}
          <div className="border-b border-gray-200 pb-4">
            <p className={cn('w-full', sectionTitleClass)}>
              {summary.detailsSection}
            </p>
            <div className="mt-2 flex items-start justify-between gap-3">
              {refineDetailEntries.length > 0 ? (
                <>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    {refineDetailEntries.map(({ key, label }) => (
                      <div
                        className="inline-flex w-fit items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-xs font-normal text-gray-900"
                        key={key}
                      >
                        <span>{label}</span>
                        <button
                          aria-label={summary.detailRemoveAria}
                          className="flex-shrink-0 rounded p-0.5 hover:bg-gray-200 hover:text-gray-700"
                          onClick={() => handleRemoveDetail(key)}
                          type="button"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    className={actionButtonClass}
                    onClick={() => onEdit?.('refine-details')}
                    type="button"
                  >
                    {summary.edit}
                  </button>
                </>
              ) : (
                <div className="flex w-full items-center justify-between gap-3">
                  <p className={detailClass}>{summary.noDetails}</p>
                  <button
                    className={actionButtonClass}
                    onClick={() => onEdit?.('refine-details')}
                    type="button"
                  >
                    {summary.add}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Origin section – labels from summary.originSection */}
      <div className="border-b border-gray-200 pb-4">
        <p className={cn('w-full', sectionTitleClass)}>
          {summary.originSection}
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          {originCity && originCountry ? (
            <>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0 text-gray-900" />
                <p className={detailClass}>
                  {originCity}, {originCountry}.
                </p>
              </div>
              <button
                className={actionButtonClass}
                onClick={() => onEdit?.('origin')}
                type="button"
              >
                {summary.change}
              </button>
            </>
          ) : (
            <div className="flex w-full justify-end">
              <button
                className={actionButtonClass}
                onClick={() => onEdit?.('origin')}
                type="button"
              >
                {summary.add}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fechas */}
      <div className="border-b border-gray-200 pb-4">
        <p className={cn('w-full', sectionTitleClass)}>
          {summary.datesSection}
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          {startDate && nights > 0 ? (
            <>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0 text-gray-900" />
                <p className={detailClass}>
                  {formatDatesSummary(
                    startDate,
                    nights,
                    summary.dateRangeTemplate,
                    summary.monthsShort,
                  )}
                </p>
              </div>
              <button
                className={actionButtonClass}
                onClick={() => onEdit?.('dates')}
                type="button"
              >
                {summary.change}
              </button>
            </>
          ) : (
            <div className="flex w-full justify-end">
              <button
                className={actionButtonClass}
                onClick={() => onEdit?.('dates')}
                type="button"
              >
                {summary.add}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transporte * */}
      <div className="border-b border-gray-200 pb-4">
        <p className={cn('w-full', sectionTitleClass)}>
          {summary.transportSection}
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          {transportLabel && TransportIcon ? (
            <>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <TransportIcon className="h-4 w-4 flex-shrink-0 text-gray-900" />
                <p className={detailClass}>
                  {transportLabel}
                  <span className="font-normal text-gray-500">
                    {summary.transportOptionalNote}
                  </span>
                </p>
              </div>
              <button
                className={actionButtonClass}
                onClick={() => onEdit?.('transport')}
                type="button"
              >
                {summary.change}
              </button>
            </>
          ) : (
            <div className="flex w-full justify-end">
              <button
                className={actionButtonClass}
                onClick={() => onEdit?.('transport')}
                type="button"
              >
                {summary.add}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filtros (opcionales) */}
      <div className="border-b border-gray-200 pb-4">
        <p className={cn('w-full', sectionTitleClass)}>
          {activeFilters.length > 0
            ? summary.filtersSectionCount.replace(
                '{count}',
                String(activeFilters.length),
              )
            : summary.filtersSection}
        </p>
        <div className="mt-2 flex items-start justify-between gap-3">
          {activeFilters.length > 0 ? (
            <>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {activeFilters.map(({ id, kind, label, value }) => (
                  <div
                    className="inline-flex w-fit items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-xs font-normal text-gray-900"
                    key={id}
                  >
                    <span>{label}</span>
                    <button
                      aria-label={summary.filterRemoveAria}
                      className="flex-shrink-0 rounded p-0.5 hover:bg-gray-200 hover:text-gray-700"
                      onClick={() => handleRemoveFilter(kind, value)}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                className={actionButtonClass}
                onClick={() => onEdit?.('filters')}
                type="button"
              >
                {summary.change}
              </button>
            </>
          ) : (
            <div className="flex w-full items-center justify-between gap-3">
              <p className={detailClass}>{summary.noFilters}</p>
              <button
                className={actionButtonClass}
                onClick={() => onEdit?.('filters')}
                type="button"
              >
                {summary.add}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Extras (add-ons) */}
      <div className="border-b border-gray-200 pb-4">
        <p className={cn('w-full', sectionTitleClass)}>
          {selectedAddons.length > 0
            ? summary.addonsSectionCount.replace(
                '{count}',
                String(selectedAddons.length),
              )
            : summary.addonsSection}
        </p>
        <div className="mt-2 flex items-start justify-between gap-3">
          {selectedAddons.length > 0 ? (
            <>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {selectedAddons.map((addon) => (
                  <div
                    className="inline-flex w-fit items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-xs font-normal text-gray-900"
                    key={addon.id}
                  >
                    <span>
                      {addonLabels?.[addon.id]?.title ?? addon.title}
                      {addon.priceType === 'currency'
                        ? ` — USD ${addon.price}`
                        : ` — ${addon.price}%`}
                    </span>
                    <button
                      aria-label={summary.addonRemoveAria}
                      className="flex-shrink-0 rounded p-0.5 hover:bg-gray-200 hover:text-gray-700"
                      onClick={() => handleRemoveAddon(addon.id)}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                className={actionButtonClass}
                onClick={() => onEdit?.('addons')}
                type="button"
              >
                {summary.change}
              </button>
            </>
          ) : (
            <div className="flex w-full items-center justify-between gap-3">
              <p className={detailClass}>{summary.noAddons}</p>
              <button
                className={actionButtonClass}
                onClick={() => onEdit?.('addons')}
                type="button"
              >
                {summary.add}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Total USD */}
      {hasAnySummary && (
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xl font-bold text-gray-900">
              {summary.totalUsd} <span className="underline">USD</span>
            </p>
            <p className={captionClass}>{summary.perPerson}</p>
          </div>
          <p className="text-right text-xl font-bold text-gray-900">
            {totalPrice} USD
          </p>
        </div>
      )}

      {/* IMPORTANTE */}
      <div className="rounded-lg bg-[#E8F4FC] p-4 text-sm">
        <div className="mb-2 flex items-center gap-2">
          <Sparkle
            aria-hidden
            className="h-4 w-4 shrink-0 text-[#5B7A8C] fill-[#5B7A8C]"
          />
          <span className="text-base font-bold text-gray-900">
            {summary.importantTitle}
          </span>
        </div>
        <ul className="list-outside list-disc pl-4 space-y-1 text-sm font-normal text-gray-900">
          <li>{summary.importantNote1}</li>
          <li>{summary.importantNote2}</li>
          <li>{summary.importantNote3}</li>
          <li>{summary.importantNote4}</li>
        </ul>
      </div>
    </aside>
  );
}
