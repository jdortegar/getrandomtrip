'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import clsx from 'clsx';
import { SOLO_TIERS } from '@/content/tiers';
import AlmaDetails from '@/components/by-type/group/AlmaDetails';
import { ALMA_OPTIONS } from '@/components/by-type/group/almaOptions';
import type { Tripper } from '@/content/trippers';

type Step =
  | 'Presentación'
  | 'Presupuesto'
  | 'By Traveller'
  | 'Alma del viaje'
  | 'Afinar detalles';

type Props = {
  t: Tripper;
};

export default function TripperPlanner({ t }: Props) {
  const [step, setStep] = useState<Step>('Presentación');
  const [budgetTier, setBudgetTier] = useState<string | null>(null);
  const [travellerType, setTravellerType] = useState<string | null>(null);
  const [groupAlma, setGroupAlma] = useState<string | null>(null);

  const tabs: Step[] = ['Presentación', 'Presupuesto', 'By Traveller', 'Alma del viaje', 'Afinar detalles'];

  const previewChips = useMemo(() => {
    return t.interests?.map(interest => ({
      title: interest,
      core: `Un viaje centrado en ${interest.toLowerCase()}.`
    })) || [];
  }, [t.interests]);

  const tiers = SOLO_TIERS;

  const allTravellerOptions = [
    { key: 'pareja',    title: 'En Pareja',   img: '/images/journey-types/couple-hetero.jpg' },
    { key: 'solo',      title: 'Solo',        img: '/images/journey-types/solo-traveler.jpg' },
    { key: 'familia',   title: 'En Familia',  img: '/images/journey-types/family-vacation.jpg' },
    { key: 'grupo',     title: 'En Grupo',    img: '/images/journey-types/friends-group.jpg' },
    { key: 'honeymoon', title: 'Honeymoon',   img: '/images/journey-types/honeymoon-same-sex.jpg' },
  ];

  const travellerOptions = allTravellerOptions;

  const almaOptionsList = useMemo(() => {
    const options = Object.entries(ALMA_OPTIONS as Record<string, any>).map(([key, val]) => ({
      key,
      title: val?.title ?? key,
      img:
        val?.heroImg ||
        val?.img ||
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80',
    }));
    if (!t.interests) {
      return options;
    }
    return options.filter(opt => t.interests!.some(interest => opt.title.toLowerCase().includes(interest.toLowerCase())));
  }, [t.interests]);

  const sectionRef = useRef<HTMLElement>(null);

  const scrollPlanner = () => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = window.location.hash;
    if (h === '#planner' || h === '#start-your-journey-anchor') {
      scrollPlanner();
    }
  }, []);

  const go = (target: Step) => {
    const doSet = (next: Step) => {
      setStep(next);
      if (next !== 'Presentación') {
        setTimeout(scrollPlanner, 0);
      }
    };
    if (target === 'Presentación' || target === 'Presupuesto') return doSet(target);
    if (target === 'By Traveller' && budgetTier) return doSet(target);
    if (target === 'Alma del viaje' && budgetTier && travellerType) return doSet(target);
    if (target === 'Afinar detalles' && budgetTier && travellerType && groupAlma) return doSet(target);
  };

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
    <section 
      id="planner" 
      ref={sectionRef} 
      className="bg-cover bg-center text-white py-16 scroll-mt-24"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80')" }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative max-w-7xl mx-auto px-4 md:px-8">
        {/* Carátula personalizada */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
            Diseña tu Aventura con {t.name}
          </h2>
          <p className="mt-4 text-lg max-w-3xl mx-auto text-white/90">
            {t.name} se especializa en crear experiencias inolvidables. Sigue estos pasos para empezar a construir tu próximo gran viaje.
          </p>
        </div>

        {/* Tabs header con gating */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-8" role="tablist" aria-label="Planificador Randomtrip">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => go(tab)}
              className={clsx(
                'px-4 py-2 rounded-full text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-lg',
                step === tab ? 'bg-white text-slate-900' : 'bg-white/10 text-white ring-1 ring-white/20'
              )}
              role="tab"
              aria-selected={step === tab}
              aria-current={step === tab ? 'step' : undefined}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* STEP 1: Presentación */}
        {step === 'Presentación' && (
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-8">
            <h2 className="text-2xl md:text-3xl font-semibold">Una muestra del estilo de {t.name.split(' ')[0]}</h2>
            <p className="mt-2 text-sm text-white/80">
              Estas son algunas de las experiencias que {t.name.split(' ')[0]} ama crear.
            </p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {previewChips.map((c) => (
                <div
                  key={c.title}
                  className="group rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition text-center"
                  role="group"
                  aria-label={c.title}
                >
                  <div className="font-semibold">{c.title}</div>
                  <div className="mt-4 text-sm text-white/90 opacity-0 group-hover:opacity-100 transition">
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
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-8">
            <h3 className="text-center text-2xl font-semibold">✨ Comiencen a planear su escapada</h3>
            <p className="mt-2 text-center text-sm text-white/80 max-w-3xl mx-auto">
              💡 Lo único que se define acá en este paso es el presupuesto por persona. Ese será su techo.
              El resto… dejalo en manos de tu Tripper.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mt-8">
              {tiers.map((tier) => (
                <div
                  key={tier.key}
                  className={clsx(
                    'h-full flex flex-col rounded-2xl border border-white/20 bg-white/10 p-5 text-left shadow-sm transition',
                    budgetTier === tier.key ? 'ring-2 ring-white' : 'hover:shadow-md hover:-translate-y-0.5'
                  )}
                >
                  <h4 className="font-semibold">{tier.title}</h4>
                  <ul className="mt-3 text-sm list-disc pl-5 space-y-1 flex-1">
                    {tier.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-4 border-t border-white/20 md:mt-auto">
                    <button
                      className="w-full inline-flex items-center justify-center rounded-full bg-white text-slate-900 px-4 py-2 text-sm font-semibold shadow-sm hover:bg-gray-200"
                      onClick={() => {
                        setBudgetTier(tier.key);
                        setStep('By Traveller');
                        setTimeout(scrollPlanner, 0);
                      }}
                      aria-pressed={budgetTier === tier.key}
                      aria-label={`Elegir ${tier.title}`}
                    >
                      {tier.cta || 'Elegir este nivel →'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: By Traveller */}
        {step === 'By Traveller' && (
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-8">
            <h3 className="text-center text-2xl font-semibold">
              ¿Qué tipo de viaje estás pensando?
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mt-8">
              {travellerOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setTravellerType(opt.key)}
                  className={clsx(
                    'group relative h-[420px] rounded-2xl overflow-hidden border border-white/20 bg-white text-left focus:outline-none focus:ring-2 focus:ring-white transition',
                    travellerType === opt.key && 'ring-2 ring-white'
                  )}
                  aria-pressed={travellerType === opt.key}
                  tabIndex={0}
                >
                  <img
                    src={opt.img}
                    alt={opt.title}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
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
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-8">
            <h3 className="text-center text-2xl font-semibold">
              Viajamos por muchas razones, ¿cuál los mueve hoy?
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-8">
              {almaOptionsList.map((it) => (
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
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-8">
            <AlmaDetails
              groupKey={groupAlma}
              budgetTier={budgetTier}
              onBack={() => {
                setStep('Alma del viaje');
                setTimeout(scrollPlanner, 0);
              }}
              onContinue={(_selectedKeys) => {
                window.location.href = `/packages/${t.slug}/basic-config`;
              }}
            />
          </div>
        )}

        {step === 'Afinar detalles' && !groupAlma && (
          <div className="rounded-xl border border-white/20 bg-white/10 p-6 mt-8">
            <p>Elegí primero un alma del viaje.</p>
            <div className="mt-4">
              <button
                className="inline-flex items-center rounded-full border px-4 py-2 text-sm hover:bg-white/20"
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