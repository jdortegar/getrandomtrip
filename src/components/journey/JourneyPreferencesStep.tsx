'use client';

import { useMemo } from 'react';
import { Accordion } from '@/components/ui/accordion';
import { AddonsSelector } from '@/components/journey/addons/AddonsSelector';
import { JourneyDropdown } from '@/components/journey/JourneyDropdown';
import { JourneyFiltersForm } from '@/components/journey/JourneyFiltersForm';
import { ADDONS } from '@/lib/data/shared/addons-catalog';
import { FILTER_OPTIONS } from '@/store/slices/journeyStore';

interface JourneyPreferencesStepProps {
  addons: string | undefined;
  arrivePref: string | undefined;
  climate: string | undefined;
  departPref: string | undefined;
  experience?: string;
  maxTravelTime: string | undefined;
  onAddonsChange: (value: string | undefined) => void;
  onArrivePrefChange: (value: string) => void;
  onClearFilters: () => void;
  onClimateChange: (value: string) => void;
  onDepartPrefChange: (value: string) => void;
  onMaxTravelTimeChange: (value: string) => void;
  onOpenSection: (id: string) => void;
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
  maxTravelTime,
  onAddonsChange,
  onArrivePrefChange,
  onClearFilters,
  onClimateChange,
  onDepartPrefChange,
  onMaxTravelTimeChange,
  onOpenSection,
  openSectionId,
  originCity,
  originCountry,
  transport,
}: JourneyPreferencesStepProps) {
  const filtersSummary = useMemo(() => {
    const parts: string[] = [];
    if (transport) {
      const opt = FILTER_OPTIONS.transport.options.find(
        (o) => o.key === transport,
      );
      if (opt) parts.push(opt.label);
    }
    if (departPref && departPref !== 'indistinto') {
      const opt = FILTER_OPTIONS.departPref.options.find(
        (o) => o.key === departPref,
      );
      if (opt) parts.push(`Salida: ${opt.label}`);
    }
    if (arrivePref && arrivePref !== 'indistinto') {
      const opt = FILTER_OPTIONS.arrivePref.options.find(
        (o) => o.key === arrivePref,
      );
      if (opt) parts.push(`Llegada: ${opt.label}`);
    }
    if (maxTravelTime && maxTravelTime !== 'sin-limite') {
      const opt = FILTER_OPTIONS.maxTravelTime.options.find(
        (o) => o.key === maxTravelTime,
      );
      if (opt) parts.push(`Tiempo: ${opt.label}`);
    }
    if (climate && climate !== 'indistinto') {
      const opt = FILTER_OPTIONS.climate.options.find((o) => o.key === climate);
      if (opt) parts.push(`Clima: ${opt.label}`);
    }
    return parts.length > 0
      ? parts.join(', ')
      : 'Transporte, horarios, clima, destinos a evitar';
  }, [arrivePref, climate, departPref, maxTravelTime, transport]);

  const addonsSummary = useMemo(() => {
    if (!addons) return 'Elegí tus add-ons.';
    const ids = addons
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) return 'Elegí tus add-ons.';
    const labels = ids
      .map((id) => ADDONS.find((a) => a.id === id)?.title ?? id)
      .filter(Boolean);
    return labels.length > 0 ? labels.join(', ') : 'Elegí tus add-ons.';
  }, [addons]);

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
          label="Filtros"
          value="filters"
        >
          <div className="space-y-10">
            <JourneyFiltersForm
              arrivePref={arrivePref}
              climate={climate}
              departPref={departPref}
              experience={experience}
              maxTravelTime={maxTravelTime}
              onArrivePrefChange={onArrivePrefChange}
              onClear={onClearFilters}
              onClimateChange={onClimateChange}
              onDepartPrefChange={onDepartPrefChange}
              onMaxTravelTimeChange={onMaxTravelTimeChange}
              onSave={() => onOpenSection('addons')}
              originCity={originCity}
              originCountry={originCountry}
            />
          </div>
        </JourneyDropdown>

        <JourneyDropdown content={addonsSummary} label="Extras" value="addons">
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
