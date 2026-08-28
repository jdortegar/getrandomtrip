"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import { DurationInput } from "@/components/ui/DurationInput";
import { ImageUploadTile } from "@/components/ui/ImageUploadTile";
import { RichTextInput } from "@/components/ui/RichTextInput";
import type { FieldPeek } from "@/components/ui/field-peek";
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
  isReadOnly?: boolean;
  /** Per-entry, per-field "peek at original" toggle; undefined outside adminReadOnly review. */
  peek?: (index: number, entryKey: keyof ActivityEntry) => FieldPeek | undefined;
}

const chipClass =
  "flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700";

const EMPTY_ENTRY: ActivityEntry = {
  name: "",
  durationRhythm: null,
  description: "",
  risks: "",
  image: null,
};

const req = <span className="text-red-500 ml-0.5">*</span>;

export function ActivitiesListStep({ copy, form, onChange, imageState, isReadOnly, peek }: Props) {
  const { fields } = copy;
  const { onEntryImageSelect, onEntryImageRemove } = imageState;

  const [tagInput, setTagInput] = useState("");

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

  // `peek` is only defined for a field when it individually differs from the
  // original entry, so it doubles as the per-field changed-field indicator.
  const ring = (index: number, key: keyof ActivityEntry) =>
    peek?.(index, key) ? "ring-2 ring-amber-400 rounded-xl" : undefined;

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
                peek={peek?.(index, "name")}
                className={ring(index, "name")}
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
              disabled={isReadOnly}
              peek={peek?.(index, "description")}
              className={ring(index, "description")}
            />

            {/* Row 3: Risks */}
            <RichTextInput
              id={`act-risks-${index}`}
              label={fields.activityRisks}
              placeholder={fields.activityRisksPlaceholder}
              value={entry.risks}
              onChange={(html) => updateEntry(index, "risks", html)}
              disabled={isReadOnly}
              peek={peek?.(index, "risks")}
              className={ring(index, "risks")}
            />

            {/* Row 4: Entry image upload tile */}
            <div className="space-y-1.5">
              <label className="block text-sm font-normal text-gray-600">
                {fields.activityImageLabel}
              </label>
              <ImageUploadTile
                alt={`Activity ${index + 1}`}
                copyrightHint={fields.copyrightHint}
                minHeight={600}
                minWidth={800}
                onRemove={() => onEntryImageRemove("activities", index)}
                onSelect={(file) => onEntryImageSelect("activities", index, file)}
                sizeHint={fields.entryImageSizeHint}
                tooSmallLabel={fields.imageTooSmall}
                uploadLabel={fields.uploadImage}
                value={entry.image}
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

      {/* tags section hidden — pending design decision */}
    </div>
  );
}
