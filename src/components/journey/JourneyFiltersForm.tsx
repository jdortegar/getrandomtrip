'use client';

import { Cloud, Snowflake, Sparkle, Sun, Thermometer } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import AvoidGrid from '@/components/journey/avoid/AvoidGrid';
import { FILTER_OPTIONS } from '@/store/slices/journeyStore';
import { cn } from '@/lib/utils';

interface FilterOption {
  key: string;
  label: string;
}

interface FilterSegProps {
  onChange: (value: string) => void;
  options: FilterOption[];
  value: string | undefined;
}

function FilterSeg({ onChange, options, value }: FilterSegProps) {
  return (
    <div className="inline-flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          className={cn(
            'rounded-full border px-3 py-1.5 text-sm transition',
            value === opt.key
              ? 'border-gray-800 bg-gray-800 text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100',
          )}
          key={opt.key}
          onClick={() => onChange(opt.key)}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const CLIMATE_ICONS: Record<string, typeof Sun> = {
  calido: Sun,
  frio: Snowflake,
  indistinto: Thermometer,
  templado: Cloud,
};

export interface JourneyFiltersFormLabels {
  arrivePrefLabel: string;
  avoidGridButton: string;
  avoidGridLoading: string;
  avoidHint: string;
  avoidLabel: string;
  avoidSearchModal?: {
    addButton: string;
    cancelButton: string;
    saveDestinationsButton: string;
    selectedCountTemplate: string;
    selectedDestinationsHeading: string;
    title: string;
  };
  clearButton: string;
  climateLabel: string;
  departPrefLabel: string;
  /** Localized filter option lists; when set, used instead of store keys. */
  filterOptions?: {
    arrivePref: { label: string; options: Array<{ key: string; label: string }> };
    climate: { label: string; options: Array<{ key: string; label: string }> };
    departPref: { label: string; options: Array<{ key: string; label: string }> };
    maxTravelTime: { label: string; options: Array<{ key: string; label: string }> };
    transport: { label: string; options: Array<{ key: string; label: string }> };
  };
  importantNote1?: string;
  importantNote2?: string;
  importantNote3?: string;
  importantNote4?: string;
  importantTitle?: string;
  maxTravelTimeLabel: string;
  saveFiltersButton: string;
}

export interface JourneyFiltersFormProps {
  arrivePref: string | undefined;
  climate: string | undefined;
  departPref: string | undefined;
  experience?: string;
  labels?: JourneyFiltersFormLabels;
  maxTravelTime: string | undefined;
  onArrivePrefChange: (value: string) => void;
  onClear: () => void;
  onClimateChange: (value: string) => void;
  onDepartPrefChange: (value: string) => void;
  onMaxTravelTimeChange: (value: string) => void;
  onSave: () => void;
  originCity: string;
  originCountry: string;
}

export function JourneyFiltersForm({
  arrivePref,
  climate,
  departPref,
  experience,
  labels: labelsProp,
  maxTravelTime,
  onArrivePrefChange,
  onClear,
  onClimateChange,
  onDepartPrefChange,
  onMaxTravelTimeChange,
  onSave,
  originCity,
  originCountry,
}: JourneyFiltersFormProps) {
  const labels = {
    arrivePrefLabel: labelsProp?.arrivePrefLabel ?? 'Horarios preferidos de llegada',
    avoidGridButton: labelsProp?.avoidGridButton ?? 'Otros destinos a evitar',
    avoidGridLoading: labelsProp?.avoidGridLoading ?? 'Cargando ciudades...',
    avoidHint: labelsProp?.avoidHint ?? 'Seleccioná hasta 15',
    avoidLabel: labelsProp?.avoidLabel ?? 'Destinos a evitar (opcional)',
    avoidSearchModal: labelsProp?.avoidSearchModal ?? {
      addButton: 'Agregar',
      cancelButton: 'Cancelar',
      saveDestinationsButton: 'Guardar destinos',
      selectedCountTemplate: 'Seleccionados: {count} / {max}',
      selectedDestinationsHeading: 'Destinos seleccionados',
      title: 'Agregar destinos a evitar',
    },
    clearButton: labelsProp?.clearButton ?? 'Borrar',
    climateLabel: labelsProp?.climateLabel ?? 'Clima preferencial',
    departPrefLabel: labelsProp?.departPrefLabel ?? 'Horarios preferidos de salida (opcional)',
    filterOptions: labelsProp?.filterOptions,
    importantNote1: labelsProp?.importantNote1 ?? 'El precio mostrado es por persona.',
    importantNote2: labelsProp?.importantNote2 ?? 'Incluye alojamiento y actividades según el nivel elegido.',
    importantNote3: labelsProp?.importantNote3 ?? 'No incluye vuelos ni traslados hasta el destino.',
    importantNote4: labelsProp?.importantNote4 ?? 'Sujeto a disponibilidad al confirmar.',
    importantTitle: labelsProp?.importantTitle ?? 'Importante',
    maxTravelTimeLabel: labelsProp?.maxTravelTimeLabel ?? 'Tiempo máximo de viaje',
    saveFiltersButton: labelsProp?.saveFiltersButton ?? 'Guardar Filtros',
  };

  const departOptions = labels.filterOptions?.departPref?.options ?? FILTER_OPTIONS.departPref.options.map((o) => ({ key: o.key, label: o.label ?? o.key }));
  const arriveOptions = labels.filterOptions?.arrivePref?.options ?? FILTER_OPTIONS.arrivePref.options.map((o) => ({ key: o.key, label: o.label ?? o.key }));
  const maxTravelTimeOptions = labels.filterOptions?.maxTravelTime?.options ?? FILTER_OPTIONS.maxTravelTime.options.map((o) => ({ key: o.key, label: o.label ?? o.key }));
  const climateOptions = labels.filterOptions?.climate?.options ?? FILTER_OPTIONS.climate.options.map((o) => ({ key: o.key, label: o.label ?? o.key }));

  return (
    <div className="space-y-8">
      <div className="rounded-lg bg-[#E8F4FC] p-4 text-sm">
        <div className="mb-2 flex items-center gap-2">
          <Sparkle
            aria-hidden
            className="h-4 w-4 shrink-0 text-[#5B7A8C] fill-[#5B7A8C]"
          />
          <span className="text-base font-bold text-gray-900">
            {labels.importantTitle}
          </span>
        </div>
        <ul className="grid list-outside list-disc grid-cols-2 gap-x-6 gap-y-1 pl-4 text-sm font-normal text-gray-900">
          <li>{labels.importantNote1}</li>
          <li>{labels.importantNote2}</li>
          <li>{labels.importantNote3}</li>
          <li>{labels.importantNote4}</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {labels.departPrefLabel}
        </h3>
        <FilterSeg
          onChange={onDepartPrefChange}
          options={departOptions}
          value={departPref}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {labels.arrivePrefLabel}
        </h3>
        <FilterSeg
          onChange={onArrivePrefChange}
          options={arriveOptions}
          value={arrivePref}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {labels.maxTravelTimeLabel}
        </h3>
        <FilterSeg
          onChange={onMaxTravelTimeChange}
          options={maxTravelTimeOptions}
          value={maxTravelTime}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {labels.climateLabel}
        </h3>
        <div className="inline-flex flex-wrap gap-2">
          {climateOptions.map((opt) => {
            const Icon = CLIMATE_ICONS[opt.key];
            const isSelected = climate === opt.key;
            return (
              <button
                className={cn(
                  'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition',
                  isSelected
                    ? 'border-gray-800 bg-gray-800 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100',
                )}
                key={opt.key}
                onClick={() => onClimateChange(opt.key)}
                type="button"
              >
                {Icon ? <Icon size={16} /> : null}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {labels.avoidLabel}
        </h3>
        <p className="text-sm text-gray-500">{labels.avoidHint}</p>
        <AvoidGrid
          experienceLevel={experience}
          labels={{
            loading: labels.avoidGridLoading,
            otherDestinationsButton: labels.avoidGridButton,
            searchModal: labels.avoidSearchModal,
          }}
          originCity={originCity}
          originCountry={originCountry}
        />
      </div>

      <div className="mt-8 flex items-center justify-center gap-10 border-t border-gray-200 pt-6">
        <button
          className="text-sm font-medium text-gray-900 underline hover:no-underline"
          onClick={onClear}
          type="button"
        >
          {labels.clearButton}
        </button>
        <Button
          className="text-sm font-normal normal-case"
          onClick={onSave}
          size="md"
          type="button"
          variant="default"
        >
          {labels.saveFiltersButton}
        </Button>
      </div>
    </div>
  );
}
