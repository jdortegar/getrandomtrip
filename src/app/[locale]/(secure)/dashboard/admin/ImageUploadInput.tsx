"use client";

import { useRef, useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import Img from "@/components/common/Img";

interface ImageUploadInputProps {
  values: string[];
  max?: number;
  feature?: string;
  onAdd: (url: string) => void;
  onRemove: (url: string) => void;
}

export function ImageUploadInput({
  values,
  max = 1,
  feature = "xsed",
  onAdd,
  onRemove,
}: ImageUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const slots = max - values.length;
    if (slots <= 0) return;
    const toUpload = Array.from(files).slice(0, slots);
    setUploading(true);
    try {
      for (const file of toUpload) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("feature", feature);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = (await res.json()) as { url?: string; error?: string };
        if (data.url) onAdd(data.url);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((url) => (
        <div
          key={url}
          className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-gray-200 group"
        >
          <Img
            alt=""
            className="object-cover"
            height={96}
            src={url}
            unoptimized
            width={96}
          />
          <button
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => onRemove(url)}
            type="button"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {values.length < max && (
        <button
          className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-neutral-400 transition-colors hover:border-gray-400 hover:text-neutral-600 disabled:opacity-50"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
          <span className="text-xs">{uploading ? "…" : "Upload"}</span>
        </button>
      )}
      <input
        accept="image/*"
        className="hidden"
        multiple={max > 1}
        onChange={(e) => handleFiles(e.target.files)}
        ref={inputRef}
        type="file"
      />
    </div>
  );
}
