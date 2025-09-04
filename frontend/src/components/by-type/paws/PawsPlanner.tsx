'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PawsExperienceCard from './PawsExperienceCard';
import PawsPetConfiguratorTab from './PawsPetConfiguratorTab';
import PawsEscapeTypeTab from './PawsEscapeTypeTab';
import { gotoBasicConfig, normalizeTierId } from '@/lib/linking';

type Step = 'levels' | 'interactive' | 'escape';

const BG_IMG = 'https://plus.unsplash.com/premium_photo-1723557630893-fc4796266248';

const LEVELS = [
  {
    id: 'essenza',
    name: 'Essenza',
    subtitle: 'Lo esencial con estilo',
    priceLabel: 'Hasta 460 USD',
    priceFootnote: '· por persona + compañer@ de 4 patas',
    features: [
      { text: '📍 Duración: Máx 2 noches' },
      {
        text: '✈️ Transporte: Low cost (buses o vuelos off-peak).',
        footnote: 'Selección de asiento, carry-on y bodega no incluidos.',
      },
      { text: '🗓️ Fechas: Menor disponibilidad, con restricciones y bloqueos.' },
      { text: '🛏️ Alojamiento: Midscale (3★ o equivalentes, pet-friendly).' },
      { text: '🎁 Extras: Guía esencial con mapa pet-friendly.' },
    ],
    closingLine: '📝 Un escape simple, donde tu mascota no es un extra, sino parte del plan.',
    ctaLabel: 'Empiecen con lo básico →',
  },
  {
    id: 'explora',
    name: 'Modo Explora',
    subtitle: 'Viaje activo y flexible',
    priceLabel: 'Hasta 650 USD',
    priceFootnote: '· por persona + compañer@ de 4 patas',
    features: [
      { text: '📍 Duración: Hasta 3 noches' },
      {
        text: '✈️ Transporte: Multimodal, horarios flexibles.',
        footnote: 'Selección de asiento, carry-on y bodega no incluidos.',
      },
      { text: '🗓️ Fechas: Mayor disponibilidad; algunos bloqueos en feriados/puentes.' },
      { text: '🛏️ Alojamiento: Midscale – Upper Midscale pet-friendly.' },
      { text: '🎁 Extras: Guía Randomtrip con rutas, spots de juego y actividades pet-friendly.' },
    ],
    closingLine: '📝 Senderos y rincones pensados para descubrir junto a tu compañer@, con libertad y sin estrés.',
    ctaLabel: 'Exploren a cuatro patas →',
  },
  {
    id: 'exploraPlus',
    name: 'Explora+',
    subtitle: 'Más capas, más momentos',
    priceLabel: 'Hasta 1100 USD',
    priceFootnote: '· por persona + compañer@ de 4 patas',
    features: [
      { text: '📍 Duración: Hasta 4 noches' },
      {
        text: '✈️ Transporte: Multimodal.',
        footnote: 'Carry-on incluido; selección de asiento y bodega no incluidos.',
      },
      { text: '🗓️ Fechas: Alta disponibilidad, incluso en feriados/puentes.' },
      { text: '🛏️ Alojamiento: : Upscale asegurado, habitaciones pet-friendly premium.' },
      { text: '🎁 Extras: 1 experiencia curada (ej.: trail o day trip pet-friendly).' },
      { text: '🌟 **Destination Decoded**: guia personalizada para que cada día sea una sorpresa curada.' },
    ],
    closingLine: '📝 Más días, más juegos, más huellas en la arena y en la memoria.',
    ctaLabel: 'Suban la aventura →',
  },
  {
    id: 'bivouac',
    name: 'Bivouac',
    subtitle: 'Curaduría artesanal',
    priceLabel: 'Hasta 1550 USD',
    priceFootnote: '· por persona + compañer@ de 4 patas',
    features: [
      { text: '📍 Duración: Hasta 5 noches' },
      {
        text: '✈️ Transporte: Multimodal.',
        footnote: 'Carry-on incluido; selección de asiento/bodega opcional.',
      },
      { text: '🗓️ Fechas: Sin bloqueos.' },
      { text: '🛏️ Alojamiento: Upper Upscale pet-friendly. (boutique, diseño, experiencias locales).' },
      { text: '🎁 Extras: **Concierge Advisor** + 1 experiencia premium + perks (late check-out, upgrade, amenities pet).' },
      { text: '🌟 **Destination Decoded**: guia curada por nuestros Concierge Advisors, con claves que pocos conocen.' },
    ],
    closingLine: '📝 Un viaje premium, curado al detalle para vos y tu compañero de cuatro patas.',
    ctaLabel: 'Viajen con huellas Bivouac →',
  },
  {
    id: 'atelier',
    name: 'Atelier Getaway',
    subtitle: 'Experiencia a medida',
    priceLabel: 'Desde 1550 USD',
    priceFootnote: '· por persona + compañer@ de 4 patas',
    features: [
      { text: '📍 Duración: Customizable' },
      { text: '✈️ Transporte: Multimodal / a medida.' },
      { text: '🗓️ Fechas: Sin bloqueos.' },
      { text: '🛏️ Alojamiento: Luxury / de autor / Cadenas Hoteleras A1 pet-friendly.' },
      { text: '💎 Extras: **Co-creación con un Luxury Travel Advisor + equipo 24/7**. Incluye 2+ experiencias premium diseñadas a medida. Atelier Perks.' },
    ],
    closingLine: '📝Una experiencia exclusiva donde cada momento está diseñado para ambos.',
    ctaLabel: 'Creen lo extraordinario →',
  },
];

function isPremium(levelId: string | null) {
  if (!levelId) return false;
  const norm = normalizeTierId(levelId);
  return norm === 'explora-plus' || norm === 'bivouac' || norm === 'atelier';
}

export default function PawsPlanner() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Step>('levels');
  const [levelId, setLevelId] = useState<string | null>(null);
  const [pendingPriceLabel, setPendingPriceLabel] = useState<string | null>(null);
  const [step2Complete, setStep2Complete] = useState(false);

  const premium = isPremium(levelId);

  const setTab = (tab: Step) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleLevelSelect = (selectedLevelId: string, priceLabel: string) => {
    const level = normalizeTierId(selectedLevelId);

    if (level === 'essenza' || level === 'modo-explora') {
      gotoBasicConfig(router, { fromOrType: 'paws', tierId: selectedLevelId, priceLabel });
      return;
    }

    setLevelId(selectedLevelId);
    setPendingPriceLabel(priceLabel);
    setStep2Complete(false);
    setTab('interactive');
    document.getElementById('paws-planner-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (activeTab === 'interactive' && !levelId) {
      setTab('levels');
    }
    if (activeTab === 'escape') {
      if (!premium) {
        setTab(levelId ? 'interactive' : 'levels');
      } else if (!step2Complete) {
        setTab('interactive');
      }
    }
  }, [activeTab, premium, step2Complete, levelId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const qsTab = url.searchParams.get('tab') as Step | null;
    if (!qsTab) return;

    if (qsTab === 'levels') setTab('levels');
    else if (qsTab === 'interactive') setTab(levelId ? 'interactive' : 'levels');
    else if (qsTab === 'escape') {
      if (premium && step2Complete) setTab('escape');
      else if (levelId) setTab('interactive');
      else setTab('levels');
    }
  }, [levelId, premium, step2Complete]);

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
      <div className="absolute inset-0 bg-white/80 backdrop-blur-md" />
      <div className="relative">{children}</div>
    </section>
  );

  const Header = () => {
    const canGoInteractive = Boolean(levelId);
    const canGoEscape = Boolean(premium && step2Complete);

    const tabBtnClass = (enabled: boolean, active: boolean) =>
      `whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
        active
          ? 'border-indigo-500 text-indigo-600'
          : enabled
          ? 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
          : 'border-transparent text-neutral-300 cursor-not-allowed'
      }`;

    return (
      <div className="text-center pt-10">
        <h2 className="font-display text-3xl md:text-4xl text-neutral-900">Planifica tu PAWSTRIP</h2>
        <div className="mt-6 border-b border-neutral-300 flex justify-center">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button onClick={() => setTab('levels')} className={tabBtnClass(true, activeTab === 'levels')}>
              🐾 Niveles de Experiencia
            </button>
            <button
              onClick={() => {
                if (canGoInteractive) setTab('interactive');
              }}
              aria-disabled={!canGoInteractive}
              className={tabBtnClass(canGoInteractive, activeTab === 'interactive')}
            >
              Más detalles
            </button>
            {premium && (
              <button
                onClick={() => {
                  if (canGoEscape) setTab('escape');
                }}
                aria-disabled={!canGoEscape}
                className={tabBtnClass(canGoEscape, activeTab === 'escape')}
              >
                🌟 Tipo de escapada
              </button>
            )}
          </nav>
        </div>
      </div>
    );
  };

  const LevelsStep = () => (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      <p className="text-center text-gray-700 mb-8 italic">
        💡 Definís el presupuesto de pasaje y alojamiento para ti + tu compañer@. Del resto… nos ocupamos nosotros.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {LEVELS.map((level) => (
          <PawsExperienceCard
            key={level.id}
            {...level}
            onClick={() => handleLevelSelect(level.id, level.priceLabel)}
          />
        ))}
      </div>
      <p className="text-xs text-center text-gray-600 mt-6">
        * Sujeto a disponibilidad y políticas pet-friendly de cada proveedor. Pueden aplicar requisitos (certificados sanitarios, vacunas, microchip, etc.).
      </p>
    </div>
  );

  return (
    <Wrapper>
      <div id="paws-planner-top" className="scroll-mt-24" />
      <section id="paws-planner">
        <Header />
        {activeTab === 'levels' && <LevelsStep />}
        {activeTab === 'interactive' && levelId && (
          <PawsPetConfiguratorTab
            levelId={levelId as any}
            onBackToLevels={() => setTab('levels')}
            onNextToEscape={() => {
              if (!premium) return;
              setStep2Complete(true);
              setTab('escape');
              document.getElementById('paws-planner-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        )}
        {premium && step2Complete && activeTab === 'escape' && levelId && (
          <PawsEscapeTypeTab
            levelId={levelId as any}
            priceLabel={pendingPriceLabel!}
            onBackToInteractive={() => {
              setTab('interactive');
              document.getElementById('paws-planner-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        )}
      </section>
    </Wrapper>
  );
}