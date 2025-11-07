'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import FamilyIntroStory from './FamilyIntroStory';
import { useRouter } from 'next/navigation';

export default function FamilyHero(): JSX.Element {
  const router = useRouter();
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
      {/* Fondo video + overlay */}
      <div className="absolute inset-0 z-0">
        {!reduceMotion ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster="/images/journey-types/family-traveler.jpg"
            className="w-full h-full object-cover"
          >
            <source src="/videos/family-hero-video.webm" type="video/webm" />
            <source src="/videos/family-hero-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <Image
            src="/images/journey-types/family-traveler.jpg"
            alt=""
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Gradiente para legibilidad (espejo de /solo) */}
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 mx-auto h-full rt-container px-4">
        <div className="grid h-full items-center gap-8 md:grid-cols-2">
          {/* Columna izquierda: título + bajada + chips + CTAs */}
          <div className="max-w-2xl">
            <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-tight tracking-tightish text-white">
              <span>KIN<sup className="align-super text-[0.65em] ml-0.5">©</sup></span> RANDOMTRIP
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
              <Link
                href="#planner"
                className="btn-primary"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = 'planner';
                  document.getElementById('planner')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }}
              >
                RANDOMTRIP-we! →
              </Link>
              <Link
                href="#inspiracion-families"
                className="btn-secondary"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = 'inspiracion-families';
                  document.getElementById('inspiracion-families')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }}
              >
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
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-white/70 select-none flex flex-col items-center">
        <span className="text-[10px] tracking-[0.35em]">SCROLL</span>
        <span className="mt-1 h-6 w-px bg-white/60 animate-pulse" />
      </div>
    </section>
  );
}