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
  normalizePriceLevelId,
  type PriceLevelId,
  type TravelerTypeSlug,
} from "@/lib/data/traveler-types";
import { isTypeOffered } from "@/lib/utils/traveler-card";

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
 * Single source of truth for "should this tripper's price overrides apply to
 * this traveler type" — a tripper's `priceOverrides` grid can carry a value
 * for any catalog-valid (type, level) pair regardless of whether they
 * currently have an ACTIVE `Experience` listing of that type (the admin grid
 * and a tripper's live experience list are two independent things). Reading
 * `priceOverrides` without also checking `allowedTypes` (experience-derived)
 * lets a display surface apply a tripper's override for a type they don't
 * actually offer today. Every call site that resolves a tripper-aware price
 * for a specific type MUST go through this instead of reading
 * `priceOverrides` directly — this used to be reimplemented ad hoc
 * (`by-type/[type]/page.tsx`) or relied on incidentally (an empty
 * `allowedLevelsByType` entry happening to filter everything out), which let
 * the two drift.
 *
 * `allowedLevelIds`, when passed, applies that same gate one level deeper —
 * a card badged "BY RANDOMTRIP" (the tripper doesn't have ACTIVE content at
 * that specific level, even though the type itself is offered) must never
 * still show the tripper's overridden price; it falls back to the global
 * catalog price like any other non-offered level. Values are raw
 * `Experience.level` strings (e.g. "explora", "atelier") and are normalized
 * via `normalizePriceLevelId` before comparing against the override map's
 * already-canonical `PriceLevelId` keys. Omitting it (the by-type page,
 * which has no level-granular tripper data) keeps the pre-existing
 * type-only gate.
 */
export function getEffectiveTripperPriceOverrides(
  tripperContext:
    | { allowedTypes: string[]; priceOverrides: TripperPriceOverrides | null }
    | null
    | undefined,
  type: string,
  allowedLevelIds?: string[],
): TripperPriceOverrides | null {
  if (!tripperContext) return null;
  if (!isTypeOffered(tripperContext.allowedTypes, type)) return null;

  const overrides = tripperContext.priceOverrides;
  if (!overrides || allowedLevelIds === undefined) return overrides;

  const typeKey = type as TravelerTypeSlug;
  const typeOverrides = overrides[typeKey];
  if (!typeOverrides) return overrides;

  const normalizedAllowed = new Set(
    allowedLevelIds
      .map((id) => normalizePriceLevelId(id))
      .filter((id): id is PriceLevelId => id !== null),
  );
  const filteredLevels = Object.fromEntries(
    Object.entries(typeOverrides).filter(([levelId]) =>
      normalizedAllowed.has(levelId as PriceLevelId),
    ),
  );
  return { ...overrides, [typeKey]: filteredLevels };
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
