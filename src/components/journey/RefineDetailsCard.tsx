'use client';

import Image from 'next/image';
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RefineDetailsCardProps {
  className?: string;
  description: string;
  imageUrl: string;
  onClick?: () => void;
  selected?: boolean;
  title: string;
}

export default function RefineDetailsCard({
  className,
  description,
  imageUrl,
  onClick,
  selected = false,
  title,
}: RefineDetailsCardProps) {
  return (
    <button
      className={cn(
        'group relative block overflow-hidden rounded-2xl transition-all duration-300 origin-center aspect-[293.95/347.82] w-full cursor-pointer text-left',
        className,
        selected && 'ring-4 ring-yellow-400',
      )}
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

      {/* Selection Indicator */}
      {selected && (
        <div className="absolute top-4 right-4 z-30 flex items-center justify-center w-10 h-10 rounded-full bg-white">
          <Check className="w-6 h-6 text-black" />
        </div>
      )}

      {/* Card Content */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="flex-1 flex flex-col items-center justify-center">
          <h3 className="font-barlow-condensed text-3xl md:text-4xl font-extrabold uppercase leading-tight mb-4">
            {title}
          </h3>
          <p className="font-barlow text-base md:text-lg text-white/90 max-w-xs">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}
