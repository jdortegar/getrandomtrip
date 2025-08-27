'use client';
import Link from 'next/link';
import Image from 'next/image';
import { track } from '@/components/common/analytics';

export default function PawsHero() {
  return (
    <section
      className="relative min-h-[90svh] md:h-[100svh] w-full overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        <video
          src="/videos/paws-hero-video.mp4"
          autoPlay
          loop
          muted
          playsInline
          poster="/images/journey-types/paws-card.jpg"
          className="w-full h-full object-cover hidden motion-safe:block"
        />
        <Image
          src="/images/journey-types/paws-card.jpg"
          alt=""
          fill
          className="object-cover block motion-reduce:block motion-safe:hidden"
        />
      </div>
      {/* overlay / gradiente para legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/40 to-black/10" />

      <div className="relative z-10 mx-auto h-full max-w-7xl px-4">
        <div className="grid h-full items-center gap-8 md:grid-cols-2">
          {/* Columna izquierda: Título + chips + CTAs */}
          <div className="max-w-2xl">
            <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-tight tracking-tightish text-white">
              <span>PAWS<sup className="align-super text-[0.65em] ml-0.5">©</sup></span> RANDOMTRIP
            </h1>

            <p className="mt-3 text-base md:text-lg text-white/90">
              Viajar con ellos es parte del plan. Diseñamos escapadas donde tu mejor amig@ de cuatro patas también es protagonista.
            </p>

            {/* Badges */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-white">
              {[
                '🐶 Pet-friendly garantizado',
                '✈️ Logística sin estrés',
                '🌳 Experiencias para ambos'
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
                href="/packages/by-type/paws#paws-planner"
                aria-label="Ir al planner PAWS para empezar su RANDOMTRIP"
                onClick={() => track('cta_click', { area: 'paws_hero', label: 'randomtrip_paws' })}
                className="btn-primary"
                data-analytics="cta_paws_planner_hero"
              >
                🐾 RANDOMTRIP-paws! →
              </Link>
              <Link
                href="/blog"
                aria-label="Ver relatos que inspiran de viajes con mascotas"
                onClick={() => track('cta_click', { area: 'paws_hero', label: 'relatos' })}
                className="btn-secondary"
                data-analytics="cta_paws_blog_hero"
              >
                ✨ Relatos que inspiran →
              </Link>
            </div>
          </div>

          {/* Columna derecha: Storytelling */}
          <aside className="md:pl-8">
            <div className="mx-auto max-w-[46ch] text-center md:text-left">
              <h3 className="font-display text-sm tracking-[0.18em] text-white/70">
                AVENTURA CON HUELLA
              </h3>
              <div className="mt-6 space-y-4 text-sm md:text-base leading-relaxed md:leading-8 text-white/90">
                <p>
                  Dicen que la vida es mejor con compañía… y pocas compañías son tan leales como la que te espera al llegar a casa con un movimiento de cola o un ronroneo.
                </p>
                <p>
                  En PAWS© RANDOMTRIP creemos que los viajes no deberían dejar a nadie atrás. Diseñamos escapadas donde tu mascota no es un problema logístico, sino parte esencial de la aventura.
                </p>
                <p>
                  Un camino nuevo huele distinto; un bosque tiene sonidos que despiertan curiosidad; una playa es territorio para correr sin relojes. Ellos no solo te acompañan: te enseñan a viajar distinto.
                </p>
                <p>
                  Porque algunas huellas se dejan en la arena, y otras, para siempre en la memoria.
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
      <div className="scroll-indicator pointer-events-none select-none z-10" aria-hidden="true">
        SCROLL
      </div>
    </section>
  );
}