'use client';

import React, { useMemo, useState } from 'react';
import { SOLO_ALMA_OPTIONS } from './soloAlmaOptions';
import SoloAlmaOptionCard from './SoloAlmaOptionCard';

export default function SoloAlmaDetails({
  soloKey,
  budgetTier,
  onBack,
  onContinue,
}: {
  soloKey: string;
  budgetTier?: string | null;
  onBack: () => void;
  onContinue: (selectedKeys: string[]) => void;
}) {
  const spec = useMemo(() => SOLO_ALMA_OPTIONS[soloKey], [soloKey]);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  if (!spec) {
    return (
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="rounded-xl border border-neutral-200 bg-white/70 backdrop-blur p-6">
          <p className="text-neutral-700">No encontramos esa excusa. Volvé y elegí otra.</p>
          <div className="mt-6">
            <button
              className="text-neutral-800 underline decoration-neutral-400 hover:decoration-neutral-800"
              onClick={onBack}
            >
              ← Volver
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      {/* HERO superior (igual concepto que en couple) */}
      <div className="rounded-3xl overflow-hidden relative h-56 md:h-64">
        <img
          src={spec.heroImg || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80'}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className={`absolute inset-0 ${spec.tint || 'bg-neutral-900/30'}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        {/* esquinas marco */}
        <div className="absolute top-4 left-4 h-12 w-12 border-t-4 border-l-4 border-amber-400 rounded-tl-xl opacity-90" />
        <div className="absolute bottom-4 right-4 h-12 w-12 border-b-4 border-r-4 border-amber-400 rounded-br-xl opacity-90" />

        <div className="absolute left-6 right-6 bottom-6 text-white">
          <h3 className="text-2xl font-semibold drop-shadow-sm">{spec.title} <span className="align-middle">✨</span></h3>
          <p className="mt-1 text-sm text-white/90">{spec.core}</p>
          {budgetTier && (
            <p className="mt-1 text-xs text-white/80">Presupuesto elegido: <span className="font-semibold">{budgetTier}</span></p>
          )}
        </div>
      </div>

      {/* GRID de opciones */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {(spec.options ?? []).map((op) => (
          <SoloAlmaOptionCard
            key={op.key}
            opKey={op.key}
            label={op.label}
            img={op.img}
            desc={op.desc}
            selected={selected.includes(op.key)}
            onToggle={() => toggle(op.key)}
            borderClass="border-rose-400"
          />
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          className="text-neutral-800 underline decoration-neutral-400 hover:decoration-neutral-800"
          onClick={onBack}
        >
          ← Volver
        </button>
        <button
          className="btn-primary"
          onClick={() => onContinue(selected)}
          disabled={selected.length === 0}
          aria-disabled={selected.length === 0}
        >
          Continuar →
        </button>
      </div>
    </section>
  );
}
