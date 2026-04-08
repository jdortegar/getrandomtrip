"use client";

import React from "react";
import Img from "@/components/common/Img";
import { useSearchParams } from "next/navigation";
import { useQuerySync } from "@/hooks/useQuerySync";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
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
        className={cn(
          "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
          isSelected
            ? "border-gray-800 bg-gray-800 text-white"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100",
        )}
        onClick={toggle}
        type="button"
      >
        <span>
          {suggestion.city}, {suggestion.country}
        </span>
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
