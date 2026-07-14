"use client";

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import Img from "@/components/common/Img";
import { FormField } from "@/components/ui/FormField";
import { cn } from "@/lib/utils";
import type { TripperBlogFormDict } from "@/lib/types/dictionary";
import type { BlogFormDraft, BlogFormDraftOnChange } from "@/types/blog";
import type { BlogImageState } from "../NewBlogPostShell";

interface Props {
  copy: TripperBlogFormDict;
  draft: BlogFormDraft;
  onChange: BlogFormDraftOnChange;
  imageState: BlogImageState;
}

const req = <span className="text-red-500 ml-0.5">*</span>;

export function TitleImageStep({ copy, draft, onChange, imageState }: Props) {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { fields } = copy;
  const { coverUploading, onCoverSelect, onCoverRemove } = imageState;

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
      />

      <FormField
        id="blog-subtitle"
        label={fields.subtitle}
        placeholder={fields.subtitlePlaceholder}
        value={draft.subtitle}
        onChange={(e) => onChange("subtitle", e.target.value)}
      />

      {/* Cover image */}
      <div className="space-y-2">
        <label className="block font-normal text-gray-600 text-base">
          {fields.coverImage}
          {req}
        </label>
        <p className="text-xs text-neutral-400 -mt-1">{fields.coverImageHint}</p>

        {draft.coverUrl ? (
          <div className="group relative h-40 w-full max-w-md overflow-hidden rounded-xl border border-neutral-200">
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
            className="flex h-40 w-full max-w-md flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-600"
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

      {/* Status toggle */}
      <div className="space-y-2">
        <label className="block font-normal text-gray-600 text-base">
          {fields.statusLabel}
        </label>
        <div className="inline-flex rounded-lg border border-gray-200 p-1">
          <button
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              draft.status === "draft"
                ? "bg-gray-900 text-white"
                : "text-neutral-500 hover:text-neutral-700",
            )}
            onClick={() => onChange("status", "draft")}
            type="button"
          >
            {fields.statusDraft}
          </button>
          <button
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              draft.status === "published"
                ? "bg-gray-900 text-white"
                : "text-neutral-500 hover:text-neutral-700",
            )}
            onClick={() => onChange("status", "published")}
            type="button"
          >
            {fields.statusPublished}
          </button>
        </div>
      </div>
    </div>
  );
}
