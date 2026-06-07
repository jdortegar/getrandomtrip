"use client";

import { useRef, useState, KeyboardEvent } from "react";
import { X, ImagePlus } from "lucide-react";
import Image from "next/image";
import type { TripperExperiencesDict } from "@/lib/types/dictionary";
import type { ExperienceFormDraft, ExperienceFormDraftOnChange } from "@/types/tripper";
import type { ExperienceImageState } from "../NewExperienceShell";

interface Props {
  copy: TripperExperiencesDict["form"];
  form: ExperienceFormDraft;
  onChange: ExperienceFormDraftOnChange;
  imageState: ExperienceImageState;
}

const MAX_GALLERY = 3;

const inputClass =
  "bg-gray-100 outline-none placeholder:text-gray-400 px-4 py-3 rounded-xl text-gray-900 w-full text-base";

const labelClass = "block font-normal text-gray-600 text-base";

const chipClass =
  "flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700";

const uploadBtnClass =
  "flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors";

export function TagsMediaStep({ copy, form, onChange, imageState }: Props) {
  const { fields } = copy;
  const { onHeroSelect, onGalleryFilesSelect, onHeroRemove, onGalleryRemove } =
    imageState;

  const [tagInput, setTagInput] = useState("");
  const [highlightInput, setHighlightInput] = useState("");

  const heroRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const canAddMore = form.galleryImages.length < MAX_GALLERY;

  function addTag(raw: string) {
    const value = raw.trim().replace(/^#/, "");
    if (!value || form.tags.includes(value)) return;
    onChange("tags", [...form.tags, value]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    onChange("tags", form.tags.filter((t) => t !== tag));
  }

  function onTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
  }

  function addHighlight(raw: string) {
    const value = raw.trim();
    if (!value || form.highlights.includes(value)) return;
    onChange("highlights", [...form.highlights, value]);
    setHighlightInput("");
  }

  function removeHighlight(h: string) {
    onChange("highlights", form.highlights.filter((v) => v !== h));
  }

  function onHighlightKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addHighlight(highlightInput);
    }
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-neutral-500 -mt-1">
        {copy.contentTabs[3]?.substeps[0]?.description}
      </p>

      {/* Tags */}
      <div className="space-y-3">
        <label className={labelClass}>{fields.tags}</label>
        <input
          className={inputClass}
          placeholder={fields.tagInput}
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={onTagKeyDown}
          onBlur={() => addTag(tagInput)}
        />
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.tags.map((tag) => (
              <span key={tag} className={chipClass}>
                <span className="text-gray-400">#</span>
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Highlights */}
      <div className="space-y-3">
        <label className={labelClass}>{fields.highlights}</label>
        <input
          className={inputClass}
          placeholder={fields.highlightInput}
          value={highlightInput}
          onChange={(e) => setHighlightInput(e.target.value)}
          onKeyDown={onHighlightKeyDown}
          onBlur={() => addHighlight(highlightInput)}
        />
        {form.highlights.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.highlights.map((h) => (
              <span key={h} className={chipClass}>
                {h}
                <button
                  type="button"
                  onClick={() => removeHighlight(h)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hero image */}
      <div className="space-y-2">
        <label className={labelClass}>{fields.heroImage}</label>
        <p className="text-xs text-neutral-400 -mt-1">{fields.heroImageHint}</p>

        <div className="flex items-start gap-3">
          {form.heroImage ? (
            <div className="relative h-24 w-24 shrink-0 rounded-xl overflow-hidden group">
              <Image
                src={form.heroImage}
                alt="Hero"
                fill
                className="object-cover"
                sizes="96px"
                unoptimized
              />
              <button
                type="button"
                onClick={onHeroRemove}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => heroRef.current?.click()}
              className={uploadBtnClass}
            >
              <ImagePlus className="h-5 w-5" />
              <span className="text-xs text-center leading-tight px-1">
                {fields.uploadImage}
              </span>
            </button>
          )}
        </div>

        <input
          ref={heroRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onHeroSelect(file);
            e.target.value = "";
          }}
        />
      </div>

      {/* Gallery */}
      <div className="space-y-2">
        <label className={labelClass}>{fields.galleryImages}</label>
        <p className="text-xs text-neutral-400 -mt-1">
          {fields.galleryImagesHint}
        </p>

        <div className="flex flex-wrap items-start gap-3">
          {form.galleryImages.map((url, i) => (
            <div
              key={i}
              className="relative h-24 w-24 shrink-0 rounded-xl overflow-hidden group"
            >
              <Image
                src={url}
                alt={`Gallery ${i + 1}`}
                fill
                className="object-cover"
                sizes="96px"
                unoptimized
              />
              <button
                type="button"
                onClick={() => onGalleryRemove(i)}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          ))}

          {canAddMore && (
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className={uploadBtnClass}
            >
              <ImagePlus className="h-5 w-5" />
              <span className="text-xs text-center leading-tight px-1">
                {fields.uploadImage}
              </span>
            </button>
          )}
        </div>

        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length > 0) onGalleryFilesSelect(files);
            e.target.value = "";
          }}
        />
      </div>

      <p className="text-xs text-neutral-400">{fields.copyrightHint}</p>
    </div>
  );
}
