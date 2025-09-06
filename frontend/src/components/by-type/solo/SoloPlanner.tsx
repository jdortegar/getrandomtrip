'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Img from '@/components/common/Img'; // Added import
import { useRouter } from 'next/navigation';
import SoloAlmaDetails from '@/components/by-type/solo/SoloAlmaDetails';
import { gotoBasicConfig, normalizeTierId } from '@/lib/linking';

type Step = 'Intro' | 'Presupuesto' | '🌟 La Excusa' | 'Afinar detalles';

const SECTION2_BG = 'https://images.unsplash.com/photo-1707016762529-0afa9d44d6f5';

export default function SoloPlanner() {
  const router = useRouter();

  const tiers = useMemo(
    () => [
      {
        id: 'essenza',
        name: 'Essenza',
        subtitle: 'Lo esencial con estilo',
        priceLabel: '450 USD',
        priceFootnote: '· por persona',
        features: [
          { text: '📍 Duración: Máx 2 noches' },
          {
            text: '✈️ Transporte: Low cost (buses o vuelos off-peak).',
            footnote: 'Selección de asiento, carry-on y bodega no incluidos.',
          },
          { text: '🗓️ Fechas: Menor disponibilidad, con restricciones y bloqueos.' },
          { text: '🛏️ Alojamiento: Midscale (3★ o equivalentes).' },
          { text: '🎁 Extras: Guía esencial para moverte sin complicaciones.' },
        ],
        closingLine:
          '📝 Un escape breve para perderte en lo simple y encontrarte en lo inesperado.',
        ctaLabel: 'Arranca tu Essenza →',
      },
      {
        id: 'modo-explora',
        name: 'Modo Explora',
        subtitle: 'Activo y flexible',
        priceLabel: '650 USD',
        priceFootnote: '· por persona',
        features: [
          { text: '📍 Duración: Hasta 3 noches' },
          {
            text: '✈️ Transporte: Multimodal, horarios flexibles.',
            footnote: 'Selección de asiento, carry-on y bodega no incluidos.',
          },
          { text: '🗓️ Fechas: Mayor disponibilidad; algunos bloqueos en feriados/puentes.' },
          { text: '🛏️ Alojamiento: Midscale – Upper Midscale.' },
          { text: '🎁 Extras: Guía Randomtrip diseñada para descubrir a tu ritmo.' },
        ],
        closingLine:
          '📝 Diseñado para quienes viajan livianos y quieren descubrir sin guion.',
        ctaLabel: 'Activa tu Modo Explora →',
      },
      {
        id: 'explora-plus',
        name: 'Explora+',
        subtitle: 'Más capas, más momentos',
        priceLabel: '1100 USD',
        priceFootnote: '· por persona',
        features: [
          { text: '📍 Duración: Hasta 4 noches' },
          {
            text: '✈️ Transporte: Multimodal.',
            footnote: 'Carry-on incluido; selección de asiento y bodega no incluidos.',
          },
          { text: '🗓️ Fechas: Alta disponibilidad, incluso en feriados/puentes.' },
          { text: '🛏️ Alojamiento: Upscale asegurado.' },
          { text: '🎁 Extras: 1 experiencia curada en solitario.' },
          { text: '🌟 **Destination Decoded**: guia personalizada para que cada día sea una sorpresa curada.' },
        ],
        closingLine:
          '📝 Más noches, más encuentros inesperados y más razones para volver distinto.',
        ctaLabel: 'Sube de nivel →',
      },
      {
        id: 'bivouac',
        name: 'Bivouac',
        subtitle: 'Curaduría artesanal',
        priceLabel: '1550 USD',
        priceFootnote: '· por persona',
        features: [
          { text: '📍 Duración: Hasta 5 noches' },
          {
            text: '✈️ Transporte: Multimodal.',
            footnote: 'Carry-on incluido; selección de asiento/bodega opcional.',
          },
          { text: '🗓️ Fechas: Sin bloqueos.' },
          { text: '🛏️ Alojamiento: Upper Upscale (boutique, diseño, stays con alma).' },
          { text: '🎁 Extras: **Concierge Advisor** + 1 experiencia premium + perks exclusivos.' },
          { text: '🌟 **Destination Decoded**: guia curada por nuestros Concierge Advisors, con claves que pocos conocen.' },
        ],
        closingLine:
          '📝 Un viaje íntimo, cuidado al detalle, que convierte la soledad en un lujo personal.',
        ctaLabel: 'Viaja distinto →',
      },
      {
        id: 'atelier-getaway',
        name: 'Atelier Getaway',
        subtitle: 'Distinción, sin esfuerzo',
        priceLabel: 'Desde 1550 USD',
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
          '📝 El lujo de viajar sin testigos, con experiencias que se vuelven confidenciales.',
        ctaLabel: 'Crea lo irrepetible →',
      },
    ],
    []
  );

  const [step, setStep] = useState<Step>('Intro');
  const [budgetTier, setBudgetTier] = useState<string | null>(null);
  const [pendingPriceLabel, setPendingPriceLabel] = useState<string | null>(null);
  const [soloAlma, setSoloAlma] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = window.location.hash;
    const [, query] = h.split('?');
    const s = new URLSearchParams(query || '').get('step');
    if (s === 'budget') setStep('Presupuesto');
  }, []);

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <section
      className="relative isolate"
      style={{
        backgroundImage: `url('${SECTION2_BG}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-white/72 backdrop-blur-[2px]" />
      <div className="relative">{children}</div>
    </section>
  );

  const Header = () => (
    <div className="sticky top-0 z-[1] bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 text-center">
        <h2 className="font-display text-3xl md:text-4xl text-neutral-900">
          Diseñá tu Sol@ Randomtrip
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          👉 Tres pasos sencillos para una historia que nadie más podrá contar.
        </p>
        <ol className="mt-4 flex justify-center gap-3 text-sm text-neutral-500">
          <li className={step === 'Presupuesto' ? 'font-semibold text-neutral-900' : ''}>Presupuesto</li>
          <li>·</li>
          <li className={step === '🌟 La Excusa' ? 'font-semibold text-neutral-900' : ''}>🌟 La Excusa</li>
          <li>·</li>
          <li className={step === 'Afinar detalles' ? 'font-semibold text-neutral-900' : ''}>Afinar detalles</li>
        </ol>
      </div>
    </div>
  );

  const Intro = () => (
    <section data-testid="solo-planner-intro" className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        <div>
          <h3 className="text-xl font-semibold text-neutral-900">
            Viajar (solo/a) tiene sus códigos <span className="text-neutral-600">(y los entendemos)</span>
          </h3>
          <p className="mt-3 text-neutral-800">
            Sin planillas, sin discusiones eternas: tú traes la historia; nosotros ponemos el escenario.
            Lo básico se resuelve en minutos. Lo inolvidable, lo vives tú.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              '✨ Cero fricción logística',
              '💞 Experiencias que conectan',
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
              href="#planes?step=budget"
              data-testid="cta-presupuesto"
              className="btn-primary"
              onClick={(e) => {
                e.preventDefault();
                setStep('Presupuesto');
                document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              👉 GETRANDOMTRIP! →
            </a>
          </div>
          <details className="mt-8 rounded-lg border bg-white/85 backdrop-blur p-4 text-neutral-900">
            <summary className="cursor-pointer font-medium">¿Cómo funciona?</summary>
            <ol className="mt-3 space-y-2 list-decimal list-inside text-sm">
              <li>Tú cuentas lo básico.</li>
              <li>Defines el marco o lo dejas 100% al azar.</li>
              <li>Nosotros orquestamos la logística + kit + Decode.</li>
              <li>Viajas con una guía invisible.</li>
            </ol>
          </details>
        </div>
        <aside className="md:pl-6 text-neutral-900 leading-relaxed">
          <p className="mb-3">
            Diseñamos viajes que funcionan para personas reales: con tiempos distintos, presupuestos claros y ganas de sorprenderse.
          </p>
          <p className="mb-3">
            Tú traes la historia; nosotros la transformamos en escenario: sin fricciones logísticas, con experiencias que conectan y la dosis justa de misterio.
          </p>
          <p className="mb-3">Porque cuando lo individual se diseña bien, cada recuerdo se escribe en mayúsculas.</p>
        </aside>
      </div>
    </section>
  );

  const SOLO_CARDS = [
    { key: 'get-lost', title: 'Get Lost 🌿', img: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470' },
    { key: 'busqueda-interior', title: 'Búsqueda Interior ✨', img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b' },
    { key: 'aventura-desafio', title: 'Aventura & Desafío ⛰️', img: 'https://images.unsplash.com/photo-1551632811-561732d1e306' },
    { key: 'exploracion-cultural', title: 'Exploración Cultural 🎭', img: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b' },
    { key: 'fotografia-narrativa', title: 'Fotografía & Narrativa Visual 📸', img: 'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac' },
    { key: 'literatura-arte', title: 'Literatura, Arte & Talleres Locales 🎨', img: 'https://plus.unsplash.com/premium_photo-1714060724900-4fceef462079' },
    { key: 'musica-sonidos', title: 'Música & Sonidos 🎶', img: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d' },
    { key: 'tribe-encounters', title: 'Tribe Encounters 🤝', img: 'https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc' },
  ] as const;

  function SoloFlipCard({
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
      'get-lost': 'Apagar el mundo para conectarse con uno mismo.',
      'busqueda-interior': 'El viaje que importa no está en el mapa, sino en ti.',
      'aventura-desafio': 'Cuando lo desconocido se convierte en tu mejor compañía.',
      'exploracion-cultural': 'Descubrir el mundo sin filtros, a tu propio ritmo.',
      'fotografia-narrativa': 'Buscar el ángulo que nadie más vio.',
      'literatura-arte': 'Meter las manos en la arcilla, en el pincel, en la creación.',
      'musica-sonidos': 'Dejar que la banda sonora del viaje inspire la tuya.',
      'tribe-encounters': 'Viajar solo no significa estar en soledad. Es abrir la puerta a encuentros con otros viajeros que también buscan historias compartidas.',
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
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped((v) => !v); }
          }}
          role="button"
          tabIndex={0}
          aria-label={`${item.title} — ver detalles`}
          className="h-full w-full"
        >
          <div className="absolute inset-0" style={faceStyle}>
            <Img src={item.img} alt={item.title} className="h-full w-full object-cover" width={420} height={420} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h3 className="text-lg font-semibold">{item.title}</h3>
            </div>
          </div>

          <div className="absolute inset-0" style={{ ...faceStyle, transform: 'rotateY(180deg)' }}>
            <Img src={item.img} alt="" className="h-full w-full object-cover" width={420} height={420} />
            <div className="absolute inset-0 bg-black/70 p-4 flex flex-col justify-between">
              <p className="text-sm leading-relaxed">{supportCopy[item.key]}</p>
              <button
                className="self-start mt-4 inline-flex items-center rounded-full bg-white text-neutral-900 px-3 py-1 text-sm font-semibold hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-white/70"
                onClick={(e) => { e.stopPropagation(); onChoose(item.key); }}
              >
                Elegir y continuar →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CTA handler: conditional logic
  const handleTierCTA = (tierId: string, priceLabel: string) => {
    const level = normalizeTierId(tierId);

    // Low tiers go directly to basic-config
    if (level === 'essenza' || level === 'modo-explora') {
      gotoBasicConfig(router, { fromOrType: 'solo', tierId, priceLabel });
      return;
    }

    // Higher tiers: save tier info and proceed to the next step
    setBudgetTier(tierId);
    setPendingPriceLabel(priceLabel);
    setStep('🌟 La Excusa');
    document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Wrapper>
      <div id="planes" className="h-0 scroll-mt-24" />
      <Header />

      {step === 'Intro' && <Intro />}

      {step === 'Presupuesto' && (
        <section data-testid="tab-presupuesto" className="max-w-7xl mx-auto px-4 md:px-8 py-10">
          <div className="text-center mb-8">
            <h3 data-testid="tab2-title" className="text-center text-xl font-semibold text-neutral-900">
              💡 Lo único que definís acá es el presupuesto por persona para pasaje y alojamiento. Ese será tu techo. Del resto… nos ocupamos nosotros.
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {tiers.map((t) => (
              <div
                key={t.id}
                role="group"
                aria-labelledby={`h-${t.id}`}
                className="h-full flex flex-col rounded-2xl bg-white/60 backdrop-blur-md p-6 border border-white/30 shadow-lg transition hover:shadow-xl hover:scale-[1.02]"
              >
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
                    <div className="mt-auto py-4 border-y border-gray-200">
                      <p className="text-neutral-800 text-sm leading-relaxed text-center">{t.closingLine}</p>
                    </div>
                  )}
                </div>

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
                  .getElementById('planes')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              ← Volver
            </button>
          </div>
        </section>
      )}

      {step === '🌟 La Excusa' && (
        <section data-testid="tab-la-excusa" className="max-w-7xl mx-auto px-4 md:px-8 py-10">
          <div className="text-center mb-8">
            <h3 data-testid="tab3-title" className="text-center text-xl font-semibold text-neutral-900">
              Viajamos por muchas razones, ¿cuál te mueve hoy?
            </h3>
            <p
              data-testid="tab3-tagline"
              className="mt-2 text-center text-sm text-neutral-700 max-w-3xl mx-auto"
            >
              Toda escapada tiene su “porque sí”. Armando el 🌟 Destination Decoded.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {SOLO_CARDS.map((it) => (
              <SoloFlipCard
                key={it.key}
                item={it}
                onChoose={(key) => {
                  setSoloAlma(key);
                  setStep('Afinar detalles');
                  document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              />
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

      {step === 'Afinar detalles' && soloAlma && (
        <SoloAlmaDetails
          soloKey={soloAlma}
          budgetTier={budgetTier}
          onBack={() => {
            setStep('🌟 La Excusa');
            document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          onContinue={(selectedKeys) => {
            gotoBasicConfig(router, {
              fromOrType: 'solo',
              tierId: budgetTier!,
              priceLabel: pendingPriceLabel!,
              extra: {
                soloAlma: soloAlma!,
                almaOptions: selectedKeys.join(','),
              },
            });
          }}
        />
      )}

      {step === 'Afinar detalles' && !soloAlma && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <p className="text-neutral-700">Por favor, seleccioná un alma de viaje primero.</p>
            <div className="mt-8 text-center">
              <button
                className="text-neutral-800 underline decoration-neutral-400 hover:decoration-neutral-800"
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