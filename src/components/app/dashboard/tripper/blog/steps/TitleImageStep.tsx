"use client";

import { useParams } from "next/navigation";
import { FormField } from "@/components/ui/FormField";
import { ImageUploadTile } from "@/components/ui/ImageUploadTile";
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
      <p className="text-sm text-ink -mt-1">
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

        <ImageUploadTile
          alt={fields.coverImage}
          className={ch("coverUrl")}
          copyrightHint={fields.copyrightHint}
          minHeight={720}
          minWidth={1280}
          onRemove={onCoverRemove}
          onSelect={onCoverSelect}
          sizeHint={fields.coverImageSizeHint}
          tooSmallLabel={fields.imageTooSmall}
          uploadLabel={fields.uploadImage}
          uploading={coverUploading}
          uploadingLabel={fields.uploading}
          value={draft.coverUrl}
        />
      </div>
    </div>
  );
}
