'use client';
import { useJourneyStore } from '@/store/journeyStore';

export function JourneyTabs({ logistics, filters }:{ logistics: React.ReactNode; filters: React.ReactNode }) {
  const { activeTab, setPartial } = useJourneyStore();
  const TabBtn = ({ id, label }:{ id:'logistics'|'filters'; label:string }) => (
    <button
      onClick={() => setPartial({ activeTab: id })}
      className={`px-4 py-2 rounded-xl border ${activeTab===id ? 'bg-white text-neutral-900 border-neutral-300 shadow-sm' : 'bg-neutral-100 text-neutral-600 border-transparent'}`}
    >
      {label}
    </button>
  );
  return (
    <div>
      <div className="mb-4 flex gap-2">
        <TabBtn id="logistics" label="Planificá tu Aventura Sorpresa" />
        <TabBtn id="filters" label="Filtros Premium" />
      </div>
      <div>{activeTab==='logistics' ? logistics : filters}</div>
    </div>
  );
}