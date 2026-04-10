"use client";

import Img from "@/components/common/Img";
import { useSearchParams } from "next/navigation";
import { useQuerySync } from "@/hooks/useQuerySync";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { avoidCityLabelsEqual } from "@/lib/helpers/avoid-destinations";

interface AvoidSuggestion {
  slug: string;
  city: string;
  country: string;
  image?: string;
  landmark?: string;
  description?: string;
}

interface DestinationCardProps {
  suggestion: AvoidSuggestion;
  variant?: "chip" | "image";
}

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
        className="inline-flex cursor-pointer rounded-full border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
        onClick={toggle}
        type="button"
      >
        <Badge selected={isSelected}>
          {suggestion.city}, {suggestion.country}
        </Badge>
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
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-200 to-neutral-400" />

      {suggestion.image ? (
        <Img
          alt={suggestion.city}
          className="absolute inset-0 aspect-square h-full w-full object-cover"
          height={300}
          src={suggestion.image}
          width={300}
        />
      ) : null}

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
