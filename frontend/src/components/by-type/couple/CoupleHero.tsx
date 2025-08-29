'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const CHIPS = ['48h antes se revela', 'Flex reprogramación', 'Pago seguro'];

export default function CoupleHero() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoOk, setVideoOk] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Respeta prefers-reduced-motion (no reproducir video si el usuario lo pide)
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReduceMotion(m.matches);
    handler();
    m.addEventListener?.('change', handler);
    return () => m.removeEventListener?.('change', handler);
  }, []);

  // Manejo de estado del video (éxito/error) + autoplay muted/inline
  useEffect(() => {
    if (reduceMotion) return;
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
  }, [reduceMotion]);

  return (
    <section className="relative min-h-[90svh] md:h-[100svh] w-full overflow-hidden">
      {/* Fondo: video + fallback imagen */}
      <div className="absolute inset-0 z-0">
        {!reduceMotion && (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster="/images/journey-types/couple-traveler.jpg"
            className={`absolute inset-0 h-full w-full object-cover pointer-events-none ${
              videoOk ? 'block' : 'hidden'
            } motion-safe:block motion-reduce:hidden`}
            aria-hidden="true"
          >
            <source src="/videos/couple-hero-video.mp4" type="video/mp4" />
          </video>
        )}

        {/* Fallback estático (y también visible si reduce motion) */}
        <img
          src="/images/journey-types/couple-traveler.jpg"
          alt=""
          className={`absolute inset-0 h-full w-full object-cover pointer-events-none ${
            !reduceMotion && videoOk ? 'hidden' : 'block'
          }`}
          aria-hidden="true"
        />

        {/* Overlay para contraste */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Gradiente para legibilidad (alineado con otros by-type) */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/40 to-black/10" />

      {/* Contenido */}
      <div className="relative z-10 mx-auto h-full max-w-7xl px-4">
        <div className="grid h-full items-center gap-8 md:grid-cols-2">
          {/* Columna izquierda: Título + chips + CTAs */}
          <div className="max-w-2xl">
            <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-tight tracking-tightish text-white">
              <span>
                BOND<sup className="align-super text-[0.65em] ml-0.5">©</sup>
              </span>{' '}
              RANDOMTRIP
            </h1>

            <p className="mt-3 text-base md:text-lg text-white/90">
              Sorpresa para ustedes. Sin spoilers.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-white">
              {CHIPS.map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-white/20 bg-white/15 px-3 py-1 backdrop-blur"
                >
                  {b}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#planes" className="btn-primary">
                RANDOMTRIP-us! →
              </Link>
              <Link href="#inspiracion-couples" className="btn-secondary">
                Relatos que inspiran →
              </Link>
            </div>
          </div>

          {/* Columna derecha: espacio para storytelling si aplica (consistente con otras páginas) */}
          <aside className="md:pl-8">
            <div className="mx-auto max-w-[46ch] text-center md:text-left text-white/90 leading-relaxed">
              <h3 className="font-display text-2xl md:text-3xl">Dos es número primo</h3>
              <p className="mt-4">
                En la reserva estarán sus nombres. El destino, no. Un itinerario bajo llave,
                diseñado para que la sorpresa sea parte del plan.
              </p>
              <p>
                Desayuno acá, un beso allá, atardeceres que no pidieron pero igual se llevan de
                recuerdo. Lo único seguro: van a volver con anécdotas imposibles de explicar sin
                gestos.
              </p>
              <p className="opacity-85 mt-2">
                — <strong>RANDOMTRIP. Wonder. Wander. Repeat.</strong> —
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Indicador de scroll unificado */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-white/70 select-none flex flex-col items-center"
        aria-hidden="true"
      >
        <span className="text-[10px] tracking-[0.35em]">SCROLL</span>
        <span className="mt-1 h-6 w-px bg-white/60 animate-pulse" />
      </div>
    </section>
  );
}
