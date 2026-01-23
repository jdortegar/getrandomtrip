'use client';

import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { cn } from '@/lib/utils';

interface TravelerTypeCardProps {
  className?: string;
  description: string;
  disabled?: boolean;
  href?: string;
  imageUrl: string;
  onClick?: () => void;
  selected?: boolean;
  title: string;
}

const TravelerTypeCard: React.FC<TravelerTypeCardProps> = ({
  className,
  description,
  disabled = false,
  href,
  imageUrl,
  onClick,
  selected = false,
  title,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    if (onClick) {
      e.preventDefault();
      onClick();
    } else if (href === '#') {
      e.preventDefault();
    }
  };

  const cardContent = (
    <>
      <Image
        alt={title}
        className="transition-transform duration-300 group-hover:scale-110"
        fill
        priority
        src={imageUrl}
        style={{ objectFit: 'cover' }}
      />
      <div className="absolute inset-0 z-10 rounded-2xl bg-gradient-to-t from-black/75 to-transparent" />

      {/* Trustpilot Rating */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 backdrop-blur-sm">
        <span className="text-xs font-semibold text-white">4.6</span>
        <svg
          className="h-3 w-3 text-yellow-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </div>

      {/* Card Content */}
      <div className="absolute bottom-0 left-0 z-20 w-full p-5 text-left text-white pb-20">
        <h3 className="font-barlow-condensed text-4xl font-extrabold uppercase leading-tight md:text-5xl">
          {title}
        </h3>
        <p className="font-barlow text-base text-white/90 md:text-lg">
          {description}
        </p>
      </div>
    </>
  );

  const baseClassName = cn(
    'group relative block overflow-hidden rounded-2xl transition-all duration-300 origin-center aspect-[293.95/347.82] w-full',
    className,
    disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
    selected && 'ring-4 ring-yellow-400',
  );

  // If onClick is provided, render as button; otherwise render as Link
  if (onClick || !href) {
    return (
      <button
        className={baseClassName}
        disabled={disabled}
        onClick={handleClick}
        type="button"
      >
        {cardContent}
      </button>
    );
  }

  return (
    <Link className={baseClassName} href={href} onClick={handleClick}>
      {cardContent}
    </Link>
  );
};

export default TravelerTypeCard;
