"use client";

import { useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { ImageUp, RotateCcw } from "lucide-react";

import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Modal,
} from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { NormalizedCrop } from "@/lib/images/crop";
import type { ImageEditorDict } from "@/lib/types/dictionary";

export type ImageEditorMaskShape = "rect" | "round";

export interface ImageEditorSource {
  /** New pick from a file input. */
  file?: File;
  /** Stored original, same-origin `/api/upload/...`. Used for lossless re-crop. */
  originalUrl?: string;
}

export interface ImageEditorResult {
  crop: NormalizedCrop;
  /** Set only when the user picked a new file (fresh upload or replace-in-modal). */
  file?: File;
  /** Set only on re-crop (no new file picked — reusing the retained original). */
  originalUrl?: string;
}

export interface ImageEditorModalProps {
  /** 16/9 for hero, 1 for avatar. */
  aspect: number;
  /** Sliced dictionary — never pass the full dictionary. */
  copy: ImageEditorDict;
  /** Default "rect". */
  maskShape?: ImageEditorMaskShape;
  onOpenChange: (open: boolean) => void;
  /** Re-open the file input without closing the modal. */
  onPickAnother?: () => void;
  onSave: (result: ImageEditorResult) => Promise<void> | void;
  open: boolean;
  /** 0–1 fraction of frame height covered by the site navbar at render time. Draws a guide strip. */
  safeAreaTopPct?: number;
  saving?: boolean;
  source: ImageEditorSource;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

/** Generic upload + crop + zoom modal. Mask shape/ratio is parametrized per
 * call site (hero: rect 16:9, avatar: round 1:1). Never touches the network —
 * `onSave` receives the framed rect + file/originalUrl and the caller
 * performs the single POST. This is what keeps "cancel leaves no uploaded
 * blob" true. */
export function ImageEditorModal({
  aspect,
  copy,
  maskShape = "rect",
  onOpenChange,
  onPickAnother,
  onSave,
  open,
  safeAreaTopPct,
  saving = false,
  source,
}: ImageEditorModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<NormalizedCrop | null>(null);

  const activeFile = source.file ?? pickedFile;

  // Object-URL lifecycle: create in an effect keyed on the active file,
  // revoke on cleanup — omitting this leaks a blob URL per file pick.
  useEffect(() => {
    if (!activeFile) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(activeFile);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [activeFile]);

  // Reset crop/zoom whenever a new image loads or the modal reopens fresh.
  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedArea(null);
  }, [open, activeFile, source.originalUrl]);

  useEffect(() => {
    if (!open) {
      setPickedFile(null);
      setIsDraggingOver(false);
    }
  }, [open]);

  const imageSrc = objectUrl ?? source.originalUrl ?? null;

  function handleFile(file: File | undefined | null) {
    if (!file) return;
    setPickedFile(file);
    onPickAnother?.();
  }

  function handleCropComplete(_area: Area, areaPixelsPct: Area) {
    // react-easy-crop's `croppedArea` (the first callback arg) is already a
    // 0-100 percentage of the media's natural size — divide by 100 for our
    // normalized [0,1] fractions. We deliberately ignore `croppedAreaPixels`
    // (the second arg) per design: pixel coords wouldn't map back correctly
    // once the server has resized the stored original.
    setCroppedArea({
      x: _area.x / 100,
      y: _area.y / 100,
      width: _area.width / 100,
      height: _area.height / 100,
    });
    void areaPixelsPct;
  }

  async function handleSave() {
    if (!croppedArea) return;
    await onSave({
      crop: croppedArea,
      file: activeFile ?? undefined,
      originalUrl: activeFile ? undefined : (source.originalUrl ?? undefined),
    });
  }

  return (
    <Modal className="max-w-3xl gap-4 p-6" onOpenChange={onOpenChange} open={open}>
      <DialogHeader>
        <DialogTitle>{copy.title}</DialogTitle>
      </DialogHeader>

      {imageSrc ? (
        <div className="flex flex-col gap-4">
          <div className="relative h-96 w-full overflow-hidden rounded-xl bg-neutral-900">
            <Cropper
              aspect={aspect}
              crop={crop}
              cropShape={maskShape}
              image={imageSrc}
              maxZoom={MAX_ZOOM}
              minZoom={MIN_ZOOM}
              onCropChange={setCrop}
              onCropComplete={handleCropComplete}
              onZoomChange={setZoom}
              zoom={zoom}
            />
            {typeof safeAreaTopPct === "number" && safeAreaTopPct > 0 && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 border-b-2 border-dashed border-white/70"
                style={{ height: `${safeAreaTopPct * 100}%` }}
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500" htmlFor="image-editor-zoom">
              {copy.zoomLabel}
            </label>
            <input
              className="h-1.5 w-full cursor-pointer accent-gray-900"
              id="image-editor-zoom"
              max={MAX_ZOOM}
              min={MIN_ZOOM}
              onChange={(e) => setZoom(Number(e.target.value))}
              step={0.01}
              type="range"
              value={zoom}
            />
          </div>

          <button
            className="flex w-fit items-center gap-1.5 text-sm font-medium text-light-blue hover:underline"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {copy.pickAnother}
          </button>
        </div>
      ) : (
        <div
          className={cn(
            "flex h-64 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-center transition-colors",
            isDraggingOver && "border-light-blue bg-light-blue/5",
          )}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDraggingOver(false);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingOver(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
        >
          <ImageUp className="h-8 w-8 text-neutral-400" />
          <p className="text-sm text-neutral-600">{copy.dropHint}</p>
          <p className="text-xs text-neutral-400">{copy.dropHintDivider}</p>
          <Button onClick={() => fileInputRef.current?.click()} size="sm" type="button">
            {copy.chooseFile}
          </Button>
        </div>
      )}

      <input
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.currentTarget.value = "";
        }}
        ref={fileInputRef}
        type="file"
      />

      <DialogFooter>
        <Button
          disabled={saving}
          onClick={() => onOpenChange(false)}
          type="button"
          variant="secondary"
        >
          {copy.cancel}
        </Button>
        <Button
          disabled={saving || !imageSrc || !croppedArea}
          onClick={() => void handleSave()}
          type="button"
        >
          {saving ? copy.saving : copy.save}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
