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
      <p className="text-sm text-neutral-500 -mt-1">
        {copy.fields.pricingDescription}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <FormField
            id="price-base"
            label={copy.fields.basePrice}
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={form.basePrice === 0 ? "" : String(form.basePrice)}
            onChange={(e) => {
              const stripped = e.target.value.replace(/[^0-9]/g, "");
              onChange("basePrice", stripped === "" ? 0 : Number(stripped));
            }}
          />
          {copy.fields.basePriceHint && (
            <p className="text-xs text-neutral-400">
              {copy.fields.basePriceHint}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <FormField
            id="price-display"
            label={copy.fields.displayPrice}
            placeholder="Ej: Desde USD 450"
            value={form.displayPrice}
            onChange={(e) => onChange("displayPrice", e.target.value)}
          />
          {copy.fields.displayPriceHint && (
            <p className="text-xs text-neutral-400">
              {copy.fields.displayPriceHint}
            </p>
          )}
        </div>
      </div>

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
