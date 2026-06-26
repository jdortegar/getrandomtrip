"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CityResult } from "@/lib/geo/types";

interface CitySelectorProps {
  className?: string;
  /** ISO alpha-2 country code used to scope city search via /api/geo/cities */
  countryCode: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onOptionSelect?: () => void;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  value: string;
}

export default function CitySelector({
  className = "",
  countryCode,
  disabled = false,
  onChange,
  onOptionSelect,
  placeholder = "Ciudad de salida",
  size = "md",
  value,
}: CitySelectorProps) {
  const params = useParams();
  const lang = (params?.locale as string)?.startsWith("en") ? "en" : "es";

  const [cities, setCities] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const hasCountry = Boolean(countryCode);

  const fetchCities = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setCities([]);
        return;
      }

      if (!countryCode) {
        setCities([]);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: query,
          countryCode,
          lang,
        });
        const res = await fetch(`/api/geo/cities?${params.toString()}`);
        if (!res.ok) {
          setCities([]);
          return;
        }
        const data = (await res.json()) as { results: CityResult[] };
        setCities(data.results ?? []);
      } catch (error) {
        console.error("Error searching cities:", error);
        setCities([]);
      } finally {
        setLoading(false);
      }
    },
    [countryCode, lang],
  );

  // Debounced search — 100ms
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCities(value);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [value, fetchCities]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCitySelect = (city: CityResult) => {
    onChange(city.name);
    setOpen(false);
    onOptionSelect?.();
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-600" />
        <Input
          autoComplete="off"
          className={cn(
            "border-gray-300 bg-white pl-11 ring-0 focus-visible:ring-0",
            size === "lg"
              ? "h-12 text-base"
              : size === "sm"
                ? "h-8 text-sm"
                : "h-10",
            className,
            open && "rounded-b-none",
          )}
          disabled={disabled || !hasCountry}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          placeholder={hasCountry ? placeholder : "Selecciona un país primero"}
          type="text"
          value={value}
        />
      </div>

      {open && hasCountry && (
        <div className="absolute z-50 w-full -mt-px border border-gray-300 border-t-0 rounded-b-md bg-white shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="animate-spin rounded-full h-4 w-4" />
            </div>
          ) : cities.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500">
              {value.length < 2
                ? "Escribe al menos 2 caracteres..."
                : "No se encontraron ciudades."}
            </div>
          ) : (
            cities.map((city) => (
              <button
                key={`${city.name}-${city.countryCode}`}
                type="button"
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                onClick={() => handleCitySelect(city)}
              >
                <div className="font-medium">{city.name}</div>
                {city.placeName !== city.name && (
                  <div className="text-xs text-gray-400">{city.placeName}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
