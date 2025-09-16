'use client';
import React, { useState, useEffect } from 'react';
import Img from '@/components/common/Img'; // Added import
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SoloHero() {
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
            poster="/images/journey-types/solo-traveler.jpg"
            className="w-full h-full object-cover"
          >
            <source src="/videos/solo-hero-video.webm" type="video/webm" />
            <source src="/videos/solo-hero-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <Img
            src="/images/journey-types/solo-traveler.jpg"
            alt=""
            className="w-full h-full object-cover"
            width={1920} // Assuming a common hero image width
            height={1080} // Assuming a common hero image height
          />
        )}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Gradiente para legibilidad */}
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 mx-auto h-full max-w-7xl px-4">
        <div className="grid h-full items-center gap-8 md:grid-cols-2">
          {/* Columna izquierda: título + chips + CTAs */}
          <div className="max-w-2xl">
            <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-tight tracking-tightish text-white">
              <span>SOLUM<sup className="align-super text-[0.65em] ml-0.5">©</sup></span> RANDOMTRIP
            </h1>
            <p className="mt-3 text-base md:text-lg text-white/90">
              Escapadas secretas diseñadas para que te pierdas. Y te encuentres.
            </p>

            {/* Badges */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-white">
              {[
                'Te acompañamos en todo momento.',
                'Menos plan, más descubrimiento.',
                'Tu historia, sin spoilers.',
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
                href="#planes"
                className="btn-primary"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = 'planes';
                  document.getElementById('planes')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }}
              >
                RANDOMTRIP-me! →
              </Link>
              <Link
                href="#inspiracion-solo"
                className="btn-secondary"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = 'inspiracion-solo';
                  document.getElementById('inspiracion-solo')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }}
              >
                Relatos que inspiran →
              </Link>
            </div>
          </div>

          {/* Columna derecha: storytelling */}
          <aside className="md:pl-8">
            <div className="mx-auto max-w-[46ch] text-center md:text-left">
              <h3 className="font-display text-sm tracking-[0.18em] text-white/70">
                SOLUM CONFIDENCIAL
              </h3>
              <div className="mt-6 space-y-4 text-sm md:text-base leading-relaxed md:leading-8 text-white/90">
                <p>
                  Cuando uno viaja solo, no hay que rendir cuentas: ni a la pareja que quiere parar en cada mirador,
                  ni al amigo que arma itinerarios con colores.
                </p>
                <p>
                  Acá no habrá listas de “cosas que hacer”, ni reseñas de TripAdvisor con cinco estrellas y fotos
                  pixeladas. Habrá un camino que se abre frente a vos, como si lo fueras inventando con cada paso.
                  Y, en el fondo, alguien —nosotros— asegurándonos de que todo funcione aunque parezca improvisado.
                </p>
                <p>
                  Quizá amanezcas mirando un lago que no sabías que existía. O termines hablando con extraños que,
                  al rato, ya no lo serán. Viajar solo es ese raro lujo: el de encontrarte con el silencio
                  y descubrir que no asusta tanto.
                </p>
                <p>
                  Lo que empieza es un relato sin testigos: un café que se enfría mientras escribís en una libreta,
                  una caminata que te obliga a pensar distinto, una foto que no tenés a quién mostrar pero que igual guardás.
                </p>
                <p>
                  Lo único seguro es que vas a volver distinto. No mejor ni peor: distinto. Y con ganas de repetir,
                  como ese libro que releés sabiendo que la segunda vez lo vas a entender mejor.
                </p>
                <p>
                 --- RANDOMTRIP. Wonder. Wander. Repeat. ---
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    {/* Indicador de scroll (unificado) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-white/70 select-none flex flex-col items-center">
        <span className="text-[10px] tracking-[0.35em]">SCROLL</span>
        <span className="mt-1 h-6 w-px bg-white/60 animate-pulse" />
      </div>
    </section>
  );
}
