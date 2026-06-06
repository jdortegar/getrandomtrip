"use client";

import { X } from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import type { TripperExperiencesDict } from "@/lib/types/dictionary";
import type {
  AccommodationEntry,
  ExperienceFormDraft,
  ExperienceFormDraftOnChange,
} from "@/types/tripper";

interface Props {
  copy: TripperExperiencesDict["form"];
  form: ExperienceFormDraft;
  onChange: ExperienceFormDraftOnChange;
}

const EMPTY_ENTRY: AccommodationEntry = {
  hotelName: "",
  hotelStars: "",
  hotelLocation: "",
  hotelDays: "",
  hotelLink: "",
  referredLink: "",
};

export function LogisticsAccommodationStep({ copy, form, onChange }: Props) {
  const { fields } = copy;

  function updateEntry(
    index: number,
    key: keyof AccommodationEntry,
    value: string,
  ) {
    const updated = form.accommodations.map((entry, i) =>
      i === index ? { ...entry, [key]: value } : entry,
    );
    onChange("accommodations", updated);
  }

  function addEntry() {
    onChange("accommodations", [...form.accommodations, { ...EMPTY_ENTRY }]);
  }

  function removeEntry(index: number) {
    onChange(
      "accommodations",
      form.accommodations.filter((_, i) => i !== index),
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-500 -mt-1">
        {copy.contentTabs[1]?.substeps[0]?.description}
      </p>

      <div className="space-y-6">
        {form.accommodations.map((entry, index) => (
          <div key={index} className="space-y-4">
            {index > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm text-neutral-500">
                  {fields.addAccommodation} {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeEntry(index)}
                  className="flex items-center gap-1 text-xs text-neutral-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  {fields.removeAccommodation}
                </button>
              </div>
            )}

            {/* Row 1: Name | Hotel link | Referred link */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                id={`acc-hotel-name-${index}`}
                label={fields.hotelName}
                placeholder={fields.hotelNamePlaceholder}
                value={entry.hotelName}
                onChange={(e) => updateEntry(index, "hotelName", e.target.value)}
              />
              <FormField
                id={`acc-hotel-link-${index}`}
                label={fields.hotelLink}
                placeholder={fields.hotelLinkPlaceholder}
                type="url"
                value={entry.hotelLink}
                onChange={(e) => updateEntry(index, "hotelLink", e.target.value)}
              />
              <FormField
                id={`acc-referred-link-${index}`}
                label={fields.referredLink}
                placeholder={fields.referredLinkPlaceholder}
                type="url"
                value={entry.referredLink}
                onChange={(e) =>
                  updateEntry(index, "referredLink", e.target.value)
                }
              />
            </div>

            {/* Row 2: Days (1/3 width) */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                id={`acc-hotel-days-${index}`}
                label={fields.hotelDays}
                placeholder={fields.hotelDaysPlaceholder}
                type="text"
                inputMode="numeric"
                value={entry.hotelDays}
                onChange={(e) =>
                  updateEntry(
                    index,
                    "hotelDays",
                    e.target.value.replace(/[^0-9]/g, ""),
                  )
                }
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addEntry}
        className="w-full rounded-xl border border-dashed border-gray-300 py-4 text-sm text-neutral-500 hover:border-gray-400 hover:text-neutral-700 transition-colors"
      >
        + {fields.addAccommodation}
      </button>
    </div>
  );
}
