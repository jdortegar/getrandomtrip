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
  href = '', // Provide a default empty string
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
      width={800}
      height={600}
      className="h-48 w-full object-cover rounded-xl"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
    <div className="absolute bottom-0 left-0 p-8 text-white text-left">
      <h3
        className="text-4xl font-bold"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        {title}
      </h3>
      <p className="mt-2 text-lg">{description}</p>
    </div>
  </Link>
);

export default TravelerTypeCard;