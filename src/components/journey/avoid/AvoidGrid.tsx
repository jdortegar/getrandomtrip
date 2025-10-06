'use client';
import { useState, useEffect } from 'react';
import DestinationCard from './DestinationCard';
import { AMERICAN_COUNTRIES } from '@/lib/data/countries';

import { getLandmarkImageForCountry } from '@/lib/api/unsplash';

import AvoidSearchModal from './AvoidSearchModal';
import { Button } from '@/components/ui/button';

export default function AvoidGrid() {
  const [showSearch, setShowSearch] = useState(false);

  // Convert countries to avoid suggestions format with landmark images
  const avoidSuggestions = AMERICAN_COUNTRIES.map((country) => {
    const landmarkImage = getLandmarkImageForCountry(country.code);

    return {
      slug: country.code.toLowerCase(),
      name: country.name,
      image: landmarkImage,
    };
  });

  const first12 = avoidSuggestions.slice(0, 12);

  return (
    <div className="space-y-4">
      <div className="w-full">
        {/* Grid 3 filas x 4 col (si está contraído) */}
        <div className="grid grid-cols-4 gap-4 w-full">
          {first12.map((d) => (
            <DestinationCard key={d.slug} suggestion={d} />
          ))}
        </div>

        <div className="mt-6">
          <Button variant="secondary" onClick={() => setShowSearch(true)}>
            Otros destinos a evitar
          </Button>
        </div>
      </div>

      {/* Modal buscador */}
      <AvoidSearchModal
        open={showSearch}
        onClose={() => setShowSearch(false)}
      />
    </div>
  );
}
