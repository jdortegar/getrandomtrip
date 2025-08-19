'use client';

import React from 'react';
import { BASE_TIERS } from '@/content/tiers';
import Link from 'next/link';
import clsx from 'clsx';

type TripperTiersProps = {
  tripper: { slug?: string; tiers?: any[]; tiersSource?: 'base' | 'custom' } | any;
  palette?: any;
  className?: string;
  ctaLabel?: string;
  onTierClick?: (tierId: string) => void; // <- importante: string
  variant?: 'light' | 'dark';
  showHeader?: boolean;                    // <- NUEVO
};

// Catálogo SOLO (se usa si no vienen tiers custom y slug === 'solo')
const SOLO_TIERS = [
  {
    id: 'essenza',
    title: 'Essenza – Lo esencial con estilo.',
    priceLabel: 'Hasta 350 USD',
    features: [
      'Duración: Máximo 2 noches.',
      'Transporte: Low cost (buses o vuelos off-peak). Asiento garantizado, carry-on opcional.',
      'Fechas: Menor disponibilidad; con restricciones.',
      'Alojamiento: Midscale (3★ o equivalentes).',
      'Extras: Una guía esencial pensada para que explores a tu manera, sin apuro.',
    ],
    ctaLabel: '👉 Reservá fácil →',
  },
  {
    id: 'modo-explora',
    title: 'Modo Explora – Viaje activo y flexible.',
    priceLabel: 'Hasta 500 USD',
    features: [
      'Duración: Hasta 3 noches.',
      'Transporte: Multimodal. En vuelos: asiento garantizado, carry-on opcional.',
      'Fechas: Mayor disponibilidad, con algunos bloqueos en feriados.',
      'Alojamiento: Mid-to-Upscale.',
      'Extras: “Randomtrip Decode” con pistas para abrirte camino a tu aire.',
    ],
    ctaLabel: '👉 Activá tu modo →',
  },
  {
    id: 'explora-plus',
    title: 'Explora+ – Más capas, más descubrimientos.',
    priceLabel: 'Hasta 850 USD',
    features: [
      'Duración: Hasta 4 noches.',
      'Transporte: Multimodal. En vuelos: asiento garantizado, carry-on opcional.',
      'Fechas: Alta disponibilidad, incluso en feriados (con bloqueos festivos).',
      'Alojamiento: Upscale asegurado.',
      'Extras: Decode personalizado + 1 experiencia curada solo para vos.',
    ],
    ctaLabel: '👉 Subí de nivel →',
  },
  {
    id: 'bivouac',
    title: 'Bivouac – Curaduría que se siente artesanal.',
    priceLabel: 'Hasta 1200 USD',
    features: [
      'Duración: Hasta 5 noches.',
      'Transporte: Multimodal. En vuelos: asiento y carry-on incluidos.',
      'Fechas: Sin bloqueos.',
      'Alojamiento: Upper-Upscale (boutique, diseño, experiencias locales).',
      'Extras: Concierge Advisor + 1 experiencia premium + perks (early/late & upgrade sujetos a dispo).',
    ],
    ctaLabel: '👉 Viajá distinto →',
  },
  {
    id: 'atelier-getaway',
    title: 'Atelier Getaway – Distinción, sin esfuerzo.',
    priceLabel: 'Desde 1200 USD',
    features: [
      'Duración: A medida.',
      'Alojamiento: Luxury / de autor / cadenas A1.',
      'Extras: Co-creación con un Luxury Travel Advisor + equipo 24/7.',
      'Incluye: 2+ experiencias premium a medida.',
      'Perks: traslados privados, salas VIP, reservas prioritarias, regalos de marcas asociadas, porque los detalles también cuentan cuando viajás solo.',
    ],
    ctaLabel: '👉 A un clic de lo impredecible →',
  },
];

export default function TripperTiers({
  tripper,
  palette,
  className = '',
  ctaLabel = 'Reservar',
  onTierClick,
  variant = 'light',
  showHeader = true,
}: TripperTiersProps) {
  const tiers =
    tripper?.tiers?.length ? tripper.tiers : tripper?.slug === 'solo' ? SOLO_TIERS : BASE_TIERS;

  const isDark = variant === 'dark';

  return (
    <section
      className={clsx(
        'py-16',
        className,
        isDark ? 'bg-neutral-950 text-white' : 'bg-white text-slate-900'
      )}
    >
      <div className="container mx-auto px-6">
        {/* Encabezado interno (opcional) */}
        {showHeader !== false && (
          <header className="mb-10 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Selecciona tu Nivel de Experiencia
            </h2>
            <p className={clsx('mt-3 text-sm md:text-base', isDark ? 'text-white/70' : 'text-slate-600')}>
              <span className="inline-flex items-center gap-2">
                <span>💡</span>
                <span>
                  Todos los presupuestos son <strong>por persona en base doble</strong>.
                </span>
              </span>
              <br />
              Precios ajustados por cantidad de pasajero.
            </p>
          </header>
        )}

        {/* Grid de tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mt-10">
          {tiers.map((tier: any) => (
            <TierCard
              key={tier.id}
              tier={tier}
              tripper={tripper}
              palette={palette}
              ctaLabel={tier.ctaLabel || ctaLabel}
              onClick={onTierClick}
              variant={variant}
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
  onClick?: (tierId: string) => void; // <- recibe el ID
  variant?: 'light' | 'dark';
};

function TierCard({
  tier,
  tripper,
  palette,
  ctaLabel,
  onClick,
  variant = 'light',
}: TierCardProps) {
  const ctaText = ctaLabel ?? 'Reservar';
  const href = `/randomtripme?type=${encodeURIComponent(tripper?.slug ?? '')}&tier=${encodeURIComponent(
    tier.id
  )}`;

  const cardBase = clsx(
    'rounded-2xl border shadow-sm p-6 flex flex-col',
    variant === 'dark'
      ? 'bg-white/8 ring-1 ring-white/10 transition hover:bg-white/12 hover:shadow-soft'
      : 'bg-white border-slate-200',
    variant === 'dark' ? 'text-white' : 'text-slate-900'
  );

  return (
    <div className={cardBase}>
      <h3 className="text-lg font-semibold">{tier.title}</h3>
      {/* subtitle es opcional en algunos catálogos */}
      {tier.subtitle && (
        <p className={clsx('mt-1', variant === 'dark' ? 'text-white/80' : 'text-slate-600')}>
          {tier.subtitle}
        </p>
      )}

      <div className="mt-5">
        <p className="text-2xl font-bold leading-tight">{tier.priceLabel}</p>
        {tier.priceFootnote && (
          <p className={clsx('text-xs mt-1', variant === 'dark' ? 'text-white/60' : 'text-slate-500')}>
            {tier.priceFootnote}
          </p>
        )}
      </div>

      <ul
        className={clsx(
          'mt-5 space-y-2 text-sm list-disc pl-5 flex-1',
          variant === 'dark' ? 'text-white/90' : 'text-slate-700'
        )}
      >
        {(tier.features ?? []).map((f: string, i: number) => (
          <li key={i}>{f}</li>
        ))}
      </ul>

      <div className="mt-6">
        {typeof onClick === 'function' ? (
          <button
            type="button"
            className={clsx(
              'tier-cta w-full rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2',
              variant === 'dark' ? 'btn-card' : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400'
            )}
            onClick={() => onClick(tier.id)} // <- pasa EL ID
          >
            {ctaText}
          </button>
        ) : (
          <Link
            href={href}
            className={clsx(
              'tier-cta block w-full rounded-xl px-4 py-3 text-center font-semibold focus:outline-none focus:ring-2',
              variant === 'dark' ? 'btn-card' : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400'
            )}
          >
            {ctaText}
          </Link>
        )}
      </div>
    </div>
  );
}
