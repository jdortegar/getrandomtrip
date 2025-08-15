'use client';

import { BASE_TIERS } from '@/content/tiers';
import Link from 'next/link';

type TripperTiersProps = {
  tripper: any; // { slug?: string; tiers?: Tier[]; tiersSource?: 'base' | 'custom' }
  palette?: any;
  className?: string;
  ctaLabel?: string;
  onTierClick?: (tier: any) => void;
};

export default function TripperTiers({
  tripper,
  palette,
  className = '',
  ctaLabel = 'Reservar',
  onTierClick,
}: TripperTiersProps) {
  const tiers = tripper?.tiers?.length ? tripper.tiers : BASE_TIERS;

  return (
    <section
      className={`bg-white text-slate-900 py-16 ${className}`}
    >
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center">Selecciona tu Nivel de Experiencia</h2>
        <p className="text-center text-slate-600 mt-3 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2">
            <span>💡</span>
            <span>Todos los presupuestos son <strong>por persona en base doble</strong>.</span>
          </span>
          <br/>
          Precios ajustados por cantidad de pasajero.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mt-10">
          {tiers.map((tier: any) => (
            <TierCard
              key={tier.id}
              tier={tier}
              tripper={tripper}
              palette={palette}
              ctaLabel={ctaLabel}
              onClick={onTierClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

type TierCardProps = {
  tier: any;
  tripper: any;
  palette?: any;
  ctaLabel?: string;
  onClick?: (tier: any) => void;
};

function TierCard({ tier, tripper, palette, ctaLabel, onClick }: TierCardProps) {
  const ctaText = ctaLabel ?? 'Reservar';
  const href = `/randomtripme?tripper=${tripper.slug}&tier=${tier.id}`;

  return (
    <div className="rounded-2xl border border-slate-200 shadow-sm bg-white text-slate-900 p-6 flex flex-col">
      <h3 className="text-lg font-semibold">{tier.title}</h3>
      <p className="text-slate-600 mt-1">{tier.subtitle}</p>

      <div className="mt-5">
        <p className="text-2xl font-bold leading-tight">{tier.priceLabel}</p>
        {tier.priceFootnote && (
          <p className="text-xs text-slate-500 mt-1">{tier.priceFootnote}</p>
        )}
      </div>

      <ul className="mt-5 space-y-2 text-sm text-slate-700 list-disc pl-5 flex-1">
        {(tier.features ?? []).map((f: string, i: number) => (
          <li key={i}>{f}</li>
        ))}
      </ul>

      <div className="mt-6">
        {typeof onClick === 'function' ? (
          <button
            type="button"
            className="tier-cta w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={() => onClick(tier)}
          >
            {ctaText}
          </button>
        ) : (
          <Link
            href={href}
            className="tier-cta block w-full rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {ctaText}
          </Link>
        )}
      </div>
    </div>
  );
}
