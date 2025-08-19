'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import EmpathyCard from './EmpathyCard';

type BudgetTier = 'explorer' | 'adventurer' | 'trailblazer';
type FamilyType = 'toddlers' | 'teens' | 'adults' | 'multigen';
type EscapeType =
  | 'aventura-suave'
  | 'naturaleza-fauna'
  | 'cultura-tradiciones'
  | 'playas-secretas'
  | 'celebraciones'
  | 'uno-a-uno';

type Props = { id?: string };

const STEP_TITLES = ['Empatía', 'Presupuesto', 'Tipo de familia', 'Tipo de escapada'] as const;
const STEP_FROM_PARAM: Record<string, number> = {
  empathy: 0,
  budget: 1,
  family: 2,
  escape: 3,
};

export default function FamilyWizard({ id }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // ----------------------------------------------------------------
  // STATE
  // ----------------------------------------------------------------
  const [step, setStep] = useState<number>(0);
  const [empathyPicked, setEmpathyPicked] = useState<number | null>(null);
  const [budgetTier, setBudgetTier] = useState<BudgetTier | null>(null);
  const [familyType, setFamilyType] = useState<FamilyType | null>(null);
  const [escapeType, setEscapeType] = useState<EscapeType | null>(null);

  // ----------------------------------------------------------------
  // HASH / DEEP-LINK (#planner y #planner?step=...)
  // ----------------------------------------------------------------
  useEffect(() => {
    const openFromHash = () => {
      if (typeof window === 'undefined') return;
      const { hash } = window.location;
      if (!hash.startsWith('#planner')) return;

      // Scroll suave al contenedor
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // ¿Hay step en el hash? (#planner?step=budget)
      const query = hash.split('?')[1] ?? '';
      const params = new URLSearchParams(query);
      const stepParam = params.get('step')?.toLowerCase();

      if (stepParam && stepParam in STEP_FROM_PARAM) {
        setStep(STEP_FROM_PARAM[stepParam]);
      } else {
        // Default deseado: Presupuesto
        setStep(1);
      }
    };

    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, []);

  // ----------------------------------------------------------------
  // UI
  // ----------------------------------------------------------------
  const tabs = useMemo(() => STEP_TITLES, []);

  return (
    <section id={id ?? 'planner'} className="bg-white text-neutral-900 py-16 scroll-mt-20">
      <div ref={ref} className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Tabs header */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-8">
          {tabs.map((t, i) => (
            <button
              key={t}
              onClick={() => setStep(i)}
              className={clsx(
                'px-3 py-2 rounded-full text-sm ring-1 ring-black/10',
                step === i ? 'bg-black text-white' : 'bg-white text-neutral-700'
              )}
              aria-current={step === i ? 'step' : undefined}
            >
              {i + 1}. {t}
            </button>
          ))}
        </div>

        {/* Steps */}
        {step === 0 && (
          <EmpathyStep
            empathyPicked={empathyPicked}
            onPick={setEmpathyPicked}
            onNext={() => setStep(1)}
          />
        )}

        {step === 1 && (
          <BudgetStep
            value={budgetTier}
            onPick={setBudgetTier}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <FamilyTypeStep
            value={familyType}
            onPick={setFamilyType}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <EscapeTypeStep
            value={escapeType}
            onPick={setEscapeType}
            onBack={() => setStep(2)}
            budget={budgetTier}
            famType={familyType}
          />
        )}
      </div>
    </section>
  );
}

/* ---------- STEP 1: Empatía ---------- */

function EmpathyStep({
  empathyPicked,
  onPick,
  onNext,
}: {
  empathyPicked: number | null;
  onPick: (i: number) => void;
  onNext: () => void;
}) {
  const cards = [
    {
      label: 'Peques',
      headline: 'Traslados simples, más descubrimiento.',
      support:
        'Menos horas de auto, más “¿y esto qué es?”. Ritmo pensado para los más chicos.',
      color: 'bg-[#C77248]',
    },
    {
      label: 'Adolescentes',
      headline: 'Experiencias que compiten con el Wi-Fi.',
      support:
        'Actividades hands-on, locales y memorables. Publican después; primero viven.',
      color: 'bg-[#3B82F6]',
    },
    {
      label: 'Toda la familia',
      headline: 'La logística es nuestro superpoder.',
      support:
        'Horarios, traslados y reservas sin peleas. Todos llegan, todos disfrutan.',
      color: 'bg-[#10B981]',
    },
    {
      label: 'Tiempo libre',
      headline: 'Días que fluyen sin culpas.',
      support:
        'Momentos para que cada uno haga lo suyo, sin perder el hilo del viaje.',
      color: 'bg-[#8B5CF6]',
    },
  ];

  return (
    <div>
      <h3 className="text-2xl md:text-3xl font-bold mb-2">
        Viajar en familia tiene sus códigos (y los entendemos)
      </h3>
      <p className="text-neutral-600 mb-6">Elegí lo que más te representa y seguimos.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <button
            key={i}
            onClick={() => onPick(i)}
            className={clsx(
              'rounded-2xl ring-2 transition-all text-left w-full',
              empathyPicked === i ? 'ring-black' : 'ring-transparent hover:ring-black/20'
            )}
            aria-pressed={empathyPicked === i}
          >
            <EmpathyCard label={c.label} headline={c.headline} support={c.support} color={c.color} />
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onNext}
          disabled={empathyPicked === null}
          className={clsx('btn-primary', empathyPicked === null && 'opacity-50 pointer-events-none')}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

/* ---------- STEP 2: Presupuesto ---------- */

function BudgetStep({
  value,
  onPick,
  onBack,
  onNext,
}: {
  value: BudgetTier | null;
  onPick: (v: BudgetTier) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const tiers: { id: BudgetTier; title: string; desc: string }[] = [
    { id: 'explorer', title: 'Explorers', desc: 'Simple y cómodo. Lo esencial bien hecho.' },
    { id: 'adventurer', title: 'Adventurers', desc: 'Más experiencias y upgrades puntuales.' },
    { id: 'trailblazer', title: 'Trailblazers', desc: 'Top en confort y curaduría.' },
  ];

  return (
    <div>
      <h3 className="text-2xl md:text-3xl font-bold mb-2">¿Con qué presupuesto jugamos?</h3>
      <p className="text-neutral-600 mb-6">Elegí un nivel para ajustar propuesta y ritmo.</p>

      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map((t) => (
          <button
            key={t.id}
            onClick={() => onPick(t.id)}
            className={clsx(
              'rounded-2xl p-5 text-left ring-1 ring-black/10 hover:ring-black/20 transition-all',
              value === t.id && 'ring-2 ring-black'
            )}
          >
            <h4 className="font-semibold">{t.title}</h4>
            <p className="text-sm text-neutral-600 mt-1">{t.desc}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <button className="btn-secondary" onClick={onBack}>
          Volver
        </button>
        <button
          className={clsx('btn-primary', !value && 'opacity-50 pointer-events-none')}
          disabled={!value}
          onClick={onNext}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

/* ---------- STEP 3: Tipo de familia ---------- */

function FamilyTypeStep({
  value,
  onPick,
  onBack,
  onNext,
}: {
  value: FamilyType | null;
  onPick: (v: FamilyType) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const items: { id: FamilyType; label: string; icon: string }[] = [
    { id: 'toddlers', label: 'Peques', icon: '/images/placeholder/Toddlers.svg' },
    { id: 'teens', label: 'Adolescentes', icon: '/images/placeholder/Teens.svg' },
    { id: 'adults', label: 'Adultos', icon: '/images/placeholder/Adult.svg' },
    { id: 'multigen', label: 'Multi-generación', icon: '/images/placeholder/Multi-Gen.svg' },
  ];

  return (
    <div>
      <h3 className="text-2xl md:text-3xl font-bold mb-2">¿Cómo está compuesta tu familia?</h3>
      <p className="text-neutral-600 mb-6">Elegí la opción que mejor encaje.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => onPick(it.id)}
            className={clsx(
              'rounded-2xl p-5 ring-1 ring-black/10 hover:ring-black/20 transition-all text-left',
              value === it.id && 'ring-2 ring-black'
            )}
          >
            <div className="h-12 w-12 mb-3 relative">
              <Image src={it.icon} alt={it.label} fill sizes="48px" />
            </div>
            <div className="font-semibold">{it.label}</div>
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <button className="btn-secondary" onClick={onBack}>
          Volver
        </button>
        <button
          className={clsx('btn-primary', !value && 'opacity-50 pointer-events-none')}
          disabled={!value}
          onClick={onNext}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

/* ---------- STEP 4: Tipo de escapada ---------- */

function EscapeTypeStep({
  value,
  onPick,
  onBack,
  budget,
  famType,
}: {
  value: EscapeType | null;
  onPick: (v: EscapeType) => void;
  onBack: () => void;
  budget: BudgetTier | null;
  famType: FamilyType | null;
}) {
  const items: { id: EscapeType; title: string; desc: string }[] = [
    { id: 'aventura-suave', title: 'Aventura suave', desc: 'Trekking fácil, rafting tranquilo, noche bajo estrellas.' },
    { id: 'naturaleza-fauna', title: 'Naturaleza y fauna', desc: 'Ballenas, aves, selvas o desiertos: compartir el asombro.' },
    { id: 'cultura-tradiciones', title: 'Cultura y tradiciones', desc: 'Cocinar, bailar, escuchar leyendas: vivir lo local.' },
    { id: 'playas-secretas', title: 'Playas secretas', desc: 'Arenas sin multitudes. Olas y risas propias.' },
    { id: 'celebraciones', title: 'Graduaciones y celebraciones', desc: 'Brindar, sorprender y marcar un antes y un después.' },
    { id: 'uno-a-uno', title: 'Madre-hija / padre-hijo', desc: 'Momentos uno a uno, lejos de la rutina.' },
  ];

  // Construcción de URL final con todos los parámetros disponibles
  const buildHref = () => {
    const params = new URLSearchParams();
    if (budget) params.set('tier', budget);
    params.set('origin', 'families');
    if (famType) params.set('famType', famType);
    if (value) params.set('tripKind', value);
    return `/journey/experience-level?${params.toString()}`;
  };

  return (
    <div>
      <h3 className="text-2xl md:text-3xl font-bold mb-2">¿Qué tipo de escapada buscan?</h3>
      <p className="text-neutral-600 mb-6">Elegí una inspiración para afinar la propuesta.</p>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => onPick(it.id)}
            className={clsx(
              'rounded-2xl p-5 text-left ring-1 ring-black/10 hover:ring-black/20 transition-all',
              value === it.id && 'ring-2 ring-black'
            )}
          >
            <h4 className="font-semibold">{it.title}</h4>
            <p className="text-sm text-neutral-600 mt-1">{it.desc}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <button className="btn-secondary" onClick={onBack}>
          Volver
        </button>

        <a
          className={clsx('btn-primary', !value && 'opacity-50 pointer-events-none')}
          aria-disabled={!value}
          href={value ? buildHref() : undefined}
        >
          Ver mis opciones
        </a>
      </div>
    </div>
  );
}
