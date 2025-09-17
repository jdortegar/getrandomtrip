'use client';
import { useStore } from '@/store/store';

type TabId = 'logistics'|'preferences'|'avoid';

export function JourneyTabs({
  logistics, preferences, avoid,
}:{ logistics: React.ReactNode; preferences: React.ReactNode; avoid: React.ReactNode }) {
  const { activeTab, setPartial } = useStore();
  const setTab = (t:TabId) => setPartial({ activeTab: t });

  const Btn = ({id,label}:{id:TabId;label:string}) => {
    const active = activeTab===id;
    return (
      <button
        onClick={()=>setTab(id)}
        aria-current={active ? 'page' : undefined}
        className={`px-4 py-2 rounded-xl border transition relative
          ${active
            ? 'bg-white text-neutral-900 border-neutral-300 shadow-sm ring-2 ring-violet-500'
            : 'bg-neutral-100 text-neutral-600 border-transparent hover:bg-neutral-200'
          }`}
        data-active={active ? 'true' : 'false'}
      >
        {label}
      </button>
    );
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Btn id="logistics" label="Planificá tu Aventura Sorpresa" />
        <Btn id="preferences" label="Preferencias y Filtros" />
        <Btn id="avoid" label="Destinos a evitar" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-neutral-200 p-4 text-neutral-900">
        {activeTab==='logistics' && logistics}
        {activeTab==='preferences' && preferences}
        {activeTab==='avoid' && avoid}
      </div>
    </div>
  );
}
