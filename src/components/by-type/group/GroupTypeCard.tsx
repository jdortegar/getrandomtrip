'use client';

import React, { useState } from 'react';

interface GroupTypeCardProps {
  data: {
    group: string;
    tagline: string;
    icon: string;
  };
  onSelect: () => void;
  isSelected: boolean;
}

export default function GroupTypeCard({ data, onSelect, isSelected }: GroupTypeCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <div
      className={`relative w-full h-64 rounded-lg shadow-md cursor-pointer transition-transform duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
    >
      {/* Front of the card */}
      <div className="absolute inset-0 backface-hidden bg-white rounded-lg flex flex-col items-center justify-center p-4 border border-neutral-200">
        <div className="text-5xl mb-4">{data.icon}</div>
        <h3 className="font-semibold text-lg text-neutral-900 text-center">{data.group}</h3>
      </div>

      {/* Back of the card */}
      <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-lg flex flex-col items-center justify-center p-4 border border-neutral-200">
        <h3 className="font-semibold text-lg text-neutral-900 text-center">{data.group}</h3>
        <p className="text-sm text-neutral-700 text-center mt-2">{data.tagline}</p>
        <button
          className="mt-4 inline-block rounded-full px-3 py-2 text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          onClick={(e) => {
            e.stopPropagation(); // Prevent card from flipping back
            onSelect();
          }}
        >
          Ir al siguiente paso →
        </button>
      </div>
    </div>
  );
}