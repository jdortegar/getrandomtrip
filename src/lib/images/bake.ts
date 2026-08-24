import sharp from "sharp";
import { normalizedCropToPixels, type NormalizedCrop } from "@/lib/images/crop";

/**
 * Bakes a final image from an original buffer + normalized crop rect: the
 * single crop implementation shared by `POST /api/upload` and the tripper
 * hero backfill script, so there is never a second place this math can
 * drift out of sync.
 */
export async function bakeCrop(
  buffer: Buffer,
  crop: NormalizedCrop,
  outputDims: { width: number; height: number },
): Promise<Buffer> {
  // `.rotate()` (no args) MUST run before `.extract()`. Browsers auto-apply
  // EXIF orientation when displaying/cropping in the editor, but the raw
  // buffer bytes do not reflect that rotation — extracting against the
  // un-rotated buffer would silently offset every crop for photos taken in
  // portrait mode on a phone that stores landscape bytes + an EXIF flag.
  const rotated = sharp(buffer).rotate();
  const meta = await rotated.metadata();
  const sourceW = meta.width ?? 0;
  const sourceH = meta.height ?? 0;

  const pixelRect = normalizedCropToPixels(crop, sourceW, sourceH);

  return rotated
    .extract(pixelRect)
    .resize(outputDims.width, outputDims.height, { fit: "cover" })
    .webp({ quality: 82 })
    .toBuffer();
}
