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
    title: 'Essenza',
    subtitle: 'Lo esencial con estilo.',
    priceLabel: 'Hasta 350 USD',
    bullets: [
      'Duración: Máximo 2 noches.',
      'Transporte: Low cost (buses o vuelos off-peak). *Carry-on y bodega - no incluido.',
      'Fechas: Menor disponibilidad; con restricciones y bloqueos.',
      'Alojamiento: Midscale (3★ o equivalentes)',
      'Extras: Guía esencial para explorar a tu manera.',
    ],
    ctaLabel: '👉 Reservá fácil',
  },
  {
    id: 'modo-explora',
    title: 'Modo Explora',
    subtitle: 'Viaje activo y flexible.',
    priceLabel: 'Hasta 500 USD',
    bullets: [
      'Duración: Hasta 3 noches.',
      'Transporte: Multimodal, Horarios flexibles. *Carry-on y bodega - no incluido.',
      'Fechas: Mayor disponibilidad; algunos feriados/puentes con bloqueos.',
      'Alojamiento: Midscale - Upper Midscale.',
      'Extras: Guía "Randomtrip Decode" - Curada por los mejores Trippers',
    ],
    ctaLabel: '👉 Activá tu modo',
  },
  {
    id: 'explora-plus',
    title: 'Explora+',
    subtitle: 'Más capas, más descubrimientos.',
    priceLabel: 'Hasta 850 USD',
    bullets: [
      'Duración: Hasta 4 noches.',
      'Transporte: Multimodal. * Carry-on Incluido - *Seleccion de bodega - no incluido.',
      'Fechas: Alta disponibilidad, incluso feriados/puentes.',
      'Alojamiento: Upscale.',
      'Extras: Guía "Randomtrip Decode" - Personalizado + 1 experiencia/actividad',
    ],
    ctaLabel: '👉 Subí de nivel',
  },
  {
    id: 'bivouac',
    title: 'Bivouac',
    subtitle: 'Curaduría que se siente artesanal.',
    priceLabel: 'Hasta 1200 USD',
    bullets: [
      'Duración: Hasta 5 noches.',
      'Transporte: Multimodal. * Carry-on y bodega - incluidos.',
      'Fechas: Sin bloqueos.',
      'Alojamiento: Upscale - Upper Upscale.',
      'Extras: Concierge Advisors + 1 Experiencia Premium + Perks.',
    ],
    ctaLabel: '👉 Viajá distinto',
  },
    {
    id: 'atelier-getaway',
    title: 'Atelier Getaway',
    subtitle: 'Distinción, sin esfuerzo.',
    priceLabel: 'Desde 1200 USD',
    bullets: [
      'Duración: Customizable.',
      'Transporte: Multimodal. *Extras Customizables',
      'Fechas: Sin bloqueos.',
      'Alojamiento: Luxury / Boutiques / Cadenas A1.',
      'Extras: Co-creación con Luxury Travel Advisor, Equipo soporte 24/7 + 2 Experiencias Premium, Traslados privados, Salas VIP, etc.',
    ],
    ctaLabel: '👉 A un clic de lo impredecible',
  },,
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
    <section className="py-16 bg-white text-neutral-900">
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

    const cardBase =
  "rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 md:p-6 " +
  "flex flex-col justify-between text-neutral-900";

  return (
    <div className={cardBase}>
      {/* START UNIFIED CARD CONTENT */}
      <>
        <h3 className="font-display text-xl tracking-tightish font-bold">
          {tier.title}
        </h3>

        {tier.subtitle && (
          <p className="text-xs text-neutral-600 leading-snug mt-0.5">{tier.subtitle}</p>
        )}

        {tier.priceLabel && (
          <>
            <p className="font-display text-3xl font-extrabold leading-tight text-[var(--rt-terracotta)] mt-3">
              {tier.priceLabel}
            </p>
            <p className="text-xs text-neutral-500 -mt-0.5">por persona</p>
          </>
        )}

        <ul className="list-disc list-inside text-sm text-neutral-800 leading-relaxed space-y-2 mt-3">
          {tier.bullets.map((b: string, i: number) => (
            <li key={i}>{b}</li>
          ))}
        </ul>

        {tier.priceFootnote && (
          <div className="mt-3 text-xs text-gray-900">{tier.priceFootnote}</div>
        )}

        <div className="mt-4 pt-4 border-t border-neutral-200">
          {typeof onClick === 'function' ? (
            <button
              type="button"
              className="btn-card w-full justify-between"
              onClick={() => onClick(tier.id)}
              aria-label={tier.ctaLabel}
            >
              {tier.ctaLabel} <span aria-hidden>→</span>
            </button>
          ) : (
            <Link
              href={href}
              className="btn-card w-full justify-between"
              aria-label={tier.ctaLabel}
            >
              {tier.ctaLabel} <span aria-hidden>→</span>
            </Link>
          )}
        </div>
      </>
      {/* END UNIFIED CARD CONTENT */}
    </div>
  );
}
