// frontend/src/components/by-type/group/GroupHero.tsx
'use client';

import { useEffect, useState } from 'react';

const CHIPS = ['Todos sincronizados', 'Más risas por m²', 'Logística sin fricción'];

export default function GroupHero() {
  // Respeta "prefers-reduced-motion" para pausar/esconder el video
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReduceMotion(m.matches);
    handler();
    m.addEventListener?.('change', handler);
    return () => m.removeEventListener?.('change', handler);
  }, []);

  return (
    <section className="relative min-h-[90svh] md:h-[100svh] w-full overflow-hidden">
      {/* Video de fondo */}
      {!reduceMotion && (
        <video
          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/images/journey-types/friends-group.jpg"
          aria-hidden="true"
        >
          {/* TODO: Replace with an actual poster image for group-hero-video.mp4 */}
          {/* WEBM primero por performance/compatibilidad */}
          <source src="/videos/group-hero-video.webm" type="video/webm" />
          <source src="/videos/group-hero-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      {/* Gradiente */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* Contenido */}
      <div className="relative z-20 rt-container px-4 md:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl md:text-6xl leading-tight">
            <span>CREW<sup className="align-super text-[0.65em] ml-0.5">©</sup></span> RANDOMTRIP
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Equipos, amigos, intereses en común: diseñamos escapadas que funcionan para todos.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {CHIPS.map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/25 bg-black/30 backdrop-blur-sm px-4 py-2 text-sm"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            {/* ⬇️ Lleva a la sección 2, Tab 1 (Intro) sin forzar step=budget */}
            <a
              href="#group-planner"
              className="btn-primary"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = 'group-planner';
                document.getElementById('group-planner')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                });
              }}
            >
              RANDOMTRIP-all! →
            </a>

            <a
              href="#inspiracion-group"
              data-testid="cta-hero-secondary"
              className="btn-secondary"
            >
              Relatos que inspiran →
            </a>
          </div>
        </div>

        {/* Storytelling */}
        <aside className="md:pl-8">
          <div className="mx-auto max-w-[46ch] text-center md:text-left">
            <h3 className="font-display text-2xl md:text-3xl">MOMENTOS EN PLURAL</h3>
            <div className="mt-4 space-y-4 text-white/90 leading-relaxed">
              <p>
                Los mejores recuerdos no se cuentan solos. Se construyen entre miradas, brindis y
                carcajadas que rebotan de un lado a otro. Porque los momentos, cuando se viven en
                grupo, pesan más. Tienen gravedad propia.
              </p>
              <p>
                Acá no se trata de coordinar vuelos ni de discutir destinos. Se trata de entregarse a
                la sorpresa de estar juntos, sin que nadie tenga que hacer de organizador. Ustedes
                llegan con la historia; nosotros la convertimos en escenario.
              </p>
              <p>
                Será una sobremesa que se extiende hasta la madrugada, una caminata que se transforma
                en ritual, un viaje que se volverá leyenda compartida. Porque lo que empieza en
                plural, siempre se recuerda en mayúsculas.
              </p>
              <p className="opacity-80">
                — <strong>RANDOMTRIP. Wonder. Wander. Repeat.</strong> —
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Scroll indicator (no capta clicks) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-white/70 select-none">
        <span className="text-[10px] tracking-[0.35em]">SCROLL</span>
        <span className="mt-1 h-6 w-px bg-white/60 animate-pulse" />
      </div>
    </section>
  );
}
