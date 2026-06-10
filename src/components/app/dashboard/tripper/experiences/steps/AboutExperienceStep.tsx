"use client";

import { useParams } from "next/navigation";
import { FormField } from "@/components/ui/FormField";
import { DaysInput } from "@/components/ui/DaysInput";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
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
    onChange("excuseKey", []);
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

        <MultiSelectInput
          id="exp-excuse"
          label={copy.fields.excuseKey}
          options={excuseOptions}
          placeholder={copy.fields.excuseKeyPlaceholder}
          hint={copy.fields.excuseKeyHint}
          value={form.excuseKey}
          onChange={(v) => onChange("excuseKey", v)}
        />
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
      <TextAreaInput
        id="exp-description"
        label={<>{copy.fields.description}{req}</>}
        placeholder={copy.fields.descriptionPlaceholder}
        value={form.description}
        onChange={(e) => onChange("description", e.target.value)}
      />
    </div>
  );
}
