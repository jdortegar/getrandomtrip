'use client';
import { useJourneyStore } from '@/store/journeyStore';

const LABELS = {
  transport: { avion: 'Avión', bus: 'Bus', tren: 'Tren', barco: 'Barco/Crucero' } as const,
  climate: { indistinto: 'Indistinto', calido: 'Cálido', frio: 'Frío', templado: 'Templado' } as const,
  maxTravelTime: { 'sin-limite': 'Sin límite', '3h': 'Hasta 3h', '5h': 'Hasta 5h', '8h': 'Hasta 8h' } as const,
  daypart: { indistinto: 'Indistinto', manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' } as const,
};

function Chip({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm border ${
        muted
          ? 'bg-neutral-100 text-neutral-600 border-neutral-200'
          : 'bg-white text-neutral-900 border-neutral-300'
      }`}
    >
      {children}
    </span>
  );
}

export default function TopFiltersSummary() {
  const { filters, setPartial } = useJourneyStore();
  const goPrefs = () => setPartial({ activeTab: 'preferences' as const });
  const goAvoid = () => setPartial({ activeTab: 'avoid' as const });

  const items: Array<{ key: string; node: React.ReactNode; onClick?: () => void }> = [];

  // Transporte (siempre)
  items.push({
    key: 'transport',
    node: <Chip>Transporte: {LABELS.transport[filters.transport]}</Chip>,
  });

  // Clima
  if (filters.climate !== 'indistinto') {
    items.push({
      key: 'climate',
      node: <Chip>Clima: {LABELS.climate[filters.climate]}</Chip>,
      onClick: goPrefs,
    });
  }

  // Máx tiempo viaje
  if (filters.maxTravelTime !== 'sin-limite') {
    items.push({
      key: 'max',
      node: <Chip>Máx viaje: {LABELS.maxTravelTime[filters.maxTravelTime]}</Chip>,
      onClick: goPrefs,
    });
  }

  // Horarios
  if (filters.departPref !== 'indistinto') {
    items.push({
      key: 'depart',
      node: <Chip>Salida: {LABELS.daypart[filters.departPref]}</Chip>,
      onClick: goPrefs,
    });
  }
  if (filters.arrivePref !== 'indistinto') {
    items.push({
      key: 'arrive',
      node: <Chip>Llegada: {LABELS.daypart[filters.arrivePref]}</Chip>,
      onClick: goPrefs,
    });
  }

  // Destinos a evitar -> chip compacto con contador
  const avoids = filters.avoidDestinations?.length ?? 0;
  if (avoids > 0) {
    items.push({
      key: 'avoid',
      node: <Chip>Evitar: {avoids}</Chip>,
      onClick: goAvoid,
    });
  }

  // Sin filtros (además de transporte)
  const onlyTransport = items.length === 1;
  const MAX_VISIBLE = 5; // aprox 1–2 líneas
  const visible = items.slice(0, MAX_VISIBLE);
  const hiddenCount = items.length - visible.length;

  if (onlyTransport) {
    return (
      <div className="mb-3 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {items.map((it) => (
            <span key={it.key}>{it.node}</span>
          ))}
          <Chip muted>Sin filtros adicionales</Chip>
        </div>
        <button
          type="button"
          onClick={goPrefs}
          className="text-sm text-violet-700 hover:underline"
        >
          Configurar
        </button>
      </div>
    );
  }

  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex flex-wrap gap-2">
        {visible.map((it) => (
          <button
            key={it.key}
            type="button"
            onClick={it.onClick}
            className="focus:outline-none"
            aria-label={`Editar ${it.key}`}
          >
            {it.node}
          </button>
        ))}
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={goPrefs}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm border bg-white text-neutral-900 border-neutral-300"
          >
            +{hiddenCount} más
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={goPrefs}
        className="text-sm text-violet-700 hover:underline"
      >
        Editar filtros
      </button>
    </div>
  );
}
