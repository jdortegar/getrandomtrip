'use client';
import React, { useMemo, useState } from 'react';

type Band = {
  id: 'essenza' | 'explora';
  title: string;
  subtitle: string;
  min: number; // piso visible en UI (“desde”)
  max: number; // techo visible en UI (“hasta”)
  note?: string; // copy corto extra
};

// Íconos/estaciones pensadas para LATAM (0 → min, 1 → max)
const TRANSPORT_STOPS = [
  { key: 'bus',   label: 'Bus',                 emoji: '🚌', pos: 0.00 },
  { key: 'rail',  label: 'Tren regional',       emoji: '🚂', pos: 0.25 },
  { key: 'ferry', label: 'Ferry / Barco',       emoji: '🚢', pos: 0.45 },
  { key: 'plane-econ', label: 'Avión Económico', emoji: '✈️', pos: 0.75 },
  { key: 'plane-full', label: 'Avión Full-Service', emoji: '🛫', pos: 0.95 },
] as const;

const BANDS: Band[] = [
  {
    id: 'essenza',
    title: 'Essenza',
    subtitle: 'Lo esencial para viajar juntos',
    min: 200,
    max: 350,
    note: 'Optimizamos tu presupuesto para darte siempre la mejor experiencia posible.',
  },
  {
    id: 'explora',
    title: 'Modo Explora',
    subtitle: 'Viaje activo y flexible',
    min: 200,
    max: 550,
    note: 'A veces llegamos al techo, pero nunca bajamos la calidad.',
  },
];

export const BudgetBandsSection: React.FC = () => {
  return (
    <section className="py-16 px-6 sm:px-8 bg-white text-neutral-900">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 text-center">
          <h3
            className="text-2xl md:text-4xl font-bold tracking-tight"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Bandas de presupuesto & modos de viaje
          </h3>
          <p className="mt-3 text-neutral-600 max-w-3xl mx-auto">
            Tu presupuesto marca el punto de partida. Nosotros transformamos cada dólar en kilómetros de sorpresa. 
            Desde un bus que abre camino, hasta un vuelo que abre horizontes: la magia está en la{' '}
            <strong>curaduría Randomtrip</strong>, no (solo) en el medio.
          </p>
        </header>

        <div className="space-y-10">
          {BANDS.map((band) => (
            <BandRail key={band.id} band={band} />
          ))}
        </div>

        {/* Leyenda */}
        <div className="mt-12 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            {TRANSPORT_STOPS.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-2 text-sm text-neutral-700">
                <span className="text-base">{s.emoji}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </span>
            ))}
            <span className="ml-auto text-sm text-neutral-500">
              * El transporte puede variar según destino y fechas, pero la experiencia Randomtrip es constante: humana, curada y sin estrés.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

const BandRail: React.FC<{ band: Band }> = ({ band }) => {
  // Slider controlado — valor dentro del rango visible de la banda
  const [value, setValue] = useState<number>(band.min);

  // ratio 0..1 para posicionar el “cursor” sobre el rail
  const ratio = useMemo(() => {
    const span = Math.max(1, band.max - band.min);
    return Math.min(1, Math.max(0, (value - band.min) / span));
  }, [value, band.min, band.max]);

  // determinar el “stop” activo (el último cuyo pos <= ratio)
  const activeStopIndex = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < TRANSPORT_STOPS.length; i++) {
      if (ratio >= TRANSPORT_STOPS[i].pos) idx = i;
    }
    return idx;
  }, [ratio]);

  const activeStop = TRANSPORT_STOPS[activeStopIndex];

  return (
    <div
      className="rounded-2xl border border-neutral-200 bg-white/80 p-5 md:p-6 shadow-sm"
      role="group"
      aria-label={`${band.title}: banda de presupuesto`}
    >
      {/* Header banda */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4
            className="text-xl md:text-2xl font-bold text-neutral-900"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            {band.title}
          </h4>
          <p className="text-sm text-neutral-600">{band.subtitle}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-neutral-500">Rango por persona</div>
          <div className="font-semibold text-neutral-900">
            US$ {band.min} <span className="text-neutral-400">—</span> US$ {band.max}
          </div>
        </div>
      </div>

      {/* Rail + slider */}
      <div className="mt-5">
        <div className="relative h-20">
          {/* Línea/banda */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-400" />

          {/* Min / Max labels */}
          <div className="absolute -top-4 left-0 text-xs text-neutral-600">Piso</div>
          <div className="absolute -top-4 right-0 text-xs text-neutral-600">Techo</div>

          {/* Cursor/indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            style={{ left: `${ratio * 100}%` }}
            aria-hidden="true"
          >
            <div className="flex flex-col items-center">
              <div className="h-5 w-5 rounded-full bg-neutral-900 shadow ring-2 ring-white" />
              <div className="mt-1 text-[10px] text-neutral-600 select-none">US$ {value}</div>
            </div>
          </div>

          {/* Stops (íconos) con highlight progresivo */}
          {TRANSPORT_STOPS.map((stop, i) => {
            const isActive = i <= activeStopIndex;
            return (
              <div
                key={stop.key}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-center"
                style={{ left: `${stop.pos * 100}%` }}
                aria-hidden="true"
              >
                <div
                  className={[
                    'mx-auto text-lg leading-none select-none transition-transform',
                    isActive ? 'scale-110' : 'opacity-50',
                  ].join(' ')}
                >
                  {stop.emoji}
                </div>
                <div
                  className={[
                    'mt-1 h-2 w-2 rounded-full mx-auto',
                    isActive ? 'bg-neutral-900' : 'bg-neutral-400',
                  ].join(' ')}
                />
              </div>
            );
          })}
        </div>

        {/* Slider input */}
        <div className="mt-4">
          <input
            type="range"
            min={band.min}
            max={band.max}
            step={10}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full accent-neutral-900"
            aria-label={`Ajustar presupuesto de ${band.title}`}
          />
        </div>

        {/* Notas + “probable logística” */}
        <div className="mt-4 flex flex-col gap-2">
          {band.note && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              {band.note}
            </p>
          )}
          <div
            className="text-sm text-neutral-700"
            aria-live="polite"
            aria-atomic="true"
          >
            Probable logística: <strong>{activeStop.label}</strong>
          </div>
          <p className="text-sm text-neutral-700">
            Ya sea <strong>US$ {band.min}</strong> o <strong>US$ {band.max}</strong>, tu viaje tiene nuestra{' '}
            <strong>curaduría</strong>, selección de alojamientos pet/people-friendly y recomendaciones únicas.
          </p>
        </div>
      </div>
    </div>
  );
};
