"use client";

import { X } from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import type { TripperExperiencesDict } from "@/lib/types/dictionary";
import type {
  ActivityEntry,
  ExperienceFormDraft,
  ExperienceFormDraftOnChange,
} from "@/types/tripper";

interface Props {
  copy: TripperExperiencesDict["form"];
  form: ExperienceFormDraft;
  onChange: ExperienceFormDraftOnChange;
}

const EMPTY_ENTRY: ActivityEntry = {
  name: "",
  durationRhythm: "",
  description: "",
  risks: "",
};

const req = <span className="text-red-500 ml-0.5">*</span>;

const textareaClass =
  "bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-base resize-none min-h-[120px]";

const labelClass = "block font-normal text-gray-600 text-base";

export function ActivitiesListStep({ copy, form, onChange }: Props) {
  const { fields } = copy;

  function updateEntry(index: number, key: keyof ActivityEntry, value: string) {
    const updated = form.activities.map((entry, i) =>
      i === index ? { ...entry, [key]: value } : entry,
    );
    onChange("activities", updated);
  }

  function addEntry() {
    onChange("activities", [...form.activities, { ...EMPTY_ENTRY }]);
  }

  function removeEntry(index: number) {
    onChange(
      "activities",
      form.activities.filter((_, i) => i !== index),
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-500 -mt-1">
        {copy.contentTabs[2]?.substeps[0]?.description}
      </p>

      <div className="space-y-6">
        {form.activities.map((entry, index) => (
          <div key={index} className="space-y-4">
            {index > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm text-neutral-500">
                  {fields.activityLabel} {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeEntry(index)}
                  className="flex items-center gap-1 text-xs text-neutral-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  {fields.removeActivity}
                </button>
              </div>
            )}

            {/* Row 1: Name (required) + Duration */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                id={`act-name-${index}`}
                label={<>{fields.activityName}{req}</>}
                placeholder={fields.activityNamePlaceholder}
                value={entry.name}
                onChange={(e) => updateEntry(index, "name", e.target.value)}
              />
              <FormField
                id={`act-duration-${index}`}
                label={fields.activityDurationRhythm}
                placeholder={fields.activityDurationPlaceholder}
                value={entry.durationRhythm}
                onChange={(e) =>
                  updateEntry(index, "durationRhythm", e.target.value)
                }
              />
            </div>

            {/* Row 2: Description */}
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor={`act-desc-${index}`}>
                {fields.activityDesc}
              </label>
              <textarea
                id={`act-desc-${index}`}
                className={textareaClass}
                placeholder={fields.activityDescPlaceholder}
                value={entry.description}
                onChange={(e) =>
                  updateEntry(index, "description", e.target.value)
                }
              />
            </div>

            {/* Row 3: Risks */}
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor={`act-risks-${index}`}>
                {fields.activityRisks}
              </label>
              <textarea
                id={`act-risks-${index}`}
                className={textareaClass}
                placeholder={fields.activityRisksPlaceholder}
                value={entry.risks}
                onChange={(e) => updateEntry(index, "risks", e.target.value)}
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
        + {fields.addAnotherActivity}
      </button>
    </div>
  );
}
