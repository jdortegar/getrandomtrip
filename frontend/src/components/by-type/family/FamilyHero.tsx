'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import FamilyIntroStory from './FamilyIntroStory';

export default function FamilyHero(): JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoOk, setVideoOk] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onError = () => setVideoOk(false);
    const onCanPlay = () => setVideoOk(true);

    v.addEventListener('error', onError);
    v.addEventListener('canplay', onCanPlay);

    // aseguramos autoplay silencioso en navegadores móviles
    v.muted = true;
    v.play().catch(() => setVideoOk(false));

    return () => {
      v.removeEventListener('error', onError);
      v.removeEventListener('canplay', onCanPlay);
    };
  }, []);

  return (
    <section className="relative min-h-[90svh] md:h-[100svh] w-full overflow-hidden">
      {/* Fondo video + overlay */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/images/journey-types/family-traveler.jpg"
          className={`w-full h-full object-cover ${videoOk ? 'block' : 'hidden'} motion-safe:block motion-reduce:hidden`}
        >
          <source src="/videos/family-hero-video.mp4" type="video/mp4" />
        </video>

        {/* Fallback si falla el video o si el usuario prefiere reducir motion */}
        <Image
          src="/images/journey-types/family-traveler.jpg"
          alt="Familia viajando"
          fill
          priority
          className={`object-cover ${videoOk ? 'hidden' : 'block'} motion-reduce:block motion-safe:hidden`}
        />

        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Gradiente para legibilidad (espejo de /solo) */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/40 to-black/10" />

      <div className="relative z-10 mx-auto h-full max-w-7xl px-4">
        <div className="grid h-full items-center gap-8 md:grid-cols-2">
          {/* Columna izquierda: título + bajada + chips + CTAs */}
          <div className="max-w-2xl">
            <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-tight tracking-tightish text-white">
              <span>
                KIN<sup className="align-super text-[0.65em] ml-0.5">©</sup>
              </span>{' '}
              RANDOMTRIP
            </h1>

            <p className="mt-3 text-base md:text-lg text-white/90">
              Viajar en familia es moverse, es descubrirse, es crear anécdotas que después se contarán mil veces en la sobremesa.
            </p>

            {/* Badges (píldoras) — espejo de /solo */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-white">
              {[
                'Para todas las edades',
                'Planes diseñados sin estrés',
                'Flex reprogramación',
              ].map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-white/20 bg-white/15 px-3 py-1 backdrop-blur"
                >
                  {b}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#planner" className="btn-primary">
                RANDOMTRIP-we! →
              </Link>
              <Link href="#inspiracion-families" className="btn-secondary">
                Relatos que inspiran →
              </Link>
            </div>
          </div>

          {/* Columna derecha: storytelling (sin card, espejo de /solo) */}
          <aside className="md:pl-8">
            <div className="mx-auto max-w-[46ch] text-center md:text-left">
              <FamilyIntroStory />
            </div>
          </aside>
        </div>
      </div>

      {/* Indicador de scroll unificado */}
      <div className="scroll-indicator pointer-events-none select-none z-10" aria-hidden="true">
        SCROLL
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
