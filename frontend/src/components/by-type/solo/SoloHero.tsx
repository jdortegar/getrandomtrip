'use client';
import React from 'react';
import Link from 'next/link';
import BackgroundVideo from "@/components/media/BackgroundVideo";

export default function SoloHero() {
  return (
    <section className="relative min-h-[90svh] md:h-[100svh] w-full overflow-hidden">
      <BackgroundVideo src="/videos/solo-hero-video.mp4" poster="/images/journey-types/solo-traveler.jpg" />

      {/* Gradiente para legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/40 to-black/10" />

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
              <Link href="#planes" className="btn-primary">
                RANDOMTRIP-me! →
              </Link>
              <Link href="#inspiracion-solo" className="btn-secondary">
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
                 --- RANDOMTIRP. Wonder. Wander. Repeat. ---
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    {/* Indicador de scroll (unificado) */}
      <div className="scroll-indicator pointer-events-none select-none z-10" aria-hidden="true">
        SCROLL
      </div>
    </section>
  );
}