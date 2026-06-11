"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { X, ImagePlus } from "lucide-react";
import Image from "next/image";
import { FormField } from "@/components/ui/FormField";
import { DurationInput } from "@/components/ui/DurationInput";
import { RichTextInput } from "@/components/ui/RichTextInput";
import type { TripperExperiencesDict } from "@/lib/types/dictionary";
import type {
  ActivityEntry,
  ExperienceFormDraft,
  ExperienceFormDraftOnChange,
  DurationValue,
} from "@/types/tripper";
import type { ExperienceImageState } from "../NewExperienceShell";

interface Props {
  copy: TripperExperiencesDict["form"];
  form: ExperienceFormDraft;
  onChange: ExperienceFormDraftOnChange;
  imageState: ExperienceImageState;
}

const chipClass =
  "flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700";

const uploadTileClass =
  "flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors";

const EMPTY_ENTRY: ActivityEntry = {
  name: "",
  durationRhythm: null,
  description: "",
  risks: "",
  image: null,
};

const req = <span className="text-red-500 ml-0.5">*</span>;

export function ActivitiesListStep({ copy, form, onChange, imageState }: Props) {
  const { fields } = copy;
  const { onEntryImageSelect, onEntryImageRemove } = imageState;

  const [tagInput, setTagInput] = useState("");
  const entryImageRefs = useRef<(HTMLInputElement | null)[]>([]);

  function addTag(raw: string) {
    const value = raw.trim().replace(/^#/, "");
    if (!value || form.tags.includes(value)) return;
    onChange("tags", [...form.tags, value]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    onChange("tags", form.tags.filter((t) => t !== tag));
  }

  function onTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
  }

  const durationUnits = [
    { value: "min" as const, label: fields.durationUnitMin, hint: fields.durationHintMin },
    { value: "hr" as const, label: fields.durationUnitHr, hint: fields.durationHintHr },
    { value: "day" as const, label: fields.durationUnitDay, hint: fields.durationHintDay },
  ];

  function updateEntry<K extends keyof ActivityEntry>(index: number, key: K, value: ActivityEntry[K]) {
    const updated = form.activities.map((entry, i) =>
      i === index ? { ...entry, [key]: value } : entry,
    );
    onChange("activities", updated);
  }

  function addEntry() {
    onChange("activities", [...form.activities, { ...EMPTY_ENTRY }]);
  }

  function removeEntry(index: number) {
    onChange(
      "activities",
      form.activities.filter((_, i) => i !== index),
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-500 -mt-1">
        {copy.contentTabs[2]?.substeps[0]?.description}
      </p>

      <div className="space-y-6">
        {form.activities.map((entry, index) => (
          <div key={index} className="space-y-4">
            {index > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm text-neutral-500">
                  {fields.activityLabel} {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeEntry(index)}
                  className="flex items-center gap-1 text-xs text-neutral-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  {fields.removeActivity}
                </button>
              </div>
            )}

            {/* Row 1: Name (required) + Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
              <FormField
                id={`act-name-${index}`}
                label={<>{fields.activityName}{req}</>}
                placeholder={fields.activityNamePlaceholder}
                value={entry.name}
                onChange={(e) => updateEntry(index, "name", e.target.value)}
              />
              <DurationInput
                id={`act-duration-${index}`}
                label={fields.activityDurationRhythm}
                value={entry.durationRhythm}
                units={durationUnits}
                onChange={(v: DurationValue) => updateEntry(index, "durationRhythm", v)}
              />
            </div>

            {/* Row 2: Description */}
            <RichTextInput
              id={`act-desc-${index}`}
              label={fields.activityDesc}
              placeholder={fields.activityDescPlaceholder}
              value={entry.description}
              onChange={(html) => updateEntry(index, "description", html)}
            />

            {/* Row 3: Risks */}
            <RichTextInput
              id={`act-risks-${index}`}
              label={fields.activityRisks}
              placeholder={fields.activityRisksPlaceholder}
              value={entry.risks}
              onChange={(html) => updateEntry(index, "risks", html)}
            />

            {/* Row 4: Entry image upload tile */}
            <div className="space-y-1.5">
              <label className="block text-sm font-normal text-gray-600">
                {fields.entryImageLabel}
              </label>
              <div className="flex items-start gap-3">
                {entry.image ? (
                  <div className="relative h-24 w-24 shrink-0 rounded-xl overflow-hidden group">
                    <Image
                      src={entry.image}
                      alt={`Activity ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="96px"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => onEntryImageRemove("activities", index)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => entryImageRefs.current[index]?.click()}
                    className={uploadTileClass}
                  >
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-xs text-center leading-tight px-1">
                      {fields.uploadImage}
                    </span>
                  </button>
                )}
              </div>
              <input
                ref={(el) => { entryImageRefs.current[index] = el; }}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onEntryImageSelect("activities", index, file);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addEntry}
        className="w-full rounded-xl border border-dashed border-gray-300 py-4 text-sm text-neutral-500 hover:border-gray-400 hover:text-neutral-700 transition-colors"
      >
        + {fields.addAnotherActivity}
      </button>

      {/* Shared tags block */}
      <div className="space-y-3">
        <label className="block font-normal text-gray-600 text-base">{fields.tags}</label>
        <input
          className="bg-gray-100 outline-none placeholder:text-gray-400 px-4 py-3 rounded-xl text-gray-900 w-full text-base"
          placeholder={fields.tagInput}
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={onTagKeyDown}
          onBlur={() => addTag(tagInput)}
        />
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.tags.map((tag) => (
              <span key={tag} className={chipClass}>
                <span className="text-gray-400">#</span>
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
