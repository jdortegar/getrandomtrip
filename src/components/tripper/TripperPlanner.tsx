"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CountryFlag from "@/components/common/CountryFlag";
import Section from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { TRIPPER_TRAVELER_TYPES_ANCHOR_ID } from "@/components/tripper/TripperTravelerTypesSection";
import { getTypeLabel } from "@/lib/data/traveler-types";
import CountrySelector from "@/components/journey/CountrySelector";
import CitySelector from "@/components/journey/CitySelector";

type Props = {
  tripperData: {
    id: string;
    name: string;
    slug: string;
    commission: number;
    availableTypes: string[];
    destinations?: string[];
    interests?: string[];
  };
  tripperPackagesByType?: Record<string, Record<string, any[]>>;
};

export default function TripperPlanner({
  tripperData,
  tripperPackagesByType = {},
}: Props) {
  const router = useRouter();
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [city, setCity] = useState("");
  const sectionRef = useRef<HTMLDivElement>(null);

  const firstName =
    tripperData.name?.split(" ")[0] || tripperData.name || "este tripper";
  const availableTypes = tripperData.availableTypes || [];

  const visitedCountries = useMemo(() => {
    if (tripperData.destinations?.length) return tripperData.destinations;
    const countries = new Set<string>();
    Object.values(tripperPackagesByType).forEach((byLevel) => {
      Object.values(byLevel).forEach((pkgs: any[]) => {
        pkgs.forEach((p) => {
          if (p?.destinationCountry) countries.add(p.destinationCountry);
        });
      });
    });
    return Array.from(countries);
  }, [tripperData.destinations, tripperPackagesByType]);

  const expertiseAreas = useMemo(() => {
    if (tripperData.interests?.length) return tripperData.interests;
    return availableTypes.map((t) => getTypeLabel(t) || t).filter(Boolean);
  }, [tripperData.interests, availableTypes]);

  const canContinue = country.trim().length > 0 && city.trim().length > 0;

  const handleContinue = () => {
    if (!canContinue) return;
    const params = new URLSearchParams({
      tripper: tripperData.slug,
      originCity: city,
      originCountry: country,
    });
    router.push(`/journey?${params.toString()}`);
  };

  const handleCountryChange = (name: string, code: string) => {
    setCountry(name);
    setCountryCode(code);
    setCity("");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = window.location.hash;
    if (h === "#planner" || h === "#start-your-journey-anchor") {
      sectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    if (h === `#${TRIPPER_TRAVELER_TYPES_ANCHOR_ID}`) {
      document
        .getElementById(TRIPPER_TRAVELER_TYPES_ANCHOR_ID)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <Section
      className="py-20"
      fullWidth={true}
      id="planner-section"
      subtitle={`${tripperData.name} se especializa en crear experiencias inolvidables. Sigue estos pasos para empezar a construir tu próximo gran viaje.`}
      title={`Planificá tu Randomtrip con ${firstName}`}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-16">
        {/* Countries + expertise */}
        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
          <div className="flex flex-col items-center">
            <h3 className="font-barlow-condensed text-center text-xl font-bold uppercase tracking-wide text-neutral-700">
              Países visitados
            </h3>
            <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
              {visitedCountries.length > 0 ? (
                visitedCountries.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 text-sm text-neutral-500"
                  >
                    <CountryFlag className="shrink-0" country={c} title={c} />
                    <span className="uppercase">{c}</span>
                  </span>
                ))
              ) : (
                <span className="text-sm text-neutral-400">—</span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center border-neutral-200 md:items-start md:border-l md:pl-12">
            <h3 className="font-barlow-condensed text-xl font-bold uppercase tracking-wide text-neutral-700">
              Áreas de expertise
            </h3>
            <ul className="mt-3 list-inside list-disc space-y-1 text-left text-sm text-neutral-500">
              {expertiseAreas.length > 0 ? (
                expertiseAreas.map((area) => (
                  <li key={area} className="uppercase">
                    {area}
                  </li>
                ))
              ) : (
                <li>—</li>
              )}
            </ul>
          </div>
        </div>

        {/* Origin form */}
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <h3 className="font-barlow-condensed text-xl font-bold uppercase tracking-wide text-neutral-700">
              ¿Desde dónde viajas?
            </h3>
            <p className="text-sm text-neutral-500">
              {firstName} diseñará tu experiencia desde tu ciudad de origen
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-600">
                País de salida
              </label>
              <CountrySelector
                onChange={handleCountryChange}
                placeholder="Selecciona tu país"
                size="lg"
                value={country}
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-sm font-medium text-neutral-600">
                Ciudad de salida
              </label>
              <CitySelector
                countryCode={countryCode}
                onChange={setCity}
                placeholder="Selecciona una ciudad"
                size="lg"
                value={city}
              />
            </div>
          </div>

          <Button
            className="min-w-48"
            disabled={!canContinue}
            onClick={handleContinue}
            size="lg"
            variant="pill"
          >
            Continuar →
          </Button>
        </div>
      </div>
    </Section>
  );
}
