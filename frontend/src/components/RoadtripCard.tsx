import React from 'react';

interface RoadtripCardProps {
  title: string;
  description: string;
  bgImage: string;
  onClick: () => void;
  icon?: string; // opcional para no romper otros usos
}

const RoadtripCard: React.FC<RoadtripCardProps> = ({
  title,
  description,
  bgImage,
  onClick,
  icon,
}) => (
  <div
    onClick={onClick}
    className="relative h-96 rounded-lg overflow-hidden shadow-lg group cursor-pointer"
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
    aria-label={`Abrir ${title}`}
  >
    <img
      src={bgImage}
      alt={title}
      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
      loading="lazy"
      decoding="async"
    />
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-t from-black/80 to-transparent text-center">
      {icon ? <div className="text-5xl mb-2">{icon}</div> : null}
      <h3
        className="text-4xl font-bold text-white"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        {title}
      </h3>
      <p className="text-lg text-gray-200 mt-2">{description}</p>
    </div>
  </div>
);

export default RoadtripCard;
