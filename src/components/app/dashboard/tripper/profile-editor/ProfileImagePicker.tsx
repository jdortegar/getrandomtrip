"use client";

import { useRef } from "react";
import { ImagePlus } from "lucide-react";
import Img from "@/components/common/Img";
import { TRIPPER_PROFILE_IMAGE_MIME_TYPES } from "@/lib/constants/TRIPPER_PROFILE_LIMITS";
import { cn } from "@/lib/utils";

interface ProfileImagePickerProps {
  alt: string;
  /** Tailwind aspect class for the frame, e.g. "aspect-[4/5]". */
  aspectClassName: string;
  changeLabel: string;
  hint?: string;
  id: string;
  onSelect: (file: File) => void;
  uploadLabel: string;
  value: string;
}

function isLocalUrl(url: string): boolean {
  return url.startsWith("blob:") || url.startsWith("data:");
}

/** Large image frame with a "change" overlay — portrait, cover, traveler-type and poster images. */
export function ProfileImagePicker({
  alt,
  aspectClassName,
  changeLabel,
  hint,
  id,
  onSelect,
  uploadLabel,
  value,
}: ProfileImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleOpen() {
    inputRef.current?.click();
  }

  return (
    <div className="flex flex-col gap-2" data-component="ProfileImagePicker">
      <div className={cn("relative overflow-hidden rounded-xl bg-gray-100", aspectClassName)}>
        {value ? (
          <>
            <Img
              alt={alt}
              className="absolute inset-0 h-full w-full object-cover"
              sizes="(min-width: 1024px) 400px, 100vw"
              src={value}
              unoptimized={isLocalUrl(value)}
            />
            <button
              aria-describedby={hint ? `${id}-hint` : undefined}
              className={cn(
                "absolute inset-x-3 bottom-3 rounded-md bg-white/90 px-3 py-2 text-sm text-primary shadow-sm backdrop-blur transition-colors",
                "hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              )}
              onClick={handleOpen}
              type="button"
            >
              {changeLabel}
            </button>
          </>
        ) : (
          <button
            aria-describedby={hint ? `${id}-hint` : undefined}
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-sm text-neutral-500 transition-colors",
              "hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            )}
            onClick={handleOpen}
            type="button"
          >
            <ImagePlus aria-hidden className="h-6 w-6" />
            {uploadLabel}
          </button>
        )}
      </div>
      {hint ? (
        <p className="text-xs text-neutral-500" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      <input
        accept={TRIPPER_PROFILE_IMAGE_MIME_TYPES}
        className="sr-only"
        id={id}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onSelect(file);
        }}
        ref={inputRef}
        tabIndex={-1}
        type="file"
      />
    </div>
  );
}
