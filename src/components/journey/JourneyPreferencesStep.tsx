'use client';

import { useMemo } from 'react';
import { Accordion } from '@/components/ui/accordion';
import { AddonsSelector } from '@/components/journey/addons/AddonsSelector';
import { JourneyDropdown } from '@/components/journey/JourneyDropdown';
import { JourneyFiltersForm } from '@/components/journey/JourneyFiltersForm';
import type { JourneyFiltersFormLabels } from '@/components/journey/JourneyFiltersForm';
import { ADDONS } from '@/lib/data/shared/addons-catalog';
import { JOURNEY_ADDONS_ENABLED } from 'config/journey-features';

export interface JourneyPreferencesStepLabels {
  addonsClearButton: string;
  addonsEmptyMessage: string;
  addonsHint: string;
  addonsLabel: string;
  addonsPlaceholder: string;
  addonsSaveButton: string;
  filtersForm: JourneyFiltersFormLabels;
  filtersLabel: string;
  filterOptions: {
    accommodationType: { label: string; options: Array<{ key: string; label: string; tooltip?: string }> };
    arrivePref: { label: string; options: Array<{ key: string; label: string }> };
    climate: { label: string; options: Array<{ key: string; label: string }> };
    departPref: { label: string; options: Array<{ key: string; label: string }> };
    maxTravelTime: { label: string; options: Array<{ key: string; label: string }> };
    transport: { label: string; options: Array<{ key: string; label: string }> };
  };
  filtersSummaryAccommodation: string;
  filtersSummaryArrive: string;
  filtersSummaryClimate: string;
  filtersSummaryDefault: string;
  filtersSummaryDepart: string;
  filtersSummaryTime: string;
}

interface JourneyPreferencesStepProps {
  accommodationType: string | undefined;
  addons: string | undefined;
  addonLabels?: Record<
    string,
    {
      category: string;
      longDescription: string;
      shortDescription: string;
      title: string;
    }
  >;
  arrivePref: string | undefined;
  climate: string | undefined;
  departPref: string | undefined;
  experience?: string;
  labels: JourneyPreferencesStepLabels;
  maxTravelTime: string | undefined;
  onAccommodationTypeChange: (value: string) => void;
  onAddonsChange: (value: string | undefined) => void;
  onArrivePrefChange: (value: string) => void;
  onClimateChange: (value: string) => void;
  onDepartPrefChange: (value: string) => void;
  onMaxTravelTimeChange: (value: string) => void;
  onOpenSection: (id: string) => void;
  /** Called after addons save (e.g. scroll to actions). */
  onAfterAddonsSave?: () => void;
  openSectionId: string;
  originCity: string;
  originCountry: string;
  transport: string | undefined;
}

export function JourneyPreferencesStep({
  accommodationType,
  addons,
  addonLabels,
  arrivePref,
  climate,
  departPref,
  experience,
  labels: labelsProp,
  maxTravelTime,
  onAccommodationTypeChange,
  onAddonsChange,
  onArrivePrefChange,
  onClimateChange,
  onDepartPrefChange,
  onMaxTravelTimeChange,
  onOpenSection,
  onAfterAddonsSave,
  openSectionId,
  originCity,
  originCountry,
  transport,
}: JourneyPreferencesStepProps) {
  const labels = useMemo(
    () => ({
      ...labelsProp,
      filtersForm: {
        ...labelsProp.filtersForm,
        filterOptions: labelsProp.filtersForm.filterOptions ?? labelsProp.filterOptions,
      },
    }),
    [labelsProp],
  );

  const filtersSummary = useMemo(() => {
    const fo = labels.filterOptions;
    const parts: string[] = [];
    if (departPref && departPref !== 'any') {
      const label =
        fo?.departPref?.options.find((o) => o.key === departPref)?.label ??
        departPref;
      parts.push(`${labels.filtersSummaryDepart}: ${label}`);
    }
    if (arrivePref && arrivePref !== 'any') {
      const label =
        fo?.arrivePref?.options.find((o) => o.key === arrivePref)?.label ??
        arrivePref;
      parts.push(`${labels.filtersSummaryArrive}: ${label}`);
    }
    if (maxTravelTime && maxTravelTime !== 'no-limit') {
      const label =
        fo?.maxTravelTime?.options.find((o) => o.key === maxTravelTime)
          ?.label ?? maxTravelTime;
      parts.push(`${labels.filtersSummaryTime}: ${label}`);
    }
    if (climate && climate !== 'any') {
      const label =
        fo?.climate?.options.find((o) => o.key === climate)?.label ?? climate;
      parts.push(`${labels.filtersSummaryClimate}: ${label}`);
    }
    if (accommodationType && accommodationType !== 'any') {
      const label =
        fo?.accommodationType?.options.find((o) => o.key === accommodationType)
          ?.label ?? accommodationType;
      parts.push(`${labels.filtersSummaryAccommodation}: ${label}`);
    }
    return parts.length > 0 ? parts.join(', ') : labels.filtersSummaryDefault;
  }, [accommodationType, arrivePref, climate, departPref, labels, maxTravelTime, transport]);

  const addonsSummary = useMemo(() => {
    if (!addons) return labels.addonsPlaceholder;
    const ids = addons
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) return labels.addonsPlaceholder;
    const labelList = ids
      .map(
        (id) =>
          addonLabels?.[id]?.title ??
          ADDONS.find((a) => a.id === id)?.title ??
          id,
      )
      .filter(Boolean);
    return labelList.length > 0 ? labelList.join(', ') : labels.addonsPlaceholder;
  }, [addons, addonLabels, labels.addonsPlaceholder]);

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
              accommodationType={accommodationType}
              arrivePref={arrivePref}
              climate={climate}
              departPref={departPref}
              experience={experience}
              labels={labels.filtersForm}
              maxTravelTime={maxTravelTime}
              onAccommodationTypeChange={onAccommodationTypeChange}
              onArrivePrefChange={onArrivePrefChange}
              onClimateChange={onClimateChange}
              onDepartPrefChange={onDepartPrefChange}
              onMaxTravelTimeChange={onMaxTravelTimeChange}
              originCity={originCity}
              originCountry={originCountry}
            />
          </div>
        </JourneyDropdown>

        {JOURNEY_ADDONS_ENABLED ? (
          <div id="journey-addons">
            <JourneyDropdown
              content={addonsSummary}
              label={labels.addonsLabel}
              value="addons"
            >
              <AddonsSelector
                experience={experience}
                labels={{
                  addonLabels,
                  addonsClearButton: labels.addonsClearButton,
                  addonsEmptyMessage: labels.addonsEmptyMessage,
                  addonsHint: labels.addonsHint,
                  addonsSaveButton: labels.addonsSaveButton,
                }}
                onChange={onAddonsChange}
                onSave={() => {
                  onOpenSection('');
                  onAfterAddonsSave?.();
                }}
                value={addons}
              />
            </JourneyDropdown>
          </div>
        ) : null}
      </div>
    </Accordion>
  );
}
