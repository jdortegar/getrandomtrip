"use client";

import { useParams } from "next/navigation";
import { Check } from "lucide-react";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import { ImageUploadTile } from "@/components/ui/ImageUploadTile";
import { DaysInput } from "@/components/ui/DaysInput";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import { MultiSelectInput } from "@/components/ui/MultiSelectInput";
import {
  getExperienceTypes,
  getExcuseOptionsForType,
  EXPERIENCE_LEVELS,
  MAX_NIGHTS_BY_LEVEL,
} from "@/lib/constants/packages";
import type { TripperExperiencesDict } from "@/lib/types/dictionary";
import type {
  ExperienceFormDraft,
  ExperienceFormDraftOnChange,
} from "@/types/tripper";
import type { FieldPeek } from "@/components/ui/field-peek";
import type { ExperienceImageState } from "../NewExperienceShell";

interface Props {
  copy: TripperExperiencesDict["form"];
  form: ExperienceFormDraft;
  onChange: ExperienceFormDraftOnChange;
  imageState: ExperienceImageState;
  changedFieldSet?: Set<string>;
  /** Builds the peek toggle for an eligible field; `undefined` when peek is not available. */
  peek?: (field: string) => FieldPeek | undefined;
  /** XSED Drop is an admin-only experience type — offered only when true. */
  isAdmin?: boolean;
}

const req = <span className="text-red-500 ml-0.5">*</span>;

const MONTH_KEYS = [
  "01","02","03","04","05","06","07","08","09","10","11","12",
];

export function AboutExperienceStep({ copy, form, onChange, imageState, changedFieldSet, peek, isAdmin }: Props) {
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const { onHeroSelect, onHeroRemove } = imageState;
  // XSED Drop is fulfilled centrally by the admin team, not authored by individual trippers.
  const experienceTypes = getExperienceTypes(locale).filter(
    (t) => isAdmin || t.value !== "XSED",
  );
  const excuseOptions = getExcuseOptionsForType(form.type, locale);
  const ch = (f: string) => changedFieldSet?.has(f) ? "ring-2 ring-amber-400 rounded-xl" : undefined;

  const handleTypeChange = (value: string[]) => {
    onChange("type", value);
    onChange("excuseKey", []);
  };

  const handleLevelChange = (value: string) => {
    onChange("level", value);
    const fixedNights = MAX_NIGHTS_BY_LEVEL[value];
    if (fixedNights != null) {
      onChange("minNights", fixedNights);
      onChange("maxNights", fixedNights);
    }
  };

  const monthOptions = MONTH_KEYS.map((value, i) => ({
    value,
    label: new Intl.DateTimeFormat(locale, { month: "long" }).format(
      new Date(2024, i, 1),
    ),
  }));

  const maxNightsAllowed = MAX_NIGHTS_BY_LEVEL[form.level];

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-500 -mt-1">
        {copy.contentTabs[0]?.substeps[0]?.description}
      </p>

      {/* Row 1: Título (wide) + Tipo de experiencia + Nivel */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="col-span-2">
          <FormField
            id="exp-title"
            label={<>{copy.fields.title}{req}</>}
            placeholder={copy.fields.titlePlaceholder}
            value={form.title}
            onChange={(e) => onChange("title", e.target.value)}
            className={ch("title")}
            peek={peek?.("title")}
          />
        </div>
        <div className="flex flex-col gap-1">
          <MultiSelectInput
            id="exp-type"
            label={<>{copy.fields.type}{req}</>}
            options={experienceTypes.map((t) => ({ value: t.value, label: t.label }))}
            value={form.type}
            onChange={handleTypeChange}
            placeholder={copy.fields.typePlaceholder}
            triggerClassName={ch("type")}
          />
          <p className="text-xs text-neutral-400">{copy.fields.typeHint}</p>
        </div>
        <FormSelectField
          id="exp-level"
          label={<>{copy.fields.level}{req}</>}
          className={ch("level")}
          value={form.level}
          onChange={(e) => handleLevelChange(e.target.value)}
        >
          {EXPERIENCE_LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </FormSelectField>
      </div>

      {/* Row 2: Duración + Meses + Excusa */}
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr] gap-4">
        <div className="flex flex-col gap-1">
          <DaysInput
            key={form.level}
            id="exp-min-nights"
            hintTemplate={copy.fields.minNightsHint}
            label={copy.fields.minNights}
            value={form.minNights + 1}
            onChange={(days) => onChange("minNights", days - 1)}
            inputClassName={ch("minNights")}
            disabled={maxNightsAllowed != null}
          />
        </div>

        <MultiSelectInput
          id="exp-season"
          label={copy.fields.season}
          options={monthOptions}
          value={form.season}
          onChange={(v) => onChange("season", v)}
          placeholder={copy.fields.seasonPlaceholder}
          hint={copy.fields.seasonHint}
          triggerClassName={ch("season")}
        />

        <MultiSelectInput
          id="exp-excuse"
          label={copy.fields.excuseKey}
          options={excuseOptions}
          placeholder={copy.fields.excuseKeyPlaceholder}
          hint={copy.fields.excuseKeyHint}
          value={form.excuseKey}
          onChange={(v) => onChange("excuseKey", v)}
          triggerClassName={ch("excuseKey")}
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
        className={ch("teaser")}
        peek={peek?.("teaser")}
      />

      {/* Row 4: Descripción completa */}
      <TextAreaInput
        id="exp-description"
        label={<>{copy.fields.description}{req}</>}
        placeholder={copy.fields.descriptionPlaceholder}
        value={form.description}
        onChange={(e) => onChange("description", e.target.value)}
        className={ch("description")}
        peek={peek?.("description")}
      />

      {/* Hero image — full-width banner upload */}
      <div className="space-y-2">
        <label className="block font-normal text-gray-600 text-base">
          {copy.fields.heroImage}
        </label>
        <p className="text-xs text-neutral-400 -mt-1">{copy.fields.heroImageHint}</p>

        <ImageUploadTile
          alt="Hero"
          className={ch("heroImage")}
          copyrightHint={copy.fields.copyrightHint}
          minHeight={720}
          minWidth={1280}
          onRemove={onHeroRemove}
          onSelect={onHeroSelect}
          sizeHint={copy.fields.heroImageSizeHint}
          tooSmallLabel={copy.fields.imageTooSmall}
          uploadLabel={copy.fields.uploadImage}
          value={form.heroImage}
        />
      </div>

      {/* Blog post checkbox */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div className="relative shrink-0">
          <input
            type="checkbox"
            checked={form.createBlogPost}
            onChange={(e) => onChange("createBlogPost", e.target.checked)}
            className="peer sr-only"
          />
          <div
            className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all duration-200 ${
              form.createBlogPost
                ? "border-blue-500 bg-blue-500"
                : "border-gray-300 bg-white"
            }`}
          >
            {form.createBlogPost && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
          </div>
        </div>
        <div>
          <p className="font-normal text-gray-600 text-base">
            {copy.fields.createBlogPost}
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">
            {copy.fields.createBlogPostHint}
          </p>
        </div>
      </label>
    </div>
  );
}
