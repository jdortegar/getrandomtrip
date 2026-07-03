"use client";

import { X } from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import { DaysInput } from "@/components/ui/DaysInput";
import type { FieldPeek } from "@/components/ui/field-peek";
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
  /** Per-entry, per-field "peek at original" toggle; undefined outside adminReadOnly review. */
  peek?: (index: number, entryKey: keyof AccommodationEntry) => FieldPeek | undefined;
}

const EMPTY_ENTRY: AccommodationEntry = {
  hotelName: "",
  hotelStars: "",
  hotelLocation: "",
  hotelDays: "",
  hotelLink: "",
  referredLink: "",
};

export function LogisticsAccommodationStep({ copy, form, onChange, peek }: Props) {
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

  // `peek` is only defined for a field when it individually differs from the
  // original entry, so it doubles as the per-field changed-field indicator.
  const ring = (index: number, key: keyof AccommodationEntry) =>
    peek?.(index, key) ? "ring-2 ring-amber-400 rounded-xl" : undefined;

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

            {/* Row 1: Hotel name (full width) */}
            <FormField
              id={`acc-hotel-name-${index}`}
              label={fields.hotelName}
              placeholder={fields.hotelNamePlaceholder}
              value={entry.hotelName}
              onChange={(e) => updateEntry(index, "hotelName", e.target.value)}
              peek={peek?.(index, "hotelName")}
              className={ring(index, "hotelName")}
            />

            {/* Row 2: Hotel link | Referred link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id={`acc-hotel-link-${index}`}
                label={fields.hotelLink}
                placeholder={fields.hotelLinkPlaceholder}
                type="url"
                value={entry.hotelLink}
                onChange={(e) => updateEntry(index, "hotelLink", e.target.value)}
                peek={peek?.(index, "hotelLink")}
                className={ring(index, "hotelLink")}
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
                peek={peek?.(index, "referredLink")}
                className={ring(index, "referredLink")}
              />
            </div>

            {/* Row 2: Days (1/3 width) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <DaysInput
                id={`acc-hotel-days-${index}`}
                label={fields.hotelDays}
                className="w-full"
                hintTemplate={fields.minNightsHint}
                value={parseInt(entry.hotelDays, 10) || 1}
                onChange={(days) => updateEntry(index, "hotelDays", String(days))}
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
