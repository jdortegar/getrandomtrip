'use client';

import React, { useState } from 'react';
import PrimaryButton from '../../components/PrimaryButton';


interface ExperienceLevel {
  id: string;
  name: string;
  description: string;
}

const experienceLevels: ExperienceLevel[] = [
  {
    id: 'essenza',
    name: 'Essenza',
    description: 'The purest form of discovery. Essential and authentic.',
  },
  {
    id: 'explora',
    name: 'Explora',
    description: 'A balanced journey with comfort and adventure.',
  },
  {
    id: 'explora_plus',
    name: 'Explora+',
    description: 'Enhanced exploration with premium touches.',
  },
  {
    id: 'bivouac',
    name: 'Bivouac',
    description: 'Immersive outdoor experiences with unique accommodations.',
  },
  {
    id: 'atelier',
    name: 'Atelier',
    description: 'Tailored, bespoke travel crafted just for you.',
  },
];

export default function ExperienceClient() {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const handleSelectLevel = (levelId: string) => {
    setSelectedLevel(levelId);
  };

  const handleContinue = () => {
    console.log('Continue to Basic Configuration with level:', selectedLevel);
    // TODO: Navigate to the next step
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-[#0A2240]">Select Your Experience Level</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {experienceLevels.map((level) => (
          <div
            key={level.id}
            className={`p-6 rounded-lg shadow-md cursor-pointer transition-all duration-300
              ${selectedLevel === level.id ? 'border-4 border-[#D97E4A] bg-white' : 'bg-white hover:shadow-lg'}`}
            onClick={() => handleSelectLevel(level.id)}
          >
            <h2 className="text-2xl font-semibold mb-2 text-[#0A2240]">{level.name}</h2>
            <p className="text-gray-700 text-sm">{level.description}</p>
            {/* Potentially add a visual indicator for selection */}
            {selectedLevel === level.id && (
              <div className="mt-4 text-[#D97E4A] font-bold">Selected</div>
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-gray-600 mb-8">
        Note: Solo Traveller may incur a +50% price markup.
      </p>

      <div className="text-center">
        <PrimaryButton onClick={handleContinue}>
          Continue to Basic Configuration
        </PrimaryButton>
      </div>
    </div>
  );
}
