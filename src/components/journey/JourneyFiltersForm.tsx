'use client';

import {
  Cloud,
  Info,
  Snowflake,
  Sparkle,
  Sun,
  Thermometer,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import AvoidGrid from '@/components/journey/avoid/AvoidGrid';
import { cn } from '@/lib/utils';

export interface FilterOption {
  key: string;
  label: string;
  /** When set, an info icon is shown and hover displays this tooltip. */
  tooltip?: string;
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
        <div
          className="group relative inline-flex"
          key={opt.key}
        >
          <button
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition cursor-pointer',
              value === opt.key
                ? 'border-gray-800 bg-gray-800 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100',
            )}
            onClick={() => onChange(opt.key)}
            type="button"
          >
            <span>{opt.label}</span>
            {opt.tooltip ? (
              <Info
                aria-hidden
                className={cn(
                  'h-3.5 w-3.5 shrink-0',
                  value === opt.key ? 'text-white' : 'text-gray-500',
                )}
              />
            ) : null}
          </button>
          {opt.tooltip ? (
            <span
              className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 min-w-[320px] max-w-[320px] -translate-x-1/2 rounded-md border border-gray-200 bg-gray-900 px-3 py-2 text-left text-xs font-normal leading-snug text-white shadow-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100 [width:320px]"
              role="tooltip"
            >
              {opt.tooltip}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

const CLIMATE_ICONS: Record<string, typeof Sun> = {
  any: Thermometer,
  cold: Snowflake,
  mild: Cloud,
  warm: Sun,
};

export interface JourneyFiltersFormLabels {
  accommodationTypeLabel?: string;
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
  /** Localized filter option lists from dictionary; must exist. Optionally include `tooltip` for accommodation types. */
  filterOptions: {
    accommodationType: {
      label: string;
      options: Array<{ key: string; label: string; tooltip?: string }>;
    };
    arrivePref: { label: string; options: Array<{ key: string; label: string }> };
    climate: { label: string; options: Array<{ key: string; label: string }> };
    departPref: { label: string; options: Array<{ key: string; label: string }> };
    maxTravelTime: { label: string; options: Array<{ key: string; label: string }> };
    transport: { label: string; options: Array<{ key: string; label: string }> };
  };
  importantNote1: string;
  importantNote2: string;
  importantNote3: string;
  importantNote4: string;
  importantTitle: string;
  maxTravelTimeLabel: string;
  saveFiltersButton: string;
}

export interface JourneyFiltersFormProps {
  accommodationType: string | undefined;
  arrivePref: string | undefined;
  climate: string | undefined;
  departPref: string | undefined;
  experience?: string;
  labels: JourneyFiltersFormLabels;
  maxTravelTime: string | undefined;
  onAccommodationTypeChange: (value: string) => void;
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
  accommodationType,
  arrivePref,
  climate,
  departPref,
  experience,
  labels: labelsProp,
  maxTravelTime,
  onAccommodationTypeChange,
  onArrivePrefChange,
  onClear,
  onClimateChange,
  onDepartPrefChange,
  onMaxTravelTimeChange,
  onSave,
  originCity,
  originCountry,
}: JourneyFiltersFormProps) {
  const accommodationTypeOptions: FilterOption[] =
    labelsProp.filterOptions.accommodationType.options.map((o) => ({
      key: o.key,
      label: o.label,
      tooltip: o.tooltip,
    }));
  const departOptions = labelsProp.filterOptions.departPref.options.map((o) => ({
    key: o.key,
    label: o.label,
  }));
  const arriveOptions = labelsProp.filterOptions.arrivePref.options.map((o) => ({
    key: o.key,
    label: o.label,
  }));
  const maxTravelTimeOptions =
    labelsProp.filterOptions.maxTravelTime.options.map((o) => ({
      key: o.key,
      label: o.label,
    }));
  const climateOptions = labelsProp.filterOptions.climate.options.map((o) => ({
    key: o.key,
    label: o.label,
  }));

  return (
    <div className="space-y-8">
      <div className="rounded-lg bg-[#E8F4FC] p-4 text-sm">
        <div className="mb-2 flex items-center gap-2">
          <Sparkle
            aria-hidden
            className="h-4 w-4 shrink-0 text-[#5B7A8C] fill-[#5B7A8C]"
          />
          <span className="text-base font-bold text-gray-900">
            {labelsProp.importantTitle}
          </span>
        </div>
        <ul className="grid list-outside list-disc grid-cols-2 gap-x-6 gap-y-1 pl-4 text-sm font-normal text-gray-900">
          <li>{labelsProp.importantNote1}</li>
          <li>{labelsProp.importantNote2}</li>
          <li>{labelsProp.importantNote3}</li>
          <li>{labelsProp.importantNote4}</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {labelsProp.departPrefLabel}
        </h3>
        <FilterSeg
          onChange={onDepartPrefChange}
          options={departOptions}
          value={departPref}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {labelsProp.arrivePrefLabel}
        </h3>
        <FilterSeg
          onChange={onArrivePrefChange}
          options={arriveOptions}
          value={arrivePref}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {labelsProp.maxTravelTimeLabel}
        </h3>
        <FilterSeg
          onChange={onMaxTravelTimeChange}
          options={maxTravelTimeOptions}
          value={maxTravelTime}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {labelsProp.climateLabel}
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
          {labelsProp?.accommodationTypeLabel ??
            labelsProp?.filterOptions?.accommodationType?.label}
        </h3>
        <FilterSeg
          onChange={onAccommodationTypeChange}
          options={accommodationTypeOptions}
          value={accommodationType}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {labelsProp.avoidLabel}
        </h3>
        <p className="text-sm text-gray-500">{labelsProp.avoidHint}</p>
        <AvoidGrid
          experienceLevel={experience}
          labels={{
            loading: labelsProp.avoidGridLoading,
            otherDestinationsButton: labelsProp.avoidGridButton,
            searchModal: labelsProp.avoidSearchModal,
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
          {labelsProp.clearButton}
        </button>
        <Button
          className="text-sm font-normal normal-case"
          onClick={onSave}
          size="md"
          type="button"
          variant="default"
        >
          {labelsProp.saveFiltersButton}
        </Button>
      </div>
    </div>
  );
}
