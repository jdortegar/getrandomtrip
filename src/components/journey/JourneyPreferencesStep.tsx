'use client';

import { useMemo } from 'react';
import { Accordion } from '@/components/ui/accordion';
import { AddonsSelector } from '@/components/journey/addons/AddonsSelector';
import { JourneyDropdown } from '@/components/journey/JourneyDropdown';
import { JourneyFiltersForm } from '@/components/journey/JourneyFiltersForm';
import type { JourneyFiltersFormLabels } from '@/components/journey/JourneyFiltersForm';
import { ADDONS } from '@/lib/data/shared/addons-catalog';
import { FILTER_OPTIONS } from '@/store/slices/journeyStore';

export interface JourneyPreferencesStepLabels {
  addonsLabel: string;
  addonsPlaceholder: string;
  filtersForm: JourneyFiltersFormLabels;
  filtersLabel: string;
  filterOptions?: {
    arrivePref: { label: string; options: Array<{ key: string; label: string }> };
    climate: { label: string; options: Array<{ key: string; label: string }> };
    departPref: { label: string; options: Array<{ key: string; label: string }> };
    maxTravelTime: { label: string; options: Array<{ key: string; label: string }> };
    transport: { label: string; options: Array<{ key: string; label: string }> };
  };
  filtersSummaryArrive: string;
  filtersSummaryClimate: string;
  filtersSummaryDefault: string;
  filtersSummaryDepart: string;
  filtersSummaryTime: string;
}

interface JourneyPreferencesStepProps {
  addons: string | undefined;
  arrivePref: string | undefined;
  climate: string | undefined;
  departPref: string | undefined;
  experience?: string;
  labels?: JourneyPreferencesStepLabels;
  maxTravelTime: string | undefined;
  onAddonsChange: (value: string | undefined) => void;
  onArrivePrefChange: (value: string) => void;
  onClearFilters: () => void;
  onClimateChange: (value: string) => void;
  onDepartPrefChange: (value: string) => void;
  onMaxTravelTimeChange: (value: string) => void;
  onOpenSection: (id: string) => void;
  onSaveFilters?: () => void;
  openSectionId: string;
  originCity: string;
  originCountry: string;
  transport: string | undefined;
}

export function JourneyPreferencesStep({
  addons,
  arrivePref,
  climate,
  departPref,
  experience,
  labels: labelsProp,
  maxTravelTime,
  onAddonsChange,
  onArrivePrefChange,
  onClearFilters,
  onClimateChange,
  onDepartPrefChange,
  onMaxTravelTimeChange,
  onOpenSection,
  onSaveFilters,
  openSectionId,
  originCity,
  originCountry,
  transport,
}: JourneyPreferencesStepProps) {
  const labels = useMemo(
    () => ({
      addonsLabel: labelsProp?.addonsLabel ?? 'Extras',
      addonsPlaceholder: labelsProp?.addonsPlaceholder ?? 'Elegí tus add-ons.',
      filtersForm: {
        arrivePrefLabel: labelsProp?.filtersForm?.arrivePrefLabel ?? 'Horarios preferidos de llegada',
        avoidGridButton: labelsProp?.filtersForm?.avoidGridButton ?? 'Otros destinos a evitar',
        avoidGridLoading: labelsProp?.filtersForm?.avoidGridLoading ?? 'Cargando ciudades...',
        avoidHint: labelsProp?.filtersForm?.avoidHint ?? 'Seleccioná hasta 15',
        avoidLabel: labelsProp?.filtersForm?.avoidLabel ?? 'Destinos a evitar (opcional)',
        avoidSearchModal: labelsProp?.filtersForm?.avoidSearchModal,
        clearButton: labelsProp?.filtersForm?.clearButton ?? 'Borrar',
        climateLabel: labelsProp?.filtersForm?.climateLabel ?? 'Clima preferencial',
        departPrefLabel: labelsProp?.filtersForm?.departPrefLabel ?? 'Horarios preferidos de salida (opcional)',
        filterOptions: labelsProp?.filtersForm?.filterOptions ?? labelsProp?.filterOptions,
        maxTravelTimeLabel: labelsProp?.filtersForm?.maxTravelTimeLabel ?? 'Tiempo máximo de viaje',
        saveFiltersButton: labelsProp?.filtersForm?.saveFiltersButton ?? 'Guardar Filtros',
      },
      filtersLabel: labelsProp?.filtersLabel ?? 'Filtros',
      filtersSummaryArrive: labelsProp?.filtersSummaryArrive ?? 'Llegada',
      filtersSummaryClimate: labelsProp?.filtersSummaryClimate ?? 'Clima',
      filtersSummaryDefault:
        labelsProp?.filtersSummaryDefault ??
        'Transporte, horarios, clima, destinos a evitar',
      filtersSummaryDepart: labelsProp?.filtersSummaryDepart ?? 'Salida',
      filtersSummaryTime: labelsProp?.filtersSummaryTime ?? 'Tiempo',
      filterOptions: labelsProp?.filterOptions,
    }),
    [labelsProp],
  );

  const filtersSummary = useMemo(() => {
    const fo = labels.filterOptions;
    const parts: string[] = [];
    if (departPref && departPref !== 'indistinto') {
      const opt = fo?.departPref?.options.find((o) => o.key === departPref) ?? FILTER_OPTIONS.departPref.options.find((o) => o.key === departPref);
      if (opt) parts.push(`${labels.filtersSummaryDepart}: ${opt.label ?? departPref}`);
    }
    if (arrivePref && arrivePref !== 'indistinto') {
      const opt = fo?.arrivePref?.options.find((o) => o.key === arrivePref) ?? FILTER_OPTIONS.arrivePref.options.find((o) => o.key === arrivePref);
      if (opt) parts.push(`${labels.filtersSummaryArrive}: ${opt.label ?? arrivePref}`);
    }
    if (maxTravelTime && maxTravelTime !== 'sin-limite') {
      const opt = fo?.maxTravelTime?.options.find((o) => o.key === maxTravelTime) ?? FILTER_OPTIONS.maxTravelTime.options.find((o) => o.key === maxTravelTime);
      if (opt) parts.push(`${labels.filtersSummaryTime}: ${opt.label ?? maxTravelTime}`);
    }
    if (climate && climate !== 'indistinto') {
      const opt = fo?.climate?.options.find((o) => o.key === climate) ?? FILTER_OPTIONS.climate.options.find((o) => o.key === climate);
      if (opt) parts.push(`${labels.filtersSummaryClimate}: ${opt.label ?? climate}`);
    }
    return parts.length > 0 ? parts.join(', ') : labels.filtersSummaryDefault;
  }, [arrivePref, climate, departPref, labels, maxTravelTime, transport]);

  const addonsSummary = useMemo(() => {
    if (!addons) return labels.addonsPlaceholder;
    const ids = addons
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) return labels.addonsPlaceholder;
    const labelList = ids
      .map((id) => ADDONS.find((a) => a.id === id)?.title ?? id)
      .filter(Boolean);
    return labelList.length > 0 ? labelList.join(', ') : labels.addonsPlaceholder;
  }, [addons, labels.addonsPlaceholder]);

  return (
    <Accordion
      collapsible
      onValueChange={onOpenSection}
      type="single"
      value={openSectionId}
    >
      <div className="space-y-4">
        <JourneyDropdown
          content={filtersSummary}
          label={labels.filtersLabel}
          value="filters"
        >
          <div className="space-y-10">
            <JourneyFiltersForm
              arrivePref={arrivePref}
              climate={climate}
              departPref={departPref}
              experience={experience}
              labels={labels.filtersForm}
              maxTravelTime={maxTravelTime}
              onArrivePrefChange={onArrivePrefChange}
              onClear={onClearFilters}
              onClimateChange={onClimateChange}
              onDepartPrefChange={onDepartPrefChange}
              onMaxTravelTimeChange={onMaxTravelTimeChange}
              onSave={onSaveFilters ?? (() => onOpenSection('addons'))}
              originCity={originCity}
              originCountry={originCountry}
            />
          </div>
        </JourneyDropdown>

        <JourneyDropdown
          content={addonsSummary}
          label={labels.addonsLabel}
          value="addons"
        >
          <AddonsSelector
            experience={experience}
            onChange={onAddonsChange}
            onSave={() => onOpenSection('')}
            value={addons}
          />
        </JourneyDropdown>
      </div>
    </Accordion>
  );
}
