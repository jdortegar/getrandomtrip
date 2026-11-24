"use client";

import { MapPin, X } from "lucide-react";
import { FormSelectField } from "@/components/ui/FormField";
import { countryLabel } from "@/lib/geo/countryOptions";
import { cn } from "@/lib/utils";
import type { TripperProfileEditorDict } from "@/lib/types/dictionary";
import type { TripperProfilePlace, TripperProfileStoryOption } from "@/types/tripper";

interface AtlasPlaceListProps {
  commonCopy: TripperProfileEditorDict["common"];
  copy: TripperProfileEditorDict["atlas"];
  locale: string;
  onChange: (id: string, patch: Partial<TripperProfilePlace>) => void;
  onRemove: (id: string) => void;
  places: TripperProfilePlace[];
  stories: TripperProfileStoryOption[];
}

/** Places on the Tripper's personal atlas, each with its badge and optional related story. */
export function AtlasPlaceList({
  commonCopy,
  copy,
  locale,
  onChange,
  onRemove,
  places,
  stories,
}: AtlasPlaceListProps) {
  if (places.length === 0) {
    return <p className="text-sm text-neutral-500">{copy.listEmpty}</p>;
  }

  return (
    <ul className="divide-y divide-gray-100" data-component="AtlasPlaceList">
      {places.map((place) => {
        const country = countryLabel(place.countryCode, locale);
        const name = place.city ? `${place.city}, ${country}` : country;
        const storyId = `place-${place.id}-story`;

        return (
          <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0" key={place.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{place.city ?? country}</p>
                  <p className="text-xs text-neutral-500">
                    {place.city ? country : copy.countryOnly}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={cn(
                    "rounded-[6px] border px-2 py-0.5 text-[11px] font-medium",
                    place.isLocalExpert
                      ? "border-primary/30 bg-primary/5 text-primary"
                      : "border-gray-200 bg-gray-50 text-neutral-600",
                  )}
                >
                  {place.isLocalExpert ? copy.localExpertBadge : copy.visitedBadge}
                </span>
                <button
                  aria-label={`${commonCopy.remove}: ${name}`}
                  className="flex h-11 w-11 items-center justify-center rounded-md text-neutral-500 hover:bg-gray-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() => onRemove(place.id)}
                  type="button"
                >
                  <X aria-hidden className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="pl-7">
              {stories.length > 0 ? (
                <FormSelectField
                  className="py-3 text-sm"
                  id={storyId}
                  label={copy.storyLabel}
                  onChange={(e) => onChange(place.id, { storyId: e.target.value || undefined })}
                  value={place.storyId ?? ""}
                >
                  <option value="">{copy.storyNone}</option>
                  {stories.map((story) => (
                    <option key={story.id} value={story.id}>
                      {story.title}
                    </option>
                  ))}
                </FormSelectField>
              ) : (
                <p className="text-xs text-neutral-500">
                  <span className="font-medium text-neutral-600">{copy.storyLabel}:</span>{" "}
                  {copy.storyPending}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
