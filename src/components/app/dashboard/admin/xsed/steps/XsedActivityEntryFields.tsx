"use client";

import { FormField } from "@/components/ui/FormField";
import { DurationInput } from "@/components/ui/DurationInput";
import type { AdminXsedDict } from "@/lib/types/dictionary";
import type { ActivityEntry } from "@/types/xsed";
import type { DurationValue } from "@/types/tripper";

interface Props {
  idPrefix: string;
  namePlaceholder: string;
  entry: ActivityEntry;
  onChange: <K extends keyof ActivityEntry>(key: K, value: ActivityEntry[K]) => void;
  copy: AdminXsedDict["form"]["fields"]["activities"];
}

const textareaClass =
  "bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-ink w-full text-base resize-none min-h-[100px]";

// Shared field group for a single dinner/activity entry — rendered by
// XsedDinnerStep and XsedActivityStep, each pointed at its own slot in the
// `activities` array so the backend field/shape stays unchanged.
export function XsedActivityEntryFields({ idPrefix, namePlaceholder, entry, onChange, copy }: Props) {
  const durationUnits = [
    { value: "min" as const, ...copy.durationUnits.min },
    { value: "hr" as const, ...copy.durationUnits.hr },
    { value: "day" as const, ...copy.durationUnits.day },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          id={`${idPrefix}-name`}
          label={
            <>
              <span className="font-semibold text-gray-800">{copy.name}</span>{" "}
              <span className="text-red-500">*</span>
            </>
          }
          placeholder={namePlaceholder}
          value={entry.name}
          onChange={(e) => onChange("name", e.target.value)}
        />

        <DurationInput
          id={`${idPrefix}-duration`}
          label={<span className="font-semibold text-gray-800">{copy.duration}</span>}
          value={entry.durationRhythm}
          units={durationUnits}
          onChange={(v: DurationValue) => onChange("durationRhythm", v)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="block font-semibold text-gray-800 text-base" htmlFor={`${idPrefix}-desc`}>
          {copy.description}
        </label>
        <textarea
          id={`${idPrefix}-desc`}
          className={textareaClass}
          placeholder={copy.descriptionPlaceholder}
          value={entry.description}
          onChange={(e) => onChange("description", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="block font-semibold text-gray-800 text-base" htmlFor={`${idPrefix}-risks`}>
          {copy.risks}
        </label>
        <textarea
          id={`${idPrefix}-risks`}
          className={textareaClass}
          placeholder={copy.risksPlaceholder}
          value={entry.risks}
          onChange={(e) => onChange("risks", e.target.value)}
        />
      </div>
    </div>
  );
}
