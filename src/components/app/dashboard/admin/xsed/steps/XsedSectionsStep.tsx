"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import Img from "@/components/common/Img";
import { FormField } from "@/components/ui/FormField";
import { RichTextInput } from "@/components/ui/RichTextInput";
import type { AdminXsedDict } from "@/lib/types/dictionary";
import type { XsedDropDraft, XsedSection, XsedSectionPhoto } from "@/types/xsed";

interface Props {
  form: XsedDropDraft;
  onChange: (patch: Partial<XsedDropDraft>) => void;
  copy: AdminXsedDict["form"]["fields"]["sections"];
}

const EMPTY_SECTION: XsedSection = { title: "", body: "", photos: [] };
const EMPTY_PHOTO: XsedSectionPhoto = { url: "", credit: "" };

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

function PhotoTile({
  photo,
  idPrefix,
  copy,
  onChange,
  onRemove,
}: {
  photo: XsedSectionPhoto;
  idPrefix: string;
  copy: Props["copy"];
  onChange: (patch: Partial<XsedSectionPhoto>) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      onChange({ url });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-200 p-3">
      {photo.url ? (
        <div className="group relative h-32 w-full overflow-hidden rounded-lg">
          <Img
            alt=""
            className="h-full w-full object-cover"
            height={128}
            src={photo.url}
            unoptimized
            width={300}
          />
          <button
            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
            onClick={onRemove}
            type="button"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          className="flex h-32 w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-neutral-400 transition-colors hover:border-gray-400 hover:text-neutral-600 disabled:opacity-50"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
        </button>
      )}

      <input
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
        ref={inputRef}
        type="file"
      />

      <FormField
        id={`${idPrefix}-credit`}
        label={copy.photoCredit}
        onChange={(e) => onChange({ credit: e.target.value })}
        placeholder={copy.photoCreditPlaceholder}
        value={photo.credit}
      />
    </div>
  );
}

export function XsedSectionsStep({ form, onChange, copy }: Props) {
  function updateSection(index: number, patch: Partial<XsedSection>) {
    const updated = form.sections.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange({ sections: updated });
  }

  function addSection() {
    onChange({ sections: [...form.sections, { ...EMPTY_SECTION }] });
  }

  function removeSection(index: number) {
    onChange({ sections: form.sections.filter((_, i) => i !== index) });
  }

  function updatePhoto(sectionIndex: number, photoIndex: number, patch: Partial<XsedSectionPhoto>) {
    const section = form.sections[sectionIndex];
    if (!section) return;
    const photos = section.photos.map((p, i) => (i === photoIndex ? { ...p, ...patch } : p));
    updateSection(sectionIndex, { photos });
  }

  function addPhoto(sectionIndex: number) {
    const section = form.sections[sectionIndex];
    if (!section) return;
    updateSection(sectionIndex, { photos: [...section.photos, { ...EMPTY_PHOTO }] });
  }

  function removePhoto(sectionIndex: number, photoIndex: number) {
    const section = form.sections[sectionIndex];
    if (!section) return;
    updateSection(sectionIndex, {
      photos: section.photos.filter((_, i) => i !== photoIndex),
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-6">
        {form.sections.map((section, index) => (
          <div className="space-y-4" key={index}>
            {index > 0 && (
              <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                <span className="text-sm text-neutral-500">
                  {copy.sectionLabel} {index + 1}
                </span>
                <button
                  className="flex items-center gap-1 text-xs text-neutral-400 transition-colors hover:text-red-500"
                  onClick={() => removeSection(index)}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                  {copy.removeSection}
                </button>
              </div>
            )}

            <FormField
              id={`xsed-section-title-${index}`}
              label={`${copy.sectionTitle} ${index + 1}`}
              onChange={(e) => updateSection(index, { title: e.target.value })}
              placeholder={copy.sectionTitlePlaceholder}
              value={section.title}
            />

            <RichTextInput
              id={`xsed-section-body-${index}`}
              label={copy.sectionBody}
              onChange={(html) => updateSection(index, { body: html })}
              placeholder={copy.sectionBodyPlaceholder}
              value={section.body}
            />

            {section.photos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {section.photos.map((photo, photoIndex) => (
                  <PhotoTile
                    copy={copy}
                    idPrefix={`xsed-section-${index}-photo-${photoIndex}`}
                    key={photoIndex}
                    onChange={(patch) => updatePhoto(index, photoIndex, patch)}
                    onRemove={() => removePhoto(index, photoIndex)}
                    photo={photo}
                  />
                ))}
              </div>
            )}

            <button
              className="w-full rounded-xl border border-dashed border-gray-300 py-3 text-sm text-neutral-500 transition-colors hover:border-gray-400 hover:text-neutral-700"
              onClick={() => addPhoto(index)}
              type="button"
            >
              + {copy.addPhoto}
            </button>
          </div>
        ))}
      </div>

      <button
        className="w-full rounded-xl border border-dashed border-gray-300 py-4 text-sm text-neutral-500 transition-colors hover:border-gray-400 hover:text-neutral-700"
        onClick={addSection}
        type="button"
      >
        + {copy.addSection}
      </button>
    </div>
  );
}
