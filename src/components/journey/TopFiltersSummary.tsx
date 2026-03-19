'use client';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/store/store';

const LABELS = {
  transport: {
    bus: 'Bus',
    plane: 'Avión',
    ship: 'Barco/Crucero',
    train: 'Tren',
  } as const,
  climate: {
    any: 'Indistinto',
    cold: 'Frío',
    mild: 'Templado',
    warm: 'Cálido',
  } as const,
  maxTravelTime: {
    'no-limit': 'Sin límite',
    '3h': 'Hasta 3h',
    '5h': 'Hasta 5h',
    '8h': 'Hasta 8h',
  } as const,
  daypart: {
    afternoon: 'Tarde',
    any: 'Indistinto',
    morning: 'Mañana',
    night: 'Noche',
  } as const,
};

function Chip({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
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
  const { filters, setPartial } = useStore();
  const searchParams = useSearchParams();
  const goPrefs = () => setPartial({ activeTab: 'preferences' as const });
  const goAvoid = () => setPartial({ activeTab: 'addons' as const });

  const avoidCount = useMemo(() => {
    const raw = searchParams.get('avoidDestinations');
    return raw ? raw.split(',').map((s) => s.trim()).filter(Boolean).length : 0;
  }, [searchParams]);

  const items: Array<{
    key: string;
    node: React.ReactNode;
    onClick?: () => void;
  }> = [];

  // Transporte (siempre)
  items.push({
    key: 'transport',
    node: (
      <Chip>
        Transporte:{' '}
        {LABELS.transport[filters.transport as keyof typeof LABELS.transport] ||
          filters.transport}
      </Chip>
    ),
  });

  // Clima
  if (filters.climate !== 'any') {
    items.push({
      key: 'climate',
      node: (
        <Chip>
          Clima:{' '}
          {LABELS.climate[filters.climate as keyof typeof LABELS.climate] ||
            filters.climate}
        </Chip>
      ),
      onClick: goPrefs,
    });
  }

  // Máx tiempo viaje
  if (filters.maxTravelTime !== 'no-limit') {
    items.push({
      key: 'max',
      node: (
        <Chip>
          Máx viaje:{' '}
          {LABELS.maxTravelTime[
            filters.maxTravelTime as keyof typeof LABELS.maxTravelTime
          ] || filters.maxTravelTime}
        </Chip>
      ),
      onClick: goPrefs,
    });
  }

  // Horarios
  if (filters.departPref !== 'any') {
    items.push({
      key: 'depart',
      node: (
        <Chip>
          Salida:{' '}
          {LABELS.daypart[filters.departPref as keyof typeof LABELS.daypart] ||
            filters.departPref}
        </Chip>
      ),
      onClick: goPrefs,
    });
  }
  if (filters.arrivePref !== 'any') {
    items.push({
      key: 'arrive',
      node: (
        <Chip>
          Llegada:{' '}
          {LABELS.daypart[filters.arrivePref as keyof typeof LABELS.daypart] ||
            filters.arrivePref}
        </Chip>
      ),
      onClick: goPrefs,
    });
  }

  // Destinos a evitar -> chip compacto con contador (from URL)
  if (avoidCount > 0) {
    items.push({
      key: 'avoid',
      node: <Chip>Evitar: {avoidCount}</Chip>,
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
