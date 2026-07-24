"use client";

import { useRef } from "react";
import { useParams } from "next/navigation";
import { ImagePlus, X } from "lucide-react";
import Img from "@/components/common/Img";
import { FormField } from "@/components/ui/FormField";
import { MultiSelectInput } from "@/components/ui/MultiSelectInput";
import { getExcuseOptionsForType } from "@/lib/constants/packages";
import { getTravelerTypeOptions } from "@/lib/data/traveler-types";
import type { TripperBlogFormDict } from "@/lib/types/dictionary";
import type { BlogFormDraft, BlogFormDraftOnChange } from "@/types/blog";
import type { FieldPeek } from "@/components/ui/field-peek";
import type { BlogImageState } from "../NewBlogPostShell";

interface Props {
  copy: TripperBlogFormDict;
  draft: BlogFormDraft;
  onChange: BlogFormDraftOnChange;
  imageState: BlogImageState;
  changedFieldSet?: Set<string>;
  /** Builds the peek toggle for an eligible field; `undefined` when peek is not available. */
  peek?: (field: keyof BlogFormDraft, diffKey?: string) => FieldPeek | undefined;
}

const req = <span className="text-red-500 ml-0.5">*</span>;

export function TitleImageStep({ copy, draft, onChange, imageState, changedFieldSet, peek }: Props) {
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { fields } = copy;
  const { coverUploading, onCoverSelect, onCoverRemove } = imageState;
  const ch = (f: string) => changedFieldSet?.has(f) ? "ring-2 ring-amber-400 rounded-xl" : undefined;

  const travelTypeOptions = getTravelerTypeOptions(locale).map((t) => ({
    value: t.key,
    label: t.title,
  }));
  const excuseOptions = getExcuseOptionsForType(draft.travelType, locale);

  const handleTravelTypeChange = (value: string[]) => {
    onChange("travelType", value);
    onChange("excuseKey", []);
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-500 -mt-1">
        {copy.contentTabs[0]?.substeps[0]?.description}
      </p>

      <FormField
        id="blog-title"
        label={<>{fields.title}{req}</>}
        placeholder={fields.titlePlaceholder}
        value={draft.title}
        onChange={(e) => onChange("title", e.target.value)}
        className={ch("title")}
        peek={peek?.("title")}
      />

      <FormField
        id="blog-subtitle"
        label={fields.subtitle}
        placeholder={fields.subtitlePlaceholder}
        value={draft.subtitle}
        onChange={(e) => onChange("subtitle", e.target.value)}
        className={ch("subtitle")}
        peek={peek?.("subtitle")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <MultiSelectInput
            id="blog-travel-type"
            label={fields.travelType}
            options={travelTypeOptions}
            value={draft.travelType}
            onChange={handleTravelTypeChange}
            placeholder={fields.travelTypePlaceholder}
            triggerClassName={ch("travelType")}
          />
          <p className="text-xs text-neutral-400">{fields.travelTypeHint}</p>
        </div>

        <MultiSelectInput
          id="blog-excuse"
          label={fields.excuseKey}
          options={excuseOptions}
          placeholder={fields.excuseKeyPlaceholder}
          hint={fields.excuseKeyHint}
          value={draft.excuseKey}
          onChange={(v) => onChange("excuseKey", v)}
          triggerClassName={ch("excuseKey")}
        />
      </div>

      {/* Cover image */}
      <div className="space-y-2">
        <label className="block font-normal text-gray-600 text-base">
          {fields.coverImage}
          {req}
        </label>
        <p className="text-xs text-neutral-400 -mt-1">{fields.coverImageHint}</p>

        {draft.coverUrl ? (
          <div className={`group relative h-40 w-full max-w-md overflow-hidden rounded-xl border border-neutral-200${ch("coverUrl") ? ` ${ch("coverUrl")}` : ""}`}>
            <Img
              alt={fields.coverImage}
              className="h-full w-full object-cover"
              height={320}
              src={draft.coverUrl}
              width={448}
            />
            <button
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={onCoverRemove}
              type="button"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        ) : (
          <button
            className={`flex h-40 w-full max-w-md flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-600${ch("coverUrl") ? ` ${ch("coverUrl")}` : ""}`}
            disabled={coverUploading}
            onClick={() => coverInputRef.current?.click()}
            type="button"
          >
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs">
              {coverUploading ? fields.uploading : fields.uploadImage}
            </span>
          </button>
        )}

        <input
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onCoverSelect(file);
          }}
          ref={coverInputRef}
          type="file"
        />
      </div>
    </div>
  );
}
