'use client';

import React from 'react';
import { Clock, Globe, Plane, Truck, ChevronDown, Check } from 'lucide-react';
import type { Level } from '@/types/planner';
import { cn } from '@/lib/utils';

interface LevelCardProps {
  featured?: boolean;
  level: Level;
  onSelect?: (levelId: string) => void;
  variant?: 'light' | 'dark';
}

const FEATURE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Duración: Clock,
  Destinos: Globe,
  Transporte: Truck,
};

export default function LevelCard({
  featured = false,
  level,
  onSelect,
  variant = 'light',
}: LevelCardProps) {
  const isDark = variant === 'dark';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const bgColor = isDark ? 'bg-gray-900' : 'bg-white';
  const borderColor = featured
    ? 'border-yellow-400'
    : isDark
      ? 'border-gray-700'
      : 'border-transparent';
  const dividerColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const priceDividerColor = 'bg-yellow-400';
  const secondaryTextColor = isDark ? 'text-white' : 'text-gray-600';

  // Get first 3 features (Duration, Destinations, Transport)
  const displayFeatures = level.features.slice(0, 3);

  const handleClick = () => {
    if (onSelect) {
      onSelect(level.id);
    }
  };

  // Format price: combine priceLabel and priceFootnote
  const priceText = `${level.priceLabel} ${level.priceFootnote}`;

  return (
    <div
      className={cn(
        'relative flex flex-col justify-center rounded-xl border-2 px-6 py-12 transition-all duration-300 w-full h-full min-h-[400px] max-w-[380px]',
        bgColor,
        borderColor,
        featured && 'shadow-lg',
        onSelect && 'cursor-pointer hover:shadow-xl',
      )}
      onClick={handleClick}
      style={{ boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.2)' }}
    >
      {/* Featured Badge - Top Left */}
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="rounded-md bg-yellow-400 px-3 py-1">
            <span className="text-xs font-semibold uppercase text-gray-900">
              Más elegido
            </span>
          </div>
        </div>
      )}

      {/* Featured Checkmark - Top Right */}
      {featured && (
        <div className="absolute -top-3 -right-[14px] z-10">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400">
            <Check className="h-5 w-5 text-gray-900" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Eyebrow Text */}
      <p
        className={cn(
          'mb-3 text-xs font-bold uppercase tracking-[6px] font-barlow',
          secondaryTextColor,
        )}
      >
        {level.subtitle}
      </p>

      {/* Title and Price Row */}
      <div className="mb-4 flex items-end gap-4">
        <h3
          className={cn(
            'flex-1 text-5xl font-barlow-condensed font-extrabold uppercase leading-none text-left',
            textColor,
          )}
        >
          {level.name}
        </h3>
        <div className={cn('h-12 w-px flex-shrink-0', priceDividerColor)} />
        <div className="flex flex-col whitespace-nowrap justify-start items-start font-barlow font-semibold text-lg">
          <span className={cn('leading-none', textColor)}>
            {level.priceLabel}
          </span>
          <span className={cn('leading-none', textColor)}>
            {level.priceFootnote}
          </span>
        </div>
      </div>

      {/* Description */}
      <p
        className={cn(
          'mb-6 text-sm text-left',
          isDark ? 'text-white' : 'text-gray-700',
        )}
      >
        {level.closingLine}
      </p>

      {/* Features */}
      <div className="flex flex-1 flex-col">
        {displayFeatures.map((feature, index) => {
          const IconComponent = FEATURE_ICONS[feature.title] || Globe;
          const isLast = index === displayFeatures.length - 1;

          return (
            <div key={feature.title}>
              <div className="flex items-center gap-4 py-4">
                {/* Icon on the left */}
                <IconComponent
                  className={cn('h-6 w-6 flex-shrink-0', secondaryTextColor)}
                />
                {/* Text content on the right */}
                <div className="flex flex-1 flex-col justify-start items-start">
                  <span
                    className={cn(
                      'mb-1 text-xs uppercase tracking-wider leading-none',
                      secondaryTextColor,
                    )}
                  >
                    {feature.title}
                  </span>
                  <p
                    className={cn(
                      'text-base font-medium leading-tight text-left',
                      textColor,
                    )}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
              {!isLast && <div className={cn('border-t', dividerColor)} />}
            </div>
          );
        })}
      </div>

      {/* Chevron Icon - Bottom Center */}
      <div className="mt-6 flex justify-center">
        <ChevronDown className={cn('h-5 w-5', secondaryTextColor)} />
      </div>
    </div>
  );
}
