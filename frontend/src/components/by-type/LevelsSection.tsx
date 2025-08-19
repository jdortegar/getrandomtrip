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
      id={type === 'solo' ? 'planes' : 'levels'}
      className={`relative scroll-mt-16 ${type === 'solo' ? 'bg-neutral-950 text-white' : 'bg-white text-slate-900'}`}
    >
      <div className="mx-auto max-w-7xl px-4 py-20"> {/* Adjusted padding to py-20 */}
        <header className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            {type === 'solo' ? '✨ Empieza a planear tu Randomtrip Solum' : 'Selecciona tu Nivel de Experiencia'}
          </h2>
          <p className="mt-3 text-sm md:text-base text-slate-600">
            {type === 'solo' ? '💡 Lo único que definís acá es hasta cuánto querés invertir en vos. El resto… lo define el camino.' : '💡 Todos los presupuestos son <strong>por persona en base doble</strong>, y representan el máximo que invertirás en tu viaje sorpresa. Vos elegís el nivel, nosotros hacemos el resto.<br />Precios ajustados por cantidad de pasajero.'}
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
          variant={type === 'solo' ? 'dark' : 'light'} // Pass variant prop
        />
      </div>
    </section>
  );
}