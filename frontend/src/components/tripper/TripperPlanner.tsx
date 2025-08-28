'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import clsx from 'clsx';
import { SOLO_TIERS } from '@/content/tiers';
import AlmaDetails from '@/components/by-type/group/AlmaDetails';
import { ALMA_OPTIONS } from '@/components/by-type/group/almaOptions';

type Step =
  | 'Presentación'
  | 'Presupuesto'
  | 'By Traveller'
  | 'Alma del viaje'
  | 'Afinar detalles';

type Props = {
  tripperName: string;
  tripperSlug: string;
};

export default function TripperPlanner({ tripperName, tripperSlug }: Props) {
  const [step, setStep] = useState<Step>('Presentación');
  const [budgetTier, setBudgetTier] = useState<string | null>(null);
  const [travellerType, setTravellerType] = useState<string | null>(null);
  const [groupAlma, setGroupAlma] = useState<string | null>(null);

  const tabs: Step[] = ['Presentación', 'Presupuesto', 'By Traveller', 'Alma del viaje', 'Afinar detalles'];

  const previewChips = [
    { title: 'Ritmo & Descubrimiento', core: 'Explorar sin correr. Sorpresas bien curadas.' },
    { title: 'Sabores & Lugares', core: 'Cocina local y escenarios auténticos.' },
    { title: 'Naturaleza & Movimiento', core: 'Aire libre, senderos y cielos enormes.' },
    { title: 'Diseño & Boutique', core: 'Stays con carácter, detalles que elevan.' },
  ];

  const tiers = SOLO_TIERS;

  const travellerOptions = [
    { key: 'pareja',    title: 'En Pareja',   img: '/images/journey-types/couple-hetero.jpg' },
    { key: 'solo',      title: 'Solo',        img: '/images/journey-types/solo-traveler.jpg' }, // <— antes .mp4
    { key: 'familia',   title: 'En Familia',  img: '/images/journey-types/family-vacation.jpg' },
    { key: 'grupo',     title: 'En Grupo',    img: '/images/journey-types/friends-group.jpg' },
    { key: 'honeymoon', title: 'Honeymoon',   img: '/images/journey-types/honeymoon-same-sex.jpg' },
  ];

  const almaOptionsList = useMemo(() => {
    return Object.entries(ALMA_OPTIONS as Record<string, any>).map(([key, val]) => ({
      key,
      title: val?.title ?? key,
      img:
        val?.heroImg ||
        val?.img ||
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80',
    }));
  }, []);

  const sectionRef = useRef<HTMLElement>(null);

  // Scroll helper: lo llamamos SOLO tras interacciones del usuario
  const scrollPlanner = () => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Si vienen con hash explícito al planner, respetarlo una sola vez
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = window.location.hash;
    if (h === '#planner' || h === '#start-your-journey-anchor') {
      scrollPlanner();
    }
  }, []);

  // Gating + scroll manual (no automático en mount)
  const go = (target: Step) => {
    const doSet = (next: Step) => {
      setStep(next);
      // scrolleo solo si NO es 'Presentación'
      if (next !== 'Presentación') {
        // Esperar al commit del state:
        setTimeout(scrollPlanner, 0);
      }
    };
    if (target === 'Presentación' || target === 'Presupuesto') return doSet(target);
    if (target === 'By Traveller' && budgetTier) return doSet(target);
    if (target === 'Alma del viaje' && budgetTier && travellerType) return doSet(target);
    if (target === 'Afinar detalles' && budgetTier && travellerType && groupAlma) return doSet(target);
  };

  // --- FlipCard local
  function FlipCard({
    item,
    onChoose,
  }: {
    item: { key: string; title: string; img: string };
    onChoose: (key: string) => void;
  }) {
    const [flipped, setFlipped] = useState(false);

    const innerStyle: CSSProperties = {
      transformStyle: 'preserve-3d',
      transition: 'transform 0.5s',
      transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
    };
    const faceStyle: CSSProperties = { backfaceVisibility: 'hidden' };

    const copy: Record<string, string> = {
      'visual-storytellers': 'De la cámara al drone: viajes para quienes miran el mundo a través de una lente.',
      'yoga-wellness': 'De la esterilla al amanecer: escapadas para reconectar cuerpo y mente.',
      spiritual: 'Del silencio al canto: viajes para quienes buscan lo trascendente.',
      foodies: 'De la cocina callejera a la de autor: paladares curiosos bienvenidos.',
      'stories-fantasy': 'De pantallas y libros al viaje: vivan sus sagas y escenarios favoritos.',
      'nature-adventure': 'De la cima al río: respirar hondo y conquistar.',
      friends: 'De las risas al brindis: anécdotas aseguradas.',
      business: 'De la sala de juntas al destino sorpresa: estrategia con conexión real.',
      students: 'De la teoría al terreno: aprendizaje en aventura.',
      'music-festivals': 'Del backstage al campamento: vivir a ritmo de canciones.',
    };

    return (
      <div
        className="relative h-[420px] w-full rounded-2xl overflow-hidden border border-white/10 bg-white/5 text-white"
        style={{ perspective: '1200px' }}
      >
        <div
          style={innerStyle}
          onMouseEnter={() => setFlipped(true)}
          onMouseLeave={() => setFlipped(false)}
          onClick={() => setFlipped((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setFlipped((v) => !v);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`${item.title} — ver detalles`}
          className="h-full w-full"
        >
          {/* Frente */}
          <div className="absolute inset-0" style={faceStyle}>
            <img
              src={item.img}
              alt={item.title}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h3 className="text-lg font-semibold">{item.title}</h3>
            </div>
          </div>
          {/* Dorso */}
          <div className="absolute inset-0" style={{ ...faceStyle, transform: 'rotateY(180deg)' }}>
            <img src={item.img} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-black/70 p-4 flex flex-col justify-between">
              <p className="text-sm leading-relaxed">
                {copy[item.key] ?? 'La razón que les mueve, convertida en aventura bien diseñada.'}
              </p>
              <button
                className="self-start mt-4 inline-flex items-center rounded-full bg-white text-neutral-900 px-3 py-1 text-sm font-semibold hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-white/70"
                onClick={(e) => {
                  e.stopPropagation();
                  onChoose(item.key);
                }}
              >
                Elegir y continuar →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section id="planner" ref={sectionRef} className="bg-white text-neutral-900 py-16 scroll-mt-24">
      {/* Ancla oculta por compatibilidad con enlaces antiguos */}
      <span id="start-your-journey-anchor" className="sr-only" />

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Tabs header con gating */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-8" role="tablist" aria-label="Planificador Randomtrip">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => go(t)}
              className={clsx(
                'px-3 py-2 rounded-full text-sm ring-1 ring-black/10 transition hover:-translate-y-0.5 hover:shadow-lg',
                step === t ? 'bg-black text-white' : 'bg-white text-neutral-700'
              )}
              role="tab"
              aria-selected={step === t}
              aria-current={step === t ? 'step' : undefined}
            >
              {t}
            </button>
          ))}
        </div>

        {/* STEP 1: Presentación */}
        {step === 'Presentación' && (
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">Una muestra del estilo</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Deslizá sobre las tarjetas para sentir la vibra. Cuando quieras, activá tu Randomtrip.
            </p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {previewChips.map((c) => (
                <div
                  key={c.title}
                  className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
                  role="group"
                  aria-label={c.title}
                >
                  <div className="text-center font-semibold text-neutral-900">{c.title}</div>
                  <div className="mt-4 text-sm text-neutral-700 opacity-0 group-hover:opacity-100 transition">
                    {c.core}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-right">
              <button
                className="inline-flex items-center rounded-full bg-[#E4A687] text-white px-5 py-3 text-sm font-semibold shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E4A687]"
                onClick={() => {
                  setStep('Presupuesto');
                  setTimeout(scrollPlanner, 0);
                }}
                aria-label="GetRandomtrip! Ir a Presupuesto"
              >
                GetRandomtrip! →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Presupuesto */}
        {step === 'Presupuesto' && (
          <div>
            <h3 className="text-center text-2xl font-semibold text-neutral-900">✨ Comiencen a planear su escapada</h3>
            <p className="mt-2 text-center text-sm text-neutral-700 max-w-3xl mx-auto">
              💡 Lo único que se define acá en este paso es el presupuesto por persona. Ese será su techo.
              El resto… dejalo en manos de tu Tripper.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mt-8">
              {tiers.map((t) => (
                <div
                  key={t.key}
                  className={clsx(
                    'h-full flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 text-left shadow-sm transition',
                    budgetTier === t.key ? 'ring-2 ring-neutral-900' : 'hover:shadow-md hover:-translate-y-0.5'
                  )}
                >
                  <h4 className="font-semibold text-neutral-900">{t.title}</h4>
                  <ul className="mt-3 text-sm text-neutral-800 list-disc pl-5 space-y-1 flex-1">
                    {t.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-4 border-t border-neutral-200 md:mt-auto">
                    <button
                      className="w-full inline-flex items-center justify-center rounded-full bg-neutral-900 text-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 focus:ring-offset-white"
                      onClick={() => {
                        setBudgetTier(t.key);
                        setStep('By Traveller');
                        setTimeout(scrollPlanner, 0);
                      }}
                      aria-pressed={budgetTier === t.key}
                      aria-label={`Elegir ${t.title}`}
                    >
                      {t.cta || 'Elegir este nivel →'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: By Traveller */}
        {step === 'By Traveller' && (
          <div>
            <h3 className="text-center text-2xl font-semibold text-neutral-900">
              ¿Qué tipo de viaje estás pensando?
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mt-8">
              {travellerOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setTravellerType(opt.key)}
                  className={clsx(
                    'group relative h-[420px] rounded-2xl overflow-hidden border border-neutral-200 bg-white text-left focus:outline-none focus:ring-2 focus:ring-neutral-900 transition',
                    travellerType === opt.key && 'ring-2 ring-neutral-900'
                  )}
                  aria-pressed={travellerType === opt.key}
                  tabIndex={0}
                >
                  {opt.img.endsWith('.mp4') ? (
                    <div className="absolute inset-0 grid place-items-center bg-neutral-200 text-neutral-600 text-sm">
                      Video preview
                    </div>
                  ) : (
                    <img
                      src={opt.img}
                      alt={opt.title}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
                  <div className="absolute bottom-0 p-4 text-white">
                    <div className="text-2xl font-extrabold drop-shadow">{opt.title}</div>
                    <div className="text-sm opacity-90">Elegí el espíritu del viaje.</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 text-right">
              <button
                className="inline-flex items-center rounded-full bg-[#E4A687] text-white px-5 py-3 text-sm font-semibold shadow-sm disabled:opacity-50"
                onClick={() => {
                  setStep('Alma del viaje');
                  setTimeout(scrollPlanner, 0);
                }}
                disabled={!travellerType}
                aria-label="Continuar a Alma del viaje"
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Alma del viaje */}
        {step === 'Alma del viaje' && (
          <div>
            <h3 className="text-center text-2xl font-semibold text-neutral-900">
              Viajamos por muchas razones, ¿cuál los mueve hoy?
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-8">
              {almaOptionsList.slice(0, 5).map((it) => (
                <FlipCard
                  key={it.key}
                  item={it}
                  onChoose={(k) => {
                    setGroupAlma(k);
                    setStep('Afinar detalles');
                    setTimeout(scrollPlanner, 0);
                  }}
                />
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-6">
              {almaOptionsList.slice(5).map((it) => (
                <FlipCard
                  key={it.key}
                  item={it}
                  onChoose={(k) => {
                    setGroupAlma(k);
                    setStep('Afinar detalles');
                    setTimeout(scrollPlanner, 0);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: Afinar detalles */}
        {step === 'Afinar detalles' && groupAlma && (
          <AlmaDetails
            groupKey={groupAlma}
            budgetTier={budgetTier}
            onBack={() => {
              setStep('Alma del viaje');
              setTimeout(scrollPlanner, 0);
            }}
            onContinue={(_selectedKeys) => {
              // The original implementation passed a lot of query params.
              // The new destination is a generic starting point for a new journey,
              // so we are navigating there directly without the old context.
              window.location.href = '/journey/basic-config';
            }}
          />
        )}

        {step === 'Afinar detalles' && !groupAlma && (
          <div className="rounded-xl border border-neutral-200 bg-white p-6 mt-8">
            <p className="text-neutral-700">Elegí primero un alma del viaje.</p>
            <div className="mt-4">
              <button
                className="inline-flex items-center rounded-full border px-4 py-2 text-sm hover:bg-neutral-50"
                onClick={() => {
                  setStep('Alma del viaje');
                  setTimeout(scrollPlanner, 0);
                }}
              >
                ← Volver
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
