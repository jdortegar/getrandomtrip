"use client";

import { useParams } from "next/navigation";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import { DaysInput } from "@/components/ui/DaysInput";
import { MultiSelectInput } from "@/components/ui/MultiSelectInput";
import { getExperienceTypes, getExcuseOptionsForType } from "@/lib/constants/packages";
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

const MONTH_KEYS = [
  "01","02","03","04","05","06","07","08","09","10","11","12",
];

export function AboutExperienceStep({ copy, form, onChange }: Props) {
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const experienceTypes = getExperienceTypes(locale);
  const excuseOptions = getExcuseOptionsForType(form.type, locale);

  const handleTypeChange = (value: string[]) => {
    onChange("type", value);
    onChange("excuseKey", "");
  };

  const monthOptions = MONTH_KEYS.map((value, i) => ({
    value,
    label: new Intl.DateTimeFormat(locale, { month: "long" }).format(
      new Date(2024, i, 1),
    ),
  }));

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-500 -mt-1">
        {copy.contentTabs[0]?.substeps[0]?.description}
      </p>

      {/* Row 1: Título (wide) + Tipo de experiencia */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="col-span-2">
          <FormField
            id="exp-title"
            label={<>{copy.fields.title}{req}</>}
            placeholder={copy.fields.titlePlaceholder}
            value={form.title}
            onChange={(e) => onChange("title", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <MultiSelectInput
            id="exp-type"
            label={<>{copy.fields.type}{req}</>}
            options={experienceTypes.map((t) => ({ value: t.value, label: t.label }))}
            value={form.type}
            onChange={handleTypeChange}
            placeholder="Select type..."
          />
          <p className="text-xs text-neutral-400">{copy.fields.typeHint}</p>
        </div>
      </div>

      {/* Row 2: Duración + Meses + Excusa */}
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr] gap-4">
        <DaysInput
          id="exp-min-nights"
          hintTemplate={copy.fields.minNightsHint}
          label={copy.fields.minNights}
          value={form.minNights + 1}
          onChange={(days) => onChange("minNights", days - 1)}
        />

        <MultiSelectInput
          id="exp-season"
          label={copy.fields.season}
          options={monthOptions}
          value={form.season}
          onChange={(v) => onChange("season", v)}
          placeholder={copy.fields.seasonPlaceholder}
          hint={copy.fields.seasonHint}
        />

        <div className="flex flex-col gap-1">
          <FormSelectField
            id="exp-excuse"
            label={copy.fields.excuseKey}
            value={form.excuseKey}
            onChange={(e) => onChange("excuseKey", e.target.value)}
          >
            <option value="" disabled>
              {copy.fields.excuseKeyPlaceholder}
            </option>
            {excuseOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </FormSelectField>
          <p className="text-xs text-neutral-400">{copy.fields.excuseKeyHint}</p>
        </div>
      </div>

      {/* Row 3: Teaser */}
      <FormField
        id="exp-teaser"
        label={<>{copy.fields.teaser}{req}</>}
        placeholder={copy.fields.teaserHint}
        maxLength={150}
        value={form.teaser}
        onChange={(e) => onChange("teaser", e.target.value)}
      />

      {/* Row 4: Descripción completa */}
      <div className="flex flex-col gap-2">
        <label
          className="block font-normal text-gray-600 text-base"
          htmlFor="exp-description"
        >
          {copy.fields.description}
          {req}
        </label>
        <textarea
          id="exp-description"
          className="bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-base min-h-[160px] resize-none"
          placeholder={copy.fields.descriptionPlaceholder}
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
        />
      </div>
    </div>
  );
}
