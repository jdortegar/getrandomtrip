'use client';

import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';

type TierLite = {
  id: string;
  title: string;
  subtitle?: string;
  priceLabel?: string;
  priceFootnote?: string;
  bullets?: string[];
  closingLine?: string;
  ctaLabel?: string;
  /** Algunos tiers antiguos no tienen `name`; lo hacemos opcional */
  name?: string;
  /** Por si en algún lugar se usa imagen */
  imageUrl?: string;
};

type Props = {
  tier: TierLite;
  href: string;
  onSelect?: () => void;
  className?: string;
};

export default function ExperienceCard({ tier, href, onSelect, className }: Props) {
  const {
    title,
    subtitle,
    priceLabel,
    priceFootnote,
    bullets = [],
    closingLine,
    ctaLabel = 'Elegir',
  } = tier;

  return (
    <GlassCard className={className}>
      <div className="p-4 md:p-5 flex flex-col h-full">
        {/* Header */}
        <div className="mb-3">
          <h3 className="text-base md:text-lg font-semibold text-neutral-900">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-neutral-600 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Precio */}
        {(priceLabel || priceFootnote) && (
          <div className="mb-3">
            {priceLabel && (
              <div className="text-sm font-medium text-neutral-900">{priceLabel}</div>
            )}
            {priceFootnote && (
              <div className="text-xs text-neutral-600">{priceFootnote}</div>
            )}
          </div>
        )}

        {/* Bullets */}
        {bullets.length > 0 && (
          <ul className="mb-4 list-disc list-inside text-sm text-neutral-800 space-y-1">
            {bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )}

        {/* Closing line */}
        {closingLine && (
          <p className="text-sm text-neutral-700 mb-4">{closingLine}</p>
        )}

        {/* CTA */}
        <div className="mt-auto">
          <Link
            href={href}
            onClick={onSelect}
            className="inline-flex items-center justify-center w-full rounded-xl bg-violet-600 text-white py-2.5 font-medium hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </GlassCard>
  );
}
