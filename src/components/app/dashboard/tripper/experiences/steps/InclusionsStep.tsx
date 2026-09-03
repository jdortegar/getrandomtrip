"use client";

import { ChipListInput } from "@/components/ui/ChipListInput";
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

export function InclusionsStep({ copy, form, onChange }: Props) {
  const { fields } = copy;

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink -mt-1">
        {copy.contentTabs[3]?.substeps[2]?.description}
      </p>

      <ChipListInput
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

      <ChipListInput
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
