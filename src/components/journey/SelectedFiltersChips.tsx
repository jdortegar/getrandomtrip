'use client';
import { X, Lock } from 'lucide-react';
import { useJourneyStore } from '@/store/journeyStore';

const LABELS = {
  transport: { avion: 'Avión', bus: 'Bus', tren: 'Tren', barco: 'Barco/Crucero' },
  climate: { indistinto: 'Indistinto', calido: 'Cálido', frio: 'Frío', templado: 'Templado' },
  maxTravelTime: { 'sin-limite': 'Sin límite', '3h': 'Hasta 3h', '5h': 'Hasta 5h', '8h': 'Hasta 8h' },
  daypart: { indistinto: 'Indistinto', manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' },
};

type Item = { key: string; label: string; locked?: boolean; onRemove?: () => void };

function Chip({ item }: { item: Item }) {
  const base =
    item.locked
      ? 'bg-neutral-200 text-neutral-700'
      : 'bg-violet-50 text-violet-800 border border-violet-200 hover:bg-violet-100';
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${base}`}>
      {item.label}
      {item.locked ? (
        <Lock size={14} className="opacity-60" />
      ) : (
        <button
          type="button"
          aria-label={`Quitar ${item.label}`}
          onClick={item.onRemove}
          className="ml-1 -mr-1 rounded p-0.5 hover:bg-violet-200"
        >
          <X size={14} />
        </button>
      )}
    </span>
  );
}

export default function SelectedFiltersChips() {
  const { filters, setPartial } = useJourneyStore();

  const items: Item[] = [];

  // Transporte (obligatorio, sin cargo) -> chip bloqueado
  items.push({
    key: 'transport',
    label: `Transporte: ${LABELS.transport[filters.transport]}`,
    locked: true,
  });

  // Clima
  if (filters.climate !== 'indistinto') {
    items.push({
      key: 'climate',
      label: `Clima: ${LABELS.climate[filters.climate]}`,
      onRemove: () => setPartial({ filters: { ...filters, climate: 'indistinto' } }),
    });
  }

  // Tiempo máx viaje
  if (filters.maxTravelTime !== 'sin-limite') {
    items.push({
      key: 'max',
      label: `Máx viaje: ${LABELS.maxTravelTime[filters.maxTravelTime]}`,
      onRemove: () => setPartial({ filters: { ...filters, maxTravelTime: 'sin-limite' } }),
    });
  }

  // Horarios
  if (filters.departPref !== 'indistinto') {
    items.push({
      key: 'depart',
      label: `Salida: ${LABELS.daypart[filters.departPref]}`,
      onRemove: () => setPartial({ filters: { ...filters, departPref: 'indistinto' } }),
    });
  }
  if (filters.arrivePref !== 'indistinto') {
    items.push({
      key: 'arrive',
      label: `Llegada: ${LABELS.daypart[filters.arrivePref]}`,
      onRemove: () => setPartial({ filters: { ...filters, arrivePref: 'indistinto' } }),
    });
  }

  // Destinos a evitar
  (filters.avoidDestinations || []).forEach((name) => {
    items.push({
      key: `avoid-${name.toLowerCase()}`,
      label: `Evitar: ${name}`,
      onRemove: () =>
        setPartial({
          filters: {
            ...filters,
            avoidDestinations: (filters.avoidDestinations || []).filter(
              (n) => n.toLowerCase() !== name.toLowerCase(),
            ),
          },
        }),
    });
  });

  // Valores por defecto para "Limpiar todo"
  const defaults = {
    transport: filters.transport, // obligatorio, mantener el actual
    climate: 'indistinto' as const,
    maxTravelTime: 'sin-limite' as const,
    departPref: 'indistinto' as const,
    arrivePref: 'indistinto' as const,
    avoidDestinations: [] as string[],
  };

  const clearAll = () => setPartial({ filters: { ...filters, ...defaults } });

  if (items.length === 1) return null; // sólo transporte (locked) -> ocultar barra

  return (
    <div className="mb-4 rounded-xl bg-neutral-50 ring-1 ring-neutral-200 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-700">
          Tus filtros ({items.length - 1})
        </span>
        <button
          type="button"
          onClick={clearAll}
          className="text-sm px-3 py-1 rounded-lg border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
        >
          Limpiar todo
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((it) => (
          <Chip key={it.key} item={it} />
        ))}
      </div>
    </div>
  );
}
