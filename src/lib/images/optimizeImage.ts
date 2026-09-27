import sharp from "sharp";

/**
 * Max pixel dimensions per upload feature.
 * Images are resized to fit within these bounds (aspect ratio preserved).
 * SVG files are never processed by sharp.
 */
const FEATURE_MAX_DIMENSIONS: Record<string, { width: number; height: number }> = {
  avatar: { width: 400, height: 400 },
  "tripper-hero": { width: 1920, height: 1080 },
  blog: { width: 1600, height: 1200 },
  experience: { width: 1600, height: 1200 },
  // Deliberately generous vs. the derivative bounds above — these hold the
  // *original* upload for a feature that supports crop/re-crop. `avatar` is
  // capped at 400x400, so storing originals under that bound would make
  // re-crop useless (there would be nothing left to re-frame).
  "tripper-hero-original": { width: 2560, height: 2560 },
  "avatar-original": { width: 1280, height: 1280 },
};
export const DEFAULT_MAX_DIMENSIONS = { width: 1600, height: 1200 };

const COMPRESSIBLE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

export async function optimizeImage(
  buffer: Buffer,
  mimeType: string,
  feature: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  if (!COMPRESSIBLE_MIME.has(mimeType)) {
    return { buffer, contentType: mimeType };
  }
  const dims = FEATURE_MAX_DIMENSIONS[feature] ?? DEFAULT_MAX_DIMENSIONS;
  const optimized = await sharp(buffer)
    .resize(dims.width, dims.height, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  return { buffer: optimized, contentType: "image/webp" };
}
