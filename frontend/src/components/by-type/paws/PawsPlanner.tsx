// frontend/src/components/by-type/paws/PawsPlanner.tsx
'use client';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { track } from '@/components/common/analytics';
import PawsExperienceCard from './PawsExperienceCard';

// Props mínimas para cada nivel + opcionales que requiere PawsExperienceCard
type LevelData = {
  id: string;
  title: string;
  price: string;
  bullets: string[];
  cta: string;
  duration?: string;
  transport?: string;
  accommodation?: string;
  extras?: string;
  description?: string;
};

const experienceLevels: LevelData[] = [
  {
    id: 'essenza',
    title: '🌱 Essenza — Lo esencial con estilo',
    price: '455 USD · por persona',
    bullets: [
      'Duración: Máx 2 noches',
      'Transporte: Low cost (buses o vuelos off-peak). Selección de asiento, carry-on y bodega no incluidos.',
      'Fechas: Menor disponibilidad, con restricciones y bloqueos.',
      'Alojamiento: Midscale (3★ o equivalentes, pet-friendly).',
      'Extras: Guía esencial con mapa pet-friendly.',
      '📝 Un escape simple, donde tu mascota no es un extra, sino parte del plan.',
    ],
    cta: 'Empiecen con lo básico →',
  },
  {
    id: 'explora',
    title: '🌿 Modo Explora — Activo y flexible',
    price: '650 USD · por persona',
    bullets: [
      'Duración: Hasta 3 noches',
      'Transporte: Multimodal, horarios flexibles. Selección de asiento, carry-on y bodega no incluidos.',
      'Fechas: Mayor disponibilidad; algunos bloqueos en feriados/puentes.',
      'Alojamiento: Midscale – Upper Midscale pet-friendly.',
      'Extras: Guía Randomtrip Decode con rutas, spots de juego y actividades dog-friendly.',
      '📝 Senderos y rincones pensados para descubrir juntos, con libertad y sin estrés.',
    ],
    cta: 'Exploren a cuatro patas →',
  },
  {
    id: 'explora-plus',
    title: '💫 Explora+ — Más capas, más momentos',
    price: '1105 USD · por persona',
    bullets: [
      'Duración: Hasta 4 noches',
      'Transporte: Multimodal. Carry-on incluido; selección de asiento y bodega no incluidos.',
      'Fechas: Alta disponibilidad, incluso en feriados/puentes.',
      'Alojamiento: Upscale asegurado, habitaciones pet-friendly premium.',
      'Extras: Decode personalizado + 1 experiencia curada (ej.: trail o day trip dog-friendly).',
      '📝 Más días, más juegos, más huellas en la arena y en la memoria.',
    ],
    cta: 'Suban la aventura →',
  },
  {
    id: 'bivouac',
    title: '🔥 Bivouac — Curaduría artesanal',
    price: '1560 USD · por persona',
    bullets: [
      'Duración: Hasta 5 noches',
      'Transporte: Multimodal. Carry-on incluido; selección de asiento/bodega opcional.',
      'Fechas: Sin bloqueos.',
      'Alojamiento: Upper Upscale boutique pet-friendly.',
      'Extras: Concierge Advisor + 1 experiencia premium + perks (late check-out, upgrade, amenities pet).',
      '📝 Un viaje premium, curado al detalle para vos y tu compañero de cuatro patas.',
    ],
    cta: 'Viajen con huellas premium →',
  },
  {
    id: 'atelier',
    title: '✨ Atelier Getaway — Distinción, sin esfuerzo',
    price: 'Desde 1560 USD · por persona',
    bullets: [
      'Duración: Customizable',
      'Transporte: Multimodal / a medida.',
      'Fechas: Sin bloqueos.',
      'Alojamiento: Luxury / de autor / cadenas A1 pet-friendly.',
      'Extras: Co-creación con Luxury Travel Advisor + equipo 24/7. Incluye 2+ experiencias premium a medida. Perks top (traslados privados, salas VIP, amenities de lujo para mascotas).',
      '📝 Una experiencia exclusiva donde cada momento está diseñado para ambos.',
    ],
    cta: 'Creen lo extraordinario →',
  },
];

const getCapFromPrice = (price: string) => {
  const m = price.match(/(\d+(?:[.,]\d+)?)/);
  return m ? Number(m[1].replace(',', '.')) : 0;
};

export default function PawsPlanner() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'experienceLevels' | 'interactive'>('experienceLevels');
  const [levelKey, setLevelKey] = useState('essenza');
  const [extraPet, setExtraPet] = useState(false);
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('small');
  const [transport, setTransport] = useState<'cabina' | 'bodega'>('cabina');
  const [viewedNotices, setViewedNotices] = useState<Set<string>>(new Set());

  const level = useMemo(
    () => experienceLevels.find((l) => l.id === levelKey) ?? experienceLevels[0],
    [levelKey]
  );

  useEffect(() => {
    if (size === 'large' && transport !== 'bodega') {
      setTransport('bodega');
      if (!viewedNotices.has('large_pet_notice')) {
        track('paws_notice_view', { type: 'large_pet_notice' });
        setViewedNotices((prev) => new Set(prev).add('large_pet_notice'));
      }
    }
  }, [size, transport, viewedNotices]);

  const baseCap = useMemo(() => getCapFromPrice(level.price), [level]);
  const finalCap = useMemo(() => (extraPet ? Math.round(baseCap * 1.25) : baseCap), [baseCap, extraPet]);

  const goInteractive = (nextLevel: string) => {
    setLevelKey(nextLevel);
    setActiveTab('interactive');
    document.getElementById('paws-planner')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    track('paws_card_select', { level: nextLevel });
  };

  const startJourney = () => {
    const q = new URLSearchParams({
      from: 'paws',
      level: levelKey,
      extraPet: String(extraPet),
      size,
      transport,
      cap: String(finalCap),
    }).toString();
    track('paws_interactive_start', { level: levelKey, extraPet, size, transport, cap: finalCap });
    router.push(`/journey/basic-config?${q}`);
  };

  return (
    <section id="paws-planner" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div role="tablist" aria-label="PAWS planner" className="flex justify-center mb-8">
          <button
            role="tab"
            aria-selected={activeTab === 'experienceLevels'}
            className={`px-6 py-3 text-lg font-semibold rounded-t-lg ${activeTab === 'experienceLevels' ? 'bg-[#D4AF37] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setActiveTab('experienceLevels')}
          >
            🐾 PAWS© RANDOMTRIP — Niveles de Experiencia
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'interactive'}
            className={`px-6 py-3 text-lg font-semibold rounded-t-lg ${activeTab === 'interactive' ? 'bg-[#D4AF37] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setActiveTab('interactive')}
          >
            Más detalles (Interactivo)
          </button>
        </div>

        <div className="bg-white p-8 rounded-b-lg shadow-lg">
          {activeTab === 'experienceLevels' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {experienceLevels.map((levelData) => (
                <PawsExperienceCard
                  key={levelData.id}
                  id={levelData.id}
                  title={levelData.title}
                  bullets={levelData.bullets}
                  cta={levelData.cta}
                  top={getCapFromPrice(levelData.price)}
                  /* Props requeridas por PawsExperienceCard con defaults seguros */
                  duration={levelData.duration ?? 'Customizable'}
                  transport={levelData.transport ?? 'Multimodal (pet-friendly)'}
                  accommodation={levelData.accommodation ?? 'Alojamientos pet-friendly'}
                  extras={levelData.extras ?? 'Asesoría y kit pet-friendly'}
                  description={levelData.description ?? 'Diseñado para viajar con tu mascota en cada paso.'}
                  onClick={() => goInteractive(levelData.id)}
                />
              ))}
            </div>
          )}

          {activeTab === 'interactive' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-semibold mb-3">Nivel</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {['essenza', 'explora', 'explora-plus', 'bivouac'].map((k) => (
                      <label
                        key={k}
                        className={`cursor-pointer rounded-lg border p-3 ${levelKey === k ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]' : 'border-gray-200'}`}
                      >
                        <input
                          type="radio"
                          name="paws-level"
                          className="sr-only"
                          checked={levelKey === k}
                          onChange={() => {
                            setLevelKey(k);
                            track('paws_interactive_change', { field: 'level', value: k });
                          }}
                        />
                        <span className="font-medium capitalize">{k.replace('-', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-semibold mb-3">¿Mascota extra?</h4>
                  <label className="inline-flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={extraPet}
                      onChange={(e) => {
                        setExtraPet(e.target.checked);
                        track('paws_interactive_change', { field: 'extra_pet', value: e.target.checked });
                      }}
                    />
                    <span>Sumar +25% al presupuesto</span>
                  </label>
                </div>

                <div>
                  <h4 className="text-xl font-semibold mb-3">Tamaño</h4>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { k: 'small', label: 'Pequeño (≤12 kg)' },
                      { k: 'medium', label: 'Mediano (≤23 kg)' },
                      { k: 'large', label: 'Grande (>23 kg)' },
                    ].map((opt) => (
                      <label
                        key={opt.k}
                        className={`cursor-pointer rounded-lg border p-3 ${size === opt.k ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]' : 'border-gray-200'}`}
                      >
                        <input
                          type="radio"
                          name="paws-size"
                          className="sr-only"
                          checked={size === opt.k}
                          onChange={() => {
                            setSize(opt.k as 'small' | 'medium' | 'large');
                            track('paws_interactive_change', { field: 'size', value: opt.k });
                          }}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-semibold mb-3">Transporte</h4>
                  <div className="flex gap-3">
                    {['cabina', 'bodega'].map((t) => {
                      const disabled = size === 'large' && t === 'cabina';
                      return (
                        <label
                          key={t}
                          className={`cursor-pointer rounded-lg border p-3 ${transport === t ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]' : 'border-gray-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <input
                            type="radio"
                            name="paws-transport"
                            className="sr-only"
                            checked={transport === t}
                            disabled={disabled}
                            onChange={() => {
                              setTransport(t as 'cabina' | 'bodega');
                              track('paws_interactive_change', { field: 'transport', value: t });
                            }}
                          />
                          <span className="capitalize">{t}</span>
                        </label>
                      );
                    })}
                  </div>
                  {size === 'large' && (
                    <p className="text-sm text-gray-500 mt-2">Mascotas grandes viajan en bodega según normativa aérea.</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xl font-semibold">Resumen</h4>
                <div className="rounded-xl bg-gray-50 p-5">
                  <p className="text-gray-700">
                    <strong>Nivel:</strong> {level.title}
                  </p>
                  <p className="text-gray-700">
                    <strong>Base:</strong> {level.price} (por persona + 1 mascota)
                  </p>
                  <p className="text-gray-700">
                    <strong>Mascota extra:</strong> {extraPet ? '+25%' : 'No'}
                  </p>
                  <p className="text-gray-700">
                    <strong>Tamaño:</strong> {size === 'small' ? 'Pequeño' : size === 'medium' ? 'Mediano' : 'Grande'}
                  </p>
                  <p className="text-gray-700">
                    <strong>Transporte:</strong> {transport}
                  </p>
                  <hr className="my-4" />
                  <p className="text-lg font-bold">Presupuesto techo aprox.: USD {finalCap.toLocaleString('en-US')}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Valor referencial para estimar el nivel. El precio final depende de fechas, disponibilidad y aerolíneas.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={startJourney}
                  className="inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-8 py-3 font-bold text-gray-900 hover:bg-[#EACD65] transition-colors"
                >
                  Empezar ahora →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
