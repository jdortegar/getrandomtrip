'use client';

import React, { useEffect, useRef, useState } from 'react';

const CHIPS = [
  'Viajes sin coordenadas fijas',
  'Experiencias a medida',
  'Intimidad y magia compartida',
];

export default function HoneymoonHero() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoOk, setVideoOk] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onError = () => setVideoOk(false);
    const onCanPlay = () => setVideoOk(true);

    v.addEventListener('error', onError);
    v.addEventListener('canplay', onCanPlay);

    v.muted = true;
    v.play().catch(() => setVideoOk(false));

    return () => {
      v.removeEventListener('error', onError);
      v.removeEventListener('canplay', onCanPlay);
    };
  }, []);

  return (
    <section className="relative min-h-[90svh] md:h-[100svh] w-full overflow-hidden">
      {/* Video de fondo */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/images/journey-types/honeymoon-traveler.jpg"
          className={`absolute inset-0 h-full w-full object-cover pointer-events-none ${videoOk ? 'block' : 'hidden'} motion-safe:block motion-reduce:hidden`}
          aria-hidden="true"
        >
          <source src="/videos/honeymoon-video.mp4" type="video/mp4" />
        </video>

        {/* Fallback si falla el video o si el usuario prefiere reducir motion */}
        <img
          src="/images/journey-types/honeymoon-traveler.jpg"
          alt=""
          className={`absolute inset-0 h-full w-full object-cover pointer-events-none ${videoOk ? 'hidden' : 'block'} motion-reduce:block motion-safe:hidden`}
          aria-hidden="true"
        />

        {/* Overlay para contraste */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      </div>

      {/* Contenido */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
        {/* Columna izquierda */}
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl md:text-6xl leading-tight">
            <span>
              NUPTIA<sup className="align-super text-[0.65em] ml-0.5">©</sup>
            </span>{' '}
            RANDOMTRIP
          </h1>
          <p className="mt-4 text-lg text-white/85">
            La luna de miel no es un destino, es el primer capítulo de su vida juntos. Nosotros
            diseñamos la sorpresa; ustedes se encargan de vivirla.
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
            {/* CTA primario -> planner (sección 2) */}
            <a
              href="#honeymoon-planner"
              data-testid="cta-hero-primary"
              className="btn-primary"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = 'honeymoon-planner';
                document.getElementById('honeymoon-planner')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                });
              }}
            >
              RANDOMTRIP-us! →
            </a>

            {/* CTA secundario -> inspiración (sección 3) */}
            <a href="#inspiracion-honeymoon" data-testid="cta-hero-secondary" className="btn-secondary">
              Relatos que inspiran →
            </a>
          </div>
        </div>

        {/* Columna derecha: Storytelling */}
        <aside className="md:pl-8">
          <div className="mx-auto max-w-[46ch] text-center md:text-left">
            <h3 className="font-display text-2xl md:text-3xl">El comienzo invisible que nadie más verá.</h3>
            <div className="mt-4 space-y-4 text-white/90 leading-relaxed">
              <p>
                El casamiento fue apenas un rito, un momento donde el amor se hizo público. Pero la
                luna de miel… la luna de miel es el instante privado en el que dos miradas se buscan
                sin testigos.
              </p>
              <p>
                No hay coordenadas precisas para ese viaje. Porque lo que importa no es el lugar al
                que se llega, sino lo que cada paso revela del otro. Una risa inesperada en medio de
                una caminata, un silencio compartido frente al mar, la certeza de que hay alguien que
                nos acompaña incluso cuando no decimos nada.
              </p>
              <p>
                Nosotros proponemos el escenario, ustedes escribirán el guion invisible que nadie más
                podrá repetir. Porque hay viajes que se terminan al regresar, y otros —los
                verdaderos— que empiezan cuando entendemos que el destino es, en realidad, el vínculo
                que construimos cada día. La luna de miel no es el epílogo de una fiesta. Es el
                prólogo de una historia que recién comienza.
              </p>
              <p className="opacity-85">
                — <strong>RANDOMTRIP. Wonder. Wander. Repeat.</strong> —
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-white/70 select-none flex flex-col items-center">
        <span className="text-[10px] tracking-[0.35em]">SCROLL</span>
        <span className="mt-1 h-6 w-px bg-white/60 animate-pulse" />
      </div>

      {/* Banner opcional si falla el video */}
      {!videoOk && (
        <div className="absolute left-1/2 top-6 -translate-x-1/2 z-20 rounded-md bg-red-600 text-white text-xs px-3 py-1 shadow">
          Problema cargando el video — usando imagen de respaldo.
        </div>
      )}
    </section>
  );
}
