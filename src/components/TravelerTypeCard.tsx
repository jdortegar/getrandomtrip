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
        src={imageUrl}
        alt={title}
        fill
        style={{ objectFit: 'cover' }}
        className="group-hover:scale-110 transition-transform duration-300"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10 rounded-md" />
      <div className="absolute bottom-0 left-0 p-6 text-white w-full z-20 text-left">
        <h3 className="text-2xl font-bold text-left font-caveat">{title}</h3>
        <p className=" text-sm text-gray-200 text-left font-jost">
          {description}
        </p>
      </div>
    </>
  );

  if (disabled) {
    return (
      <div className="relative h-[40vh] w-60 flex-shrink-0 cursor-not-allowed group rounded-md block transition-all duration-300 origin-center overflow-hidden opacity-50">
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="relative h-[40vh] w-60 flex-shrink-0 cursor-pointer group rounded-md block transition-all duration-300 origin-center overflow-hidden"
    >
      {cardContent}
    </Link>
  );
};

export default TravelerTypeCard;
