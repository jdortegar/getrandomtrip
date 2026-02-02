'use client';

import { useMemo } from 'react';
import { ADDONS } from '@/lib/data/shared/addons-catalog';
import { JourneySectionCard } from '@/components/journey/JourneySectionCard';
import { FILTER_OPTIONS } from '@/store/slices/journeyStore';
import { cn } from '@/lib/utils';

interface Option {
  key: string;
  label: string;
}

function Seg({
  onChange,
  options,
  value,
}: {
  onChange: (v: string) => void;
  options: Option[];
  value: string | undefined;
}) {
  return (
    <div className="inline-flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          className={cn(
            'px-3 py-1.5 rounded-full text-sm border transition',
            value === opt.key
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-200',
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

function toggleCsv(value: string | undefined, item: string) {
  const cur = (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const has = cur.includes(item);
  const next = has ? cur.filter((x) => x !== item) : [...cur, item];
  return next.length ? next.join(',') : undefined;
}

interface JourneyPreferencesStepProps {
  addons: string | undefined; // csv
  arrivePref: string | undefined;
  climate: string | undefined;
  departPref: string | undefined;
  maxTravelTime: string | undefined;
  onAddonsChange: (value: string | undefined) => void;
  onArrivePrefChange: (value: string) => void;
  onClimateChange: (value: string) => void;
  onDepartPrefChange: (value: string) => void;
  onMaxTravelTimeChange: (value: string) => void;
  onOpenSection: (id: string) => void;
  onTransportChange: (value: string) => void;
  openSectionId: string;
  transport: string | undefined;
}

export function JourneyPreferencesStep({
  addons,
  arrivePref,
  climate,
  departPref,
  maxTravelTime,
  onAddonsChange,
  onArrivePrefChange,
  onClimateChange,
  onDepartPrefChange,
  onMaxTravelTimeChange,
  onOpenSection,
  onTransportChange,
  openSectionId,
  transport,
}: JourneyPreferencesStepProps) {
  const isFiltersOpen = openSectionId === 'filters';
  const isAddonsOpen = openSectionId === 'addons';

  const groupedAddons = useMemo(() => {
    const list = ADDONS.filter((a) => a.purchaseType === 'prePurchase');
    const m: Record<string, typeof list> = {};
    list.forEach((a) => (m[a.category] ??= []).push(a));
    return m;
  }, []);

  const addonCategories = Object.keys(groupedAddons);

  return (
    <div className="space-y-6">
      <JourneySectionCard
        actionLabel={isFiltersOpen ? 'Cerrar' : 'Filtrar'}
        description="Personalizá tus preferencias de viaje."
        isOpen={isFiltersOpen}
        onActionClick={() => onOpenSection(isFiltersOpen ? '' : 'filters')}
        title="Filtros"
      >
        <div className="space-y-10">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Transporte preferido (obligatorio)
            </h3>
            <Seg
              onChange={onTransportChange}
              options={FILTER_OPTIONS.transport.options}
              value={transport}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Horarios preferidos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-sm text-gray-700">Salida</div>
                <Seg
                  onChange={onDepartPrefChange}
                  options={FILTER_OPTIONS.departPref.options}
                  value={departPref}
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-700">Llegada</div>
                <Seg
                  onChange={onArrivePrefChange}
                  options={FILTER_OPTIONS.arrivePref.options}
                  value={arrivePref}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Tiempo máximo de viaje
            </h3>
            <Seg
              onChange={onMaxTravelTimeChange}
              options={FILTER_OPTIONS.maxTravelTime.options}
              value={maxTravelTime}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Clima preferencial
            </h3>
            <Seg
              onChange={onClimateChange}
              options={FILTER_OPTIONS.climate.options}
              value={climate}
            />
          </div>
        </div>
      </JourneySectionCard>

      <JourneySectionCard
        actionLabel={isAddonsOpen ? 'Cerrar' : 'Add-ons'}
        description="Elegí tus add-ons."
        isOpen={isAddonsOpen}
        onActionClick={() => onOpenSection(isAddonsOpen ? '' : 'addons')}
        title="Extras"
      >
        <div className="space-y-4">
          {addonCategories.map((cat) => (
            <div
              className="border border-gray-200 rounded-lg overflow-hidden bg-white"
              key={cat}
            >
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">{cat}</h3>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {groupedAddons[cat].map((addon) => {
                  const isSelected = (addons || '')
                    .split(',')
                    .filter(Boolean)
                    .includes(addon.id);
                  return (
                    <button
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm border transition',
                        isSelected
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-200',
                      )}
                      key={addon.id}
                      onClick={() => onAddonsChange(toggleCsv(addons, addon.id))}
                      type="button"
                    >
                      {addon.title}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </JourneySectionCard>
    </div>
  );
}

