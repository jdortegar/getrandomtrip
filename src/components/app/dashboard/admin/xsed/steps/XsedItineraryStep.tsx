"use client";

import { X } from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import { RichTextInput } from "@/components/ui/RichTextInput";
import type { AdminXsedDict } from "@/lib/types/dictionary";
import type { ItineraryDayEntry, XsedDropDraft } from "@/types/xsed";

interface Props {
  form: XsedDropDraft;
  onChange: (patch: Partial<XsedDropDraft>) => void;
  copy: AdminXsedDict["form"]["fields"]["itinerary"];
}

const EMPTY_DAY: ItineraryDayEntry = { title: "", description: "", image: null };

/**
 * Parallel thin XSED-specific step — NOT adapted from the tripper
 * `ItineraryStep` (design.md ADR-7). No per-day image: XSED already has a
 * gallery and per-section photos, and adapting the image contract would
 * drag in `ExperienceImageState`, which XSED authoring has no equivalent
 * for.
 */
export function XsedItineraryStep({ form, onChange, copy }: Props) {
  function updateDay(index: number, key: "title" | "description", value: string) {
    const updated = form.itinerary.map((day, i) =>
      i === index ? { ...day, [key]: value } : day,
    );
    onChange({ itinerary: updated });
  }

  function addDay() {
    onChange({ itinerary: [...form.itinerary, { ...EMPTY_DAY }] });
  }

  function removeDay(index: number) {
    onChange({ itinerary: form.itinerary.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-6">
        {form.itinerary.map((day, index) => (
          <div key={index} className="space-y-4">
            {index > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm text-neutral-500">
                  {copy.dayLabel} {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeDay(index)}
                  className="flex items-center gap-1 text-xs text-neutral-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  {copy.removeDay}
                </button>
              </div>
            )}

            <div className="max-w-[50%] pr-2">
              <FormField
                id={`xsed-itin-title-${index}`}
                label={copy.titleLabel}
                placeholder={copy.titlePlaceholder}
                value={day.title}
                onChange={(e) => updateDay(index, "title", e.target.value)}
              />
            </div>

            <RichTextInput
              id={`xsed-itin-desc-${index}`}
              label={copy.descLabel}
              placeholder={copy.descPlaceholder}
              value={day.description}
              onChange={(html) => updateDay(index, "description", html)}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addDay}
        className="w-full rounded-xl border border-dashed border-gray-300 py-4 text-sm text-neutral-500 hover:border-gray-400 hover:text-neutral-700 transition-colors"
      >
        + {copy.addDay}
      </button>
    </div>
  );
}
