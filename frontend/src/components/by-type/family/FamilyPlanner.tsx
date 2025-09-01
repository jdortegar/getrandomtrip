'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import EmpathyCard from '@/components/by-type/family/EmpathyCard';
import TravelerGroupCard from '@/components/by-type/family/TravelerGroupCard';
import PhotoTileCard from '@/components/by-type/family/PhotoTileCard';
import { usePlannerStore } from '@/stores/planner';

type Step = 'Intro' | 'Presupuesto' | 'Tipo de viaje' | 'Tipo de escapada';

export default function FamilyPlanner() {
  const router = useRouter();
  const { budgetTier, familyType, setBudgetTier, setFamilyType, setEscapeType } = usePlannerStore();
  const [step, setStep] = useState<Step>('Intro');

  // lee ?step del hash (#planner?step=budget)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = window.location.hash;
    const q = new URLSearchParams(h.split('?')[1] || '');
    if (q.get('step') === 'budget') setStep('Presupuesto');
  }, []);

  // gating
  useEffect(() => {
    if (step === 'Tipo de viaje' && !budgetTier) setStep('Presupuesto');
    if (step === 'Tipo de escapada' && !familyType) setStep('Tipo de viaje');
  }, [step, budgetTier, familyType]);

  // ---------- Presupuesto ----------
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
          { text: '🎁 Extras: Guía esencial para que todos disfruten sin complicaciones.' },
        ],
        closingLine: '📝 Una escapada familiar con lo esencial, sin estrés, para que todos disfruten.',
        ctaLabel: 'Reserven fácil →',
      },
      {
        id: 'explora',
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
          { text: '🛏️ Alojamiento: Midscale – Upper Midscale' },
          { text: '🎁 Extras: Guía Randomtrip con actividades para todas las edades.' },
        ],
        closingLine: '📝 Para familias que quieren explorar a su ritmo, con la flexibilidad que necesitan.',
        ctaLabel: 'Activen su Modo Explora →',
      },
      {
        id: 'explora-plus',
        name: 'Explora+',
        subtitle: 'Más capas, más descubrimientos',
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
          { text: '🎁 Extras: 1 experiencia curada familiar.' },
          { text: '🌟 **Destination Decoded**: guia personalizada para que cada día sea una sorpresa curada.' },
        ],
        closingLine: '📝 Más días, más actividades, más recuerdos imborrables para toda la familia.',
        ctaLabel: 'Suban de nivel →',
      },
      {
        id: 'bivouac',
        name: 'Bivouac',
        subtitle: 'Curaduría artesanal',
        priceLabel: 'Hasta 1200 USD',
        priceFootnote: '· por persona',
        features: [
          { text: '📍 Duración: Hasta 5 noches' },
          {
            text: '✈️ Transporte: Multimodal.',
            footnote: 'Carry-on incluido; selección de asiento/bodega opcional.',
          },
          { text: '🗓️ Fechas: Sin bloqueos.' },
          { text: '🛏️ Alojamiento: Upper-Upscale (boutique, diseño, experiencias locales).' },
          { text: '🎁 Extras: **Concierge Advisor** + 1 experiencia premium familiar + perks.' },
          { text: '🌟 **Destination Decoded**: guia curada por nuestros Concierge Advisors, con claves que pocos conocen.' },
        ],
        closingLine: '📝 Una experiencia familiar única, con detalles que marcan la diferencia.',
        ctaLabel: 'Viajen distinto →',
      },
      {
        id: 'atelier',
        name: 'Atelier Getaway',
        subtitle: 'Distinción, sin esfuerzo',
        priceLabel: 'Desde 1200 USD',
        priceFootnote: '· por persona',
        features: [
          { text: '📍 Duración: Customizable.' },
          { text: '✈️ Transporte: Multimodal / a medida.' },
          { text: '🗓️ Fecha: Sin bloqueos.' },
          { text: '🛏️ Alojamiento: Luxury / de autor / Cadenas Hoteleras A1.' },
          { text: '💎 Extras: **Co-creación con un Luxury Travel Advisor + equipo 24/7**. Incluye 2+ experiencias premium diseñadas a medida. Atelier Perks.'},  
        ],
        closingLine: '📝  Una experiencia a medida donde la familia entera viaja como protagonista.',
        ctaLabel: 'A un clic de lo inolvidable →',
      },
    ],
    [] // <- DEP ARRAY correcto
  );

  // ---------- Tipo de viaje ----------
  const familyItems = [
    {
      key: 'toddlers',
      title: 'Con los más chicos',
      tagline:
        'Cuando todavía hay cochecitos, mamaderas y siestas obligadas, todo cuenta… lo transformamos en juego y calma.',
      icon: '/images/placeholder/Toddlers.svg',
    },
    {
      key: 'teens',
      title: 'Con adolescentes',
      tagline: 'Secretos para que dejen el celular: primero viven, después publican.',
      icon: '/images/placeholder/Teens.svg',
    },
    {
      key: 'adults',
      title: 'Con hijos grandes',
      tagline: 'Aventuras más intensas: trekking, surf, cultura local.',
      icon: '/images/placeholder/Adult.svg',
    },
    {
      key: 'multigen',
      title: 'Con toda la familia',
      tagline: 'Nadie queda afuera. Logística y actividades para cada edad.',
      icon: '/images/placeholder/Multi-Gen.svg',
    },
  ];

  // ---------- Tipo de escapada ----------
  const escapes = [
    { key: 'aventura', title: 'Aventura en familia', img: '/images/journey-types/aventura-familiar.jpg' },
    { key: 'naturaleza', title: 'Naturaleza & fauna', img: '/images/journey-types/naturaleza-y-fauna.jpg' },
    { key: 'cultura', title: 'Cultura & tradiciones', img: '/images/journey-types/cultura-y-tradiciones.jpg' },
    { key: 'playas', title: 'Playas & Dunas', img: '/images/journey-types/playas-y-medanos.jpg' },
    { key: 'graduaciones', title: 'Graduaciones & celebraciones', img: '/images/journey-types/graduaciones-y-celebraciones.jpg' },
    { key: 'duos', title: 'Escapadas Madre-hij@ / Padre-hij@', img: '/images/journey-types/Escapadas%20madre-hija%20-%20padre-hijo.jpg' },
  ];

  // ---------- Header fijo (título + subtítulo + indicadores) ----------
  const Header = () => (
    <div className="text-center">
      <h2 className="font-display text-3xl md:text-4xl text-neutral-900">
        Comencemos a diseñar el Family Randomtrip
      </h2>
      <p className="mt-2 text-sm text-neutral-600">
        3 pasos cortos, para que comencemos a crear la mejor experiencia.
      </p>

      {step !== 'Intro' && (
        <ol className="mt-4 flex justify-center gap-3 text-sm text-neutral-500">
          <li
            className={
              step === 'Presupuesto'
                ? 'font-semibold text-neutral-900'
                : budgetTier
                ? 'text-neutral-900'
                : ''
            }
          >
            Presupuesto
          </li>
          <li>·</li>
          <li
            className={
              step === 'Tipo de viaje'
                ? 'font-semibold text-neutral-900'
                : familyType
                ? 'text-neutral-900'
                : ''
            }
          >
            Tipo de viaje
          </li>
          <li>·</li>
          <li className={step === 'Tipo de escapada' ? 'font-semibold text-neutral-900' : ''}>
            Tipo de escapada
          </li>
        </ol>
      )}
    </div>
  );

  // ---------- Secciones ----------
  const Intro = () => (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      <Header />

      <h3 className="mt-8 text-center text-lg font-semibold text-neutral-900">
        Viajar en familia tiene sus códigos (y los entendemos)
      </h3>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-6 place-items-center">
        <EmpathyCard
          label="Peques"
          headline="Traslados simples, más descubrimiento."
          support="Menos horas de auto, más “¿y esto qué es?”. Ritmo pensando para los más chicos."
          color="bg-[#C77248]"
        />
        <EmpathyCard
          label="Adolescentes"
          headline="Experiencias que compiten con el WiFi."
          support="Actividades hands-on, locales y memorables. Publican después; primero viven."
          color="bg-[#2E7D73]"
        />
        <EmpathyCard
          label="Toda la familia"
          headline="Logística es nuestro superpoder."
          support="Horarios, traslados y reservas sin peleas. Todos llegan, todos disfrutan."
          color="bg-[#203643]"
        />
        <EmpathyCard
          label="Tiempo libre"
          headline="Días que fluyen sin culpas."
          support="Espacios para siestas, charlas y nada. Porque descansar también es viajar."
          color="bg-[#BE9D77]"
        />
      </div>

      <div className="mt-10 flex justify-center">
        <a
          href="#planner?step=budget"
          className="btn-primary"
          onClick={(e) => {
            e.preventDefault();
            setStep('Presupuesto');
          }}
        >
          Empezar a diseñar nuestro Family Randomtrip →
        </a>
      </div>
    </section>
  );

  // ---------- Presupuesto (CTA al fondo de cada tarjeta) ----------
  const Presupuesto = () => (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-10" data-testid="tab-presupuesto">
      <Header />
      <h3 className="mt-8 mb-8 text-center text-lg font-semibold text-neutral-900">
        💡 Lo único que definen acá es el presupuesto por persona para pasaje y alojamiento. Ese será su techo. Del resto… nos ocupamos nosotros.
      </h3>

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
                onClick={() => {
                  setBudgetTier(t.id);
                  setStep('Tipo de viaje');
                  document
                    .getElementById('planner')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                {t.ctaLabel}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer: Volver */}
      <div className="mt-10 flex justify-center">
        <button
          className="text-neutral-800 underline decoration-neutral-400 hover:decoration-neutral-800"
          onClick={() => setStep('Intro')}
        >
          ← Volver
        </button>
      </div>
    </section>
  );

  const TipoDeViaje = () => (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-10" data-testid="tab-tipo-viaje">
      <Header />
      <h3 className="mt-8 text-center text-lg font-semibold text-neutral-900">
        De flotadores a tablas de surf: el viaje crece con tu familia.
      </h3>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {familyItems.map((it) => (
          <TravelerGroupCard
            key={it.key}
            title={it.title}
            tagline={it.tagline}
            iconSrc={it.icon}
            active={familyType === it.key}
            onSelect={() => {
              setFamilyType(it.key as any);
              setStep('Tipo de escapada');
            }}
          />
        ))}
      </div>

      <div className="mt-8 text-center">
        <button
          className="text-neutral-800 underline decoration-neutral-400 hover:decoration-neutral-800"
          onClick={() => setStep('Presupuesto')}
        >
          ← Volver
        </button>
      </div>
    </section>
  );

  const TipoDeEscapada = () => (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-10" data-testid="tab-tipo-escapada">
      <Header />
      <h3 className="mt-8 text-center text-lg font-semibold text-neutral-900">
        Viajamos por muchas razones, ¿cuál los mueve hoy?
      </h3>
      <p className="mt-1 text-center text-neutral-500">
        Toda escapada tiene su “porque sí”.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {escapes.map((e) => (
          <PhotoTileCard
            key={e.key}
            title={e.title}
            src={e.img}
            onClick={() => {
              setEscapeType(e.key);
              const q = new URLSearchParams({
                from: 'families',
                budgetTier: budgetTier ?? '',
                familyType: familyType ?? '',
                escapeType: e.key,
              }).toString();
              router.push(`/journey/experience-level?${q}`);
            }}
          />
        ))}
      </div>

      {/* Footer: Volver */}
      <div className="mt-10 flex justify-center">
        <button className="text-neutral-900 underline" onClick={() => setStep('Tipo de viaje')}>
          ← Volver
        </button>
      </div>
    </section>
  );

  // ---------- Render ----------
  return (
    <div className="bg-white">
      {step === 'Intro' && <Intro />}
      {step === 'Presupuesto' && <Presupuesto />}
      {step === 'Tipo de viaje' && <TipoDeViaje />}
      {step === 'Tipo de escapada' && <TipoDeEscapada />}
    </div>
  );
}
