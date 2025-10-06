'use client';

import SelectedFiltersChips from './SelectedFiltersChips';
import { useStore } from '@/store/store';
import { useQuerySync } from '@/hooks/useQuerySync';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FILTER_OPTIONS, FilterOption } from '@/store/slices/journeyStore';
import AvoidGrid from './avoid/AvoidGrid';

const Seg = ({
  options,
  value,
  onChange,
  className,
}: {
  options: FilterOption[];
  value: FilterOption['key'];
  onChange: (v: FilterOption['key']) => void;
  className?: string;
}) => (
  <div className={cn('inline-flex flex-wrap gap-2', className)}>
    {options.map((opt) => (
      <button
        key={opt.key}
        type="button"
        onClick={() => onChange(opt.key)}
        className={`px-3 py-1.5 rounded-full text-sm border transition
          ${value === opt.key ? 'bg-primary-900 text-white border-primary-900' : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-200'}`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export default function PreferencesTab() {
  const { filters, setPartial } = useStore();
  // const sync = useQuerySync();

  const setAndSync = (patch: Partial<typeof filters>) => {
    setPartial({ filters: { ...filters, ...patch } });
    // sync(patch as Record<string, string>);
  };

  return (
    <div className="space-y-10 font-jost">
      {/* Transporte (obligatorio) */}
      <div className="space-y-6 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex justify-center">
          <div className="flex flex-col gap-1 space-y-6">
            <h3 className="font-medium text-center">
              Transporte preferido (obligatorio)
            </h3>
            <Seg
              options={FILTER_OPTIONS.transport.options}
              value={filters.transport}
              onChange={(v) => setAndSync({ transport: v })}
              className="justify-center"
            />
            <p className="text-xs text-neutral-500 text-center">
              Tren y Barco/Crucero podrían requerir traslados extra.
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <h3 className="font-medium">Horarios preferidos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 text-left ">
            <div className="text-sm mb-1">Salida</div>
            <Seg
              options={FILTER_OPTIONS.departPref.options}
              value={filters.departPref}
              onChange={(v) => setAndSync({ departPref: v })}
            />
          </div>
          <div className="flex flex-col gap-1 text-left ">
            <div className="text-sm mb-1">Llegada</div>
            <Seg
              options={FILTER_OPTIONS.arrivePref.options}
              value={filters.arrivePref}
              onChange={(v) => setAndSync({ arrivePref: v })}
            />
          </div>
        </div>
        <div className="border-t border-gray-200 my-2"></div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 space-y-6">
            <h3 className="font-medium text-left">Tiempo máximo de viaje</h3>
            <Seg
              options={FILTER_OPTIONS.maxTravelTime.options}
              value={filters.maxTravelTime}
              onChange={(v) => setAndSync({ maxTravelTime: v })}
            />
          </div>
          <div className="flex flex-col gap-1 space-y-6">
            <h3 className="font-medium text-left">Clima preferencial</h3>
            <Seg
              options={FILTER_OPTIONS.climate.options}
              value={filters.climate}
              onChange={(v) => setAndSync({ climate: v })}
            />
          </div>
        </div>
        <div className="border-t border-gray-200 my-2"></div>
      </div>
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="flex flex-col w-full  ">
            <h3 className="font-medium text-left">
              Destinos a evitar (opcional)
            </h3>
            <p className="text-sm text-neutral-500 text-left mb-6">
              Seleccioná hasta 15
            </p>
            <AvoidGrid />
          </div>
        </div>
      </div>
    </div>
  );
}
