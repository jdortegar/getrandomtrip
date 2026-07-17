"use client";

import { useRef } from "react";
import { useParams } from "next/navigation";
import { Check, ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import { validateImageSize } from "@/lib/utils/validateImageSize";
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
}

const req = <span className="text-red-500 ml-0.5">*</span>;

const MONTH_KEYS = [
  "01","02","03","04","05","06","07","08","09","10","11","12",
];

export function AboutExperienceStep({ copy, form, onChange, imageState, changedFieldSet, peek }: Props) {
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const { onHeroSelect, onHeroRemove } = imageState;
  const heroRef = useRef<HTMLInputElement>(null);
  const experienceTypes = getExperienceTypes(locale);
  const excuseOptions = getExcuseOptionsForType(form.type, locale);
  const ch = (f: string) => changedFieldSet?.has(f) ? "ring-2 ring-amber-400 rounded-xl" : undefined;

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

  const maxNightsAllowed = MAX_NIGHTS_BY_LEVEL[form.level];
  const maxNightsHint =
    maxNightsAllowed != null
      ? copy.fields.maxNightsHint.replace("{n}", String(maxNightsAllowed))
      : null;

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
          onChange={(e) => onChange("level", e.target.value)}
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
            id="exp-min-nights"
            hintTemplate={copy.fields.minNightsHint}
            label={copy.fields.minNights}
            value={form.minNights + 1}
            onChange={(days) => onChange("minNights", days - 1)}
            inputClassName={ch("minNights")}
          />
          {maxNightsHint && (
            <p className="text-xs text-neutral-400">{maxNightsHint}</p>
          )}
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

        {form.heroImage ? (
          <div className={`relative w-40 aspect-video rounded-lg overflow-hidden group shrink-0${ch("heroImage") ? ` ${ch("heroImage")}` : ""}`}>
            <Image
              src={form.heroImage}
              alt="Hero"
              fill
              className="object-cover"
              sizes="160px"
              unoptimized
            />
            <button
              type="button"
              onClick={onHeroRemove}
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => heroRef.current?.click()}
            className={`flex w-40 aspect-video flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors shrink-0${ch("heroImage") ? ` ${ch("heroImage")}` : ""}`}
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-xs">{copy.fields.uploadImage}</span>
          </button>
        )}

        <p className="text-xs text-neutral-400">{copy.fields.heroImageSizeHint}</p>
        <input
          ref={heroRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const result = await validateImageSize(file, 1280, 720);
            if (!result.valid) {
              toast.error(`${copy.fields.imageTooSmall} — min 1280 × 720 px (actual: ${result.width} × ${result.height} px)`);
              e.target.value = "";
              return;
            }
            onHeroSelect(file);
            e.target.value = "";
          }}
        />
        <p className="text-xs text-neutral-400">{copy.fields.copyrightHint}</p>
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
