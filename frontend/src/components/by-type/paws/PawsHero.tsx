'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useRef, useState, useEffect } from 'react';
import { track } from '@/components/common/analytics';

export default function PawsHero() {
  const videoKey = useMemo(() => '/videos/paws-hero-video', []);
  const vidRef = useRef<HTMLVideoElement | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const v = vidRef.current;
    if (!v) return;
    const onErr = () => {
      // @ts-ignore
      const err = v.error;
      const code = err?.code;
      const msg =
        code === 1 ? 'ABORTED' :
        code === 2 ? 'NETWORK' :
        code === 3 ? 'DECODE' :
        code === 4 ? 'SRC_NOT_SUPPORTED' :
        'UNKNOWN';
      setVideoError(`Video error: ${msg}`);
      // eslint-disable-next-line no-console
      console.error('PAWS hero video error', { code, err, sources: v.querySelectorAll('source') });
    };
    v.addEventListener('error', onErr);
    return () => v.removeEventListener('error', onErr);
  }, []);

  return (
    <section className="relative min-h-[90svh] md:h-[100svh] w-full overflow-hidden">
      {/* Capa de video */}
      <div className="absolute inset-0 z-0">
        {!videoError ? (
          <video
            ref={vidRef}
            key={videoKey}
            muted
            playsInline
            autoPlay
            loop
            preload="auto"
            poster="/images/journey-types/paws-card.jpg"
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden
            onLoadedData={() => setLoaded(true)}
            onError={() => setVideoError('Video error: SRC_NOT_SUPPORTED')}
          >
            {/* WebM (VP9/VP8) para Chrome/Firefox */}
            <source src="/videos/paws-hero-video.webm" type="video/webm" />
            {/* MP4 (H.264) para Safari/iOS y fallback general */}
            <source src="/videos/paws-hero-video.mp4" type="video/mp4" />
          </video>
        ) : (
          // Fallback visible SOLO si falla el video
          <Image
            src="/images/journey-types/paws-card.jpg"
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        )}
      </div>

      {/* Overlay para legibilidad (no tapa el video) */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/40 to-black/10 z-[1]" />

      {/* Avisos de estado */}
      {!loaded && !videoError && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[2] rounded bg-black/60 px-3 py-1 text-xs text-white">
          Cargando video…
        </div>
      )}
      {videoError && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[2] rounded bg-red-600/80 px-3 py-1 text-xs text-white">
          {videoError} — Verifica LFS/codec. Abre /videos/paws-hero-video.mp4 en el navegador.
        </div>
      )}

      {/* Contenido */}
      <div className="relative z-[2] mx-auto h-full max-w-7xl px-4">
        <div className="grid h-full items-center gap-8 md:grid-cols-2">
          <div className="max-w-2xl">
            <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-tight tracking-tightish text-white">
              <span>PAWS<sup className="align-super text-[0.65em] ml-0.5">©</sup></span> RANDOMTRIP
            </h1>
            <p className="mt-3 text-base md:text-lg text-white/90">
              Viajar con ellos es parte del plan. Diseñamos escapadas donde tu mejor amig@ de cuatro patas
              también es protagonista.
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

          <aside className="md:pl-8">
            <div className="mx-auto max-w-[46ch] text-center md:text-left">
              <h3 className="font-display text-sm tracking-[0.18em] text-white/70">AVENTURA CON HUELLA</h3>
              <div className="mt-6 space-y-4 text-sm md:text-base leading-relaxed md:leading-8 text-white/90">
                <p>Dicen que la vida es mejor con compañía… y pocas compañías son tan leales como la que te recibe con cola moviéndose o un ronroneo.</p>
                <p>En PAWS© RANDOMTRIP los viajes no dejan a nadie atrás: tu mascota es parte esencial de la aventura.</p>
                <p>Un camino nuevo huele distinto; un bosque despierta curiosidad; la playa es territorio para correr sin relojes.</p>
                <p>Algunas huellas se van con la marea; otras quedan para siempre en la memoria.</p>
                <p>— RANDOMTRIP. Wonder. Wander. Repeat. —</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="scroll-indicator pointer-events-none select-none z-[2]" aria-hidden="true">
        SCROLL
      </div>
    </section>
  );
}