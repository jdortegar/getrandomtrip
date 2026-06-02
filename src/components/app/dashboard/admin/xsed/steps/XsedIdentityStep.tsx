"use client";

import { useRef, useState } from "react";
import { Loader2, X, ImagePlus } from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import Img from "@/components/common/Img";
import type { XsedDropDraft } from "@/types/xsed";

interface Props {
  form: XsedDropDraft;
  onChange: (patch: Partial<XsedDropDraft>) => void;
}

function HeroImageUpload({
  label,
  hint,
  value,
  onAdd,
  onRemove,
}: {
  label: string;
  hint?: string;
  value: string;
  onAdd: (url: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("feature", "xsed");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string };
      if (data.url) onAdd(data.url);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="block font-normal text-gray-600 text-base">
        {label}
      </label>

      {value ? (
        <div className="relative w-full h-52 rounded-xl overflow-hidden border border-gray-200 group">
          <Img
            src={value}
            alt="Hero"
            width={900}
            height={208}
            className="object-cover w-full h-full"
            unoptimized
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 w-full h-52 rounded-xl border-2 border-dashed border-gray-300 text-neutral-400 hover:border-gray-400 hover:text-neutral-600 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <ImagePlus className="h-6 w-6" />
          )}
          <span className="text-sm">{uploading ? "…" : "Upload image"}</span>
        </button>
      )}

      {hint && <p className="text-xs text-neutral-400">{hint}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}

export function XsedIdentityStep({ form, onChange }: Props) {
  const isActive = form.status === "ACTIVE";

  return (
    <div className="space-y-5">
      <FormField
        id="xsed-titleInternal"
        label="Title (internal)"
        placeholder="e.g. Buenos Aires mystery weekend"
        type="text"
        value={form.titleInternal}
        onChange={(e) => onChange({ titleInternal: e.target.value })}
      />

      <FormField
        id="xsed-teaser"
        label="Teaser"
        placeholder="One-line mystery hint shown before reveal"
        type="text"
        value={form.teaser}
        onChange={(e) => onChange({ teaser: e.target.value })}
      />

      <HeroImageUpload
        label="Hero image"
        value={form.heroImage}
        onAdd={(url) => onChange({ heroImage: url })}
        onRemove={() => onChange({ heroImage: "" })}
      />

      <div className="flex items-center justify-between">
        <span className="block font-normal text-gray-600 text-base">Status</span>
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          onClick={() =>
            onChange({ status: isActive ? "DRAFT" : "ACTIVE" })
          }
          className="flex items-center gap-2 group"
        >
          <span
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
              isActive ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                isActive ? "translate-x-[18px]" : "translate-x-[3px]"
              }`}
            />
          </span>
          <span
            className={`text-xs font-medium ${isActive ? "text-green-600" : "text-gray-400"}`}
          >
            {isActive ? "Active" : "Draft"}
          </span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          checked={form.isFeatured}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          id="xsed-isFeatured"
          onChange={(e) => onChange({ isFeatured: e.target.checked })}
          type="checkbox"
        />
        <div>
          <label
            className="text-sm font-medium text-neutral-500 cursor-pointer"
            htmlFor="xsed-isFeatured"
          >
            Featured drop
          </label>
          <p className="text-xs text-neutral-400">
            Show on homepage / promoted slots
          </p>
        </div>
      </div>
    </div>
  );
}
