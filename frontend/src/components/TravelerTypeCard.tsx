'use client';

import Link from 'next/link';
import Image from 'next/image';
import React from 'react';

interface TravelerTypeCardProps {
  title: string;
  description: string;
  imageUrl: string;
  href?: string;
}

const TravelerTypeCard: React.FC<TravelerTypeCardProps> = ({
  title,
  description,
  imageUrl,
  href = '',
}) => (
  <Link
    href={href}
    className="
      block
      group
      rounded-2xl
      overflow-hidden
      shadow-lg
      hover:scale-[1.02]
      transform
      transition-transform
      duration-300
      relative
      h-[60vh]
      w-full
    "
  >
    <Image
      src={imageUrl}
      alt={title}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
    <div className="absolute bottom-0 left-0 p-6 text-white text-left">
      <h3
        className="text-3xl font-bold drop-shadow-md"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        {title}
      </h3>
      <p className="mt-1 text-base text-white/90 drop-shadow-sm">{description}</p>
    </div>
  </Link>
);

export default TravelerTypeCard;