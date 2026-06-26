"use client";

import { X } from "lucide-react";
import type { TripperExperiencesDict } from "@/lib/types/dictionary";
import type {
  ExperienceFormDraft,
  ExperienceFormDraftOnChange,
} from "@/types/tripper";

interface Props {
  copy: TripperExperiencesDict["form"];
  form: ExperienceFormDraft;
  onChange: ExperienceFormDraftOnChange;
}

const inputClass =
  "bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-base";

function ChipList({
  id,
  label,
  placeholder,
  values,
  onAdd,
  onRemove,
  chipColor,
}: {
  id: string;
  label: string;
  placeholder: string;
  values: string[];
  onAdd: (v: string) => void;
  onRemove: (i: number) => void;
  chipColor: string;
}) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (val) {
        onAdd(val);
        e.currentTarget.value = "";
      }
    }
  }
  return (
    <div className="flex flex-col gap-2">
      <label
        className="block font-semibold text-gray-800 text-base"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        id={id}
        className={inputClass}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
      />
      {values.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-1">
          {values.map((v, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-lg px-4 py-2.5 text-sm ${chipColor}`}
            >
              <span>{v}</span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="ml-3 text-current opacity-50 hover:opacity-100 transition-opacity"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function InclusionsStep({ copy, form, onChange }: Props) {
  const { fields } = copy;

  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-500 -mt-1">
        {copy.contentTabs[3]?.substeps[2]?.description}
      </p>

      <ChipList
        id="inc-inclusions"
        label={fields.inclusions}
        placeholder={fields.addInclusion}
        values={form.inclusions}
        onAdd={(v) => onChange("inclusions", [...form.inclusions, v])}
        onRemove={(i) =>
          onChange(
            "inclusions",
            form.inclusions.filter((_, idx) => idx !== i),
          )
        }
        chipColor="bg-green-50 text-green-800 border border-green-100"
      />

      <ChipList
        id="inc-exclusions"
        label={fields.exclusions}
        placeholder={fields.addExclusion}
        values={form.exclusions}
        onAdd={(v) => onChange("exclusions", [...form.exclusions, v])}
        onRemove={(i) =>
          onChange(
            "exclusions",
            form.exclusions.filter((_, idx) => idx !== i),
          )
        }
        chipColor="bg-red-50 text-red-800 border border-red-100"
      />
    </div>
  );
}
