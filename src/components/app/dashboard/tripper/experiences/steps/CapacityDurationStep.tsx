'use client';

import { FormField } from '@/components/ui/FormField';
import { MAX_NIGHTS_BY_LEVEL } from '@/lib/constants/packages';
import type { TripperExperiencesDict } from '@/lib/types/dictionary';
import type { ExperienceFormDraft, ExperienceFormDraftOnChange } from '@/types/tripper';

interface Props {
  copy: TripperExperiencesDict['form'];
  form: ExperienceFormDraft;
  onChange: ExperienceFormDraftOnChange;
}

const req = <span className="text-red-500 ml-0.5">*</span>;

export function CapacityDurationStep({ copy, form, onChange }: Props) {
  const maxAllowed = MAX_NIGHTS_BY_LEVEL[form.level];
  const hint = maxAllowed != null
    ? copy.fields.maxNightsHint.replace('{n}', String(maxAllowed))
    : null;

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-500 -mt-1">
        {copy.contentTabs[1]?.substeps[0]?.description}
      </p>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="cap-min-pax"
          label={<>{copy.fields.minPax}{req}</>}
          type="number"
          min={1}
          value={form.minPax}
          onChange={(e) => onChange('minPax', Math.max(1, Number(e.target.value)))}
        />
        <FormField
          id="cap-max-pax"
          label={<>{copy.fields.maxPax}{req}</>}
          type="number"
          min={1}
          value={form.maxPax}
          onChange={(e) => onChange('maxPax', Math.max(1, Number(e.target.value)))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="cap-max-nights"
          label={copy.fields.maxNights}
          type="number"
          min={1}
          max={maxAllowed ?? undefined}
          value={form.maxNights}
          onChange={(e) => onChange('maxNights', Math.max(1, Number(e.target.value)))}
        />
      </div>

      {hint && <p className="text-sm text-neutral-400">{hint}</p>}
    </div>
  );
}
