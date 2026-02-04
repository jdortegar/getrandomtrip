'use client';

import { Calendar, MapPin, Sparkle, X } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuerySync } from '@/hooks/useQuerySync';
import Img from '@/components/common/Img';
import { getTravelerType } from '@/lib/data/traveler-types';
import { TRAVELER_TYPE_LABELS } from '@/lib/data/journey-labels';
import { formatUSD } from '@/lib/format';
import { initialTravellerTypes } from '@/lib/data/travelerTypes';
import { getExcuseTitle, getExcuseOptions } from '@/lib/helpers/excuse-helper';
import { FILTER_OPTIONS } from '@/store/slices/journeyStore';
import { ADDONS } from '@/lib/data/shared/addons-catalog';
import {
  TRANSPORT_ICONS,
  TRANSPORT_OPTIONS,
} from '@/components/journey/TransportSelector';
import { cn } from '@/lib/utils';

const MONTH_SHORT_ES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

function formatDatesSummary(startDate: string, nights: number): string {
  const [y, m, d] = startDate.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(start);
  end.setDate(end.getDate() + nights);
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = MONTH_SHORT_ES[start.getMonth()];
  const endMonth = MONTH_SHORT_ES[end.getMonth()];
  if (startMonth === endMonth) {
    return `Del ${startDay} de ${startMonth} al ${endDay} de ${endMonth}`;
  }
  return `Del ${startDay} de ${startMonth} al ${endDay} de ${endMonth}`;
}

function getFilterLabel(
  group: keyof typeof FILTER_OPTIONS,
  key: string,
): string {
  const opt = FILTER_OPTIONS[group]?.options?.find((o) => o.key === key);
  return opt?.label ?? key;
}

interface JourneySummaryProps {
  className?: string;
  onDetailRemove?: (detail: string) => void;
  onEdit?: (section: string) => void;
}

export default function JourneySummary({
  className,
  onDetailRemove,
  onEdit,
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

  const travelerTypeData = useMemo(() => {
    if (!travelType) return null;
    return getTravelerType(travelType);
  }, [travelType]);

  const selectedLevel = useMemo(() => {
    if (!experience || !travelerTypeData) return null;
    return travelerTypeData.planner.levels.find((l) => l.id === experience);
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
    return {
      label: selectedLevel.name,
      price: `${formatUSD(selectedLevel.price)} por persona`,
    };
  }, [selectedLevel]);

  const excuseTitle = useMemo(
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
    return (
      TRANSPORT_OPTIONS.find((o) => o.id === transport)?.label ??
      getFilterLabel('transport', transport)
    );
  }, [transport]);

  const TransportIcon = transport
    ? (TRANSPORT_ICONS[transport] ?? TRANSPORT_ICONS.avion)
    : null;

  type FilterKind =
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
    if (departPref && departPref !== 'indistinto') {
      list.push({
        id: `depart-${departPref}`,
        kind: 'departPref',
        label: `Salida: ${getFilterLabel('departPref', departPref)}`,
      });
    }
    if (arrivePref && arrivePref !== 'indistinto') {
      list.push({
        id: `arrive-${arrivePref}`,
        kind: 'arrivePref',
        label: `Llegada: ${getFilterLabel('arrivePref', arrivePref)}`,
      });
    }
    if (maxTravelTime && maxTravelTime !== 'sin-limite') {
      list.push({
        id: `time-${maxTravelTime}`,
        kind: 'maxTravelTime',
        label: `Tiempo: ${getFilterLabel('maxTravelTime', maxTravelTime)}`,
      });
    }
    if (climate && climate !== 'indistinto') {
      list.push({
        id: `climate-${climate}`,
        kind: 'climate',
        label: `Clima: ${getFilterLabel('climate', climate)}`,
      });
    }
    avoidDestinations.forEach((city) => {
      list.push({
        id: `avoid-${city}`,
        kind: 'avoid',
        label: city,
        value: city,
      });
    });
    return list;
  }, [arrivePref, avoidDestinations, climate, departPref, maxTravelTime]);

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

  const totalPrice = useMemo(() => {
    let base = selectedLevel?.price ?? 0;
    selectedAddons.forEach((addon) => {
      if (addon.priceType === 'currency') {
        base += addon.price;
      } else {
        base += (base * addon.price) / 100;
      }
    });
    return formatUSD(Math.round(base));
  }, [selectedLevel, selectedAddons]);

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
        'flex w-full flex-shrink-0 flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm md:w-80 lg:sticky lg:top-8 lg:self-start',
        className,
      )}
    >
      <h2 className="text-xl font-bold text-gray-900">Resumen del viaje</h2>

      {/* Tipo de viaje */}
      {selectedTravelTypeInfo && (
        <div className="flex items-stretch justify-between gap-3 border-b border-gray-200 pb-4">
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
                Tipo de viaje | {selectedTravelTypeInfo.label}
              </p>
              <div className="flex items-center justify-between">
                {selectedTravelTypeInfo.rating != null && (
                  <p className={cn('mt-1', captionClass)}>
                    Favorito entre viajeros ★
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
                  Cambiar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Experiencia */}
      {selectedExperienceInfo && (
        <div className="border-b border-gray-200 pb-4">
          <p className={cn('w-full', sectionTitleClass)}>Experiencia</p>
          <div className="mt-2 flex items-center justify-between">
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
              Cambiar
            </button>
          </div>
        </div>
      )}

      {/* Excusa */}
      {excuseTitle && (
        <div className="border-b border-gray-200 pb-4">
          <p className={cn('w-full', sectionTitleClass)}>Excusa</p>
          <div className="mt-2 flex items-center justify-between">
            <p className={detailClass}>{excuseTitle}</p>
            <button
              className={actionButtonClass}
              onClick={() => onEdit?.('excuse')}
              type="button"
            >
              Cambiar
            </button>
          </div>
        </div>
      )}

      {/* Afinar detalles */}
      {refineDetailEntries.length > 0 && (
        <div className="border-b border-gray-200 pb-4">
          <p className={cn('w-full', sectionTitleClass)}>Detalles</p>
          <div className="mt-2 flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {refineDetailEntries.map(({ key, label }) => (
                <div
                  className="inline-flex w-fit items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-xs font-normal text-gray-900"
                  key={key}
                >
                  <span>{label}</span>
                  <button
                    aria-label="Quitar"
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
              Editar
            </button>
          </div>
        </div>
      )}

      {/* Origen */}
      {originCity && originCountry && (
        <div className="border-b border-gray-200 pb-4">
          <p className={cn('w-full', sectionTitleClass)}>Origen</p>
          <div className="mt-2 flex items-center justify-between gap-3">
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
              Cambiar
            </button>
          </div>
        </div>
      )}

      {/* Fechas */}
      {startDate && nights > 0 && (
        <div className="border-b border-gray-200 pb-4">
          <p className={cn('w-full', sectionTitleClass)}>Fechas</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Calendar className="h-4 w-4 flex-shrink-0 text-gray-900" />
              <p className={detailClass}>
                {formatDatesSummary(startDate, nights)}
              </p>
            </div>
            <button
              className={actionButtonClass}
              onClick={() => onEdit?.('dates')}
              type="button"
            >
              Cambiar
            </button>
          </div>
        </div>
      )}

      {/* Transporte * */}
      {transportLabel && TransportIcon && (
        <div className="border-b border-gray-200 pb-4">
          <p className={cn('w-full', sectionTitleClass)}>
            Transporte de preferencia
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <TransportIcon className="h-4 w-4 flex-shrink-0 text-gray-900" />
              <p className={detailClass}>
                {transportLabel}
                <span className="font-normal text-gray-500">*</span>
              </p>
            </div>
            <button
              className={actionButtonClass}
              onClick={() => onEdit?.('filters')}
              type="button"
            >
              Cambiar
            </button>
          </div>
        </div>
      )}

      {/* Filtros (opcionales) */}
      {activeFilters.length > 0 && (
        <div className="border-b border-gray-200 pb-4">
          <p className={cn('w-full', sectionTitleClass)}>Filtros</p>
          <div className="mt-2 flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {activeFilters.map(({ id, kind, label, value }) => (
                <div
                  className="inline-flex w-fit items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-xs font-normal text-gray-900"
                  key={id}
                >
                  <span>{label}</span>
                  <button
                    aria-label="Quitar filtro"
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
              Cambiar
            </button>
          </div>
        </div>
      )}

      {/* Extras (add-ons) */}
      {selectedAddons.length > 0 && (
        <div className="border-b border-gray-200 pb-4">
          <p className={cn('w-full', sectionTitleClass)}>Extras</p>
          <div className="mt-2 flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {selectedAddons.map((addon) => (
                <div
                  className="inline-flex w-fit items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-xs font-normal text-gray-900"
                  key={addon.id}
                >
                  <span>
                    {addon.title}
                    {addon.priceType === 'currency'
                      ? ` — USD ${addon.price}`
                      : ` — ${addon.price}%`}
                  </span>
                  <button
                    aria-label="Quitar extra"
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
              Cambiar
            </button>
          </div>
        </div>
      )}

      {/* Total USD */}
      {hasAnySummary && (
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xl font-bold text-gray-900">
              Total <span className="underline">USD</span>
            </p>
            <p className={captionClass}>Por persona</p>
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
          <span className="text-base font-bold text-gray-900">IMPORTANTE</span>
        </div>
        <ul className="list-outside list-disc pl-4 space-y-1 text-sm font-normal text-gray-900">
          <li>Transporte es obligatorio y no suma costo.</li>
          <li>Freemium: el primer filtro opcional es gratis.</li>
          <li>2-3 filtros: USD 18 c/u.</li>
          <li>4+ filtros: USD 25 c/u.</li>
        </ul>
      </div>
    </aside>
  );
}
