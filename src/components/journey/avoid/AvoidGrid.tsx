'use client';
import { useState, useEffect } from 'react';
import DestinationCard from './DestinationCard';
import { getAvoidCities } from '@/lib/helpers/avoid-cities';
import { getCityImage, getLandmarkImageForCountry } from '@/lib/api/unsplash';
import AvoidSearchModal from './AvoidSearchModal';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/store';

export default function AvoidGrid() {
  const [showSearch, setShowSearch] = useState(false);
  const [suggestions, setSuggestions] = useState<
    Array<{ slug: string; city: string; country: string; image: string }>
  >([]);
  const { logistics, level } = useStore();

  // Get cities based on level and departure location
  const avoidCities = getAvoidCities(
    logistics.country,
    logistics.city,
    level,
    12,
  );

  // Load city images asynchronously
  useEffect(() => {
    async function loadCityImages() {
      console.log(
        `🏙️ Loading images for ${avoidCities.length} cities:`,
        avoidCities.map((c) => `${c.name}, ${c.countryCode}`),
      );

      const citiesWithImages = await Promise.all(
        avoidCities.map(async (city) => {
          console.log(`🔄 Processing city: ${city.name}, ${city.countryCode}`);
          const image = await getCityImage(city.name, city.countryCode);
          console.log(`🖼️ Got image for ${city.name}: ${image}`);
          return {
            slug: city.id,
            city: city.name,
            country: city.country,
            image,
          };
        }),
      );

      console.log(`✅ All cities loaded:`, citiesWithImages);
      setSuggestions(citiesWithImages);
    }

    if (avoidCities.length > 0) {
      loadCityImages();
    } else {
      setSuggestions([]);
    }
  }, [logistics.country, logistics.city, level]);

  return (
    <div className="space-y-4">
      <div className="w-full">
        {/* Grid 3 filas x 4 col */}
        <div className="grid grid-cols-4 gap-4 w-full">
          {suggestions.length === 0 ? (
            <div className="col-span-4 text-center py-8 text-neutral-500">
              Cargando ciudades...
            </div>
          ) : (
            suggestions.map((d) => (
              <DestinationCard key={d.slug} suggestion={d} />
            ))
          )}
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
