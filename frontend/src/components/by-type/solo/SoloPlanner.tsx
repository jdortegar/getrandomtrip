'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function SoloPlanner() {
  const router = useRouter();

  // Helper para renderizar **negritas** dentro de strings
  const renderRich = (s: string) =>
    s.split('**').map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
    );

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
        ctaLabel: 'Arranca tu Essenza',
      },
      {
        id: 'explora',
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
        ctaLabel: 'Activa tu Modo Explora',
      },
      {
        id: 'exploraPlus',
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
        id: 'atelier',
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

  return (
    <section id="planes" className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      <div className="text-center mb-8">
        <h3 className="text-center text-xl font-semibold text-neutral-900">
          💡 Lo único que definís acá es el presupuesto para pasaje y alojamiento. Ese será tu techo. Del resto… nos ocupamos nosotros.
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
            {/* Contenido principal: columna flexible */}
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
                    • {renderRich(f.text)}
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

            {/* CTA con altura uniforme para no desalinear el closingLine */}
            <div className="mt-6 min-h-[64px] flex items-end">
              <button
                type="button"
                className="btn-card w-full"
                aria-label={t.ctaLabel}
                onClick={() => {
                  router.push(`/journey/basic-config?from=solo&tier=${t.id}`);
                }}
              >
                {t.ctaLabel}
                {!t.ctaLabel.includes('→') && <span aria-hidden>→</span>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
