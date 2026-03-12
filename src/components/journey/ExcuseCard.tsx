'use client';

import Image from 'next/image';
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/Button';

interface ExcuseCardProps {
  className?: string;
  ctaLabel?: string;
  description: string;
  imageUrl: string;
  onClick?: () => void;
  selected?: boolean;
  title: string;
}

export default function ExcuseCard({
  className,
  ctaLabel = 'Elegir y continuar',
  description,
  imageUrl,
  onClick,
  selected = false,
  title,
}: ExcuseCardProps) {
  return (
    <div
      className={cn(
        '@container group relative block overflow-hidden rounded-2xl transition-all duration-300 origin-center aspect-[293.95/347.82] w-full',
        className,
        selected && 'ring-4 ring-yellow-400',
      )}
    >
      <button
        className="h-full w-full text-left"
        onClick={onClick}
        type="button"
      >
        <Image
          alt={title}
          className="transition-transform duration-300 group-hover:scale-110"
          fill
          priority
          src={imageUrl}
          style={{ objectFit: 'cover' }}
        />
        <div className="absolute inset-0 z-10 rounded-2xl bg-gradient-to-t from-black/75 to-transparent" />

        {/* Card Content */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="flex-1 flex flex-col items-center justify-center mb-4">
            <h3 className="font-barlow-condensed text-2xl font-extrabold uppercase leading-tight mb-4">
              {title}
            </h3>
            <p className="font-barlow text-base @[300px]:text-lg text-white/90 max-w-xs">
              {description}
            </p>
          </div>
          {/* <button
            className="px-6 py-3 border-2 border-white rounded-lg font-semibold text-white hover:bg-white/10 transition-colors mt-auto"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            type="button"
          >
            {ctaLabel}
          </button> */}
          <Button variant="outline" onClick={onClick}>
            {ctaLabel}
          </Button>
        </div>
      </button>
    </div>
  );
}
