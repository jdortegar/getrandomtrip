'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import PawsExperienceCard from './PawsExperienceCard';
import GetRandomtripCta from '@/components/common/GetRandomtripCta';

const LEVELS = [
  {
    id: 'essenza',
    title: '🌱 Essenza — Lo esencial para viajar juntos',
    top: 450,
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
    top: 650,
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
    top: 1100,
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
    top: 1550,
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
    top: 1550, // base de referencia (desde)
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

export default function PawsPlanner() {
  const [activeTab, setActiveTab] = useState<'levels' | 'interactive'>('levels');

  // MVP calculadora (tab 2)
  const [levelId, setLevelId] = useState<string>('explora');
  const [extraPets, setExtraPets] = useState<number>(0); // 0-2
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('small');
  const [cargo, setCargo] = useState<'cabina' | 'bodega' | 'na'>('cabina');

  const baseTop = useMemo(
    () => LEVELS.find((l) => l.id === levelId)?.top ?? 650,
    [levelId]
  );

  const estimate = useMemo(() => {
    let total = baseTop;
    total *= 1 + 0.25 * extraPets; // +25% por mascota extra
    if (size === 'large' || cargo === 'bodega') total *= 1.1; // +10% grande/bodega
    return Math.round(total);
  }, [baseTop, extraPets, size, cargo]);

  return (
    <section id="paws-planner" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-10">
          Planifica tu Aventura PAWS©
        </h2>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <button
            className={`px-5 py-2 rounded-full font-semibold ${activeTab === 'levels'
              ? 'bg-[#D4AF37] text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
            onClick={() => setActiveTab('levels')}
          >
            🐾 Niveles de Experiencia
          </button>
          <button
            className={`px-5 py-2 rounded-full font-semibold ${activeTab === 'interactive'
              ? 'bg-[#D4AF37] text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
            onClick={() => setActiveTab('interactive')}
          >
            Más detalles (Interactivo)
          </button>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
          {activeTab === 'levels' && (
            <>
              <p className="text-center text-gray-600 mb-8 italic">
                💡 Definen el presupuesto por persona + 1 mascota (tope). Del resto… nos ocupamos nosotros.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {LEVELS.map((level) => (
                  <PawsExperienceCard key={level.id} {...level} />
                ))}
              </div>

              <p className="text-xs text-gray-500 mt-6">
                * Sujeto a disponibilidad y políticas pet-friendly de cada proveedor. Pueden aplicar requisitos
                (certificados sanitarios, vacunas, microchip, límites de peso/temperatura y restricciones por raza).
              </p>

              <div className="mt-10">
                <GetRandomtripCta align="center" />
              </div>
            </>
          )}

          {activeTab === 'interactive' && (
            <div className="max-w-2xl mx-auto">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-1">Nivel</label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={levelId}
                    onChange={(e) => setLevelId(e.target.value)}
                  >
                    {LEVELS.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title.substring(l.title.indexOf(' ') + 1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Mascotas extra</label>
                  <input
                    type="number"
                    min={0}
                    max={2}
                    value={extraPets}
                    onChange={(e) => setExtraPets(Math.max(0, Math.min(2, +e.target.value || 0)))}
                    className="w-full border rounded-md p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Tamaño</label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={size}
                    onChange={(e) => setSize(e.target.value as any)}
                  >
                    <option value="small">Pequeño (≤ 12 kg)</option>
                    <option value="medium">Mediano (≤ 23 kg)</option>
                    <option value="large">Grande (&gt; 23 kg)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Transporte</label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value as any)}
                  >
                    <option value="cabina">Cabina (si aplica)</option>
                    <option value="bodega">Bodega</option>
                    <option value="na">N/A</option>
                  </select>
                </div>
              </div>

              <div className="text-center mt-8">
                <p className="text-gray-600 mb-2">Estimación tope por persona (+ 1 mascota):</p>
                <div className="text-3xl font-bold text-gray-900">${estimate} USD</div>

                <Link
                  href={`/journey/basic-config?type=paws&level=${levelId}&extraPets=${extraPets}&size=${size}&cargo=${cargo}`}
                  className="inline-block mt-6 bg-[#D4AF37] text-gray-900 font-bold py-3 px-6 rounded-full hover:bg-[#EACD65] transition-colors"
                  data-analytics="cta_paws_continue_interactive"
                >
                  Continuar →
                </Link>

                <p className="text-xs text-gray-500 mt-4">
                  * Estimación orientativa. El costo final depende de aerolíneas, políticas y disponibilidad.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
