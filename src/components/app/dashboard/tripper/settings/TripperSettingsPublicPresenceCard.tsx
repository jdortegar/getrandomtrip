"use client";

import { Check } from "lucide-react";
import { AccountSettingsTagList } from "@/components/app/account/AccountSettingsTagList";
import { cn } from "@/lib/utils";
import type { TripperDashboardDict, MarketingDictionary } from "@/lib/types/dictionary";
import type { TripperSettingsFormState } from "@/types/tripper";
import type { TravellerType } from "@/types/tripper";

const TRAVELER_TYPE_KEYS: TravellerType[] = [
  "solo",
  "couple",
  "family",
  "group",
  "honeymoon",
  "paws",
];

interface TripperSettingsPublicPresenceCardProps {
  copy: TripperDashboardDict["settingsProfile"]["publicPresence"];
  tagListCopy: MarketingDictionary["profile"]["tagList"];
  travelerTypesCopy: MarketingDictionary["profile"]["travelerTypes"];
  formData: TripperSettingsFormState;
  isEditing: boolean;
  onChange: (next: TripperSettingsFormState) => void;
}

export function TripperSettingsPublicPresenceCard({
  copy,
  tagListCopy,
  travelerTypesCopy,
  formData,
  isEditing,
  onChange,
}: TripperSettingsPublicPresenceCardProps) {
  const bio = formData.bio.trim();

  function toggleType(key: TravellerType) {
    const active = formData.availableTypes.includes(key);
    onChange({
      ...formData,
      availableTypes: active
        ? formData.availableTypes.filter((t) => t !== key)
        : [...formData.availableTypes, key],
    });
  }

  function addDestination(value: string) {
    if (formData.destinations.includes(value)) return;
    onChange({ ...formData, destinations: [...formData.destinations, value] });
  }

  function removeDestination(value: string) {
    onChange({
      ...formData,
      destinations: formData.destinations.filter((d) => d !== value),
    });
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
          {copy.eyebrow}
        </p>
        <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
          {copy.heading}
        </h2>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-neutral-500">
          {copy.bioLabel}
        </p>
        {isEditing ? (
          <textarea
            className="w-full rounded-lg border border-gray-200 p-3 text-sm text-neutral-800 outline-none focus:border-light-blue"
            onChange={(e) => onChange({ ...formData, bio: e.target.value })}
            placeholder={copy.bioPlaceholder}
            rows={4}
            value={formData.bio}
          />
        ) : (
          <p
            className={cn(
              "text-sm text-neutral-700",
              !bio && "italic text-neutral-400",
            )}
          >
            {bio || copy.bioEmpty}
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-neutral-500">
          {copy.destinationsLabel}
        </p>
        <AccountSettingsTagList
          addAriaLabel={tagListCopy.addAriaLabel}
          editing={isEditing}
          items={formData.destinations}
          onAdd={addDestination}
          onRemove={removeDestination}
          placeholder={copy.destinationsAddPlaceholder}
          removeAriaLabel={tagListCopy.removeAriaLabel}
        />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-neutral-500">
          {copy.travelerTypesLabel}
        </p>
        {!isEditing && (
          <p className="mb-2 text-xs text-neutral-400">
            {copy.travelerTypesHelper}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {TRAVELER_TYPE_KEYS.map((key) => {
            const active = formData.availableTypes.includes(key);
            return (
              <button
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors",
                  active
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-neutral-500",
                  !isEditing && !active && "cursor-not-allowed opacity-40",
                  isEditing && !active && "hover:border-gray-400",
                )}
                disabled={!isEditing}
                key={key}
                onClick={() => toggleType(key)}
                type="button"
              >
                {active && <Check className="h-3.5 w-3.5" />}
                {travelerTypesCopy[key]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
