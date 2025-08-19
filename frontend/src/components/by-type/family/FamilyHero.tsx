'use client';
import React from 'react';
import Link from 'next/link';
import FamilyIntroStory from './FamilyIntroStory';

export default function FamilyHero(): JSX.Element {
  return (
    <section className="relative min-h-[90svh] md:h-[100svh] w-full overflow-hidden">
      {/* Fondo video + overlay */}
      <div className="absolute inset-0 z-0">
        <video
          src="/videos/family-hero-video.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover hidden motion-safe:block"
        />
        {/* Fallback opcional: elimina si no tienes esta imagen */}
        <img
          src="/images/journey-types/family-traveler.jpg"
          alt=""
          className="w-full h-full object-cover block motion-reduce:block motion-safe:hidden"
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
              FAMILY <span>RANDOMTRIP<sup className="align-super text-[0.65em] ml-0.5">©</sup></span>
            </h1>

            <p className="mt-3 text-base md:text-lg text-white/90">
              Viajar en familia es moverse, es descubrirse, es crear anécdotas que después se contarán mil veces en la sobremesa.
            </p>

            {/* Badges (píldoras) — espejo de /solo */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-white">
              {[
                'Viajes seguros para todas las edades',
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
                Armar mi viaje
              </Link>
              <Link href="#family-inspiration" className="btn-secondary">
                Inspírame →
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
    </section>
  );
}
