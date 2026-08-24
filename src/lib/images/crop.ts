/**
 * Pure crop math shared by the upload API route and the hero backfill
 * script. No sharp, no React — must stay fully unit-testable in isolation.
 *
 * A crop rect is always normalized as fractions (0–1) of the source image's
 * EXIF-rotated natural size. This makes it immune to any resize the server
 * later applies to the stored original, which is what lets re-crop stay
 * lossless.
 */

/** Crop rect as fractions of the source image's EXIF-rotated natural size. */
export interface NormalizedCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Tolerance for floating-point drift when validating x + width <= 1 (and y + height <= 1). */
const EPSILON = 1e-6;

/**
 * The rect `object-fit: cover` + `object-position: {fx}% {fy}%` would show
 * at zoom 1. This is the backfill's correctness story: it derives a 16:9
 * (or any target aspect) crop from a legacy focal-point percentage pair.
 */
export function coverCropFromFocalPoint(
  sourceW: number,
  sourceH: number,
  aspect: number,
  fxPct: number | null,
  fyPct: number | null,
): NormalizedCrop {
  const fx = fxPct ?? 50;
  const fy = fyPct ?? 50;
  const sourceAspect = sourceW / sourceH;

  let cropW: number;
  let cropH: number;
  let left: number;
  let top: number;

  if (sourceAspect > aspect) {
    // Source is relatively wider than the target — crop full height,
    // slide the window horizontally per the focal point's x fraction.
    cropH = sourceH;
    cropW = sourceH * aspect;
    left = (sourceW - cropW) * (fx / 100);
    top = 0;
  } else {
    // Source is relatively taller than (or equal to) the target — crop
    // full width, slide the window vertically per the focal point's y fraction.
    cropW = sourceW;
    cropH = sourceW / aspect;
    left = 0;
    top = (sourceH - cropH) * (fy / 100);
  }

  return {
    x: left / sourceW,
    y: top / sourceH,
    width: cropW / sourceW,
    height: cropH / sourceH,
  };
}

/**
 * API guard for the `crop` form field: finite numbers, 0<=x<=1, 0<w<=1,
 * x+w<=1+EPSILON (and the same for y/height). Returns null on any
 * violation, including malformed/non-object input or a JSON string that
 * fails to parse.
 */
export function parseCropPayload(raw: unknown): NormalizedCrop | null {
  let value: unknown = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const { x, y, width, height } = value as Record<string, unknown>;
  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    typeof width !== "number" ||
    typeof height !== "number"
  ) {
    return null;
  }
  if (![x, y, width, height].every((n) => Number.isFinite(n))) {
    return null;
  }

  if (x < 0 || y < 0) return null;
  if (width <= 0 || width > 1) return null;
  if (height <= 0 || height > 1) return null;
  if (x + width > 1 + EPSILON) return null;
  if (y + height > 1 + EPSILON) return null;

  return { x, y, width, height };
}

/**
 * Clamp a normalized crop to [0,1] against the source's pixel dimensions and
 * convert it to sharp `extract` args. Guarantees width/height are never
 * below 1px (a degenerate 0px extract throws in sharp).
 */
export function normalizedCropToPixels(
  crop: NormalizedCrop,
  sourceW: number,
  sourceH: number,
): { left: number; top: number; width: number; height: number } {
  const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
  // Clamp to sourceDim - 1 (not sourceDim) so there is always at least 1px
  // of room left for the minimum-size extract below.
  const clampOrigin = (n: number, sourceDim: number) =>
    Math.min(Math.max(sourceDim - 1, 0), Math.max(0, n));

  const left = clampOrigin(Math.round(clamp01(crop.x) * sourceW), sourceW);
  const top = clampOrigin(Math.round(clamp01(crop.y) * sourceH), sourceH);

  const maxWidth = Math.max(1, sourceW - left);
  const maxHeight = Math.max(1, sourceH - top);

  const width = Math.min(
    maxWidth,
    Math.max(1, Math.round(clamp01(crop.width) * sourceW)),
  );
  const height = Math.min(
    maxHeight,
    Math.max(1, Math.round(clamp01(crop.height) * sourceH)),
  );

  return { left, top, width, height };
}
