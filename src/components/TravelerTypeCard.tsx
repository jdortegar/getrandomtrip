'use client';

import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { cn } from '@/lib/utils';

interface TravelerTypeCardProps {
  title: string;
  description: string;
  imageUrl: string;
  href?: string;
  disabled?: boolean;
  className?: string;
}

const TravelerTypeCard: React.FC<TravelerTypeCardProps> = ({
  title,
  description,
  imageUrl,
  href = '', // Provide a default empty string
  disabled = false,
  className,
}) => {
  const baseClasses =
    'group relative block overflow-hidden rounded-2xl transition-all duration-300 origin-center aspect-[3/4] w-72 md:w-96';
  const composedClasses = cn(baseClasses, className);

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
      <div className="absolute bottom-0 left-0 z-20 w-full p-5 text-left text-white md:p-8">
        <h3 className="font-caveat text-3xl font-bold md:text-4xl">{title}</h3>
        <p className="font-jost mt-2 text-sm text-gray-200 md:text-base">
          {description}
        </p>
      </div>
    </>
  );

  if (disabled) {
    return (
      <div className={cn(composedClasses, 'cursor-not-allowed opacity-50')}>
        {cardContent}
      </div>
    );
  }

  return (
    <Link className={composedClasses} href={href}>
      {cardContent}
    </Link>
  );
};

export default TravelerTypeCard;
