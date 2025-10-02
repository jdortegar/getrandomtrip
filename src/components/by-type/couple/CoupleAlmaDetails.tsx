'use client';

import { useEffect, useMemo, useState } from 'react';
import Img from '@/components/common/Img'; // Added import
import CoupleAlmaOptionCard from './CoupleAlmaOptionCard';
import { COUPLE_ALMA_OPTIONS } from './coupleAlmaOptions';
import { Button } from '@/components/ui/button';

const BORDER_COLOR: Record<string, string> = {
  'romantic-getaway': 'border-rose-400',
  'adventure-duo': 'border-cyan-400',
  'foodie-lovers': 'border-orange-400',
  'culture-tradition': 'border-purple-400',
  'wellness-retreat': 'border-emerald-400',
  celebrations: 'border-yellow-400',
  'beach-dunes': 'border-blue-400',
  'urban-getaway': 'border-gray-400',
};

export default function CoupleAlmaDetails({
  coupleKey,
  budgetTier,
  onBack,
  onContinue,
}: {
  coupleKey: string;
  budgetTier?: string | null;
  onBack: () => void;
  onContinue: (selectedKeys: string[]) => void;
}) {
  const spec = COUPLE_ALMA_OPTIONS[coupleKey];
  const borderClass = BORDER_COLOR[coupleKey] || 'border-white';
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => setSelected([]), [coupleKey]);

  const canContinue = selected.length > 0;

  const toggle = (key: string) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );

  const liveText = useMemo(
    () => `Seleccionadas: ${selected.length}`,
    [selected.length],
  );

  return (
    <section
      id="couple-planner"
      data-testid="tab-afinar-detalles"
      className="max-w-7xl mx-auto"
    >
      {/* HERO */}
      <div className="relative overflow-hidden rounded-md">
        <Img
          src={
            spec.heroImg ||
            'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80'
          }
          alt={spec.title}
          className="h-64 w-full object-cover md:h-40"
          width={1600} // Assuming a reasonable default width
          height={160} // Assuming a reasonable default height (h-64)
        />
        <div className={`absolute inset-0 ${spec.tint || 'bg-black/30'}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
          <h3 className="font-display text-2xl md:text-4xl drop-shadow font-caveat">
            {spec.title}
          </h3>
          <p
            data-testid="tab4-core"
            className="mt-2 max-w-3xl text-white/90 font-jost"
          >
            {spec.core}
          </p>
          {budgetTier && (
            <p className="mt-2 text-sm text-white/75 font-jost">
              Presupuesto elegido:{' '}
              <span className="font-semibold">{budgetTier}</span>
            </p>
          )}
        </div>
      </div>

      {/* GRID opciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-8">
        {spec.options.map((op) => (
          <CoupleAlmaOptionCard
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
        <Button
          data-testid="cta-alma-continue"
          disabled={!canContinue}
          onClick={() => canContinue && onContinue(selected)}
          size="lg"
        >
          {spec.ctaLabel}
        </Button>
      </div>
    </section>
  );
}
