"use client";

import { useRef, useState } from "react";
import { Loader2, X, ImagePlus } from "lucide-react";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import { EXPERIENCE_TYPES, EXPERIENCE_LEVELS } from "@/lib/constants/packages";
import Img from "@/components/common/Img";
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

function ChipInput({
  id,
  label,
  placeholder,
  values,
  onAdd,
  onRemove,
}: {
  id: string;
  label: string;
  placeholder: string;
  values: string[];
  onAdd: (v: string) => void;
  onRemove: (i: number) => void;
}) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (val) {
        onAdd(val);
        e.currentTarget.value = "";
      }
    }
  }
  return (
    <div className="flex flex-col gap-2">
      <label className="block font-normal text-gray-600 text-base" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-base"
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
      />
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {values.map((v, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 bg-neutral-100 border border-neutral-200 rounded-full px-3 py-1 text-sm text-neutral-700"
            >
              {v}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-neutral-400 hover:text-red-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function HeroImageUpload({
  label,
  hint,
  value,
  onAdd,
  onRemove,
}: {
  label: string;
  hint?: string;
  value: string;
  onAdd: (url: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("feature", "experience");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string };
      if (data.url) onAdd(data.url);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="block font-normal text-gray-600 text-base">
        {label}
      </label>

      {value ? (
        <div className="relative w-full h-52 rounded-xl overflow-hidden border border-gray-200 group">
          <Img
            src={value}
            alt="Hero"
            width={900}
            height={208}
            className="object-cover w-full h-full"
            unoptimized
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 w-full h-52 rounded-xl border-2 border-dashed border-gray-300 text-neutral-400 hover:border-gray-400 hover:text-neutral-600 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <ImagePlus className="h-6 w-6" />
          )}
          <span className="text-sm">{uploading ? "…" : "Subir imagen"}</span>
        </button>
      )}

      {hint && <p className="text-xs text-neutral-400">{hint}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}

export function AboutExperienceStep({ copy, form, onChange }: Props) {
  const isActive = form.status === "ACTIVE";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between -mt-1">
        <p className="text-sm text-neutral-500">
          {copy.contentTabs[0]?.substeps[0]?.description}
        </p>

        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          onClick={() => onChange("status", isActive ? "DRAFT" : "ACTIVE")}
          className="flex items-center gap-2 group"
        >
          <span
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
              isActive ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                isActive ? "translate-x-[18px]" : "translate-x-[3px]"
              }`}
            />
          </span>
          <span
            className={`text-xs font-medium ${isActive ? "text-green-600" : "text-gray-400"}`}
          >
            {isActive ? copy.fields.statusActive : copy.fields.statusDraft}
          </span>
        </button>
      </div>

      <FormField
        id="exp-title"
        label={
          <>
            {copy.fields.title}
            {req}
          </>
        }
        placeholder={copy.fields.title}
        value={form.title}
        onChange={(e) => onChange("title", e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormSelectField
          id="exp-type"
          label={
            <>
              {copy.fields.type}
              {req}
            </>
          }
          value={form.type}
          onChange={(e) => onChange("type", e.target.value)}
        >
          {EXPERIENCE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </FormSelectField>

        <FormSelectField
          id="exp-level"
          label={
            <>
              {copy.fields.level}
              {req}
            </>
          }
          value={form.level}
          onChange={(e) => onChange("level", e.target.value)}
        >
          <option value="" disabled>
            {copy.fields.level}
          </option>
          {EXPERIENCE_LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </FormSelectField>
      </div>

      <FormField
        id="exp-teaser"
        label={
          <>
            {copy.fields.teaser}
            {req}
          </>
        }
        placeholder={copy.fields.teaserHint}
        maxLength={150}
        value={form.teaser}
        onChange={(e) => onChange("teaser", e.target.value)}
      />

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
          placeholder={copy.fields.description}
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
        />
      </div>

      <HeroImageUpload
        label={copy.fields.heroImage}
        hint={copy.fields.heroImageHint}
        value={form.heroImage}
        onAdd={(url) => onChange("heroImage", url)}
        onRemove={() => onChange("heroImage", "")}
      />

      <ChipInput
        id="exp-tags"
        label={copy.fields.tags}
        placeholder={copy.fields.tagInput}
        values={form.tags}
        onAdd={(v) => onChange("tags", [...form.tags, v])}
        onRemove={(i) =>
          onChange(
            "tags",
            form.tags.filter((_, idx) => idx !== i),
          )
        }
      />

      <ChipInput
        id="exp-highlights"
        label={copy.fields.highlights}
        placeholder={copy.fields.highlightInput}
        values={form.highlights}
        onAdd={(v) => onChange("highlights", [...form.highlights, v])}
        onRemove={(i) =>
          onChange(
            "highlights",
            form.highlights.filter((_, idx) => idx !== i),
          )
        }
      />
    </div>
  );
}
