'use client';
import { useJourneyStore } from '@/store/journeyStore';

type TabId = 'logistics'|'preferences'|'avoid';

export function JourneyTabs({
  logistics, preferences, avoid,
}:{ logistics: React.ReactNode; preferences: React.ReactNode; avoid: React.ReactNode }) {
  const { activeTab, setPartial } = useJourneyStore();
  const setTab = (t:TabId) => setPartial({ activeTab: t });

  const Btn = ({id,label}:{id:TabId;label:string}) => (
    <button
      onClick={()=>setTab(id)}
      className={`px-4 py-2 rounded-xl border transition ${
        activeTab===id
          ? 'bg-white text-neutral-900 border-neutral-300 shadow-sm'
          : 'bg-neutral-100 text-neutral-600 border-transparent hover:bg-neutral-200'
      }`}
    >
      {label}
    </button>
  );

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