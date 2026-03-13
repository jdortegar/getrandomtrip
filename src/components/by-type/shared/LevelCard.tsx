'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Globe,
  Plane,
  Truck,
  ChevronDown,
  Check,
  Bed,
  Gift,
  Calendar,
  Sparkles,
} from 'lucide-react';
import type { Level } from '@/types/planner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import Link from 'next/link';

interface LevelCardProps {
  featured?: boolean;
  level: Level;
  onSelect?: (levelId: string) => void;
  selected?: boolean;
  travelerType?: string;
  variant?: 'light' | 'dark';
}

const FEATURE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Duración: Clock,
  Destinos: Globe,
  Transporte: Truck,
  Alojamiento: Bed,
  Beneficios: Gift,
  Extras: Sparkles,
  Fechas: Calendar,
};

export default function LevelCard({
  featured = false,
  level,
  onSelect,
  selected = false,
  travelerType,
  variant = 'light',
}: LevelCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDark = variant === 'dark';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const bgColor = isDark ? 'bg-gray-900' : 'bg-white';
  const borderColor = selected
    ? 'border-[#172C36]'
    : isDark
      ? 'border-gray-700'
      : 'border-transparent';
  const dividerColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const priceDividerColor = 'bg-yellow-400';
  const secondaryTextColor = isDark ? 'text-white' : 'text-gray-600';

  // Show first 3 features when collapsed, all when expanded
  const displayFeatures = isExpanded
    ? level.features
    : level.features.slice(0, 3);
  const hasMoreFeatures = level.features.length > 3;

  const handleClick = () => {
    if (onSelect) {
      onSelect(level.id);
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking expand button
    setIsExpanded(!isExpanded);
  };
  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col justify-center rounded-xl border-2 px-4 py-8 transition-all duration-300 min-h-[540px] @[250px]:min-h-[690px] @[250px]:px-6 @[250px]:py-12',
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
        <Label
          text="Más elegido"
          className="absolute left-1/2 z-10 -translate-x-1/2 -top-2 @[250px]:-top-3"
        />
      )}

      {/* Selected Checkmark - Top Right */}
      {selected && (
        <div className="absolute -right-[9.8px] -top-2 z-10 @[250px]:-right-[14px] @[250px]:-top-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#172C36]">
            <Check className="h-5 w-5 text-white" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Eyebrow Text */}
      <p
        className={cn(
          'mb-2 font-barlow font-bold uppercase tracking-[4.2px] text-xs @[250px]:mb-3 @[250px]:tracking-[6px] text-center',
          secondaryTextColor,
        )}
      >
        {level.subtitle}
      </p>

      {/* Title and Price Row */}
      <div className="mb-3 flex @[280px]:items-end gap-3 @[280px]:mb-4 @[280px]:gap-4 flex-col @[280px]:flex-row">
        <h3
          className={cn(
            'flex-1 font-barlow-condensed font-extrabold uppercase text-left text-[2.1rem] @[250px]:text-5xl',
            'leading-none',
            textColor,
          )}
        >
          {level.name}
        </h3>
        <div
          className={cn(
            'h-px w-12 flex-shrink-0 @[280px]:h-8 @[280px]:w-px',
            priceDividerColor,
          )}
        />
        <div className="flex flex-col justify-start items-start font-barlow font-semibold text-left text-[0.7875rem] @[250px]:text-lg">
          <span className={cn('leading-none whitespace-nowrap', textColor)}>
            {level.priceLabel}
          </span>
          <span className={cn('leading-none whitespace-nowrap', textColor)}>
            {` ${level.price} USD`}
          </span>
          <span
            className={cn(
              'leading-none whitespace-nowrap text-[0.525rem] @[250px]:text-xs',
              textColor,
            )}
          >
            {level.priceFootnote}
          </span>
        </div>
      </div>

      {/* Description */}
      <p
        className={cn(
          'mb-4 text-left text-[0.6125rem] @[250px]:mb-6 @[250px]:text-sm',
          isDark ? 'text-white' : 'text-gray-700',
        )}
      >
        {level.closingLine}
      </p>

      {/* Features */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AnimatePresence initial={false}>
          {displayFeatures.map((feature, index) => {
            const IconComponent = FEATURE_ICONS[feature.title] || Globe;
            const isLast = index === displayFeatures.length - 1;
            const isNewFeature = index >= 3 && isExpanded;

            return (
              <motion.div
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                initial={isNewFeature ? { opacity: 0, height: 0 } : false}
                key={feature.title}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-3 py-3 @[250px]:gap-4 @[250px]:py-4">
                  {/* Icon on the left */}
                  <IconComponent
                    className={cn(
                      'h-4 w-4 flex-shrink-0 @[250px]:h-6 @[250px]:w-6',
                      secondaryTextColor,
                    )}
                  />
                  {/* Text content on the right */}
                  <div className="flex flex-1 flex-col justify-start items-start">
                    <span
                      className={cn(
                        'mb-0.5 uppercase tracking-wider leading-none text-[0.525rem] @[250px]:mb-1 @[250px]:text-xs',
                        secondaryTextColor,
                      )}
                    >
                      {feature.title}
                    </span>
                    <p
                      className={cn(
                        'font-medium leading-tight text-left text-[0.7rem] @[250px]:text-base',
                        textColor,
                      )}
                    >
                      {feature.description}
                    </p>
                  </div>
                </div>
                {!isLast && <div className={cn('border-t', dividerColor)} />}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Expand/Collapse Button - Bottom Center */}
      {hasMoreFeatures && (
        <div className="mt-4 flex justify-center @[250px]:mt-6">
          <button
            aria-label={isExpanded ? 'Collapse features' : 'Expand features'}
            className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 rounded-full p-2 transition-transform"
            onClick={handleExpandClick}
            type="button"
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 @[250px]:h-5 @[250px]:w-5',
                  secondaryTextColor,
                )}
              />
            </motion.div>
          </button>
        </div>
      )}
      <div className="mt-4 flex justify-center px-7 @[250px]:mt-6 @[250px]:px-10">
        <Button asChild variant="feature" size="sm">
          <Link
            href={
              travelerType
                ? `/journey?travelType=${travelerType}&experience=${level.id}`
                : `/packages/by-type/${level.id}`
            }
            className="uppercase"
          >
            {level.ctaLabel}
          </Link>
        </Button>
      </div>
    </div>
  );
}
