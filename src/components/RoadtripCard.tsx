import React from 'react';
import Link from 'next/link';
import Img from '@/components/common/Img'; // Added import

interface RoadtripCardProps {
  title: string;
  description: string;
  bgImage: string;
  icon?: string;
  href: string; // siempre requerido
  className?: string;
}

const RoadtripCard: React.FC<RoadtripCardProps> = ({
  title,
  description,
  bgImage,
  icon,
  href,
  className,
}) => {
  return (
    <Link href={href} className="block">
      <div
        className={`relative h-96 rounded-lg overflow-hidden shadow-lg group hover:scale-[1.03] transition-all duration-300 ${className || ''}`}
      >
        <Img
          src={bgImage}
          alt={title}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
          width={1200}
          height={960}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-t from-black/80 to-transparent text-center">
          <h3 className="font-caveat text-4xl font-bold text-white">{title}</h3>
          <p className="font-jost text-lg text-gray-200 mt-2">{description}</p>
        </div>
      </div>
    </Link>
  );
};

export default RoadtripCard;
