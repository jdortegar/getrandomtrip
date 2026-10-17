"use client";

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import Img from "@/components/common/Img";
import { validateImageSize } from "@/lib/utils/validateImageSize";
import { cn } from "@/lib/utils";
import { useDictionary } from "@/hooks/useDictionary";

const TILE_CLASS = "w-40 aspect-video rounded-lg";
const TILE_DIMENSIONS = { width: 320, height: 180 };
const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp";
const HINT_CLASS = "text-xs text-neutral-400";

interface ImageUploadTileProps {
  value: string | null | undefined;
  onSelect: (file: File) => void;
  onRemove: () => void;
  /** Minimum accepted width/height in px — enforced client-side before onSelect fires and shown as a hint. Omit to skip both. */
  minWidth?: number;
  minHeight?: number;
  uploadLabel: string;
  uploading?: boolean;
  uploadingLabel?: string;
  alt?: string;
  removeLabel?: string;
  /** Merged onto the preview/upload box — used for the amber "changed field" ring. */
  className?: string;
  disabled?: boolean;
}

interface ImageUploadHintsProps {
  minWidth?: number;
  minHeight?: number;
}

/** Formats, minimum size (only when both dimensions are set) and copyright hint lines. */
export function ImageUploadHints({ minWidth, minHeight }: ImageUploadHintsProps) {
  const copy = useDictionary((d) => d.common.imageUpload);

  return (
    <>
      <p className={HINT_CLASS}>{copy.formats}</p>
      {minWidth && minHeight ? (
        <p className={HINT_CLASS}>
          {copy.minSize
            .replace("{width}", String(minWidth))
            .replace("{height}", String(minHeight))}
        </p>
      ) : null}
      <p className={HINT_CLASS}>{copy.copyright}</p>
    </>
  );
}

export function ImageUploadTile(props: ImageUploadTileProps) {
  return (
    <div className="space-y-1.5" data-component="ImageUploadTile">
      <ImageUploadTileBody {...props} />
      <ImageUploadHints minHeight={props.minHeight} minWidth={props.minWidth} />
    </div>
  );
}

/** The tile and its file picker without hint lines — ImageUploadTileGroup renders the hints once below all tiles. */
export function ImageUploadTileBody({
  value,
  onSelect,
  onRemove,
  minWidth,
  minHeight,
  uploadLabel,
  uploading = false,
  uploadingLabel,
  alt = "",
  removeLabel,
  className,
  disabled,
}: ImageUploadTileProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const tooSmallLabel = useDictionary((d) => d.common.imageUpload.tooSmall);

  return (
    <div className="flex items-start gap-3">
      {value ? (
        <div
          className={cn(
            "group relative shrink-0 overflow-hidden",
            TILE_CLASS,
            className,
          )}
        >
          <Img
            alt={alt}
            className="h-full w-full object-cover"
            height={TILE_DIMENSIONS.height}
            src={value}
            width={TILE_DIMENSIONS.width}
          />
          <button
            aria-label={removeLabel}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={onRemove}
            type="button"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      ) : (
        <button
          className={cn(
            "flex shrink-0 flex-col items-center justify-center gap-1.5 border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50",
            TILE_CLASS,
            className,
          )}
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <ImagePlus className="h-5 w-5" />
          <span className="px-1 text-center text-xs leading-tight">
            {uploading ? (uploadingLabel ?? uploadLabel) : uploadLabel}
          </span>
        </button>
      )}
      <input
        accept={ACCEPTED_IMAGE_TYPES}
        className="sr-only"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          if (minWidth && minHeight) {
            const result = await validateImageSize(file, minWidth, minHeight);
            if (!result.valid) {
              toast.error(
                `${tooSmallLabel} — min ${minWidth} × ${minHeight} px (actual: ${result.width} × ${result.height} px)`,
              );
              return;
            }
          }
          onSelect(file);
        }}
        ref={inputRef}
        type="file"
      />
    </div>
  );
}
