"use client";

import { X } from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import type { TripperExperiencesDict } from "@/lib/types/dictionary";
import type {
  ItineraryDayEntry,
  ExperienceFormDraft,
  ExperienceFormDraftOnChange,
} from "@/types/tripper";

interface Props {
  copy: TripperExperiencesDict["form"];
  form: ExperienceFormDraft;
  onChange: ExperienceFormDraftOnChange;
}

const EMPTY_DAY: ItineraryDayEntry = { title: "", description: "" };

const textareaClass =
  "bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-base resize-none min-h-[120px]";

export function ItineraryStep({ copy, form, onChange }: Props) {
  const { fields } = copy;

  function updateDay(
    index: number,
    key: keyof ItineraryDayEntry,
    value: string,
  ) {
    const updated = form.itinerary.map((day, i) =>
      i === index ? { ...day, [key]: value } : day,
    );
    onChange("itinerary", updated);
  }

  function addDay() {
    onChange("itinerary", [...form.itinerary, { ...EMPTY_DAY }]);
  }

  function removeDay(index: number) {
    onChange(
      "itinerary",
      form.itinerary.filter((_, i) => i !== index),
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-500 -mt-1">
        {copy.contentTabs[3]?.substeps[1]?.description}
      </p>

      <div className="space-y-6">
        {form.itinerary.map((day, index) => (
          <div key={index} className="space-y-4">
            {index > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm text-neutral-500">
                  Día {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeDay(index)}
                  className="flex items-center gap-1 text-xs text-neutral-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  {fields.removeDay}
                </button>
              </div>
            )}

            <div className="max-w-[50%] pr-2">
              <FormField
                id={`itin-title-${index}`}
                label={
                  <>
                    <span className="font-semibold text-gray-800">
                      {fields.itineraryTitle} {index + 1}
                    </span>{" "}
                    <span className="text-red-500">*</span>
                  </>
                }
                placeholder="Ej: primer día en la colina"
                value={day.title}
                onChange={(e) => updateDay(index, "title", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="block font-semibold text-gray-800 text-base"
                htmlFor={`itin-desc-${index}`}
              >
                {fields.itineraryDesc}
              </label>
              <textarea
                id={`itin-desc-${index}`}
                className={textareaClass}
                placeholder='Ej: el primer día fuimos a la colina llamada "Viva lava"'
                value={day.description}
                onChange={(e) =>
                  updateDay(index, "description", e.target.value)
                }
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addDay}
        className="w-full rounded-xl border border-dashed border-gray-300 py-4 text-sm text-neutral-500 hover:border-gray-400 hover:text-neutral-700 transition-colors"
      >
        + {fields.addAnotherDay}
      </button>
    </div>
  );
}
