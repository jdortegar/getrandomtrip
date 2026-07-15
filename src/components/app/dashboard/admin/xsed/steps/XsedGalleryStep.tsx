"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import Img from "@/components/common/Img";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFilesSelect(files: File[]) {
    setUploading(true);
    try {
      const results = await Promise.allSettled(files.map((f) => uploadImageFile(f)));
      const urls = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
        .map((r) => r.value);
      if (urls.length > 0) onChange({ gallery: [...form.gallery, ...urls] });
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

      <input
        accept="image/*"
        className="sr-only"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length > 0) void handleFilesSelect(files);
        }}
        ref={inputRef}
        type="file"
      />

      <button
        className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-gray-300 hover:bg-neutral-50 disabled:opacity-50"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImagePlus className="h-4 w-4" />
        )}
        {uploading ? copy.uploading : copy.addImage}
      </button>

      {form.gallery.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {form.gallery.map((url, index) => (
            <div
              className="group relative aspect-square overflow-hidden rounded-lg border border-neutral-200"
              key={`${url}-${index}`}
            >
              <Img
                alt=""
                className="h-full w-full object-cover"
                height={200}
                src={url}
                unoptimized
                width={200}
              />
              <button
                aria-label={copy.removeImageAria}
                className="absolute right-1 top-1 rounded-full bg-white/80 p-1 text-neutral-700 hover:bg-white hover:text-neutral-900"
                onClick={() => removeImage(index)}
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
