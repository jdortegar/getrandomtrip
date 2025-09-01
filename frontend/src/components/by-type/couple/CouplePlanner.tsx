'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

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
        ctaLabel: 'Den el primer paso',
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
        ctaLabel: 'Exploren su historia',
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
        ctaLabel: 'Suban la apuesta',
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
        ctaLabel: 'Viajen distinto',
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
        ctaLabel: 'Creen lo irrepetible',
      },
    ],
    [],
  );

  return (
    <section id="planes" className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      <div className="text-center mb-8">
        <h3 className="text-center text-xl font-semibold text-neutral-900">
          💡 Lo único que definen acá es el presupuesto por persona para pasaje y alojamiento. Ese será su techo. Del resto…
          nos ocupamos nosotros.
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
                  router.push(`/journey/basic-config?from=couple&tier=${t.id}`);
                }}
              >
                {t.ctaLabel} <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
