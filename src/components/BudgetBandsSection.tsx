'use client';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';

type BudgetBandsSectionProps = {
  variant?: 'default' | 'compact';
  defaultOpenDetails?: boolean;
};

type Band = {
  id: 'essenza' | 'explora';
  title: string;
  subtitle: string;
  min: number;
  max: number;
  note?: string;
};

const TRANSPORT_STOPS = [
  { key: 'bus', label: 'Bus', emoji: '🚌', pos: 0.0 },
  { key: 'train', label: 'Tren', emoji: '🚂', pos: 0.3 },
  { key: 'ferry', label: 'Ferry / Barco', emoji: '🚢', pos: 0.6 },
  { key: 'plane', label: 'Avión', emoji: '✈️', pos: 0.95 },
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

const legendText =
  ' * El transporte puede variar según destino y fechas, pero la experiencia Randomtrip es constante: humana, curada y sin estrés.';

export function BudgetBandsSection({
  variant = 'default',
  defaultOpenDetails = true,
}: BudgetBandsSectionProps) {
  const isCompact = variant === 'compact';

  return (
    <section className={isCompact ? 'py-6 md:py-8' : 'py-10 md:py-14'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header
          className={
            isCompact ? 'text-center mb-4 md:mb-6' : 'text-center mb-10'
          }
        >
          <p
            className={
              'text-center text-gray-600  italic font-jost text-lg mb-6'
            }
          >
            Tu presupuesto marca el punto de partida. Nosotros transformamos
            cada dólar en kilómetros de sorpresa. Desde un bus que abre camino,
            hasta un vuelo que abre horizontes: la magia está en la curaduría
            Randomtrip, no (solo) en el medio.
          </p>
        </header>

        <div
          className={
            isCompact
              ? 'grid md:grid-cols-2 gap-4 lg:gap-6 items-start'
              : 'space-y-10'
          }
        >
          {BANDS.map((band) => (
            <BandCard
              key={band.id}
              band={band}
              compact={isCompact}
              defaultOpenDetails={defaultOpenDetails}
            />
          ))}
        </div>

        <div
          className={
            isCompact
              ? 'mt-4 text-xs text-neutral-600 text-center'
              : 'mt-12 text-sm text-neutral-500'
          }
        >
          {isCompact ? (
            legendText
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-4">
                {TRANSPORT_STOPS.map((s) => (
                  <span
                    key={s.key}
                    className="inline-flex items-center gap-2 text-neutral-700"
                  >
                    <span className="text-base">{s.emoji}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </span>
                ))}
                <span className="ml-auto">{legendText}</span>
              </div>
            </div>
          )}
        </div>

        <div
          className={
            isCompact ? 'mt-6 flex justify-center' : 'mt-10 flex justify-center'
          }
        >
          <Link
            href="/?tab=By%20Traveller#start-your-journey-anchor"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
          >
            RANDOMTRIPME!
          </Link>
        </div>
      </div>
    </section>
  );
}

type BandCardProps = {
  band: Band;
  compact?: boolean;
  defaultOpenDetails?: boolean;
};

const BandCard: React.FC<BandCardProps> = ({
  band,
  compact = false,
  defaultOpenDetails = false,
}) => {
  const [value, setValue] = useState<number>(band.min);

  const ratio = useMemo(() => {
    const span = Math.max(1, band.max - band.min);
    return Math.min(1, Math.max(0, (value - band.min) / span));
  }, [value, band.min, band.max]);

  const activeStopIndex = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < TRANSPORT_STOPS.length; i++) {
      if (ratio >= TRANSPORT_STOPS[i].pos) idx = i;
    }
    return idx;
  }, [ratio]);

  const activeStop = TRANSPORT_STOPS[activeStopIndex];

  const OriginalText = () => (
    <div className="flex flex-col gap-2">
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
        Ya sea <strong>US$ {band.min}</strong> o <strong>US$ {band.max}</strong>
        , tu viaje tiene nuestra <strong>curaduría</strong>, selección de
        alojamientos y recomendaciones únicas.
      </p>
    </div>
  );

  return (
    <div
      className={
        compact
          ? 'rounded-2xl border border-neutral-200 bg-white p-4 lg:p-5 shadow-sm'
          : 'rounded-2xl border border-neutral-200 bg-white/80 p-5 md:p-6 shadow-sm'
      }
      role="group"
      aria-label={`${band.title}: banda de presupuesto`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4
            className={
              'text-xl md:text-2xl font-bold text-neutral-900 font-caveat'
            }
          >
            {band.title}
          </h4>
          {!compact && (
            <p className="text-sm text-neutral-600">{band.subtitle}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div
            className={
              compact ? 'text-xs text-neutral-500' : 'text-sm text-neutral-500'
            }
          >
            Rango p/p
          </div>
          <div
            className={
              compact
                ? 'font-semibold text-neutral-900 text-sm'
                : 'font-semibold text-neutral-900'
            }
          >
            US$ {band.min} <span className="text-neutral-400">—</span> US${' '}
            {band.max}
          </div>
        </div>
      </div>

      <div className={compact ? 'mt-2' : 'mt-5'}>
        <div className={compact ? 'relative h-12' : 'relative h-20'}>
          <div
            className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-400 ${
              compact ? 'h-1' : 'h-2'
            }`}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            style={{ left: `${ratio * 100}%` }}
            aria-hidden="true"
          >
            <div className="flex flex-col items-center">
              <div
                className={`rounded-full bg-neutral-900 shadow ring-2 ring-white ${
                  compact ? 'h-3 w-3' : 'h-5 w-5'
                }`}
              />
              <div className="mt-1 text-[10px] text-neutral-600 select-none">
                US$ {value}
              </div>
            </div>
          </div>
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
                  className={`mx-auto leading-none select-none transition-transform ${
                    isActive ? 'scale-100' : 'opacity-40'
                  } ${compact ? 'text-base' : 'text-lg'}`}
                >
                  {stop.emoji}
                </div>
                <div
                  className={`mx-auto rounded-full ${isActive ? 'bg-neutral-900' : 'bg-neutral-400'} ${
                    compact ? 'mt-0.5 h-1.5 w-1.5' : 'mt-1 h-2 w-2'
                  }`}
                />
              </div>
            );
          })}
        </div>

        <div className={compact ? 'mt-1' : 'mt-4'}>
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

        <div
          className={
            compact
              ? 'mt-2 text-xs text-neutral-600'
              : 'mt-3 text-sm text-neutral-700'
          }
        >
          {compact ? (
            <>
              <p>Optimizado para la mejor relación valor/experiencia.</p>
              <details className="mt-1" open={defaultOpenDetails}>
                <summary className="cursor-pointer underline">
                  Más detalles
                </summary>
                <div className="mt-1 space-y-1">
                  <OriginalText />
                </div>
              </details>
            </>
          ) : (
            <OriginalText />
          )}
        </div>
      </div>
    </div>
  );
};
