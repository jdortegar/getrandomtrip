'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function HoneymoonPlanner() {
  const router = useRouter();

  const tier = useMemo(
    () => ({
      id: 'atelier',
      badge: 'Premium Choice',
      name: 'Atelier Getaway',
      subtitle: 'Distinción, sin esfuerzo',
      priceLabel: 'Desde 1800 USD',
      priceFootnote: '· por persona',
      features: [
        { text: 'Duración: Customizable' },
        { text: 'Transporte: Multimodal / a medida.' },
        { text: 'Fechas: Sin bloqueos.' },
        { text: 'Alojamiento: Luxury / de autor / cadenas A1.' },
        { text: 'Extras: Co-creación con un Luxury Travel Advisor + equipo 24/7' },
        { text: 'Incluye: 2+ experiencias premium diseñadas para la pareja' },
        { text: 'Perks: Traslados privados, salas VIP, reservas prioritarias, atenciones exclusivas' },
      ],
      closingLine:
        '“Un viaje irrepetible, diseñado como prólogo de una historia que recién comienza.”',
      cta: '✨ Crear lo extraordinario',
    }),
    []
  );

  // videos en /public (escapamos espacios)
  const videoWebm = '/videos/honeymoon-video%20(seccion%202).webm';
  const videoMp4  = '/videos/honeymoon-video%20(seccion%202).mp4';

  return (
    // Sección full-width con video de fondo (tipo hero SOLO para esta sección)
    <section id="honeymoon-planner" className="relative isolate w-full">
      {/* background de sección */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <video
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster="images\journey-types\honeymoon-poster.jpeg"
        >
          <source src={videoWebm} type="video/webm" />
          <source src={videoMp4} type="video/mp4" />
        </video>
        {/* oscurecemos un poco más el video para que quede realmente de fondo */}
        <div className="absolute inset-0 bg-black/55" />
      </div>

      {/* Contenido centrado */}
      <div className="mx-auto max-w-6xl px-4 md:px-8 py-16 md:py-24">
        {/* Encabezado de la sección */}
        <div className="text-center text-white">
          <h2 className="font-display text-2xl md:text-4xl font-bold">
            Diseñen su Honeymoon Randomtrip
          </h2>
          <div className="mt-2 text-sm md:text-base opacity-90">
            Presupuesto · Tipo de honeymoon
          </div>
          <p className="mt-6 text-base md:text-lg max-w-3xl mx-auto opacity-95">
            Una luna de miel sin coordenadas fijas, diseñada a medida. Nosotros ponemos el
            escenario; ustedes escriben la historia.
          </p>
        </div>

        {/* Card única (glass) */}
        <div className="mt-10 grid place-items-center">
          <div
            role="group"
            aria-labelledby="honeymoon-atelier"
            className="w-full max-w-2xl rounded-2xl bg-white/12 backdrop-blur-md border border-white/25 shadow-xl transition hover:shadow-2xl"
          >
            <div className="p-6 md:p-8">
              {/* Badge */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-amber-100 bg-amber-900/40 px-2 py-1 rounded-full border border-amber-200/30">
                  {tier.badge}
                </span>
              </div>

              {/* Título + subtítulo */}
              <h3
                id="honeymoon-atelier"
                className="mt-3 font-display text-2xl md:text-3xl font-bold text-white"
              >
                {tier.name}
              </h3>
              <p className="text-neutral-200 text-sm md:text-base">{tier.subtitle}</p>

              {/* Precio */}
              <div className="mt-6">
                <div className="font-display text-3xl md:text-4xl leading-tight font-bold text-[var(--rt-terracotta)] drop-shadow">
                  {tier.priceLabel}
                </div>
                <span className="block text-xs text-neutral-100">
                  {tier.priceFootnote}
                </span>
              </div>

              {/* Bullets */}
              <ul className="mt-5 space-y-2 text-sm text-neutral-100">
                {tier.features.map((f, i) => (
                  <li key={i} className="leading-snug">• {f.text}</li>
                ))}
              </ul>

              {/* Cita */}
              <div className="mt-6 py-4 border-y border-white/20">
                <p className="text-neutral-50 text-sm md:text-base leading-relaxed text-center">
                  {tier.closingLine}
                </p>
              </div>

              {/* CTA */}
              <div className="mt-6 min-h-[64px] flex items-end">
                <button
                  type="button"
                  className="btn-card w-full"
                  aria-label={tier.cta}
                  onClick={() =>
                    router.push(`/journey/basic-config?from=honeymoon&tier=${tier.id}`)
                  }
                >
                  {tier.cta}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Volver */}
        <div className="mt-10 text-center">
          <a
            href="/packages/by-type"
            className="text-neutral-200 hover:text-white underline underline-offset-4"
          >
            ← Volver
          </a>
        </div>
      </div>
    </section>
  );
}
