"use client";

import { useEffect, useState } from "react";
import DestinationCard from "./DestinationCard";
import { getAvoidCities } from "@/lib/helpers/avoid-cities";
import { getCityImage } from "@/lib/api/unsplash";
import AvoidSearchModal, {
  type AvoidSearchModalLabels,
} from "./AvoidSearchModal";
import { Button } from "@/components/ui/Button";

export interface AvoidGridLabels {
  loading: string;
  otherDestinationsButton: string;
  searchModal: AvoidSearchModalLabels;
}

export interface AvoidGridProps {
  experienceLevel?: string;

  labels: AvoidGridLabels;

  originCity?: string;

  originCountry?: string;

  tripperPackageDestinations?: Array<{ city: string; country: string }>;

  /** When false, destinations render as filter chips (same style as JourneyFiltersForm FilterSeg). */
  showImages?: boolean;
}

function filterOutPackageDestinations<
  T extends { city: string; country: string },
>(
  cities: T[],
  tripperPackageDestinations?: Array<{ city: string; country: string }>,
): T[] {
  return cities.filter((city) => {
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
}

export default function AvoidGrid({
  experienceLevel,
  labels,
  originCity: originCityProp,
  originCountry: originCountryProp,
  showImages = true,
  tripperPackageDestinations,
}: AvoidGridProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [suggestions, setSuggestions] = useState<
    Array<{ slug: string; city: string; country: string; image?: string }>
  >([]);

  const originCountry = originCountryProp ?? "";
  const originCity = originCityProp ?? "";
  const level = experienceLevel ?? "modo-explora";

  // Level controls scope: essenza = national; modo-explora = national + neighbors;
  // explora-plus = region; bivouac/atelier-getaway = all Americas (see getAvoidCities)
  const avoidCities = getAvoidCities(originCountry, originCity, level, 12);

  useEffect(() => {
    if (avoidCities.length === 0) {
      setSuggestions([]);
      return;
    }

    if (!showImages) {
      const chips = filterOutPackageDestinations(
        avoidCities.map((city) => ({
          slug: city.id,
          city: city.name,
          country: city.country,
        })),
        tripperPackageDestinations,
      );
      setSuggestions(chips);
      return;
    }

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

      setSuggestions(
        filterOutPackageDestinations(
          citiesWithImages,
          tripperPackageDestinations,
        ),
      );
    }

    void loadCityImages();
  }, [
    originCountry,
    originCity,
    level,
    showImages,
    tripperPackageDestinations,
  ]);

  return (
    <div className="space-y-4">
      <div className="w-full">
        {/* Grid 3 filas x 4 col */}
        <div
          className={
            showImages
              ? "grid w-full grid-cols-4 gap-4"
              : "flex w-full flex-wrap gap-2"
          }
        >
          {suggestions.length === 0 ? (
            <div
              className={
                showImages
                  ? "col-span-4 py-8 text-center text-neutral-500"
                  : "w-full py-8 text-center text-neutral-500"
              }
            >
              {labels.loading}
            </div>
          ) : (
            suggestions.map((d) => (
              <DestinationCard
                key={d.slug}
                suggestion={d}
                variant={showImages ? "image" : "chip"}
              />
            ))
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <Button
            className="font-medium normal-case underline"
            onClick={() => setShowSearch(true)}
            variant="link"
          >
            {labels.otherDestinationsButton}
          </Button>
        </div>
      </div>

      <AvoidSearchModal
        labels={labels.searchModal}
        onClose={() => setShowSearch(false)}
        open={showSearch}
      />
    </div>
  );
}
