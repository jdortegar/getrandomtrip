'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import TripperTiers from '@/components/tripper/TripperTiers';

type Props = { type: 'solo' | 'families' | 'couple' | string; palette?: any };

// Construye el shape que usa la página /packages/horacio-teran
function buildTripperPropsFromType(type: string) {
  return { slug: type, tiersSource: 'base' as const };
}

export default function LevelsSection({ type, palette }: Props) {
  const router = useRouter();
  const tripper = buildTripperPropsFromType(type);
  const isSolo = type === 'solo';
  const sectionId = isSolo ? 'planes' : 'levels';
  const bgClass = isSolo ? 'bg-neutral-950 text-white' : 'bg-white text-slate-900';

  return (
    <section id={sectionId} className={`relative scroll-mt-16 ${bgClass}`}>
      <div className="mx-auto max-w-7xl px-4 py-20">
        <header className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            {isSolo ? '✨ Empieza a planear tu Solum Randomtrip' : 'Elige tu nivel Randomtrip'}
          </h2>
          <p className="mt-3 text-sm md:text-base text-white">
            {isSolo
              ? '💡 Lo único que definís acá es hasta cuánto querés invertir en vos. El resto… lo define el camino.'
              : 'Selecciona el nivel que mejor se adapta a esta escapada.'}
          </p>
        </header>

        <TripperTiers
          className="levels-grid"
          tripper={tripper}
          palette={palette}
          ctaLabel="Reservar"
          onTierClick={(tierId: string) =>
            router.push(
              `/randomtripme?type=${encodeURIComponent(type)}&tier=${encodeURIComponent(tierId)}`
            )
          }
          variant={isSolo ? 'dark' : 'light'}
          showHeader={!isSolo}   // oculta el encabezado interno en SOLO
        />
      </div>
    </section>
  );
}
