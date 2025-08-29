'use client';

import { useEffect, useRef, useState } from 'react';

const CHIPS = [
  'Viajes sin coordenadas fijas',
  'Experiencias a medida',
  'Intimidad y magia compartida',
];

export default function HoneymoonHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoOk, setVideoOk] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  const SRC = '/videos/honeymoon-video.mp4';
  const POSTER = '/images/journey-types/couple-traveler.jpg';

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setReduceMotion(mediaQuery.matches);
    handleChange(); // Initial check
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video && !reduceMotion) {
      video.muted = true;
      video.play().catch(() => {
        console.error("Video playback failed.");
        setVideoOk(false);
      });
    }
  }, [reduceMotion]);

  return (
    <section className="relative min-h-[90svh] md:h-[100svh] w-full overflow-hidden">
      {/* Fondo video + poster + fallback */}
      <div className="absolute inset-0 z-0">
        {reduceMotion || !videoOk ? (
          <img
            src={POSTER}
            alt="Couple on their honeymoon"
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster={POSTER}
            className="w-full h-full object-cover"
            onError={() => setVideoOk(false)}
          >
            <source src={SRC} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Gradiente */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/40 to-black/10" />

      {/* Contenido */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl md:text-6xl leading-tight text-white">
            <span>NUPTIA<sup className="align-super text-[0.65em] ml-0.5">©</sup></span> RANDOMTRIP
          </h1>
          <p className="mt-4 text-lg text-white/85">
            La luna de miel no es un destino; es el primer capítulo de su vida juntos.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {CHIPS.map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/25 bg-black/30 backdrop-blur-sm px-4 py-2 text-sm text-white"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#honeymoon-planner"
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

            <a href="#inspiracion-honeymoon" className="btn-secondary">
              Relatos que inspiran →
            </a>
          </div>
        </div>

        {/* Storytelling */}
        <aside className="md:pl-8">
          <div className="mx-auto max-w-[46ch] text-center md:text-left text-white/90 leading-relaxed space-y-4">
            <h3 className="font-display text-2xl md:text-3xl text-white">
              El comienzo invisible que nadie más verá.
            </h3>
            <p>Nosotros proponemos el escenario; ustedes escriben el guion.</p>
            <p className="opacity-85">— <strong>RANDOMTRIP. Wonder. Wander. Repeat.</strong> —</p>
          </div>
        </aside>
      </div>

      {/* Indicador de scroll */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-white/70 select-none flex flex-col items-center">
        <span className="text-[10px] tracking-[0.35em]">SCROLL</span>
        <span className="mt-1 h-6 w-px bg-white/60 animate-pulse" />
      </div>
    </section>
  );
}
