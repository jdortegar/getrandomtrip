'use client';

import Link, { LinkProps } from 'next/link';
import clsx from 'clsx';
import { ComponentProps, ElementType } from 'react';

export type TierData = {
  id: string;
  name: string;
  subtitle?: string;
  priceLabel: string;
  priceFootnote?: string;
  bullets: string[];
  closingLine?: string;
  ctaLabel: string;
  title?: string;
};

type ExperienceCardProps = {
  tier: TierData;
  onSelect?: (id: string) => void;
  href?: string;
  className?: string;
  isSelected?: boolean;
  variant?: 'default' | 'featured';
};

export default function ExperienceCard({
  tier,
  onSelect,
  href,
  className,
  isSelected = false,
  variant = 'default',
}: ExperienceCardProps) {
  const CtaComponent: ElementType = href ? Link : 'button';
  const isFeatured = variant === 'featured';

  const handleSelect = () => {
    if (onSelect) {
      onSelect(tier.id);
    }
  };

  const ctaProps = (href
    ? { href, onClick: handleSelect }
    : { type: 'button', onClick: handleSelect, 'aria-pressed': isSelected, 'aria-label': `Elegir ${tier.name}` }) as LinkProps & ComponentProps<'button'>;

  return (
    <div
      className={clsx(
        'flex h-full flex-col rounded-2xl border border-neutral-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5',
        isFeatured ? 'p-6 shadow-lg hover:shadow-xl' : 'p-5 hover:shadow-md',
        className,
        isSelected && 'ring-2 ring-neutral-900'
      )}
    >
      <h3 className={clsx('font-display font-bold tracking-tightish text-neutral-900', isFeatured ? 'text-xl' : 'text-lg')}>{tier.name}</h3>
      {tier.subtitle && <p className="mt-1 text-sm text-neutral-700">{tier.subtitle}</p>}

      <p className={clsx('font-display font-bold text-[var(--rt-terracotta)]', isFeatured ? 'mt-4 text-3xl' : 'mt-3 text-2xl')}>{tier.priceLabel}</p>

      {tier.priceFootnote && <p className={clsx('text-neutral-700', isFeatured ? 'mt-1 text-sm' : 'mt-1 text-xs')}>{tier.priceFootnote}</p>}

      <ul className={clsx('flex-grow leading-normal text-neutral-700', isFeatured ? 'mt-5 space-y-2' : 'mt-4 space-y-1.5')}>
        {tier.bullets.map((b, i) => (
          <li key={i} className={clsx('flex', isFeatured ? 'gap-3' : 'gap-2')}>
            {isFeatured ? <span aria-hidden className="text-[var(--rt-terracotta)] font-bold">✓</span> : <span aria-hidden className="text-[var(--rt-terracotta)]">•</span>}
            <span>{b}</span>
          </li>
        ))}
        {tier.closingLine && <li className={clsx('italic text-neutral-800', isFeatured ? 'pt-3 text-sm' : 'pt-2 text-xs')}>{tier.closingLine}</li>}
      </ul>

      <div className={clsx('pt-4', isFeatured ? 'mt-6' : 'mt-auto')}>
        <CtaComponent {...ctaProps} className={clsx('btn-card w-full text-center', isFeatured && 'text-lg py-3')}>
          {tier.ctaLabel}
        </CtaComponent>
      </div>
    </div>
  );
}