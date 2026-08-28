"use client";

import { ImageUploadTile } from "@/components/ui/ImageUploadTile";

interface ImageUploadTileGroupProps {
  values: string[];
  onAdd: (file: File) => void;
  onRemove: (index: number) => void;
  uploadLabel: string;
  uploading?: boolean;
  uploadingLabel?: string;
  /** Once reached, the trailing empty upload tile stops appearing. */
  max?: number;
  alt?: string;
  removeLabel?: string;
  minWidth?: number;
  minHeight?: number;
  tooSmallLabel?: string;
  sizeHint?: string;
  copyrightHint?: string;
}

const noop = () => {};

export function ImageUploadTileGroup({
  values,
  onAdd,
  onRemove,
  uploadLabel,
  uploading = false,
  uploadingLabel,
  max,
  alt = "",
  removeLabel,
  minWidth,
  minHeight,
  tooSmallLabel,
  sizeHint,
  copyrightHint,
}: ImageUploadTileGroupProps) {
  const canAddMore = max == null || values.length < max;

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-3">
        {values.map((value, index) => (
          <ImageUploadTile
            alt={alt ? `${alt} ${index + 1}` : ""}
            key={`${value}-${index}`}
            onRemove={() => onRemove(index)}
            onSelect={noop}
            removeLabel={removeLabel}
            uploadLabel={uploadLabel}
            value={value}
          />
        ))}
        {canAddMore && (
          <ImageUploadTile
            alt={alt}
            minHeight={minHeight}
            minWidth={minWidth}
            onRemove={noop}
            onSelect={onAdd}
            tooSmallLabel={tooSmallLabel}
            uploadLabel={uploadLabel}
            uploading={uploading}
            uploadingLabel={uploadingLabel}
            value={null}
          />
        )}
      </div>
      {sizeHint && <p className="text-xs text-neutral-400">{sizeHint}</p>}
      {copyrightHint && (
        <p className="text-xs text-neutral-400">{copyrightHint}</p>
      )}
    </div>
  );
}
