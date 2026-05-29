'use client';

import { FormField, FormSelectField } from '@/components/ui/FormField';
import { TRANSPORT_MODES, MAX_TRAVEL_TIME_OPTIONS, TIME_PREFERENCES } from '@/lib/constants/packages';
import type { TripperExperiencesDict } from '@/lib/types/dictionary';
import type { ExperienceFormDraft, ExperienceFormDraftOnChange } from '@/types/tripper';

interface Props {
  copy: TripperExperiencesDict['form'];
  form: ExperienceFormDraft;
  onChange: ExperienceFormDraftOnChange;
}

export function LogisticsTransportStep({ copy, form, onChange }: Props) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-500 -mt-1">
        {copy.contentTabs[2]?.substeps[0]?.description}
      </p>

      <div className="grid grid-cols-2 gap-4">
        <FormSelectField
          id="log-transport"
          label={copy.fields.suggestedTransport}
          value={form.transport}
          onChange={(e) => onChange('transport', e.target.value)}
        >
          {TRANSPORT_MODES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </FormSelectField>

        <FormField
          id="log-travel-time"
          label={copy.fields.estimatedTravelTime}
          placeholder="Ej: 12hs."
          value={form.travelTime}
          onChange={(e) => onChange('travelTime', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormSelectField
          id="log-max-travel-time"
          label={copy.fields.maxTravelTime}
          value={form.maxTravelTime}
          onChange={(e) => onChange('maxTravelTime', e.target.value)}
        >
          {MAX_TRAVEL_TIME_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </FormSelectField>

        <div />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormSelectField
          id="log-depart-pref"
          label={copy.fields.departPref}
          value={form.departPref}
          onChange={(e) => onChange('departPref', e.target.value)}
        >
          {TIME_PREFERENCES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </FormSelectField>

        <FormSelectField
          id="log-arrive-pref"
          label={copy.fields.arrivePref}
          value={form.arrivePref}
          onChange={(e) => onChange('arrivePref', e.target.value)}
        >
          {TIME_PREFERENCES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </FormSelectField>
      </div>

      {copy.fields.compatibilityHint && (
        <p className="text-xs text-neutral-400">{copy.fields.compatibilityHint}</p>
      )}
    </div>
  );
}
