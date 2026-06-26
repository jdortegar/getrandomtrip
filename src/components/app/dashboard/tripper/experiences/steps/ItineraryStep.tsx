"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { validateImageSize } from "@/lib/utils/validateImageSize";
import { X, ImagePlus } from "lucide-react";
import Image from "next/image";
import { FormField } from "@/components/ui/FormField";
import { RichTextInput } from "@/components/ui/RichTextInput";
import type { TripperExperiencesDict } from "@/lib/types/dictionary";
import type {
  ItineraryDayEntry,
  ExperienceFormDraft,
  ExperienceFormDraftOnChange,
} from "@/types/tripper";
import type { ExperienceImageState } from "../NewExperienceShell";

interface Props {
  copy: TripperExperiencesDict["form"];
  form: ExperienceFormDraft;
  onChange: ExperienceFormDraftOnChange;
  imageState: ExperienceImageState;
  changedFieldSet?: Set<string>;
  isReadOnly?: boolean;
}

const uploadTileClass =
  "flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors";

const EMPTY_DAY: ItineraryDayEntry = { title: "", description: "", image: null };

const req = <span className="text-red-500 ml-0.5">*</span>;


export function ItineraryStep({ copy, form, onChange, imageState, changedFieldSet, isReadOnly }: Props) {
  const { fields } = copy;
  const { onEntryImageSelect, onEntryImageRemove } = imageState;
  const dayImageRefs = useRef<(HTMLInputElement | null)[]>([]);

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
    <div className="space-y-5">
      <p className="text-sm text-neutral-500 -mt-1">
        {copy.contentTabs[2]?.substeps[1]?.description}
      </p>

      <div className={`space-y-6 ${changedFieldSet?.has("itinerary") ? "ring-2 ring-amber-400 rounded-xl p-2" : ""}`}>
        {form.itinerary.map((day, index) => (
          <div key={index} className="space-y-4">
            {index > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm text-neutral-500">
                  {fields.dayLabel} {index + 1}
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

            {/* Title — ~50% width */}
            <div className="max-w-[50%] pr-2">
              <FormField
                id={`itin-title-${index}`}
                label={
                  <>{fields.itineraryTitle} {index + 1}{req}</>
                }
                placeholder={fields.itineraryTitlePlaceholder}
                value={day.title}
                onChange={(e) => updateDay(index, "title", e.target.value)}
              />
            </div>

            {/* Description — full width */}
            <RichTextInput
              id={`itin-desc-${index}`}
              label={fields.itineraryDesc}
              placeholder={fields.itineraryDescPlaceholder}
              value={day.description}
              onChange={(html) => updateDay(index, "description", html)}
              disabled={isReadOnly}
            />

            {/* Day image upload tile */}
            <div className="space-y-1.5">
              <label className="block text-sm font-normal text-gray-600">
                {fields.dayImageLabel}
              </label>
              <div className="flex items-start gap-3">
                {day.image ? (
                  <div className="relative h-24 w-24 shrink-0 rounded-xl overflow-hidden group">
                    <Image
                      src={day.image}
                      alt={`Day ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="96px"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => onEntryImageRemove("itinerary", index)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => dayImageRefs.current[index]?.click()}
                    className={uploadTileClass}
                  >
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-xs text-center leading-tight px-1">
                      {fields.uploadImage}
                    </span>
                  </button>
                )}
              </div>
              <p className="text-xs text-neutral-400">{fields.entryImageSizeHint}</p>
              <input
                ref={(el) => { dayImageRefs.current[index] = el; }}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const result = await validateImageSize(file, 800, 600);
                  if (!result.valid) {
                    toast.error(`${fields.imageTooSmall} — min 800 × 600 px (actual: ${result.width} × ${result.height} px)`);
                    e.target.value = "";
                    return;
                  }
                  onEntryImageSelect("itinerary", index, file);
                  e.target.value = "";
                }}
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
