"use client";

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import Img from "@/components/common/Img";
import type { TripperBlogFormDict } from "@/lib/types/dictionary";
import type { BlogFormDraft, BlogFormDraftOnChange } from "@/types/blog";
import type { BlogImageState } from "../NewBlogPostShell";

interface Props {
  copy: TripperBlogFormDict;
  draft: BlogFormDraft;
  onChange: BlogFormDraftOnChange;
  imageState: BlogImageState;
  changedFieldSet?: Set<string>;
}

export function GalleryStep({ copy, draft, imageState, changedFieldSet }: Props) {
  const { fields } = copy;
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { galleryUploading, onGalleryFilesSelect, onGalleryImageRemove } = imageState;

  return (
    // Gallery images fold into the server-side "blocks" column alongside
    // the quote and sections — no per-image peek (images aren't text to
    // compare), just a ring highlight on the whole section when it changed.
    <div className={`space-y-5 ${changedFieldSet?.has("blocks") ? "ring-2 ring-amber-400 rounded-xl p-2" : ""}`}>
      <p className="text-sm text-neutral-500 -mt-1">
        {copy.contentTabs[3]?.substeps[0]?.description}
      </p>
      <p className="text-sm text-neutral-600">{fields.galleryHint}</p>

      <input
        accept="image/*"
        className="sr-only"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length > 0) onGalleryFilesSelect(files);
        }}
        ref={galleryInputRef}
        type="file"
      />

      <button
        className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-gray-300 hover:bg-neutral-50 disabled:opacity-50"
        disabled={galleryUploading}
        onClick={() => galleryInputRef.current?.click()}
        type="button"
      >
        <ImagePlus className="h-4 w-4" />
        {galleryUploading ? fields.uploading : fields.addImage}
      </button>

      {draft.gallery.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {draft.gallery.map((url, index) => (
            <div
              className="group relative aspect-square overflow-hidden rounded-lg border border-neutral-200"
              key={`${url}-${index}`}
            >
              <Img
                alt={`${fields.galleryHint} ${index + 1}`}
                className="h-full w-full object-cover"
                height={200}
                src={url}
                width={200}
              />
              <button
                aria-label={fields.removeImageAria}
                className="absolute right-1 top-1 rounded-full bg-white/80 p-1 text-neutral-700 hover:bg-white hover:text-neutral-900"
                onClick={() => onGalleryImageRemove(index)}
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
