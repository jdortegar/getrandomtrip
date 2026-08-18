/**
 * Per-tripper price overrides — pure, no prisma (unit-testable, safe for the
 * client bundle). Storage shape lives on `User.tripperPriceOverrides` (Json?).
 *
 * Three price states (see design ADR-2):
 * - not offered: derived from the global catalog (`isPairOffered`), NEVER stored.
 * - inherit global: the (type, level) key is absent from the map (or null).
 * - explicit override (including 0): a finite number >= 0 stored under the key.
 */
import {
  PRICE_BY_TYPE_AND_LEVEL,
  TRAVELER_TYPE_SLUGS,
  type PriceLevelId,
  type TravelerTypeSlug,
} from "@/lib/data/traveler-types";

const PRICE_LEVEL_IDS: PriceLevelId[] = [
  "essenza",
  "explora",
  "explora-plus",
  "bivouac",
  "atelier",
];

export type TripperPriceOverrides = Partial<
  Record<TravelerTypeSlug, Partial<Record<PriceLevelId, number>>>
>;

export type ParseOverridesPayloadError =
  | "invalid-shape"
  | "unknown-type"
  | "unknown-level"
  | "not-finite"
  | "negative"
  | "not-offered";

export type ParseOverridesPayloadResult =
  | { ok: true; value: TripperPriceOverrides }
  | { ok: false; error: ParseOverridesPayloadError };

function isTravelerTypeSlug(value: string): value is TravelerTypeSlug {
  return (TRAVELER_TYPE_SLUGS as string[]).includes(value);
}

function isPriceLevelId(value: string): value is PriceLevelId {
  return (PRICE_LEVEL_IDS as string[]).includes(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" && value !== null && !Array.isArray(value)
  );
}

/**
 * Whether the global catalog offers a price for this (type, level) pair.
 * "Not offered" is a property of the catalog, not of any tripper — this is
 * the ONLY source of truth for that state; it is never persisted per tripper.
 */
export function isPairOffered(
  type: TravelerTypeSlug,
  level: PriceLevelId,
): boolean {
  return (PRICE_BY_TYPE_AND_LEVEL[type]?.[level] ?? 0) > 0;
}

/**
 * Lenient read-side parser: used when loading a tripper's overrides for
 * price resolution. Silently drops anything malformed (unknown keys,
 * non-finite/negative values, null cells) rather than failing — a stored row
 * should never crash checkout. Returns `null` for `null`/non-object input.
 */
export function parseTripperPriceOverrides(
  raw: unknown,
): TripperPriceOverrides | null {
  if (!isPlainObject(raw)) return null;

  const result: TripperPriceOverrides = {};
  for (const [typeKey, levels] of Object.entries(raw)) {
    if (!isTravelerTypeSlug(typeKey) || !isPlainObject(levels)) continue;

    const cleanLevels: Partial<Record<PriceLevelId, number>> = {};
    for (const [levelKey, cellValue] of Object.entries(levels)) {
      if (!isPriceLevelId(levelKey)) continue;
      if (cellValue === null || cellValue === undefined) continue;
      if (typeof cellValue !== "number" || !Number.isFinite(cellValue))
        continue;
      if (cellValue < 0) continue;
      cleanLevels[levelKey] = cellValue;
    }

    if (Object.keys(cleanLevels).length > 0) {
      result[typeKey] = cleanLevels;
    }
  }

  return result;
}

/**
 * Strict write-side parser: used by the admin PATCH endpoint. Validates the
 * ENTIRE payload before any write — a single bad cell rejects the whole
 * request (nothing written). A `null` cell value clears that key (does not
 * error); an empty resulting type entry is stripped from the output.
 */
export function parseTripperPriceOverridesPayload(
  raw: unknown,
): ParseOverridesPayloadResult {
  if (!isPlainObject(raw)) return { error: "invalid-shape", ok: false };

  const result: TripperPriceOverrides = {};
  for (const [typeKey, levels] of Object.entries(raw)) {
    if (!isTravelerTypeSlug(typeKey)) {
      return { error: "unknown-type", ok: false };
    }
    if (!isPlainObject(levels)) {
      return { error: "invalid-shape", ok: false };
    }

    const cleanLevels: Partial<Record<PriceLevelId, number>> = {};
    for (const [levelKey, cellValue] of Object.entries(levels)) {
      if (!isPriceLevelId(levelKey)) {
        return { error: "unknown-level", ok: false };
      }
      if (cellValue === null || cellValue === undefined) {
        // Explicit clear — skip, do not store the key.
        continue;
      }
      if (typeof cellValue !== "number" || !Number.isFinite(cellValue)) {
        return { error: "not-finite", ok: false };
      }
      if (cellValue < 0) {
        return { error: "negative", ok: false };
      }
      if (!isPairOffered(typeKey, levelKey)) {
        return { error: "not-offered", ok: false };
      }
      cleanLevels[levelKey] = cellValue;
    }

    if (Object.keys(cleanLevels).length > 0) {
      result[typeKey] = cleanLevels;
    }
  }

  return { ok: true, value: result };
}
