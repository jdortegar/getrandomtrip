// frontend/src/components/by-type/paws/PawsHero.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { track } from '@/components/common/analytics';

export default function PawsHero() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoOk, setVideoOk] = useState(true); // si falla el codec, mostramos fallback

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onError = () => setVideoOk(false);
    const onCanPlay = () => setVideoOk(true);

    v.addEventListener('error', onError);
    v.addEventListener('canplay', onCanPlay);

    // en iOS/Safari a veces necesita un play “silencioso” para validar
    v.muted = true;
    v.play().catch(() => {
      // si no puede reproducir inmediatamente, igual dejamos que el póster/fallback actúe
      setVideoOk(false);
    });

    return () => {
      v.removeEventListener('error', onError);
      v.removeEventListener('canplay', onCanPlay);
    };
  }, []);

  return (
    <section className="relative min-h-[90svh] md:h-[100svh] w-full overflow-hidden">
      {/* Media layer */}
      <div className="absolute inset-0 z-0">
        {/* Video (si el codec está OK) */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/images/journey-types/paws-card.jpg"
          className={`w-full h-full object-cover ${videoOk ? 'block' : 'hidden'}`}
        >
          {/* IMPORTANTE: el mp4 debe estar en H.264 + AAC */}
          <source src="/videos/paws-hero-video.webm" type="video/webm" />
          <source src="/videos/paws-hero-video.mp4" type="video/mp4" />
        </video>

        {/* Fallback a imagen si el video no puede cargarse/reproducirse */}
        <Image
          src="/images/journey-types/paws-card.jpg"
          alt=""
          fill
          priority
          className={`object-cover ${videoOk ? 'hidden' : 'block'}`}
        />
      </div>

      {/* overlay / gradiente para legibilidad */}
      <div className="absolute inset-0 bg-black/40" />

      {/* copy + CTAs */}
      <div className="relative z-10 mx-auto h-full rt-container px-4">
        <div className="grid h-full items-center gap-8 md:grid-cols-2">
          <div className="max-w-2xl">
            <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-tight tracking-tightish text-white">
              <span>
                PAWS<sup className="align-super text-[0.65em] ml-0.5">©</sup>
              </span>{' '}
              RANDOMTRIP
            </h1>

            <p className="mt-3 text-base md:text-lg text-white/90">
              Viajar con ellos es parte del plan. Diseñamos escapadas donde tu mejor amig@ de cuatro patas también es protagonista.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-white">
              {['🐶 Pet-friendly garantizado', '✈️ Logística sin estrés', '🌳 Experiencias para ambos'].map((b) => (
                <span key={b} className="rounded-full border border-white/20 bg-white/15 px-3 py-1 backdrop-blur">
                  {b}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/packages/by-type/paws#paws-planner"
                aria-label="Ir al planner PAWS para empezar su RANDOMTRIP"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = 'paws-planner';
                  document.getElementById('paws-planner')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                  track('cta_click', { area: 'paws_hero', label: 'randomtrip_paws' });
                }}
                className="btn-primary"
                data-analytics="cta_paws_planner_hero"
              >
                🐾 RANDOMTRIP-paws! →
              </Link>
              <Link
                href="#inspiracion-paws"
                aria-label="Ver relatos que inspiran de viajes con mascotas"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = 'inspiracion-paws';
                  document.getElementById('inspiracion-paws')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                  track('cta_click', { area: 'paws_hero', label: 'relatos' });
                }}
                className="btn-secondary"
                data-analytics="cta_paws_blog_hero"
              >
                ✨ Relatos que inspiran →
              </Link>
            </div>
          </div>

          <aside className="md:pl-8">
            <div className="mx-auto max-w-[46ch] text-center md:text-left">
              <h3 className="font-display text-sm tracking-[0.18em] text-white/70">AVENTURA CON HUELLA</h3>
              <div className="mt-6 space-y-4 text-sm md:text-base leading-relaxed md:leading-8 text-white/90">
                <p>
                  Dicen que la vida es mejor con compañía… y pocas compañías son tan leales como la que te espera al llegar a casa con un
                  movimiento de cola o un ronroneo.
                </p>
                <p>
                  En PAWS© RANDOMTRIP creemos que los viajes no deberían dejar a nadie atrás. Diseñamos escapadas donde tu mascota no es un
                  problema logístico, sino parte esencial de la aventura.
                </p>
                <p>
                  Un camino nuevo huele distinto; un bosque tiene sonidos que despiertan curiosidad; una playa es territorio para correr sin
                  relojes. Ellos no solo te acompañan: te enseñan a viajar distinto.
                </p>
                <p>Porque algunas huellas se dejan en la arena, y otras, para siempre en la memoria.</p>
                <p>--- RANDOMTRIP. Wonder. Wander. Repeat. ---</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Indicador de scroll */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-white/70 select-none flex flex-col items-center">
        <span className="text-[10px] tracking-[0.35em]">SCROLL</span>
        <span className="mt-1 h-6 w-px bg-white/60 animate-pulse" />
      </div>

      {/* Aviso si el video falló (útil en dev para detectar codec/LFS) */}
      {!videoOk && (
        <div className="absolute left-1/2 top-6 -translate-x-1/2 z-20 rounded-md bg-red-600 text-white text-xs px-3 py-1 shadow">
          Video error: SRC_NOT_SUPPORTED — Verificá LFS/codec. Abrí <code>/videos/paws-hero-video.mp4</code> directo en el navegador.
        </div>
      )}
    </section>
  );
}