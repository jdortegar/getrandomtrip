'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function CoupleHero() {
  const router = useRouter();

  return (
    <section
      className="relative min-h-[90svh] md:h-[100svh] w-full overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/images/journey-types/couple-traveler.jpg"
          className="w-full h-full object-cover block motion-reduce:hidden"
        >
          {/* IMPORTANT: .webm should be first for better performance/compatibility */}
          <source src="/videos/couple-hero-video.webm" type="video/webm" /> {/* Ensure this file exists! */}
          <source src="/videos/couple-hero-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <Image
          src="/images/journey-types/couple-traveler.jpg"
          alt=""
          fill
          className="object-cover hidden motion-reduce:block"
        />
      </div>
      {/* overlay / gradiente para legibilidad */}
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 mx-auto h-full max-w-7xl px-4">
        <div className="grid h-full items-center gap-8 md:grid-cols-2">
          {/* Columna izquierda: Título + chips + CTAs */}
          <div className="max-w-2xl">
            <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-tight tracking-tightish text-white">
              <span>BOND<sup className="align-super text-[0.65em] ml-0.5">©</sup></span> RANDOMTRIP
            </h1>

                        <p className="mt-3 text-base md:text-lg text-white/90">
              Sorpresa para ustedes. Sin spoilers.
            </p>

            {/* Badges */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-white">
              {['48h antes se revela', 'Flex reprogramación', 'Pago seguro'].map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-white/20 bg-white/15 px-3 py-1 backdrop-blur"
                >
                  {b}
                </span>
              ))}
            </div>

            {/* CTAs — más notorios */}
            <div className="mt-8 flex flex-wrap gap-3">
              {/* Primario */}
              <Link
                href="#couple-planner?step=budget"
                className="btn-primary"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = 'couple-planner?step=budget';
                  document.getElementById('couple-planner')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }}
              >
                RANDOMTRIP-us! →
              </Link>

              {/* Secundario (outline + blur para que se note que es botón) */}
              <Link
                href="#inspiracion-couples"
                className="btn-secondary"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = 'inspiracion-couples';
                  document.getElementById('inspiracion-couples')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }}
              >
                Relatos que inspiran →
              </Link>
            </div>

            
          </div>

          {/* Columna derecha: Storytelling */}
          <aside className="md:pl-8">
            <div className="mx-auto max-w-[46ch] text-center md:text-left">
              <h3 className="font-display text-sm tracking-[0.18em] text-white/70">
                AMOR CLASIFICADO
              </h3>
              <div className="mt-6 space-y-4 text-sm md:text-base leading-relaxed md:leading-8 text-white/90">
                <p>
                  Nadie sabrá dónde estarán. Ni siquiera ustedes… todavía. Y créanme: eso está
                  buenísimo. Porque si algo mata la magia de un viaje es ese Excel de horarios
                  que se arma el primo que “sabe organizar”.
                </p>
                <p>
                  Acá no habrá Excel, ni folletos de agencia con gente sonriendo falsamente.
                  Habrá alguien —que no son ustedes— y armaremos todo para que parezca
                  improvisado. Ustedes, mientras tanto, no sabrán si al día siguiente
                  amanecerán viendo el mar o escuchando gallos… y eso, mis enamorados, es arte.
                </p>
                <p>
                  Ningún mapa lo marca. Ningún blog lo recomienda. Solo ustedes dos, caminando
                  por lugares que parecerán inventados para que nadie más los vea. Un itinerario
                  bajo llave, como las recetas de la abuela, que jura llevarse a la tumba… y
                  después termina contando en un casamiento.
                </p>
                <p>
                  En la reserva estarán sus nombres. El destino, no. Y ahí empezará la novela:
                  desayuno acá, un beso allá, un atardecer que no pidieron pero igual se
                  llevarán de recuerdo. Lo único seguro es que volverán con anécdotas
                  imposibles de explicar sin gestos y sin exagerar… y con ganas de repetir,
                  como cuando una canción que nos gusta termina y uno aprieta “otra vez”.
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
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-white/70 select-none flex flex-col items-center">
        <span className="text-[10px] tracking-[0.35em]">SCROLL</span>
        <span className="mt-1 h-6 w-px bg-white/60 animate-pulse" />
      </div>
    </section>
  );
}