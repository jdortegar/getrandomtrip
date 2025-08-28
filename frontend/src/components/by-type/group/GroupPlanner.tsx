'use client';

import { useState, useMemo, useEffect, type CSSProperties } from 'react';
import AlmaDetails from '@/components/by-type/group/AlmaDetails';

type Step = 'Intro' | 'Presupuesto' | 'Grupo & Alma' | 'Afinar detalles';

const cardBase =
  "rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 md:p-6 " +
  "flex flex-col justify-between text-neutral-900";

export default function GroupPlanner() {
  const [step, setStep] = useState<Step>('Intro');
  const [budgetTier, setBudgetTier] = useState<string | null>(null);
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
        key: 'essenza',
        title: '🌱 Essenza — Lo esencial con estilo',
        price: '350 USD · por persona',
        bullets: [
          'Duración: Máx 2 noches',
          'Transporte: Low cost (buses o vuelos off-peak). Selección de asiento, carry-on y bodega no incluidos.',
          'Fechas: Menor disponibilidad, con restricciones y bloqueos.',
          'Alojamiento: Midscale (3★ o equivalentes).',
          'Extras: Guía esencial con recomendaciones simples para el grupo.',
          '📝 Una escapada simple para sincronizar agendas y reírse juntos otra vez.',
        ],
        cta: 'Reservar fácil →',
      },
      {
        key: 'explora',
        title: '🌿 Modo Explora — Activo y flexible',
        price: '500 USD · por persona',
        bullets: [
          'Duración: Hasta 3 noches',
          'Transporte: Multimodal, horarios flexibles. Selección de asiento, carry-on y bodega no incluidos.',
          'Fechas: Mayor disponibilidad; algunos bloqueos en feriados/puentes.',
          'Alojamiento: Midscale – Upper Midscale.',
          'Extras: Guía Randomtrip Decode con actividades y sugerencias para distintos ritmos dentro del grupo.',
          '📝 Planes flexibles que funcionan para distintos gustos y energías dentro del grupo.',
        ],
        cta: 'Activen su modo Explora →',
      },
      {
        key: 'exploraPlus',
        title: '💫 Explora+ — Más capas, más momentos',
        price: '850 USD · por persona',
        bullets: [
          'Duración: Hasta 4 noches',
          'Transporte: Multimodal. Carry-on incluido; selección de asiento y bodega no incluidos.',
          'Fechas: Alta disponibilidad, incluso en feriados/puentes.',
          'Alojamiento: Upscale asegurado.',
          'Extras: Decode personalizado + 1 experiencia curada para el grupo (ej.: brindis privado o salida guiada).',
          '📝 Más noches, más brindis, más anécdotas que se vuelven leyenda compartida.',
        ],
        cta: 'Suban de nivel →',
      },
      {
        key: 'bivouac',
        title: '🔥 Bivouac — Curaduría artesanal',
        price: '1200 USD · por persona',
        bullets: [
          'Duración: Hasta 5 noches',
          'Transporte: Multimodal. Carry-on incluido; selección de asiento/bodega opcional.',
          'Fechas: Sin bloqueos.',
          'Alojamiento: Upper Upscale (boutique, diseño, stays con alma).',
          'Extras: Concierge Advisor + 1 experiencia premium grupal (ej.: mesa del chef, excursión privada) + perks (early/late check-out, upgrades).',
          '📝 Un viaje artesanal que convierte a cualquier grupo en una tribu.',
        ],
        cta: 'Viajen distinto →',
      },
      {
        key: 'atelier',
        title: '✨ Atelier Getaway — Distinción, sin esfuerzo',
        price: 'Desde 1200 USD · por persona',
        bullets: [
          'Duración: Customizable',
          'Transporte: Multimodal / a medida.',
          'Fechas: Sin bloqueos.',
          'Alojamiento: Luxury / de autor / cadenas A1.',
          'Extras: Co-creación con un Luxury Travel Advisor + equipo 24/7. Incluye 2+ experiencias premium a medida para el grupo (celebraciones, milestones, team-bonding). Perks (traslados privados, salas VIP, reservas prioritarias, regalos de marcas asociadas).',
          '📝 La experiencia premium que convierte cualquier celebración en inolvidable.',
        ],
        cta: 'A un clic de lo extraordinario →',
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
              💡 Lo único que definen acá es el presupuesto por persona. Ese será su techo. Del resto… nos ocupamos nosotros.
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {tiers.map((t) => (
              <div
                key={t.key}
                role="group"
                aria-labelledby={`h-${t.key}`}
                className="h-full flex flex-col rounded-2xl bg-white p-6 border border-gray-200 shadow-md transition hover:shadow-lg hover:scale-[1.02]"
              >
                <h4 id={`h-${t.key}`} className="font-display text-xl tracking-tightish font-bold">
                  {t.title}
                </h4>

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
                      setStep('Grupo & Alma');
                      document.getElementById('group-planner')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    aria-controls="group-soul"
                  >
                    {t.ctaLabel} <span aria-hidden>→</span>
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
            const q = new URLSearchParams({
              from: 'group',
              budgetTier: budgetTier ?? '',
              groupAlma: groupAlma ?? '',
              almaOptions: selectedKeys.join(','),
            }).toString();
            window.location.href = `/journey/basic-config?${q}`;
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
