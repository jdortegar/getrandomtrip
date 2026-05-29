'use client';

import { FormField, FormSelectField } from '@/components/ui/FormField';
import { CLIMATE_OPTIONS, getExcuseOptionsForType } from '@/lib/constants/packages';
import type { TripperExperiencesDict } from '@/lib/types/dictionary';
import type { ExperienceFormDraft, ExperienceFormDraftOnChange } from '@/types/tripper';

interface Props {
  copy: TripperExperiencesDict['form'];
  form: ExperienceFormDraft;
  onChange: ExperienceFormDraftOnChange;
}

const req = <span className="text-red-500 ml-0.5">*</span>;

export function AboutDestinationStep({ copy, form, onChange }: Props) {
  const excuseOptions = getExcuseOptionsForType(form.type);

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-500 -mt-1">
        {copy.contentTabs[0]?.substeps[1]?.description}
      </p>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="dest-country"
          label={<>{copy.fields.country}{req}</>}
          placeholder="Ej: Argentina"
          value={form.destinationCountry}
          onChange={(e) => onChange('destinationCountry', e.target.value)}
        />
        <FormField
          id="dest-city"
          label={<>{copy.fields.city}{req}</>}
          placeholder="Ej: Buenos Aires"
          value={form.destinationCity}
          onChange={(e) => onChange('destinationCity', e.target.value)}
        />
      </div>

      <FormSelectField
        id="dest-excuse"
        label={<>{copy.fields.excuseKey}{req}</>}
        value={form.excuseKey}
        onChange={(e) => onChange('excuseKey', e.target.value)}
      >
        <option value="" disabled>{copy.fields.excuseKey}</option>
        {excuseOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </FormSelectField>

      <div className="grid grid-cols-2 gap-4">
        <FormSelectField
          id="dest-climate"
          label={copy.fields.climate}
          value={form.climate}
          onChange={(e) => onChange('climate', e.target.value)}
        >
          {CLIMATE_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </FormSelectField>
      </div>

      {copy.fields.excuseKeyHint && (
        <p className="text-sm text-neutral-400">{copy.fields.excuseKeyHint}</p>
      )}
    </div>
  );
}
