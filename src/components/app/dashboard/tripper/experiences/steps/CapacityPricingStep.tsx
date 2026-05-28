'use client';

import { FormField } from '@/components/ui/FormField';
import type { TripperExperiencesDict } from '@/lib/types/dictionary';
import type { ExperienceFormDraft, ExperienceFormDraftOnChange } from '@/types/tripper';

interface Props {
  copy: TripperExperiencesDict['form'];
  form: ExperienceFormDraft;
  onChange: ExperienceFormDraftOnChange;
}

export function CapacityPricingStep({ copy, form, onChange }: Props) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-500 -mt-1">
        {copy.fields.pricingDescription}
      </p>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="price-estimated-cost"
          label={copy.fields.estimatedCost}
          placeholder="Ej:USD 2000"
          value={form.estimatedCost}
          onChange={(e) => onChange('estimatedCost', e.target.value)}
        />
        <FormField
          id="price-season"
          label={copy.fields.season}
          placeholder="Alta o Baja, según experiencia"
          value={form.season}
          onChange={(e) => onChange('season', e.target.value)}
        />
      </div>
    </div>
  );
}
