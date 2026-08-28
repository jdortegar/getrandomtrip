"use client";

import { useState } from "react";
import { ImageUploadTileGroup } from "@/components/ui/ImageUploadTileGroup";
import type { AdminXsedDict } from "@/lib/types/dictionary";
import type { XsedDropDraft } from "@/types/xsed";

interface Props {
  form: XsedDropDraft;
  onChange: (patch: Partial<XsedDropDraft>) => void;
  copy: AdminXsedDict["form"]["fields"]["gallery"];
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

export function XsedGalleryStep({ form, onChange, copy }: Props) {
  const [uploading, setUploading] = useState(false);

  async function handleAdd(file: File) {
    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      onChange({ gallery: [...form.gallery, url] });
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    onChange({ gallery: form.gallery.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-600">{copy.hint}</p>

      <ImageUploadTileGroup
        onAdd={handleAdd}
        onRemove={removeImage}
        removeLabel={copy.removeImageAria}
        uploadLabel={copy.addImage}
        uploading={uploading}
        uploadingLabel={copy.uploading}
        values={form.gallery}
      />
    </div>
  );
}
