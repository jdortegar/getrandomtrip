'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Img from '@/components/common/Img';
import { Button } from '@/components/ui/button';
import { gotoBasicConfig } from '@/lib/linking';
import ExcuseOptionCard from './ExcuseOptionCard';
import type { ExcuseSpec, DetailsContent } from '@/types/planner';

interface DetailsProps {
  excuseKey: string | null;
  excuseOptions: Record<string, ExcuseSpec>;
  budgetTier: string | null;
  content: DetailsContent;
  pendingPriceLabel: string | null;
  setStep: (stepIndex: number) => void;
  type: string;
  tripperSlug?: string;
}

const BORDER_COLOR: Record<string, string> = {
  'romantic-getaway': 'border-rose-400',
  'adventure-duo': 'border-cyan-400',
  'foodie-lovers': 'border-orange-400',
  'culture-tradition': 'border-purple-400',
  'wellness-retreat': 'border-emerald-400',
  celebrations: 'border-yellow-400',
  'beach-dunes': 'border-blue-400',
  'urban-getaway': 'border-gray-400',
  'get-lost': 'border-emerald-400',
  'urban-nomad': 'border-gray-400',
  'work-travel': 'border-blue-400',
  'foodie-journey': 'border-orange-400',
  'wellness-solo': 'border-emerald-400',
  'adventure-solo': 'border-cyan-400',
  // Family excuse keys
  toddlers: 'border-orange-400',
  teens: 'border-teal-400',
  adults: 'border-slate-400',
  multigen: 'border-amber-400',
};

export default function Details({
  excuseKey,
  excuseOptions,
  budgetTier,
  content,
  pendingPriceLabel,
  setStep,
  type,
  tripperSlug,
}: DetailsProps) {
  const router = useRouter();
  const spec = excuseKey ? excuseOptions[excuseKey] : null;
  const borderClass = excuseKey
    ? BORDER_COLOR[excuseKey] || 'border-white'
    : 'border-white';
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => setSelected([]), [excuseKey]);

  const canContinue = selected.length > 0;

  const toggle = (key: string) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );

  const liveText = useMemo(
    () => `Seleccionadas: ${selected.length}`,
    [selected.length],
  );

  if (!excuseKey) {
    return (
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h3 className="text-xl font-semibold text-neutral-900 mb-4">
            {content.title}
          </h3>
          <p className="text-neutral-700 mb-6">
            Para personalizar tu experiencia, primero necesitás elegir el tipo
            de viaje que más te inspire.
          </p>
          <div className="text-center">
            <Button onClick={() => setStep(2)} variant="default" size="lg">
              Elegir tipo de viaje →
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (!spec) {
    return (
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <p className="text-neutral-700">
            Tipo de viaje no encontrado. Por favor, volvé a seleccionar.
          </p>
          <div className="mt-8 text-center">
            <Button onClick={() => setStep(2)} variant="link">
              ← Volver
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="max-w-7xl mx-auto px-4 md:px-8 py-10 relative"
      data-testid="tab-afinar-detalles"
    >
      <div className="text-center mb-8 relative">
        <h3
          className="text-center text-xl font-semibold text-neutral-900"
          data-testid="tab3-title"
        >
          {content.title}
        </h3>
        <p
          className="mt-2 text-center text-sm text-neutral-800 max-w-3xl mx-auto w-full"
          data-testid="tab3-tagline"
        >
          {content.tagline}
        </p>
        <div className="text-center absolute left-0 top-1/2 -translate-y-1/2">
          <Button
            className="text-neutral-900 hover:underline decoration-neutral-400 hover:decoration-neutral-800"
            data-testid="cta-back-to-tab2"
            onClick={() => setStep(2)}
            variant="link"
          >
            ← Volver
          </Button>
        </div>
      </div>

      {/* HERO */}
      <div className="relative overflow-hidden rounded-md">
        <Img
          alt={spec.title}
          className="h-64 w-full object-cover md:h-40"
          height={160}
          src={
            spec.heroImg ||
            'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80'
          }
          width={1600}
        />
        <div className={`absolute inset-0 ${spec.tint || 'bg-black/30'}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
          <h3 className="font-display text-2xl md:text-4xl drop-shadow font-caveat">
            {spec.title}
          </h3>
          <p
            className="mt-2 max-w-3xl text-white/90 font-jost mx-auto w-full"
            data-testid="tab4-core"
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
      <div className="flex flex-wrap gap-8 mt-8">
        {spec.options.map((op) => (
          <div
            key={op.key}
            className={`flex-1 min-w-0 h-full aspect-square ${
              spec.options.length === 1
                ? 'w-full'
                : spec.options.length === 2
                  ? 'w-full sm:w-1/2'
                  : spec.options.length === 3
                    ? 'w-full sm:w-1/2 lg:w-1/3'
                    : 'w-full sm:w-1/2 lg:w-1/4'
            }`}
          >
            <ExcuseOptionCard
              borderClass={borderClass}
              desc={op.desc}
              img={op.img}
              label={op.label}
              opKey={op.key}
              selected={selected.includes(op.key)}
              onToggle={() => toggle(op.key)}
            />
          </div>
        ))}
      </div>

      {/* Estado accesible */}
      <div className="sr-only" aria-live="polite">
        {liveText}
      </div>

      {/* Acciones */}
      <div className="mt-10 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
        <Button
          data-testid="cta-excuse-continue"
          disabled={!canContinue}
          onClick={() => {
            if (canContinue) {
              // Navigate to basic config with all selections
              // Let basicConfig handle price calculation internally
              gotoBasicConfig(router, {
                fromOrType: type as
                  | 'couple'
                  | 'solo'
                  | 'family'
                  | 'group'
                  | 'honeymoon'
                  | 'paws',
                tierId: budgetTier!,
                priceLabel: pendingPriceLabel!,
                extra: {
                  [`${type}Excuse`]: excuseKey || '',
                  excuseOptions: selected.join(','),
                  tripperSlug: tripperSlug || '',
                },
              });
            }
          }}
          size="lg"
        >
          {spec.ctaLabel}
        </Button>
      </div>
    </section>
  );
}
