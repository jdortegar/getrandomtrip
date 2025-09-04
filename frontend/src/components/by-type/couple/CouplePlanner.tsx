'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import CoupleAlmaDetails from '@/components/by-type/couple/CoupleAlmaDetails';
import { gotoBasicConfig, normalizeTierId } from '@/lib/linking';

type Step = 'Intro' | 'Presupuesto' | '🌟 La Excusa' | 'Afinar detalles';

export default function CouplePlanner() {
  const router = useRouter();

  const tiers = useMemo(
    () => [
      {
        id: 'essenza',
        name: 'Essenza',
        subtitle: 'Lo esencial con estilo',
        priceLabel: 'Hasta 350 USD',
        priceFootnote: '· por persona',
        features: [
          { text: '📍 Duración: Máx 2 noches' },
          {
            text: '✈️ Transporte: Low cost (buses o vuelos off-peak).',
            footnote: 'Selección de asiento, carry-on y bodega no incluidos.',
          },
          { text: '🗓️ Fechas: Menor disponibilidad, con restricciones y bloqueos.' },
          { text: '🛏️ Alojamiento: Midscale (3★ o equivalentes).' },
          {
            text:
              '🎁 Extras: Guía esencial del destino.',
          },
        ],
        closingLine:
          '📝 Un escape breve, suficiente para mirarse distinto y recordar por qué empezó todo.',
        ctaLabel: 'Den el primer paso →',
      },
      {
        id: 'modo-explora',
        name: 'Modo Explora',
        subtitle: 'Viaje activo y flexible',
        priceLabel: 'Hasta 550 USD',
        priceFootnote: '· por persona',
        features: [
          { text: '📍 Duración: Hasta 3 noches' },
          {
            text: '✈️ Transporte: Multimodal, horarios flexibles.',
            footnote: 'Selección de asiento, carry-on y bodega no incluidos.',
          },
          { text: '🗓️ Fechas: Mayor disponibilidad; algunos bloqueos en feriados/puentes.' },
          { text: '🛏️ Alojamiento: Mid-to-Upscale.' },
          { text: '🎁 Extras: Guía Randomtrip diseñada para descubrir juntos.' },
        ],
        closingLine:
          '📝 Para los que creen que la mejor forma de enamorarse es perderse y reencontrarse.',
        ctaLabel: 'Exploren su historia →',
      },
      {
        id: 'explora-plus',
        name: 'Explora+',
        subtitle: 'Más capas, más momentos',
        priceLabel: 'Hasta 850 USD',
        priceFootnote: '· por persona',
        features: [
          { text: '📍 Duración: Hasta 4 noches' },
          {
            text: '✈️ Transporte: Multimodal.',
            footnote: 'Carry-on incluido; selección de asiento y bodega no incluidos.',
          },
          { text: '🗓️ Fechas: Alta disponibilidad, incluso en feriados/puentes.' },
          { text: '🛏️ Alojamiento: Upscale asegurado.' },
          { text: '🎁 Extras: 1 experiencia especial en pareja.' },
          { text: '🌟 **Destination Decoded**: guia personalizada para que cada día sea una sorpresa curada.' },
        ],
        closingLine:
          '📝 Más noches, más sorpresas, más excusas para coleccionar recuerdos a dos voces.',
        ctaLabel: 'Suban la apuesta →',
      },
      {
        id: 'bivouac',
        name: 'Bivouac',
        subtitle: 'Romance artesanal',
        priceLabel: 'Hasta 1200 USD',
        priceFootnote: '· por persona',
        features: [
          { text: '📍 Duración: Hasta 5 noches' },
          {
            text: '✈️ Transporte: Multimodal.',
            footnote: 'Carry-on incluido; selección de asiento/bodega opcional.',
          },
          { text: '🗓️ Fechas: Sin bloqueos.' },
          { text: '🛏️ Alojamiento: Upper Upscale (boutique, diseño, experiencias locales).' },
          { text: '🎁 Extras: **Concierge Advisor** + 1 experiencia premium en pareja + perks exclusivos.' },
          { text: '🌟 **Destination Decoded**: guia curada por nuestros Concierge Advisors, con claves que pocos conocen.' },
        ],
        closingLine:
          '📝 Un viaje que se cuida como se cuida una relación: con detalle y paciencia.',
        ctaLabel: 'Viajen distinto →',
      },
      {
        id: 'atelier-getaway',
        name: 'Atelier Getaway',
        subtitle: 'Amor a medida',
        priceLabel: 'Desde 1200 USD',
        priceFootnote: '· por persona',
        features: [
          { text: '📍 Duración: Customizable' },
          { text: '✈️ Transporte: Multimodal / a medida.' },
          { text: '🗓️ Fechas: Sin bloqueos.' },
          { text: '🛏️ Alojamiento: Luxury / de autor / Cadenas Hoteleras A1.' },
          {
            text:
              '💎 Extras: **Co-creación con un Luxury Travel Advisor + equipo 24/7**. Incluye 2+ experiencias premium diseñadas a medida. Atelier Perks.',
          },
        ],
        closingLine:
          '📝 Un lienzo en blanco para crear la escapada que nadie más podrá repetir.',
        ctaLabel: 'Creen lo irrepetible →',
      },
    ],
    [],
  );

  const [step, setStep] = useState<Step>('Intro');
  const [budgetTier, setBudgetTier] = useState<string | null>(null);
  const [pendingPriceLabel, setPendingPriceLabel] = useState<string | null>(null);
  const [coupleAlma, setCoupleAlma] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = window.location.hash;
    const [, query] = h.split('?');
    const s = new URLSearchParams(query || '').get('step');
    if (s === 'budget') setStep('Presupuesto');
  }, []);

  // ------------ BG Wrapper ------------
  const BG_IMG =
    'https://images.unsplash.com/photo-1513279922550-250c2129b13a?auto=format&fit=crop&w=2000&q=80';

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <section
      className="relative isolate"
      style={{
        backgroundImage: `url('${BG_IMG}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* overlay para contraste general */}
      <div className="absolute inset-0 bg-white/72 backdrop-blur-[2px]" />
      {/* contenido */}
      <div className="relative">{children}</div>
    </section>
  );

  // --------- Header ----------
  const Header = () => (
    <div className="sticky top-0 z-[1] bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 text-center">
        <h2 className="font-display text-3xl md:text-4xl text-neutral-900">
          Diseñen su Randomtrip en pareja
        </h2>
        <p className="mt-1 text-sm text-neutral-700">
          👉 Tres pasos sencillos para vivir una historia que nadie más podrá contar.
        </p>
        <ol className="mt-4 flex justify-center gap-3 text-sm text-neutral-600">
          <li className={step === 'Presupuesto' ? 'font-semibold text-neutral-900' : ''}>Presupuesto</li>
          <li>·</li>
          <li className={step === '🌟 La Excusa' ? 'font-semibold text-neutral-900' : ''}>🌟 La Excusa</li>
          <li>·</li>
          <li className={step === 'Afinar detalles' ? 'font-semibold text-neutral-900' : ''}>Afinar detalles</li>
        </ol>
      </div>
    </div>
  );

  // --------- Intro ----------
  const Intro = () => (
    <section data-testid="couple-planner" className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        <div>
          <h3 className="text-xl font-semibold text-neutral-900">
            Viajar en pareja tiene sus códigos <span className="text-neutral-600">(y los entendemos)</span>
          </h3>
          <p className="mt-3 text-neutral-800">
            Sin planillas, sin discusiones eternas: ustedes traen la historia; nosotros ponemos el escenario.
            Lo básico se resuelve en minutos. Lo inolvidable, lo viven ustedes.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {[
              '✨ Cero fricción logística',
              '💞 Experiencias que unen',
              '🎭 Sorpresa bien diseñada',
              '🌟 Destination Decoded (exclusivo en Explora+, Bivouac y Atelier)',
            ].map((t) => (
              <span
                key={t}
                className="rounded-full border border-neutral-300/70 bg-white/80 backdrop-blur px-4 py-2 text-sm text-neutral-900"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="mt-8">
            <a
              href="#couple-planner?step=budget"
              data-testid="cta-presupuesto"
              className="btn-primary"
              onClick={(e) => {
                e.preventDefault();
                setStep('Presupuesto');
                document.getElementById('couple-planner')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              👉 GETRANDOMTRIP! →
            </a>
          </div>

          <details className="mt-8 rounded-lg border bg-white/85 backdrop-blur p-4 text-neutral-900">
            <summary className="cursor-pointer font-medium">¿Cómo funciona?</summary>
            <ol className="mt-3 space-y-2 list-decimal list-inside text-sm">
              <li>Ustedes cuentan lo básico.</li>
              <li>Definen el marco o lo dejan 100% al azar.</li>
              <li>Nosotros orquestamos la logística + kit + Decode.</li>
              <li>Viajan guiados de forma invisible.</li>
            </ol>
          </details>
        </div>

        <aside className="md:pl-6 text-neutral-900 leading-relaxed">
          <p className="mb-3">
            Diseñamos viajes que funcionan para parejas reales: con tiempos distintos, presupuestos mezclados y ganas de sorprenderse en común.
          </p>
          <p className="mb-3">
            Ustedes traen la historia; nosotros la transformamos en escenario: sin fricciones logísticas, con experiencias que conectan y la dosis justa de misterio.
          </p>
          <p className="mb-3">Porque cuando lo compartido se diseña bien, cada recuerdo se escribe en mayúsculas.</p>
        </aside>
      </div>
    </section>
  );

  // 8 tarjetas (4x4) para "La Excusa"
  const COUPLES_CARDS = [
    { key: 'romantic-getaway', title: 'Escapada Romántica 💞', img: 'https://images.unsplash.com/photo-1639748399660-734ae9ec2f8a' },
    { key: 'adventure-duo', title: 'Dúo de Aventura 🏔️', img: 'https://images.unsplash.com/photo-1562337635-a4d98d22c1d2' },
    { key: 'foodie-lovers', title: 'Foodie Lovers 🍷🍝', img: 'https://images.unsplash.com/photo-1663428710477-c7c838be76b5' },
    { key: 'culture-tradition', title: 'Cultura & Tradición 🎭🏘️', img: 'https://images.unsplash.com/photo-1717801556175-3a22bd4a0360' },
    { key: 'wellness-retreat', title: 'Wellness Retreat 🧘‍♀️✨', img: 'https://images.unsplash.com/photo-1687875495230-96dfea96d9da' },
    { key: 'celebrations', title: 'Celebraciones 🎂🥂', img: 'https://images.unsplash.com/photo-1746559893894-92e3318393bc' },
    { key: 'beach-dunes', title: 'Playa & Dunas 🌊🏖️', img: 'https://images.unsplash.com/photo-1756506606876-e0ed2a999616' },
    { key: 'urban-getaway', title: 'Escapada Urbana 🏙️🍸', img: 'https://images.unsplash.com/photo-1634452584863-e6590064b4d3' },
  ] as const;

  // Flip card de La Excusa
  function CoupleFlipCard({
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

    const supportCopy: Record<string, string> = {
      'romantic-getaway': 'Un viaje corto, suficiente para apagar el mundo y encenderse mutuamente.',
      'adventure-duo': 'Porque nada une más que perderse juntos en la naturaleza y conquistar lo inesperado.',
      'foodie-lovers': 'Para quienes creen que el amor también entra por el paladar.',
      'culture-tradition': 'El encanto de descubrir juntos pueblos, historias y costumbres locales.',
      'wellness-retreat': 'Un respiro compartido: spa, silencio y bienestar en pareja.',
      celebrations: 'Un aniversario, un logro, o simplemente la excusa perfecta para brindar juntos.',
      'beach-dunes': 'Sol, arena y la excusa eterna para caminar de la mano al atardecer.',
      'urban-getaway': 'Porque la ciudad también puede ser el mejor escenario para perderse en pareja.',
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
          {/* Front */}
          <div className="absolute inset-0" style={faceStyle}>
            <img src={item.img} alt={item.title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h3 className="text-lg font-semibold">{item.title}</h3>
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0" style={{ ...faceStyle, transform: 'rotateY(180deg)' }}>
            <img src={item.img} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-black/70 p-4 flex flex-col justify-between">
              <p className="text-sm leading-relaxed">{supportCopy[item.key]}</p>
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

  // CTA handler: conditional logic as requested
  const handleTierCTA = (tierId: string, priceLabel: string) => {
    const level = normalizeTierId(tierId);

    // Low tiers go directly to basic-config
    if (level === 'essenza' || level === 'modo-explora') {
      gotoBasicConfig(router, { fromOrType: 'couple', tierId, priceLabel });
      return;
    }

    // Higher tiers: save tier info and proceed to the next step
    setBudgetTier(tierId);
    setPendingPriceLabel(priceLabel);
    setStep('🌟 La Excusa');
    document.getElementById('couple-planner')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Wrapper>
      <div id="couple-planner" className="h-0 scroll-mt-24" />
      <Header />

      {step === 'Intro' && <Intro />}

      {step === 'Presupuesto' && (
        <section data-testid="tab-presupuesto" className="max-w-7xl mx-auto px-4 md:px-8 py-10">
          <div className="text-center mb-8">
            <h3 data-testid="tab2-title" className="text-center text-xl font-semibold text-neutral-900">
              💡 Lo único que definen acá es el presupuesto por persona para pasaje y alojamiento. Ese será su techo. Del resto… nos
              ocupamos nosotros.
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {tiers.map((t) => (
              <div
                key={t.id}
                role="group"
                aria-labelledby={`h-${t.id}`}
                className="h-full flex flex-col rounded-2xl bg-white/75 backdrop-blur-md p-6 border border-gray-200/70 shadow-md transition hover:shadow-lg hover:scale-[1.02]"
              >
                {/* Contenido: columna flexible para alinear el closingLine abajo */}
                <div className="flex-1 flex flex-col">
                  <h4 id={`h-${t.id}`} className="font-display text-xl tracking-tightish font-bold text-gray-900">
                    {t.name}
                  </h4>

                  <p className="text-gray-800 text-sm">{t.subtitle}</p>

                  <div className="mt-6">
                    <div className="font-display text-3xl leading-tight font-bold text-[var(--rt-terracotta)]">
                      {t.priceLabel}
                    </div>
                    <span className="block text-xs text-gray-900">{t.priceFootnote}</span>
                  </div>

                  <ul className="mt-5 space-y-2 text-sm text-gray-800">
                    {(t.features ?? []).map((f, i) => (
                      <li key={i} className="leading-snug">
                        •{' '}
                        {f.text.split('**').map((part, index) =>
                          index % 2 === 1 ? <strong key={index}>{part}</strong> : <span key={index}>{part}</span>
                        )}
                        {f.footnote && (
                          <span className="block pl-4 text-xs text-gray-600">* {f.footnote}</span>
                        )}
                      </li>
                    ))}
                  </ul>

                  {t.closingLine && (
                    <div className="mt-auto py-4 border-y border-gray-200/70">
                      <p className="text-neutral-800 text-sm leading-relaxed text-center">{t.closingLine}</p>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div>
                  <button
                    type="button"
                    className="btn-card w-full mt-6"
                    aria-label={t.ctaLabel}
                    onClick={() => handleTierCTA(t.id, t.priceLabel)}
                  >
                    {t.ctaLabel}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              data-testid="cta-volver-intro"
              className="text-neutral-900 underline decoration-neutral-400 hover:decoration-neutral-800"
              onClick={() => {
                setStep('Intro');
                document
                  .getElementById('couple-planner')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              ← Volver
            </button>
          </div>
        </section>
      )}

      {step === '🌟 La Excusa' && (
        <section data-testid="tab-pareja-alma" className="max-w-7xl mx-auto px-4 md:px-8 py-10">
          <div className="text-center mb-8">
            <h3 data-testid="tab3-title" className="text-center text-xl font-semibold text-neutral-900">
              Viajamos por muchas razones, ¿cuál los mueve hoy?
            </h3>
            <p
              data-testid="tab3-tagline"
              className="mt-2 text-center text-sm text-neutral-800 max-w-3xl mx-auto"
            >
              Toda escapada tiene su “porque sí”. Armando el 🌟 Destination Decoded.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {COUPLES_CARDS.map((it) => (
              <CoupleFlipCard
                key={it.key}
                item={it}
                onChoose={(key) => {
                  setCoupleAlma(key);
                  setStep('Afinar detalles');
                  document
                    .getElementById('couple-planner')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              />
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              data-testid="cta-back-to-tab2"
              className="text-neutral-900 underline decoration-neutral-400 hover:decoration-neutral-800"
              onClick={() => setStep('Presupuesto')}
            >
              ← Volver
            </button>
          </div>
        </section>
      )}

      {step === 'Afinar detalles' && coupleAlma && (
        <CoupleAlmaDetails
          coupleKey={coupleAlma}
          budgetTier={budgetTier}
          onBack={() => {
            setStep('🌟 La Excusa');
            document
              .getElementById('couple-planner')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          onContinue={(selectedKeys) => {
            // Final navigation for higher tiers
            gotoBasicConfig(router, {
              fromOrType: 'couple',
              tierId: budgetTier!,
              priceLabel: pendingPriceLabel!,
              extra: {
                coupleAlma: coupleAlma!,
                almaOptions: selectedKeys.join(','),
              },
            });
          }}
        />
      )}

      {step === 'Afinar detalles' && !coupleAlma && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          <div className="rounded-xl border border-neutral-200 bg-white/85 backdrop-blur p-6">
            <p className="text-neutral-800">Por favor, seleccionen un alma de viaje primero.</p>
            <div className="mt-8 text-center">
              <button
                className="text-neutral-900 underline decoration-neutral-400 hover:decoration-neutral-800"
                onClick={() => setStep('🌟 La Excusa')}
              >
                ← Volver
              </button>
            </div>
          </div>
        </section>
      )}
    </Wrapper>
  );
}