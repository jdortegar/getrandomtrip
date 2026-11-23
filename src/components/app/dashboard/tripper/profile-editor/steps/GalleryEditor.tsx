"use client";

import { useRef } from "react";
import { Plus } from "lucide-react";
import Img from "@/components/common/Img";
import { FormField } from "@/components/ui/FormField";
import { PanelCard } from "@/components/common/PanelCard";
import { ProfileReorderControls } from "@/components/app/dashboard/tripper/profile-editor/ProfileReorderControls";
import {
  TRIPPER_PROFILE_IMAGE_MIME_TYPES,
  TRIPPER_PROFILE_MAX_GALLERY_ITEMS,
  TRIPPER_PROFILE_TEXT_LIMITS,
  TRIPPER_PROFILE_VIDEO_MIME_TYPES,
} from "@/lib/constants/TRIPPER_PROFILE_LIMITS";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import { moveListItem } from "@/lib/helpers/tripperProfileEditor";
import { cn } from "@/lib/utils";
import type { TripperProfileEditorDict } from "@/lib/types/dictionary";
import type { TripperProfileGalleryItem } from "@/types/tripper";

interface GalleryEditorProps {
  commonCopy: TripperProfileEditorDict["common"];
  copy: TripperProfileEditorDict["media"]["gallery"];
  items: TripperProfileGalleryItem[];
  onAddFiles: (files: File[]) => void;
  onChange: (items: TripperProfileGalleryItem[]) => void;
}

function isLocalUrl(url: string): boolean {
  return url.startsWith("blob:") || url.startsWith("data:");
}

/** "Your notebook in pictures": up to eight ordered photos/videos with captions. */
export function GalleryEditor({ commonCopy, copy, items, onAddFiles, onChange }: GalleryEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isFull = items.length >= TRIPPER_PROFILE_MAX_GALLERY_ITEMS;
  const meta = interpolateTemplate(copy.meta, {
    count: String(items.length),
    max: String(TRIPPER_PROFILE_MAX_GALLERY_ITEMS),
  });

  function handleItemChange(id: string, patch: Partial<TripperProfileGalleryItem>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  return (
    <PanelCard meta={meta} title={copy.title}>
      <p className="-mt-3 text-sm text-neutral-600">{copy.intro}</p>

      {items.length > 0 ? (
        <ol className="divide-y divide-gray-100" data-component="GalleryEditor">
          {items.map((item, index) => {
            const kindLabel = item.kind === "video" ? copy.videoLabel : copy.photoLabel;
            const itemLabel = item.caption.trim() || `${kindLabel} ${index + 1}`;
            return (
              <li className="flex gap-4 py-4 first:pt-0" key={item.id}>
                <div className={cn("relative h-16 w-20 shrink-0 overflow-hidden rounded-md bg-gray-200", "sm:h-24 sm:w-32")}>
                  {item.kind === "video" ? (
                    <video className="h-full w-full object-cover" muted preload="metadata" src={item.url} />
                  ) : (
                    <Img
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      sizes="128px"
                      src={item.url}
                      unoptimized={isLocalUrl(item.url)}
                    />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-start justify-between gap-x-2">
                    <span className="min-w-0 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                      {kindLabel} · {copy.captionLabel}
                    </span>
                    <ProfileReorderControls
                      copy={commonCopy}
                      index={index}
                      itemLabel={itemLabel}
                      onMove={(direction) => onChange(moveListItem(items, index, direction))}
                      onRemove={() => onChange(items.filter((other) => other.id !== item.id))}
                      total={items.length}
                    />
                  </div>
                  <FormField
                    aria-label={`${copy.captionLabel} — ${kindLabel} ${index + 1}`}
                    className="px-4 py-2.5 text-sm"
                    id={`gallery-${item.id}-caption`}
                    label={<span className="sr-only">{copy.captionLabel}</span>}
                    maxLength={TRIPPER_PROFILE_TEXT_LIMITS.galleryCaption}
                    onChange={(e) => handleItemChange(item.id, { caption: e.target.value })}
                    placeholder={copy.captionPlaceholder}
                    showCount
                    value={item.caption}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}

      <button
        className={cn(
          "flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 px-4 py-8 text-center transition-colors",
          "hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
        disabled={isFull}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        <span className="flex items-center gap-1 text-sm font-medium text-primary">
          <Plus aria-hidden className="h-4 w-4" />
          {isFull ? copy.full : copy.addTitle}
        </span>
        {isFull ? null : <span className="text-xs text-neutral-500">{copy.addHint}</span>}
      </button>
      <input
        accept={`${TRIPPER_PROFILE_IMAGE_MIME_TYPES},${TRIPPER_PROFILE_VIDEO_MIME_TYPES}`}
        className="sr-only"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length > 0) onAddFiles(files);
        }}
        ref={inputRef}
        tabIndex={-1}
        type="file"
      />

      <div className="space-y-1 rounded-lg bg-secondary/15 px-4 py-3 text-xs text-neutral-700">
        <p>{copy.specsPhotos}</p>
        <p>{copy.specsVideos}</p>
      </div>
      <p className="-mt-2 text-xs text-neutral-500">{copy.orientationNote}</p>
    </PanelCard>
  );
}
