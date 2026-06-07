"use client";

import { FormField } from "@/components/ui/FormField";
import { MAX_NIGHTS_BY_LEVEL } from "@/lib/constants/packages";
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

const req = <span className="text-red-500 ml-0.5">*</span>;

const numDisplay = (n: number) => (n === 0 ? "" : String(n));
const parseNum = (s: string) => {
  const stripped = s.replace(/[^0-9]/g, "");
  return stripped === "" ? 0 : Number(stripped);
};

export function CapacityDurationStep({ copy, form, onChange }: Props) {
  const maxAllowed = MAX_NIGHTS_BY_LEVEL[form.level];
  const hint =
    maxAllowed != null
      ? copy.fields.maxNightsHint.replace("{n}", String(maxAllowed))
      : null;

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-500 -mt-1">
        {copy.contentTabs[1]?.substeps[0]?.description}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          id="cap-min-pax"
          label={
            <>
              {copy.fields.minPax}
              {req}
            </>
          }
          type="text"
          inputMode="numeric"
          value={numDisplay(form.minPax)}
          onChange={(e) => onChange("minPax", parseNum(e.target.value))}
          onBlur={() => {
            if (form.minPax < 1) onChange("minPax", 1);
          }}
        />
        <FormField
          id="cap-max-pax"
          label={
            <>
              {copy.fields.maxPax}
              {req}
            </>
          }
          type="text"
          inputMode="numeric"
          value={numDisplay(form.maxPax)}
          onChange={(e) => onChange("maxPax", parseNum(e.target.value))}
          onBlur={() => {
            if (form.maxPax < 1) onChange("maxPax", 1);
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          id="cap-min-nights"
          label={copy.fields.minNights}
          type="text"
          inputMode="numeric"
          value={numDisplay(form.minNights)}
          onChange={(e) => onChange("minNights", parseNum(e.target.value))}
          onBlur={() => {
            if (form.minNights < 1) onChange("minNights", 1);
          }}
        />
        <FormField
          id="cap-max-nights"
          label={copy.fields.maxNights}
          type="text"
          inputMode="numeric"
          value={numDisplay(form.maxNights)}
          onChange={(e) => onChange("maxNights", parseNum(e.target.value))}
          onBlur={() => {
            if (form.maxNights < 1) onChange("maxNights", 1);
          }}
        />
      </div>

      {hint && <p className="text-sm text-neutral-400">{hint}</p>}
    </div>
  );
}
