import React from 'react';
import Image from 'next/image';

interface TripCardProps {
  title: string;
  imageUrl: string;
}

const TripCard: React.FC<TripCardProps> = ({ title, imageUrl }) => {
  return (
    <div className="relative overflow-hidden h-96 w-full cursor-pointer group">
      <Image
        src={imageUrl}
        alt={title}
        fill
        style={{ objectFit: 'cover' }}
        className="transition-transform duration-300 ease-in-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-0 left-0 p-8">
        <h3 className="text-white text-4xl font-serif font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
          {title}
        </h3>
      </div>
    </div>
  );
};

export default TripCard;