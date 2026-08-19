/**
 * Pure resolver: base price per person (USD), tripper-override-aware.
 * `getBasePricePerPerson` (traveler-types/index.ts) is intentionally left
 * alone — it is imported by client display components and MUST NOT become
 * async/prisma-aware. This module sits ABOVE it: split load (server-only,
 * `tripper-price-overrides.server.ts`) from resolve (this file, pure).
 */
import {
  getBasePricePerPerson,
  normalizePriceLevelId,
  TRAVELER_TYPE_SLUGS,
  type PriceLevelId,
  type TravelerTypeSlug,
} from "@/lib/data/traveler-types";
import { isPairOffered, type TripperPriceOverrides } from "./tripper-price-overrides";

export type PriceResolution =
  | { offered: false; price: 0; source: "not-offered" }
  | { offered: true; price: number; source: "override" | "catalog" };

function isTravelerTypeSlug(value: string): value is TravelerTypeSlug {
  return (TRAVELER_TYPE_SLUGS as string[]).includes(value);
}

/**
 * Resolves the base price per person for the given traveler type/level,
 * preferring a tripper-specific override when one exists for that pair.
 *
 * - `xsed` is a flat-rate product: it never consults overrides and always
 *   resolves from the catalog (`getBasePricePerPerson` short-circuits it).
 * - `overrides` MUST be `null` for RandomTrip-owned bookings (no tripper
 *   attribution) — callers pass `null` explicitly, never omit the field.
 * - Unknown type/level pairs resolve to `{ offered: false, price: 0 }`,
 *   matching `getBasePricePerPerson`'s existing "unknown -> 0" semantics.
 */
export function resolveBasePricePerPerson(input: {
  travelerType: string;
  levelId: string | null | undefined;
  overrides: TripperPriceOverrides | null;
}): PriceResolution {
  const { travelerType, levelId, overrides } = input;

  if (travelerType.toLowerCase() === "xsed") {
    return {
      offered: true,
      price: getBasePricePerPerson(travelerType, levelId),
      source: "catalog",
    };
  }

  if (!isTravelerTypeSlug(travelerType)) {
    return { offered: false, price: 0, source: "not-offered" };
  }

  const level: PriceLevelId | null = normalizePriceLevelId(levelId);
  if (!level || !isPairOffered(travelerType, level)) {
    return { offered: false, price: 0, source: "not-offered" };
  }

  const overrideValue = overrides?.[travelerType]?.[level];
  if (typeof overrideValue === "number" && Number.isFinite(overrideValue)) {
    return { offered: true, price: overrideValue, source: "override" };
  }

  return {
    offered: true,
    price: getBasePricePerPerson(travelerType, level),
    source: "catalog",
  };
}
