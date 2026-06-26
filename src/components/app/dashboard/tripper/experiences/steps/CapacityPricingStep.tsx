"use client";

import { FormField } from "@/components/ui/FormField";
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

export function CapacityPricingStep({ copy, form, onChange }: Props) {
  return (
    <div className="space-y-5">
      <FormField
        id="price-estimated-cost"
        label={copy.fields.estimatedCost}
        placeholder="Ej: USD 2000"
        value={form.estimatedCost}
        onChange={(e) => onChange("estimatedCost", e.target.value)}
      />
    </div>
  );
}
