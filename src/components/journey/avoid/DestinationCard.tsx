"use client";

import Img from "@/components/common/Img";
import { useSearchParams } from "next/navigation";
import { useQuerySync } from "@/hooks/useQuerySync";
import { Check } from "lucide-react";
import { avoidCityLabelsEqual } from "@/lib/helpers/avoid-destinations";

interface AvoidSuggestion {
  slug: string;
  city: string;
  country: string;
  image?: string | null;
  landmark?: string;
  description?: string;
}

interface DestinationCardProps {
  suggestion: AvoidSuggestion;
  variant?: "chip" | "image";
}

// Used when no relevant city photo is available — a neutral, on-brand mark
// with no real-place reference, so an unmatched city never shows a wrong one.
const FALLBACK_IMAGE = "/images/placeholder/placeholder.jpg";

export default function DestinationCard({
  suggestion,
  variant = "image",
}: DestinationCardProps) {
  const searchParams = useSearchParams();
  const updateQuery = useQuerySync();

  const raw = searchParams.get("avoidDestinations");
  const selected = raw
    ? raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const isSelected = selected.some((n) =>
    avoidCityLabelsEqual(n, suggestion.city),
  );

  const toggle = () => {
    let next: string[];
    if (isSelected) {
      next = selected.filter((n) => !avoidCityLabelsEqual(n, suggestion.city));
    } else {
      if (selected.length >= 15) return;
      next = [...selected, suggestion.city];
    }
    updateQuery({
      avoidDestinations: next.length > 0 ? next : undefined,
    });
  };

  if (variant === "chip") {
    return (
      <button
        aria-pressed={isSelected}
        className={`group relative h-[80px] w-full cursor-pointer overflow-hidden rounded-sm border-[3px] bg-neutral-300 p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 ${
          isSelected ? "border-primary" : "border-transparent"
        }`}
        onClick={toggle}
        type="button"
      >
        <Img
          alt={suggestion.city}
          className="absolute inset-0 h-full w-full object-cover"
          height={80}
          src={suggestion.image ?? FALLBACK_IMAGE}
          width={165}
        />

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,24,39,.72)_0%,rgba(17,24,39,.42)_55%,rgba(17,24,39,.18)_100%)] transition-opacity group-hover:opacity-0" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,24,39,.8)_0%,rgba(17,24,39,.5)_55%,rgba(17,24,39,.22)_100%)] opacity-0 transition-opacity group-hover:opacity-100" />

        <div className="relative z-10 flex h-full flex-col justify-center px-3 text-white">
          <span className="text-sm font-semibold leading-tight">
            {suggestion.city}
          </span>
          <span className="text-xs font-normal leading-tight text-white/85">
            {suggestion.country}
          </span>
        </div>
      </button>
    );
  }

  return (
    <button
      aria-pressed={isSelected}
      className={`relative aspect-square cursor-pointer overflow-hidden rounded-sm bg-white text-left shadow-sm ring-1 ring-neutral-200 group ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={toggle}
      type="button"
    >
      <div className="absolute inset-0 bg-linear-to-b from-neutral-200 to-neutral-400" />

      <Img
        alt={suggestion.city}
        className="absolute inset-0 aspect-square h-full w-full object-cover"
        height={300}
        src={suggestion.image ?? FALLBACK_IMAGE}
        width={300}
      />

      <div className="absolute inset-0 bg-black/50" />

      <div className="absolute bottom-2 left-2 right-2 flex flex-col text-white drop-shadow">
        <div className="text-xl font-semibold">{suggestion.city}</div>
        <div className="text-sm font-semibold">{suggestion.country}</div>
      </div>

      {isSelected ? (
        <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-primary shadow">
          <Check size={16} />
        </div>
      ) : null}
    </button>
  );
}
