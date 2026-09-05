"use client";

import { useState } from "react";
import { FormField } from "@/components/ui/FormField";
import { RichTextInput } from "@/components/ui/RichTextInput";
import { ImageUploadTileGroup } from "@/components/ui/ImageUploadTileGroup";
import type { XsedSection } from "@/types/xsed";
import type { AdminXsedDict } from "@/lib/types/dictionary";

interface Props {
  idPrefix: string;
  entry: XsedSection;
  onChange: (patch: Partial<XsedSection>) => void;
  copy: AdminXsedDict["form"]["fields"]["sections"];
  /** Shared hero-image copy (size/copyright/too-small) — same conditions as the experience form's image fields. */
  imageCopy: Pick<
    AdminXsedDict["form"]["fields"],
    "heroImageSizeHint" | "copyrightHint" | "imageTooSmall"
  >;
}

async function uploadImageFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("feature", "xsed");
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("upload failed");
  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new Error("no url");
  return data.url;
}

// Title + rich-text content + multi-image uploader, shared by
// XsedAccommodationStep, XsedDinnerStep, and XsedActivityStep — each bound
// to its own slot in the `sections` array (see types/xsed.ts).
export function XsedSectionFields({ idPrefix, entry, onChange, copy, imageCopy }: Props) {
  const [uploading, setUploading] = useState(false);

  async function handleAdd(file: File) {
    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      onChange({ photos: [...entry.photos, { url, credit: "" }] });
    } finally {
      setUploading(false);
    }
  }

  function handleRemove(index: number) {
    onChange({ photos: entry.photos.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-4">
      <FormField
        id={`${idPrefix}-title`}
        label={copy.title}
        placeholder={copy.titlePlaceholder}
        value={entry.title}
        onChange={(e) => onChange({ title: e.target.value })}
      />

      <RichTextInput
        id={`${idPrefix}-content`}
        label={copy.content}
        placeholder={copy.contentPlaceholder}
        value={entry.body}
        onChange={(html) => onChange({ body: html })}
      />

      <div className="space-y-2">
        <label className="block font-normal text-gray-600 text-base">{copy.images}</label>
        <ImageUploadTileGroup
          values={entry.photos.map((p) => p.url)}
          onAdd={handleAdd}
          onRemove={handleRemove}
          uploadLabel={copy.addImage}
          uploading={uploading}
          uploadingLabel={copy.uploading}
          removeLabel={copy.removeImageAria}
          minWidth={1280}
          minHeight={720}
          sizeHint={imageCopy.heroImageSizeHint}
          copyrightHint={imageCopy.copyrightHint}
          tooSmallLabel={imageCopy.imageTooSmall}
        />
      </div>
    </div>
  );
}
