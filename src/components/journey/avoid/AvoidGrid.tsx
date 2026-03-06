'use client';

import { useEffect, useState } from 'react';
import DestinationCard from './DestinationCard';
import { getAvoidCities } from '@/lib/helpers/avoid-cities';
import { getCityImage } from '@/lib/api/unsplash';
import AvoidSearchModal from './AvoidSearchModal';
import { Button } from '@/components/ui/Button';

export interface AvoidGridProps {
  /** Experience/level id (e.g. from query param `experience`). */
  experienceLevel?: string;
  /** Optional labels for loading state, button, and search modal. */
  labels?: {
    loading?: string;
    otherDestinationsButton?: string;
    searchModal?: {
      addButton: string;
      badgeLabelCity: string;
      cancelButton: string;
      saveDestinationsButton: string;
      selectedCountTemplate: string;
      selectedDestinationsHeading: string;
      title: string;
    };
  };
  /** Origin city (e.g. from query param `originCity`). */
  originCity?: string;
  /** Origin country (e.g. from query param `originCountry`). */
  originCountry?: string;
  /** When set, suggestions that match these destinations are filtered out (e.g. tripper package destinations). */
  tripperPackageDestinations?: Array<{ city: string; country: string }>;
}

export default function AvoidGrid({
  experienceLevel,
  labels: labelsProp,
  originCity: originCityProp,
  originCountry: originCountryProp,
  tripperPackageDestinations,
}: AvoidGridProps = {}) {
  const labels = {
    loading: labelsProp?.loading ?? 'Cargando ciudades...',
    otherDestinationsButton:
      labelsProp?.otherDestinationsButton ?? 'Otros destinos a evitar',
    searchModal: labelsProp?.searchModal ?? {
      addButton: 'Agregar',
      badgeLabelCity: 'Ciudad',
      cancelButton: 'Cancelar',
      saveDestinationsButton: 'Guardar destinos',
      selectedCountTemplate: 'Seleccionados: {count} / {max}',
      selectedDestinationsHeading: 'Destinos seleccionados',
      title: 'Agregar destinos a evitar',
    },
  };
  const [showSearch, setShowSearch] = useState(false);
  const [suggestions, setSuggestions] = useState<
    Array<{ slug: string; city: string; country: string; image: string }>
  >([]);

  const originCountry = originCountryProp ?? '';
  const originCity = originCityProp ?? '';
  const level = experienceLevel ?? 'modo-explora';

  // Level controls scope: essenza = national; modo-explora = national + neighbors;
  // explora-plus = region; bivouac/atelier-getaway = all Americas (see getAvoidCities)
  const avoidCities = getAvoidCities(originCountry, originCity, level, 12);

  useEffect(() => {
    async function loadCityImages() {
      const citiesWithImages = await Promise.all(
        avoidCities.map(async (city) => {
          const image = await getCityImage(city.name, city.countryCode);
          return {
            slug: city.id,
            city: city.name,
            country: city.country,
            image,
          };
        }),
      );

      const filteredCities = citiesWithImages.filter((city) => {
        if (
          !tripperPackageDestinations ||
          tripperPackageDestinations.length === 0
        ) {
          return true;
        }
        const isPackageDestination = tripperPackageDestinations.some(
          (pkg) =>
            pkg.city.toLowerCase() === city.city.toLowerCase() &&
            pkg.country.toLowerCase() === city.country.toLowerCase(),
        );
        return !isPackageDestination;
      });

      setSuggestions(filteredCities);
    }

    if (avoidCities.length > 0) {
      loadCityImages();
    } else {
      setSuggestions([]);
    }
  }, [
    originCountry,
    originCity,
    level,
    tripperPackageDestinations,
  ]);

  return (
    <div className="space-y-4">
      <div className="w-full">
        {/* Grid 3 filas x 4 col */}
        <div className="grid grid-cols-4 gap-4 w-full">
          {suggestions.length === 0 ? (
            <div className="col-span-4 py-8 text-center text-neutral-500">
              {labels.loading}
            </div>
          ) : (
            suggestions.map((d) => (
              <DestinationCard key={d.slug} suggestion={d} />
            ))
          )}
        </div>

        <div className="mt-6">
          <Button
            onClick={() => setShowSearch(true)}
            variant="secondary"
          >
            {labels.otherDestinationsButton}
          </Button>
        </div>
      </div>

      {/* Modal buscador */}
      <AvoidSearchModal
        labels={labels.searchModal}
        onClose={() => setShowSearch(false)}
        open={showSearch}
      />
    </div>
  );
}
