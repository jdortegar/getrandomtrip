// frontend/src/components/by-type/group/AlmaDetails.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Img from '@/components/common/Img'; // Added import
import AlmaOptionCard from './AlmaOptionCard';
import { ALMA_OPTIONS } from './almaOptions';

const BORDER_COLOR: Record<string, string> = {
  'visual-storytellers': 'border-rose-400',
  'yoga-wellness': 'border-emerald-400',
  spiritual: 'border-amber-400',
  foodies: 'border-orange-400',
  'stories-fantasy': 'border-fuchsia-400',
  'nature-adventure': 'border-cyan-400',
  friends: 'border-amber-500',
  business: 'border-blue-400',
  students: 'border-green-400',
  'music-festivals': 'border-violet-400',
};

export default function AlmaDetails({
  groupKey,
  budgetTier,
  onBack,
  onContinue,
}: {
  groupKey: string;
  budgetTier?: string | null;
  onBack: () => void;
  onContinue: (selectedKeys: string[]) => void;
}) {
  const spec = ALMA_OPTIONS[groupKey];
  const borderClass = BORDER_COLOR[groupKey] || 'border-white';
  const [selected, setSelected] = useState<string[]>([]);

  // Reset selección si cambia el grupo
  useEffect(() => setSelected([]), [groupKey]);

  const canContinue = selected.length > 0;

  const toggle = (key: string) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const liveText = useMemo(
    () => `Seleccionadas: ${selected.length}`,
    [selected.length]
  );

  if (!spec) {
    return (
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <p className="text-neutral-700">
            Elegí primero un grupo válido en “Grupo & Alma”.
          </p>
        </div>
        <div className="mt-8 text-center">
          <button
            data-testid="cta-back-to-tab3"
            className="text-neutral-800 underline decoration-neutral-400 hover:decoration-neutral-800"
            onClick={onBack}
          >
            ← Volver
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      id="group-planner"
      data-testid="tab-afinar-detalles"
      className="max-w-7xl mx-auto px-4 md:px-8 py-10"
    >
      {/* HERO del tab */}
      <div className="relative overflow-hidden rounded-3xl">
        <Img
          src={
            spec.heroImg ||
            'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80'
          }
          alt={spec.title}
          className="h-64 w-full object-cover md:h-80"
          width={1600} // Assuming a reasonable default width
          height={320} // Assuming a reasonable default height (h-64)
        />
        <div className={`absolute inset-0 ${spec.tint || 'bg-black/30'}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
        {/* Marco tipo Black Tomato */}
        <div className={`pointer-events-none absolute left-6 top-6 h-12 w-12 border-t-4 border-l-4 ${borderClass}`} />
        <div className={`pointer-events-none absolute right-6 bottom-6 h-12 w-12 border-b-4 border-r-4 ${borderClass}`} />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
          <h3 className="font-display text-2xl md:text-3xl drop-shadow">{spec.title}</h3>
          <p data-testid="tab4-core" className="mt-2 max-w-3xl text-white/90">{spec.core}</p>
          {budgetTier && (
            <p className="mt-2 text-sm text-white/75">
              Presupuesto elegido: <span className="font-semibold">{budgetTier}</span>
            </p>
          )}
        </div>
      </div>

      {/* GRID de 4 opciones */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {spec.options.map((op) => (
          <AlmaOptionCard
            key={op.key}
            opKey={op.key}
            label={op.label}
            desc={op.desc}
            img={op.img}
            selected={selected.includes(op.key)}
            onToggle={() => toggle(op.key)}
            borderClass={borderClass}
          />
        ))}
      </div>

      {/* Estado accesible */}
      <div className="sr-only" aria-live="polite">
        {liveText}
      </div>

      {/* Acciones */}
      <div className="mt-10 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
        <button
          data-testid="cta-alma-continue"
          disabled={!canContinue}
          className={[
            'inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold shadow-sm',
            canContinue
              ? 'bg-neutral-900 text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 focus:ring-offset-white'
              : 'bg-neutral-200 text-neutral-500 cursor-not-allowed',
          ].join(' ')}
          onClick={() => canContinue && onContinue(selected)}
        >
          {spec.ctaLabel}
        </button>

        <button
          data-testid="cta-back-to-tab3"
          className="text-neutral-800 underline decoration-neutral-400 hover:decoration-neutral-800"
          onClick={onBack}
        >
          ← Volver
        </button>
      </div>
    </section>
  );
}