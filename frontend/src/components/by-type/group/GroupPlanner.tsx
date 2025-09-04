'use client';

import { useState, useMemo, useEffect, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import AlmaDetails from '@/components/by-type/group/AlmaDetails';
import { gotoBasicConfig, normalizeTierId } from '@/lib/linking';

type Step = 'Intro' | 'Presupuesto' | 'Grupo & Alma' | 'Afinar detalles';

const cardBase =
  "rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 md:p-6 " +
  "flex flex-col justify-between text-neutral-900";

export default function GroupPlanner() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('Intro');
  const [budgetTier, setBudgetTier] = useState<string | null>(null);
  const [pendingPriceLabel, setPendingPriceLabel] = useState<string | null>(null);
  const [groupAlma, setGroupAlma] = useState<string | null>(null);

  // Lee hash inicial para abrir directamente el presupuesto: #group-planner?step=budget
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = window.location.hash;
    const [, query] = h.split('?');
    const s = new URLSearchParams(query || '').get('step');
    if (s === 'budget') setStep('Presupuesto');
  }, []);

  // --------- TAB 2: Presupuesto ---------
  const tiers = useMemo(
    () => [
      {
        id: 'essenza',
        name: 'Essenza',
        subtitle: 'Lo esencial, compartido.',
        priceLabel: 'Hasta 350 USD',
        priceFootnote: '· por persona',
        features: [
          { text: '📍 Duración: Máximo 2 noches.' },
          {
            text: '✈️ Transporte: Low cost (buses o vuelos off-peak).',
            footnote: 'Selección de asiento, carry-on y bodega no incluidos.',
          },
          { text: '🗓️ Fechas: Menor disponibilidad; con restricciones y bloqueos.' },
          { text: '🛏️ Alojamiento: Midscale (3★ o equivalentes).',
          },
          { text: '🎁 Extras: Guía esencial con recomendaciones simples para el grupo.' },
        ],
        closingLine: '📝 Una escapada simple para sincronizar agendas, para que solo se preocupen por disfrutar juntos.',
        ctaLabel: 'Activen su Essenza →',
      },
      {
        id: 'explora',
        name: 'Modo Explora',
        subtitle: 'Activo y flexible, en equipo.',
        priceLabel: 'Hasta 550 USD',
        priceFootnote: '· por persona',
        features: [
          { text: '📍 Duración: Hasta 3 noches.' },
          {
            text: '✈️ Transporte: Multimodal, horarios flexibles.',
            footnote: 'Selección de asiento, carry-on y bodega no incluidos.',
          },
          { text: '🗓️ Fechas: Mayor disponibilidad; algunos bloqueos en feriados/puentes.' },
          { text: '🛏️ Alojamiento: : Midscale – Upper Midscale.' },
          { text: '🎁 Extras: Guia Randomtrip con actividades y sugerencias para distintos ritmos dentro del grupo.' },
        ],
        closingLine: '📝 Para grupos que quieren explorar a su ritmo, con la flexibilidad que necesitan.',
        ctaLabel: 'Activen su Modo Explora →',
      },
      {
        id: 'exploraPlus',
        name: 'Explora+',
        subtitle: 'Más capas, más momentos.',
        priceLabel: 'Hasta 850 USD',
        priceFootnote: '· por persona',
        features: [
          { text: '📍 Duración: Hasta 4 noches.' },
          {
            text: '✈️ Transporte: Multimodal.',
            footnote: 'Carry-on incluido; selección de asiento y bodega no incluidos.',
          },
          { text: '🗓️ Fechas: Alta disponibilidad, incluso en feriados/puentes.' },
          { text: '🛏️ Alojamiento: Upscale asegurado.' },
          { text: '🎁 Extras: 1 experiencia curada especial para el grupo (ej.: brindis privado, caminata guiada al atardecer).' },
          { text: '🌟 **Destination Decoded**: guia personalizada para que cada día sea una sorpresa curada.' },
        ],
        closingLine: '📝 Más días, más actividades, más anécdotas que se vuelven leyenda compartida.',
        ctaLabel: 'Suban de nivel con Explora+ →',
      },
      {
        id: 'bivouac',
        name: 'Bivouac',
        subtitle: 'Curaduría artesanal para su tribu.',
        priceLabel: 'Hasta 1200 USD',
        priceFootnote: '· por persona',
        features: [
          { text: '📍 Duración: Hasta 5 noches.' },
          {
            text: '✈️ Transporte: Multimodal.',
            footnote: 'Carry-on incluido; selección de asiento/bodega opcional.',
          },
          { text: '🗓️ Fechas: Sin bloqueos.' },
          { text: '🛏️ Alojamiento: Upper-Upscale (boutique, diseño, stays con alma).',
          },
          { text: '🎁 Extras: **Concierge Advisor** + 1 experiencia premium grupal (ej.: mesa del chef, excursión privada) + perks.' },
          { text: '🌟 **Destination Decoded**: guia curada por nuestros Concierge Advisors, con claves que pocos conocen.' },
        ],
        closingLine: '📝 Una experiencia grupal única, con detalles que marcan la diferencia.',
        ctaLabel: 'Viajen distinto con Bivouac →',
      },
      {
        id: 'atelier',
        name: 'Atelier Getaway',
        subtitle: 'Distinción, a medida (Group Edition).',
        priceLabel: 'Desde 1200 USD',
        priceFootnote: '· por persona',
        features: [
          { text: '📍 Duración: Customizable.' },
          { text: '✈️ Transporte: Multimodal / a medida.' },
          { text: '🗓️ Fecha: Sin bloqueos.' },
          { text: '🛏️ Alojamiento: Luxury / de autor / Cadenas Hoteleras A1.' },
          { text: '💎 Extras: **Co-creación con un Luxury Travel Advisor + equipo 24/7**. Incluye 2+ experiencias de lujo diseñadas a medida. Atelier Perks.'},
        ],
        closingLine: '📝 La experiencia que convierte cualquier celebración en inolvidable.',
        ctaLabel: 'A un clic de lo extraordinario →',
      },
    ],
    []
  );

  // --------- TAB 3: data de grupos ---------
  const groups = [
    { key: 'visual-storytellers', title: 'Narradores Visuales', img: 'https://images.unsplash.com/photo-1483721310020-03333e577078' },
    { key: 'yoga-wellness', title: 'Yoga & Bienestar', img: 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d' },
    { key: 'spiritual', title: 'Religioso o Espiritual', img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee' },
    { key: 'foodies', title: 'Gastronómico', img: 'https://images.unsplash.com/photo-1526312426976-593c2d0a3d5b' },
    { key: 'stories-fantasy', title: 'Historias & Fantasía', img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e' },
    { key: 'nature-adventure', title: 'Naturaleza & Aventura', img: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470' },
    { key: 'friends', title: 'Amigos', img: 'https://images.unsplash.com/photo-1520975916090-3105956dac38' },
    { key: 'business', title: 'Negocios', img: 'https://images.unsplash.com/photo-1474631245212-32dc3c8310c6' },
    { key: 'students', title: 'Estudiantes', img: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b' },
    { key: 'music-festivals', title: 'Música & Festivales', img: 'https://images.unsplash.com/photo-1506157786151-b8491531f063' },
  ];

  const handleTierCTA = (tierId: string, priceLabel: string) => {
    const level = normalizeTierId(tierId);

    if (level === 'essenza' || level === 'modo-explora') {
      gotoBasicConfig(router, { fromOrType: 'group', tierId, priceLabel });
      return;
    }

    setBudgetTier(tierId);
    setPendingPriceLabel(priceLabel);
    setStep('Grupo & Alma');
    document.getElementById('group-planner')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // --------- Header ----------
  const Header = () => (
    <div className="sticky top-0 z-[1] bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 text-center">
        <h2 className="font-display text-3xl md:text-4xl text-neutral-900">
          De amigos a equipos: diseñen su Randomtrip
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Pasos cortos, para crear la mejor experiencia.
        </p>
        <ol className="mt-4 flex justify-center gap-3 text-sm text-neutral-500">
          <li className={step === 'Presupuesto' ? 'font-semibold text-neutral-900' : ''}>Presupuesto</li>
          <li>·</li>
          <li className={step === 'Grupo & Alma' ? 'font-semibold text-neutral-900' : ''}>Grupo & Alma</li>
          <li>·</li>
          <li className={step === 'Afinar detalles' ? 'font-semibold text-neutral-900' : ''}>Afinar detalles</li>
        </ol>
      </div>
    </div>
  );

  // --------- Tab 1: Intro ----------
  const Intro = () => (
    <section data-testid="group-planner" className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        <div>
          <h3 className="text-xl font-semibold text-neutral-900">
            Viajar en grupo tiene sus códigos <span className="text-neutral-500">(y los entendemos)</span>
          </h3>
          <p className="mt-3 text-neutral-700">
            Sin planillas ni discusiones eternas: nosotros orquestamos la logística, ustedes disfrutan la historia compartida.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {['Cero fricción logística', 'Experiencias que unen', 'Sorpresa bien diseñada'].map((t) => (
              <span key={t} className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-800">
                {t}
              </span>
            ))}
          </div>

          <div className="mt-8">
            <a
              href="#group-planner?step=budget"
              data-testid="cta-presupuesto"
              className="btn-primary"
              onClick={(e) => {
                e.preventDefault();
                setStep('Presupuesto');
                document.getElementById('group-planner')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              Empezar → Presupuesto
            </a>
          </div>

          <details className="mt-8 rounded-lg border bg-white p-4 text-neutral-800">
            <summary className="cursor-pointer font-medium">¿Cómo funciona?</summary>
            <ol className="mt-3 space-y-2 list-decimal list-inside text-sm">
              <li>Nos cuentan lo básico y los matcheamos con un Travel Expert.</li>
              <li>Eligen el marco (entorno) o lo dejan 100% sorpresa.</li>
              <li>Preparamos la experiencia: logística + kit + recomendaciones.</li>
              <li>Aventura guiada de forma invisible.</li>
            </ol>
          </details>
        </div>

        <aside className="md:pl-6 text-neutral-700 leading-relaxed">
          <p className="mb-3">
            Diseñamos viajes que funcionan para grupos reales: tiempos distintos, presupuestos mixtos y objetivos en común.
          </p>
          <p className="mb-3">
            Ustedes traen la historia; nosotros la convertimos en escenario: logística sin fricción, experiencias que unen y la dosis justa de sorpresa.
          </p>
          <p className="opacity-80">Cuando lo compartido se diseña bien, cada momento se recuerda en mayúsculas.</p>
        </aside>
      </div>
    </section>
  );

  // --------- FlipCard (Tab 3) ----------
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

    const supportCopy: Record<string, string> = {
      'visual-storytellers':
        'De la cámara al drone: viajes para quienes miran el mundo a través de una lente. Nosotros armamos el escenario; ustedes capturan la historia.',
      'yoga-wellness':
        'De la esterilla al amanecer: escapadas para reconectar cuerpo y mente. Nosotros diseñamos el espacio; ustedes encuentran la calma.',
      spiritual:
        'Del silencio al canto: viajes para quienes buscan lo trascendente. Nosotros marcamos el camino; ustedes viven la fe y la conexión.',
      foodies:
        'De la cocina callejera al banquete local: escapadas para paladares curiosos. Nosotros preparamos la mesa; ustedes descubren el sabor.',
      'stories-fantasy':
        'De pantallas y libros al viaje: vivan sus sagas y escenarios favoritos. Nosotros creamos la trama; ustedes son protagonistas.',
      'nature-adventure':
        'De la cima al río: para quienes buscan sudar, respirar y conquistar. Nosotros trazamos la ruta; ustedes se lanzan.',
      friends:
        'De las risas al brindis: viajes para celebrar la amistad en cada kilómetro. Nosotros armamos el plan; ustedes las anécdotas.',
      business:
        'De la sala de juntas al destino sorpresa: escapadas que mezclan estrategia con conexión real.',
      students:
        'De la teoría al terreno: viajes que convierten el aprendizaje en aventura.',
      'music-festivals':
        'Del backstage al campamento: viajes para quienes viven a ritmo de canciones.',
    };

    return (
      <div className="relative h-[420px] w-full rounded-2xl overflow-hidden border border-white/10 bg-white/5 text-white" style={{ perspective: '1200px' }}>
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
          <div className="absolute inset-0" style={faceStyle}>
            <img src={item.img} alt={item.title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h3 className="text-lg font-semibold">{item.title}</h3>
            </div>
          </div>

          <div className="absolute inset-0" style={{ ...faceStyle, transform: 'rotateY(180deg)' }}>
            <img src={item.img} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-black/70 p-4 flex flex-col justify-between">
              <p className="text-sm leading-relaxed">{supportCopy[item.key]}</p>
              <button
                className="self-start mt-4 inline-flex items-center rounded-full bg-white text-neutral-900 px-3 py-1 text-sm font-semibold hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-white/70"
                onClick={(e) => {
                  e.stopPropagation();
                  setGroupAlma(item.key);
                  setStep('Afinar detalles');
                  document.getElementById('group-planner')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  // --------- Render principal por tabs ----------
  return (
    <div className="bg-white">
      <div id="group-planner" className="h-0 scroll-mt-24" />
      <Header />

      {step === 'Intro' && <Intro />}

      {step === 'Presupuesto' && (
        <section data-testid="tab-presupuesto" className="max-w-7xl mx-auto px-4 md:px-8 py-10">
          <div className="text-center mb-8">
            <h3
              data-testid="tab2-title"
              className="text-center text-xl font-semibold text-neutral-900"
            >
             💡 Lo único que definen acá es el presupuesto por persona para pasaje y alojamiento. Ese será su techo. Del resto… nos ocupamos nosotros.
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {tiers.map((t) => (
              <div
                key={t.id}
                role="group"
                aria-labelledby={`h-${t.id}`}
                className="h-full flex flex-col rounded-2xl bg-white p-6 border border-gray-200 shadow-md transition hover:shadow-lg hover:scale-[1.02]"
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
                        • {f.text.split('**').map((part, index) => (
                            index % 2 === 1 ? <strong key={index}>{part}</strong> : part
                          ))}
                        {f.footnote && (
                          <span className="block pl-4 text-xs text-gray-600">* {f.footnote}</span>
                        )}
                      </li>
                    ))}
                  </ul>

                  {t.closingLine && (
                    <div className="mt-auto py-4 border-y border-gray-200">
                      <p className="text-neutral-800 text-sm leading-relaxed text-center">
                        {t.closingLine}
                      </p>
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
              className="text-neutral-800 underline decoration-neutral-400 hover:decoration-neutral-800"
              onClick={() => {
                setStep('Intro');
                document.getElementById('group-planner')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              ← Volver
            </button>
          </div>
        </section>
      )}

      {step === 'Grupo & Alma' && (
        <section data-testid="tab-grupo-alma" className="max-w-7xl mx-auto px-4 md:px-8 py-10">
          <div className="text-center mb-8">
            <h3
              data-testid="tab3-title"
              className="text-center text-xl font-semibold text-neutral-900"
            >
              Viajamos por muchas razones, ¿cuál los mueve hoy?
            </h3>
            <p
              data-testid="tab3-tagline"
              className="mt-2 text-center text-sm text-neutral-700 max-w-3xl mx-auto"
            >
              Toda escapada tiene su “porque sí”.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-8">
            {groups.slice(0, 5).map((it) => (
              <FlipCard key={it.key} item={it} onChoose={(k) => setGroupAlma(k)} />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-6">
            {groups.slice(5).map((it) => (
              <FlipCard key={it.key} item={it} onChoose={(k) => setGroupAlma(k)} />
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              data-testid="cta-back-to-tab2"
              className="text-neutral-800 underline decoration-neutral-400 hover:decoration-neutral-800"
              onClick={() => setStep('Presupuesto')}
            >
              ← Volver
            </button>
          </div>
        </section>
      )}

      {step === 'Afinar detalles' && groupAlma && (
        <AlmaDetails
          groupKey={groupAlma}
          budgetTier={budgetTier}
          onBack={() => {
            setStep('Grupo & Alma');
            document.getElementById('group-planner')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          onContinue={(selectedKeys) => {
            gotoBasicConfig(router, {
              fromOrType: 'group',
              tierId: budgetTier!,
              priceLabel: pendingPriceLabel!,
              extra: {
                groupAlma: groupAlma!,
                almaOptions: selectedKeys.join(','),
              },
            });
          }}
        />
      )}

      {step === 'Afinar detalles' && !groupAlma && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <p className="text-neutral-700">Elegí primero un alma del viaje.</p>
          </div>
          <div className="mt-8 text-center">
            <button
              className="text-neutral-800 underline decoration-neutral-400 hover:decoration-neutral-800"
              onClick={() => setStep('Grupo & Alma')}
            >
              ← Volver
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
