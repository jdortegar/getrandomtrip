// frontend/src/components/by-type/honeymoon/HoneymoonPlanner.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'Presupuesto' | 'Tipo de honeymoon';

type TierData = {
  key: string;
  title: string;
  /** Opcional: no todos los tiers llevan subtítulo */
  subtitle?: string;
  priceLabel: string;
  bullets: string[];
  priceFootnote?: string;
  ctaLabel: string;
  testid?: string;
};

export default function HoneymoonPlanner() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('Presupuesto');
  const [budgetTier, setBudgetTier] = useState<string | null>(null);
  const [hmType, setHmType] = useState<string | null>(null);

  // Lee el hash inicial: #honeymoon-planner?step=budget
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = window.location.hash; // "#honeymoon-planner?step=budget"
    const [, query] = h.split('?'); // "step=budget"
    const s = new URLSearchParams(query || '').get('step');
    if (s === 'budget') {
      setStep('Presupuesto');
      document
        .getElementById('honeymoon-planner')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // --------- TAB 1: Presupuesto (tiers) ---------
  const tiers: TierData[] = useMemo(
    () => [
      {
        key: 'atelier',
        title: '✨ Atelier Getaway — Distinción, sin esfuerzo',
        priceLabel: 'Desde 1800 USD · por persona',
        bullets: [
          'Duración: Customizable',
          'Transporte: Multimodal / a medida.',
          'Fechas: Sin bloqueos.',
          'Alojamiento: Luxury / de autor / cadenas A1.',
          'Extras: Co-creación con un Luxury Travel Advisor + equipo 24/7. Incluye 2+ experiencias premium diseñadas a medida para la pareja.',
          'Perks: Traslados privados, salas VIP, reservas prioritarias, atenciones exclusivas de marcas asociadas.',
        ],
        priceFootnote:
          '📝 Un viaje irrepetible, diseñado como prólogo de una historia que recién comienza.',
        ctaLabel: 'Creen lo extraordinario →',
        testid: 'hm-tier-atelier',
      },
    ],
    []
  );

  // --------- TAB 2: Tipo de Honeymoon (5 tarjetas) ---------
  const hmTypes = [
    {
      key: 'aventura',
      title: 'Aventura',
      core: 'Desafíos compartidos: trekking, kayak, alturas y rutas que laten a su ritmo.',
      img: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
    },
    {
      key: 'naturaleza',
      title: 'Naturaleza & fauna',
      core: 'Escenarios salvajes y encuentros con vida silvestre para recordar por siempre.',
      img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
    },
    {
      key: 'cultura',
      title: 'Cultura & tradiciones',
      core: 'Rituales, sabores y historias locales que se vuelven parte de la suya.',
      img: 'https://images.unsplash.com/photo-1526312426976-593c2d0a3d5b',
    },
    {
      key: 'playas',
      title: 'Playas & Dunas',
      core: 'Mar, arena y cielos que invitan a bajar el ritmo y mirarse en silencio.',
      img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    },
    {
      key: 'musica',
      title: 'Música & Festivales',
      core: 'Sonidos y atmósferas que convierten cada noche en su propia canción.',
      img: 'https://images.unsplash.com/photo-1506157786151-b8491531f063',
    },
  ];

  // --------- Header fijo ---------
  const Header = () => (
    <div className="sticky top-0 z-[1] bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 text-center">
        <h2 className="font-display text-3xl md:text-4xl text-neutral-900">
          Diseñen su Honeymoon Randomtrip
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Pasos cortos, para crear la mejor experiencia.
        </p>
        <ol className="mt-4 flex justify-center gap-3 text-sm text-neutral-500">
          <li className={step === 'Presupuesto' ? 'font-semibold text-neutral-900' : ''}>
            Presupuesto
          </li>
          <li>·</li>
          <li
            className={step === 'Tipo de honeymoon' ? 'font-semibold text-neutral-900' : ''}
          >
            Tipo de honeymoon
          </li>
        </ol>
      </div>
    </div>
  );

  return (
    <div className="bg-white">
      {/* Anchor único para scroll + header sticky */}
      <div
        id="honeymoon-planner"
        data-testid="honeymoon-planner"
        className="h-0 scroll-mt-24"
      />
      <Header />

      {/* ----- TAB: Presupuesto ----- */}
      {step === 'Presupuesto' && (
        <section
          data-testid="hm-tab-presupuesto"
          className="max-w-7xl mx-auto px-4 md:px-8 py-10"
        >
          <p className="mb-8 text-center text-neutral-700">
            <span className="mr-1">💡</span>
            En este paso solo definen el presupuesto por persona. Ese será el techo.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {tiers.map((t) => (
              <div
                key={t.key}
                role="group"
                aria-labelledby={`hm-h-${t.key}`}
                className="h-full flex flex-col rounded-2xl bg-white p-6 border border-gray-200 shadow-md transition hover:shadow-lg hover:scale-[1.02]"
              >
                <h3
                  id={`hm-h-${t.key}`}
                  className="font-display text-xl tracking-tightish font-bold"
                >
                  {t.title}
                </h3>

                {t.subtitle && <p className="mt-1 text-sm text-gray-700">{t.subtitle}</p>}

                {t.priceLabel && (
                  <>
                    <p className="mt-4 font-display text-3xl text-[var(--rt-terracotta)]">
                      {t.priceLabel}
                    </p>
                    <p className="text-xs text-gray-900">por persona</p>
                  </>
                )}

                <ul className="mt-4 list-disc pl-5 text-sm text-neutral-700 leading-relaxed space-y-1">
                  {t.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>

                {t.priceFootnote && (
                  <div className="mt-3 text-xs text-gray-900">{t.priceFootnote}</div>
                )}

                <div className="mt-4">
                  <button
                    type="button"
                    className="btn-card w-full"
                    aria-label={t.ctaLabel}
                    onClick={() => {
                      setBudgetTier(t.key);
                      setStep('Tipo de honeymoon');
                      document
                        .getElementById('honeymoon-planner')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  >
                    {t.ctaLabel} <span aria-hidden>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              data-testid="hm-back"
              className="text-neutral-800 underline decoration-neutral-400 hover:decoration-neutral-800"
              onClick={() => {
                // vuelve al hero
                window.location.hash = '';
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              ← Volver
            </button>
          </div>
        </section>
      )}

      {/* ----- TAB: Tipo de Honeymoon ----- */}
      {step === 'Tipo de honeymoon' && (
        <section
          data-testid="hm-tab-tipo"
          className="max-w-7xl mx-auto px-4 md:px-8 py-10"
        >
          <h3 className="text-center text-lg font-semibold text-neutral-900">
            Elegí el pulso del viaje
          </h3>
          <p className="mt-1 text-center text-neutral-500">
            Cada opción abre una puerta distinta para este nuevo capítulo juntos.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {hmTypes.map((t) => (
              <article
                key={t.key}
                className="group relative h-[420px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition will-change-transform"
              >
                <img
                  src={t.img}
                  alt={t.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-90 group-hover:opacity-100 transition"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
                <div className="relative z-10 h-full flex flex-col justify-between p-4 text-white">
                  <div>
                    <h4 className="text-lg font-semibold">{t.title}</h4>
                    <p className="mt-2 text-sm text-white/90">{t.core}</p>
                  </div>
                  <div className="pt-3">
                    <button
                      data-testid={`hm-type-${t.key}`}
                      className="inline-flex items-center rounded-full bg-white text-neutral-900 px-3 py-1 text-sm font-semibold hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-white/70"
                      onClick={() => {
                        setHmType(t.key);
                        const q = new URLSearchParams({
                          from: 'honeymoon',
                          budgetTier: budgetTier ?? '',
                          honeymoonType: t.key,
                        }).toString();
                        router.push(`/journey/basic-config?${q}`);
                      }}
                    >
                      Seguir a experiencia →
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              data-testid="hm-back"
              className="text-neutral-800 underline decoration-neutral-400 hover:decoration-neutral-800"
              onClick={() => setStep('Presupuesto')}
            >
              ← Volver
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
