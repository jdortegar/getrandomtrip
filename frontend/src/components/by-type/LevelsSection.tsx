'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import TripperTiers from '@/components/tripper/TripperTiers';

type Props = { type: string; palette?: any };

// Construye el shape que usa la página /packages/horacio-teran
function buildTripperPropsFromType(type: string) {
  // Si en /horacio-teran se pasa: tripper={{ slug, tiersSource: 'base' }}, replicamos eso:
  return { slug: type, tiersSource: 'base' };
}

export default function LevelsSection({ type, palette }: Props) {
  const router = useRouter();
  const tripper = buildTripperPropsFromType(type);

  return (
    <section
      className="
        isolate relative py-16
        bg-white text-slate-900
        dark:bg-white dark:text-slate-900
        [&_*]:text-slate-900
        [&_h1]:text-slate-900 [&_h2]:text-slate-900 [&_h3]:text-slate-900
        [&_p]:text-slate-700 [&_li]:text-slate-700
        [&_.card]:bg-white [&_.card]:border [&_.card]:border-slate-200 [&_.card]:shadow-sm
        [&_.card:hover]:shadow-md
      "
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Selecciona tu Nivel de Experiencia
          </h2>
          <p className="mt-3 text-sm md:text-base text-slate-600">
            💡 Todos los presupuestos son <strong>por persona en base doble</strong>, y representan
            el máximo que invertirás en tu viaje sorpresa. Vos elegís el nivel, nosotros hacemos el resto.
            <br />
            Precios ajustados por cantidad de pasajero.
          </p>
        </header>

        <TripperTiers
          className="levels-grid"
          tripper={tripper}
          palette={palette}
          ctaLabel="Reservar"
          onTierClick={(tierId) =>
            router.push(`/randomtripme?type=${type}&tier=${tierId}`)
          }
        />
      </div>
    </section>
  );
}