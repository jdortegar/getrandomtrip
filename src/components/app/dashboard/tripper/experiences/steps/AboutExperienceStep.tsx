'use client';

import { FormField, FormSelectField } from '@/components/ui/FormField';
import { EXPERIENCE_TYPES, EXPERIENCE_LEVELS } from '@/lib/constants/packages';
import type { TripperExperiencesDict } from '@/lib/types/dictionary';
import type { ExperienceFormDraft, ExperienceFormDraftOnChange } from '@/types/tripper';

interface Props {
  copy: TripperExperiencesDict['form'];
  form: ExperienceFormDraft;
  onChange: ExperienceFormDraftOnChange;
}

const req = <span className="text-red-500 ml-0.5">*</span>;

export function AboutExperienceStep({ copy, form, onChange }: Props) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-500 -mt-1">
        {copy.contentTabs[0]?.substeps[0]?.description}
      </p>

      <FormField
        id="exp-title"
        label={<>{copy.fields.title}{req}</>}
        placeholder={copy.fields.title}
        value={form.title}
        onChange={(e) => onChange('title', e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormSelectField
          id="exp-type"
          label={<>{copy.fields.type}{req}</>}
          value={form.type}
          onChange={(e) => onChange('type', e.target.value)}
        >
          {EXPERIENCE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </FormSelectField>

        <FormSelectField
          id="exp-level"
          label={<>{copy.fields.level}{req}</>}
          value={form.level}
          onChange={(e) => onChange('level', e.target.value)}
        >
          <option value="" disabled>{copy.fields.level}</option>
          {EXPERIENCE_LEVELS.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </FormSelectField>
      </div>

      <FormField
        id="exp-teaser"
        label={<>{copy.fields.teaser}{req}</>}
        placeholder={copy.fields.teaserHint}
        maxLength={150}
        value={form.teaser}
        onChange={(e) => onChange('teaser', e.target.value)}
      />

      <div className="flex flex-col gap-2">
        <label className="block font-normal text-gray-600 text-base" htmlFor="exp-description">
          {copy.fields.description}{req}
        </label>
        <textarea
          id="exp-description"
          className="bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-base min-h-[160px] resize-none focus:ring-2 focus:ring-neutral-900"
          placeholder={copy.fields.description}
          value={form.description}
          onChange={(e) => onChange('description', e.target.value)}
        />
      </div>
    </div>
  );
}
