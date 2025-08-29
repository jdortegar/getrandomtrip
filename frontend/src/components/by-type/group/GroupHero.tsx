// frontend/src/components/by-type/group/GroupHero.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';

const CHIPS = ['Todos sincronizados', 'Más risas por m²', 'Logística sin fricción'];

export default function GroupHero() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoOk, setVideoOk] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onError = () => setVideoOk(false);
    const onCanPlay = () => setVideoOk(true);

    v.addEventListener('error', onError);
    v.addEventListener('canplay', onCanPlay);

    // autoplay silencioso (móvil)
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
          poster="/images/journey-types/group-traveler.jpg"
          className={`absolute inset-0 h-full w-full object-cover pointer-events-none ${videoOk ? 'block' : 'hidden'} motion-safe:block motion-reduce:hidden`}
          aria-hidden="true"
        >
          <source src="/videos/group-hero-video.mp4" type="video/mp4" />
        </video>

        {/* Fallback si falla el video o si el usuario prefiere reducir motion */}
        <img
          src="/images/journey-types/group-traveler.jpg"
          alt=""
          className={`absolute inset-0 h-full w-full object-cover pointer-events-none ${videoOk ? 'hidden' : 'block'} motion-reduce:block motion-safe:hidden`}
          aria-hidden="true"
        />

        {/* Overlay/gradiente */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      </div>

      {/* Contenido */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl md:text-6xl leading-tight">
            <span>
              CREW<sup className="align-super text-[0.65em] ml-0.5">©</sup>
            </span>{' '}
            RANDOMTRIP
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

            <a href="#inspiracion-group" data-testid="cta-hero-secondary" className="btn-secondary">
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

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-white/70 select-none">
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
