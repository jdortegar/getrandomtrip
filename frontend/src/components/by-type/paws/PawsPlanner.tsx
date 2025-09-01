'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function PawsPlanner() {
  const router = useRouter();

  const tiers = useMemo(
    () => [
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
          { text: '💎 Extras: **Co-creación con un Luxury Travel Advisor + equipo 24/7**. Incluye 2+ experiencias premium diseñadas a medida. Atelier Perks.'},
        ],
        closingLine: '📝Una experiencia exclusiva donde cada momento está diseñado para ambos.',
        ctaLabel: 'Creen lo extraordinario →',
      },
    ],
    []
  );

  return (
    <section id="paws-planner" className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      <div className="text-center mb-8">
        <h3 className="text-center text-xl font-semibold text-neutral-900">
          💡 Lo único que definís acá es el presupuesto para vos y para tu compañer@ de cuatro patas para pasaje y alojamiento. Ese será su techo. Del resto… nos ocupamos nosotros.
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
                onClick={() => {
                  router.push(`/journey/basic-config?from=paws&tier=${t.id}`);
                }}
              >
                {t.ctaLabel}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
