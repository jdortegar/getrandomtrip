"use client";

import { useRef } from "react";
import { ChevronDown, EyeOff, Film, Upload } from "lucide-react";
import Img from "@/components/common/Img";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import { ProfileImagePicker } from "@/components/app/dashboard/tripper/profile-editor/ProfileImagePicker";
import { ProfileReorderControls } from "@/components/app/dashboard/tripper/profile-editor/ProfileReorderControls";
import {
  TRIPPER_PROFILE_TEXT_LIMITS,
  TRIPPER_PROFILE_VIDEO_MIME_TYPES,
} from "@/lib/constants/TRIPPER_PROFILE_LIMITS";
import { isValidMediaUrl } from "@/lib/helpers/tripperProfileEditor";
import { cn } from "@/lib/utils";
import type { TripperProfileEditorDict } from "@/lib/types/dictionary";
import type { TripperProfileMediaItem } from "@/types/tripper";

interface MediaItemEditorProps {
  commonCopy: TripperProfileEditorDict["common"];
  copy: TripperProfileEditorDict["media"]["item"];
  index: number;
  isExpanded: boolean;
  item: TripperProfileMediaItem;
  onChange: (patch: Partial<TripperProfileMediaItem>) => void;
  onMove: (direction: -1 | 1) => void;
  onPosterSelect: (file: File) => void;
  onRemove: () => void;
  onToggle: () => void;
  onVideoSelect: (file: File) => void;
  providerLabel: string;
  total: number;
}

function isLocalUrl(url: string): boolean {
  return url.startsWith("blob:") || url.startsWith("data:");
}

/** One video or social post in the media list: collapsed summary row, expandable editor. */
export function MediaItemEditor({
  commonCopy,
  copy,
  index,
  isExpanded,
  item,
  onChange,
  onMove,
  onPosterSelect,
  onRemove,
  onToggle,
  onVideoSelect,
  providerLabel,
  total,
}: MediaItemEditorProps) {
  const videoInputRef = useRef<HTMLInputElement>(null);
  const baseId = `media-${item.id}`;
  const title = item.title.trim() || copy.untitled;
  const showUrlError = item.provider !== "upload" && item.url.length > 0 && !isValidMediaUrl(item.provider, item.url);

  return (
    <li
      className={cn(
        "overflow-hidden rounded-xl border",
        isExpanded ? "border-gray-300 bg-white" : "border-gray-200 bg-ground/60",
      )}
      data-component="MediaItemEditor"
    >
      <button
        aria-controls={`${baseId}-panel`}
        aria-expanded={isExpanded}
        className="flex w-full items-center gap-4 p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        onClick={onToggle}
        type="button"
      >
        <span className="relative flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-200">
          {item.posterUrl ? (
            <Img
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              sizes="80px"
              src={item.posterUrl}
              unoptimized={isLocalUrl(item.posterUrl)}
            />
          ) : (
            <Film aria-hidden className="h-5 w-5 text-neutral-400" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            {providerLabel}
            {item.isVisible ? null : <EyeOff aria-hidden className="h-3.5 w-3.5" />}
          </span>
          <span className="block truncate text-sm text-ink">{title}</span>
        </span>
        <span className="sr-only">{isExpanded ? copy.collapse : copy.expand}</span>
        <ChevronDown
          aria-hidden
          className={cn("h-5 w-5 shrink-0 text-primary transition-transform", isExpanded && "rotate-180")}
        />
      </button>

      {isExpanded ? (
        <div className="flex flex-col gap-5 border-t border-gray-200 p-4 sm:p-5" id={`${baseId}-panel`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex cursor-pointer items-center gap-3 text-sm text-ink" htmlFor={`${baseId}-visible`}>
              <input
                checked={item.isVisible}
                className="h-5 w-5 accent-primary"
                id={`${baseId}-visible`}
                onChange={(e) => onChange({ isVisible: e.target.checked })}
                type="checkbox"
              />
              {copy.show}
            </label>
            <ProfileReorderControls
              copy={commonCopy}
              index={index}
              itemLabel={title}
              onMove={onMove}
              onRemove={onRemove}
              total={total}
            />
          </div>

          {item.provider === "upload" ? (
            <div className="flex flex-col gap-2">
              <span className="text-base text-gray-600">{copy.urlLabels.upload}</span>
              {item.url ? (
                <video
                  className="aspect-video w-full rounded-lg bg-black"
                  controls
                  preload="metadata"
                  src={item.url}
                />
              ) : null}
              <div className="flex items-center gap-3">
                <Button onClick={() => videoInputRef.current?.click()} size="sm" type="button" variant="secondary">
                  {copy.uploadVideo}
                  <Upload aria-hidden />
                </Button>
                <span className="text-xs text-neutral-500">{copy.urlHints.upload}</span>
              </div>
              <input
                accept={TRIPPER_PROFILE_VIDEO_MIME_TYPES}
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) onVideoSelect(file);
                }}
                ref={videoInputRef}
                tabIndex={-1}
                type="file"
              />
            </div>
          ) : (
            <FormField
              aria-invalid={showUrlError || undefined}
              hint={showUrlError ? <span className="text-red-700">{copy.invalidUrl}</span> : copy.urlHints[item.provider]}
              id={`${baseId}-url`}
              inputMode="url"
              label={copy.urlLabels[item.provider]}
              onChange={(e) => onChange({ url: e.target.value })}
              spellCheck={false}
              type="url"
              value={item.url}
            />
          )}

          <TextAreaInput
            className="min-h-[96px]"
            hint={copy.titleHint}
            id={`${baseId}-title`}
            label={copy.titleLabel}
            maxLength={TRIPPER_PROFILE_TEXT_LIMITS.mediaTitle}
            onChange={(e) => onChange({ title: e.target.value })}
            value={item.title}
          />

          <div className="w-full max-w-[240px]">
            <ProfileImagePicker
              alt=""
              aspectClassName="aspect-video"
              changeLabel={copy.posterChange}
              hint={copy.posterHint}
              id={`${baseId}-poster`}
              onSelect={onPosterSelect}
              uploadLabel={copy.posterChange}
              value={item.posterUrl}
            />
          </div>
        </div>
      ) : null}
    </li>
  );
}
