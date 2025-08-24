'use client';
import React, { useMemo, useState } from 'react';
import { track } from '@/components/common/analytics';
import Link from 'next/link';
import PawsExperienceCard from './PawsExperienceCard';
import GetRandomtripCta from '@/components/common/GetRandomtripCta';

const experienceLevels = [
  {
    id: 'essenza',
    title: '🌱 Essenza — Lo esencial para viajar juntos',
    price: 'Hasta 450 USD',
    duration: 'Máximo 2 noches.',
    transport: 'Low cost (buses o vuelos off-peak, con opción pet).',
    dates: 'Disponibilidad limitada.',
    accommodation: 'Hoteles pet-friendly básicos (3★ o equivalentes).',
    extras: 'Mapa pet-friendly.',
    description:
      'Un escape simple y sin complicaciones, para quienes quieren empezar a compartir viajes con su compañero de cuatro patas.',
    cta: 'Empiecen con lo básico →',
  },
  {
    id: 'explora',
    title: '🌿 Modo Explora — Aventuras compartidas',
    price: 'Hasta 650 USD',
    duration: 'Hasta 3 noches.',
    transport: 'Multimodal flexible.',
    dates: 'Amplia disponibilidad; algunos bloqueos en feriados.',
    accommodation: 'Mid-to-Upscale pet-friendly.',
    extras: 'Randomtrip Decode para explorar con tu mascota (rutas, spots de juego).',
    description:
      'Ideal para quienes entienden que los viajes son mejores cuando se exploran juntos, con libertad.',
    cta: 'Exploren a cuatro patas →',
  },
  {
    id: 'explora-plus',
    title: '💫 Explora+ — Más capas, más momentos',
    price: 'Hasta 1100 USD',
    duration: 'Hasta 4 noches.',
    transport: 'Multimodal.',
    dates: 'Alta disponibilidad, incluso en feriados.',
    accommodation: 'Upscale asegurado (habitaciones pet-friendly premium).',
    extras: 'Decode personalizado + 1 experiencia curada especial (trail, day trip dog-friendly).',
    description:
      'Un upgrade pensado para multiplicar momentos compartidos: más noches, más planes, más memorias.',
    cta: 'Suban la aventura →',
  },
  {
    id: 'bivouac',
    title: '🔥 Bivouac — Curaduría artesanal con huellas',
    price: 'Hasta 1550 USD',
    duration: 'Hasta 5 noches.',
    transport: 'Multimodal.',
    dates: 'Sin bloqueos.',
    accommodation: 'Upper-Upscale boutique pet-friendly.',
    extras: 'Concierge Advisor + experiencia premium + perks (late check-out, upgrade, amenities pet).',
    description:
      'Un viaje donde el detalle importa tanto para vos como para tu compañero: servicio premium y recuerdos imborrables.',
    cta: 'Viajen con huellas premium →',
  },
  {
    id: 'atelier',
    title: '✨ Atelier Getaway — A medida, sin límites',
    price: 'Desde 1550 USD',
    duration: 'Customizable.',
    transport: 'A medida.',
    dates: 'A medida.',
    accommodation: 'Luxury/de autor/cadenas A1 pet-friendly.',
    extras:
      'Co-creación con Luxury Travel Advisor + equipo 24/7. 2+ experiencias premium a medida. Perks top (traslados privados, salas VIP, amenities de lujo para mascotas).',
    description:
      'Un viaje exclusivo, único e irrepetible, donde cada detalle está pensado para ustedes y su compañero de cuatro patas.',
    cta: 'Creen lo extraordinario →',
  },
];

const getCapFromPrice = (price: string) => {
  const m = price.match(/(\d+(?:[.,]\d+)?)/);
  return m ? Number(m[1].replace(',', '.')) : 0;
};

export default function PawsPlanner() {
  const [activeTab, setActiveTab] = useState<'experienceLevels' | 'interactive'>('experienceLevels');

  const [levelKey, setLevelKey] = useState('essenza');
  const [extraPet, setExtraPet] = useState(false);
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('small');
  const [transport, setTransport] = useState<'cabina' | 'bodega'>('cabina');

  const level = useMemo(
    () => experienceLevels.find(l => l.id === levelKey) ?? experienceLevels[0],
    [levelKey]
  );

  React.useEffect(() => {
    if (size === 'large' && transport !== 'bodega') setTransport('bodega');
  }, [size, transport]);

  const baseCap = useMemo(() => getCapFromPrice(level.price), [level]);
  const finalCap = useMemo(() => (extraPet ? Math.round(baseCap * 1.25) : baseCap), [baseCap, extraPet]);

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
                  <PawsExperienceCard key={levelData.id} {...levelData} top={getCapFromPrice(levelData.price)} />
                ))}
              </div>
          )}

          {activeTab === 'interactive' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-semibold mb-3">Nivel</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {['essenza','explora','explora-plus','bivouac'].map(k => (
                      <label key={k} className={`cursor-pointer rounded-lg border p-3 ${levelKey === k ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]' : 'border-gray-200'}`}>
                        <input
                          type="radio"
                          name="paws-level"
                          className="sr-only"
                          checked={levelKey === k}
                          onChange={() => { setLevelKey(k); track('paws_interactive_change', { field: 'level', value: k }); }}
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
                      onChange={(e) => { setExtraPet(e.target.checked); track('paws_interactive_change', { field: 'extra_pet', value: e.target.checked }); }}
                    />
                    <span>Sumar +25% al presupuesto</span>
                  </label>
                </div>

                <div>
                  <h4 className="text-xl font-semibold mb-3">Tamaño</h4>
                  <div className="flex flex-wrap gap-3">
                    {[
                      {k:'small', label:'Pequeño (≤12 kg)'},
                      {k:'medium', label:'Mediano (≤23 kg)'},
                      {k:'large', label:'Grande (&gt;23 kg)'},
                    ].map(opt => (
                      <label key={opt.k} className={`cursor-pointer rounded-lg border p-3 ${size === opt.k ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]' : 'border-gray-200'}`}>
                        <input
                          type="radio"
                          name="paws-size"
                          className="sr-only"
                          checked={size === opt.k}
                          onChange={() => { setSize(opt.k as any); track('paws_interactive_change', { field: 'size', value: opt.k }); }}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-semibold mb-3">Transporte</h4>
                  <div className="flex gap-3">
                    {['cabina','bodega'].map(t => {
                      const disabled = size === 'large' && t === 'cabina';
                      return (
                        <label key={t} className={`cursor-pointer rounded-lg border p-3 ${transport === t ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]' : 'border-gray-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <input
                            type="radio"
                            name="paws-transport"
                            className="sr-only"
                            checked={transport === t}
                            disabled={disabled}
                            onChange={() => { setTransport(t as any); track('paws_interactive_change', { field: 'transport', value: t }); }}
                          />
                          <span className="capitalize">{t}</span>
                        </label>
                      );
                    })}
                  </div>
                  {size === 'large' && <p className="text-sm text-gray-500 mt-2">Mascotas grandes viajan en bodega según normativa aérea.</p>}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xl font-semibold">Resumen</h4>
                <div className="rounded-xl bg-gray-50 p-5">
                  <p className="text-gray-700"><strong>Nivel:</strong> {level.title}</p>
                  <p className="text-gray-700"><strong>Base:</strong> {level.price} (por persona + 1 mascota)</p>
                  <p className="text-gray-700"><strong>Mascota extra:</strong> {extraPet ? '+25%' : 'No'}</p>
                  <p className="text-gray-700"><strong>Tamaño:</strong> {size === 'small' ? 'Pequeño' : size === 'medium' ? 'Mediano' : 'Grande'}</p>
                  <p className="text-gray-700"><strong>Transporte:</strong> {transport}</p>
                  <hr className="my-4" />
                  <p className="text-lg font-bold">Presupuesto techo aprox.: USD {finalCap.toLocaleString('en-US')}</p>
                  <p className="text-xs text-gray-500 mt-2">Valor referencial para estimar el nivel. El precio final depende de fechas, disponibilidad y aerolíneas.</p>
                </div>

                <a
                  href="/packages/by-type/paws#paws-planner"
                  onClick={() => track('paws_interactive_start', { level: levelKey, extraPet, size, transport, cap: finalCap })}
                  className="inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-8 py-3 font-bold text-gray-900 hover:bg-[#EACD65] transition-colors"
                >
                  Empezar ahora →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}