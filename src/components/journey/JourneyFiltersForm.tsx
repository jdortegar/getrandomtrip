'use client';

import { Cloud, Snowflake, Sun, Thermometer } from 'lucide-react';
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

export interface JourneyFiltersFormProps {
  arrivePref: string | undefined;
  climate: string | undefined;
  departPref: string | undefined;
  experience?: string;
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
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Horarios preferidos de salida (opcional)
        </h3>
        <FilterSeg
          onChange={onDepartPrefChange}
          options={FILTER_OPTIONS.departPref.options}
          value={departPref}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Horarios preferidos de llegada
        </h3>
        <FilterSeg
          onChange={onArrivePrefChange}
          options={FILTER_OPTIONS.arrivePref.options}
          value={arrivePref}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Tiempo máximo de viaje
        </h3>
        <FilterSeg
          onChange={onMaxTravelTimeChange}
          options={FILTER_OPTIONS.maxTravelTime.options}
          value={maxTravelTime}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Clima preferencial
        </h3>
        <div className="inline-flex flex-wrap gap-2">
          {FILTER_OPTIONS.climate.options.map((opt) => {
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
          Destinos a evitar (opcional)
        </h3>
        <p className="text-sm text-gray-500">Seleccioná hasta 15</p>
        <AvoidGrid />
      </div>

      <div className="mt-8 flex items-center justify-center gap-10 border-t border-gray-200 pt-6">
        <button
          className="text-sm font-medium text-gray-900 underline hover:no-underline"
          onClick={onClear}
          type="button"
        >
          Borrar
        </button>
        <Button
          className="text-sm font-normal normal-case"
          onClick={onSave}
          size="md"
          type="button"
          variant="default"
        >
          Guardar Filtros
        </Button>
      </div>
    </div>
  );
}
