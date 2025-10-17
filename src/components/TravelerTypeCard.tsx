'use client';

import Link from 'next/link';
import Image from 'next/image';
import React from 'react';

interface TravelerTypeCardProps {
  title: string;
  description: string;
  imageUrl: string;
  href?: string;
  disabled?: boolean;
}

const TravelerTypeCard: React.FC<TravelerTypeCardProps> = ({
  title,
  description,
  imageUrl,
  href = '', // Provide a default empty string
  disabled = false,
}) => {
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
      <div className="absolute inset-0 z-10 rounded-lg bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-0 left-0 z-20 w-full p-8 text-left text-white">
        <h3 className="font-caveat text-3xl font-bold text-left">{title}</h3>
        <p className="font-jost text-base text-gray-200 text-left mt-2">
          {description}
        </p>
      </div>
    </>
  );

  if (disabled) {
    return (
      <div className="group relative block flex-shrink-0 cursor-not-allowed overflow-hidden rounded-lg opacity-50 transition-all duration-300 origin-center h-[65vh] w-96">
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      className="group relative block flex-shrink-0 cursor-pointer overflow-hidden rounded-lg transition-all duration-300 origin-center h-[65vh] w-96"
      href={href}
    >
      {cardContent}
    </Link>
  );
};

export default TravelerTypeCard;
