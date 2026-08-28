"use client";

import { ImageUploadTileGroup } from "@/components/ui/ImageUploadTileGroup";
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

      <ImageUploadTileGroup
        alt={fields.galleryHint}
        onAdd={(file) => onGalleryFilesSelect([file])}
        onRemove={onGalleryImageRemove}
        removeLabel={fields.removeImageAria}
        uploadLabel={fields.addImage}
        uploading={galleryUploading}
        uploadingLabel={fields.uploading}
        values={draft.gallery}
      />
    </div>
  );
}
