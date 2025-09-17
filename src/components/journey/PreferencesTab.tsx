'use client';

import SelectedFiltersChips from './SelectedFiltersChips';
import StepperNav from './StepperNav';
import { useStore } from '@/store/store';
import { useQuerySync } from '@/hooks/useQuerySync';

const Seg = ({options,value,onChange}:{options:string[];value:string;onChange:(v:string)=>void}) => (
  <div className="inline-flex flex-wrap gap-2">
    {options.map(opt=>(
      <button
        key={opt}
        type="button"
        onClick={()=>onChange(opt)}
        className={`px-3 py-1.5 rounded-full text-sm border transition
          ${value===opt ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200'}`}
      >
        {opt}
      </button>
    ))}
  </div>
);

export default function PreferencesTab(){
  const { filters, setPartial } = useStore();
  const sync = useQuerySync();

  const setAndSync = (patch: Partial<typeof filters>) => {
    setPartial({ filters: { ...filters, ...patch } });
    sync(patch as Record<string, string>);
  };

  return (
    <div className="space-y-6">
      <SelectedFiltersChips />
      <div className="rounded-xl bg-neutral-50 text-neutral-700 p-3 text-sm">
        <strong>Freemium:</strong> el primer filtro opcional es <strong>gratis</strong>.
        2–3 filtros: <strong>USD 18</strong> c/u. 4+ filtros: <strong>USD 25</strong> c/u.
        Transporte es obligatorio y no suma costo.
      </div>

      {/* Transporte (obligatorio) */}
      <section className="space-y-2">
        <h3 className="font-medium">Transporte preferido (obligatorio)</h3>
        <Seg
          options={['avion','bus','tren','barco']}
          value={filters.transport}
          onChange={(v)=>setAndSync({ transport: v as any })}
        />
        <p className="text-xs text-neutral-500">Tren y Barco/Crucero podrían requerir traslados extra.</p>
      </section>

      {/* Clima */}
      <section className="space-y-2">
        <h3 className="font-medium">Clima preferencial</h3>
        <Seg
          options={['indistinto','calido','frio','templado']}
          value={filters.climate}
          onChange={(v)=>setAndSync({ climate: v as any })}
        />
      </section>

      {/* Tiempo máximo de viaje */}
      <section className="space-y-2">
        <h3 className="font-medium">Tiempo máximo de viaje</h3>
        <Seg
          options={['sin-limite','3h','5h','8h']}
          value={filters.maxTravelTime}
          onChange={(v)=>setAndSync({ maxTravelTime: v as any })}
        />
      </section>

      {/* Horarios */}
      <section className="space-y-2">
        <h3 className="font-medium">Horarios preferidos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="mb-1 text-sm">Salida</div>
            <Seg
              options={['indistinto','manana','tarde','noche']}
              value={filters.departPref}
              onChange={(v)=>setAndSync({ departPref: v as any })}
            />
          </div>
          <div>
            <div className="mb-1 text-sm">Llegada</div>
            <Seg
              options={['indistinto','manana','tarde','noche']}
              value={filters.arrivePref}
              onChange={(v)=>setAndSync({ arrivePref: v as any })}
            />
          </div>
        </div>
      </section>

      <StepperNav />
    </div>
  );
}
