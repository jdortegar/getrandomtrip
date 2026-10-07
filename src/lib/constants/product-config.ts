/**
 * Product (traveler type) configuration and rules.
 * Single source for which types exist and when they show the excuse step.
 *
 * Filter cost (Power Pack) – see also lib/constants/journey-filters.ts:
 * - Precio por filtro: $25 USD. "Power Pack" (3 filtros): $60 USD.
 * - 1er destino a evitar incluido para todos; 2do incluido para Explora+ y Bivouac; luego cada uno cuenta como filtro.
 * - Transporte sin costo para Modo Explora, Explora+ y Bivouac.
 * - Duración máxima de viaje sin costo para Bivouac.
 * - Horario salida/llegada sin costo para Explora+ y Bivouac.
 */

import type { TravelerTypeSlug } from "@/lib/data/traveler-types";

/** Traveler type slugs = product identifiers (BOND=couple, SOLUM=solo, etc.). */
export const PRODUCT_TYPES: TravelerTypeSlug[] = [
  "solo",
  "couple",
  "family",
  "group",
  "honeymoon",
  "paws",
];

/** Level ids that can show the excuse step (when the product allows it). */
export const LEVEL_IDS_WITH_EXCUSE = [
  "essenza",
  "modo-explora",
  "explora-plus",
  "bivouac",
] as const;

export type LevelIdWithExcuse = (typeof LEVEL_IDS_WITH_EXCUSE)[number];

/**
 * Excuse step rule per product:
 * - 'all-levels': Essenza, Modo Explora, Explora+ and Bivouac show excuse + refine
 *   details (BOND, KIN, CREW, SOLUM, PAWS per product maps). Atelier never.
 * - 'explora-plus-and-bivouac': only Explora+ and Bivouac (no product uses it today).
 * - 'none': no excuse step (NUPTIA / honeymoon).
 */
export type ExcuseRule = "all-levels" | "explora-plus-and-bivouac" | "none";

export const EXCUSE_RULE_BY_TYPE: Record<TravelerTypeSlug, ExcuseRule> = {
  couple: "all-levels", // BOND
  solo: "all-levels", // SOLUM
  family: "all-levels", // KIN
  group: "all-levels", // CREW
  honeymoon: "none", // NUPTIA
  paws: "all-levels", // PAWS
};

/** Normalize level id for comparison (e.g. explora-plus, modo-explora). */
function normalizeLevelId(level: string): string {
  const n = level
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace("explora+", "explora-plus");
  if (n === "exploraplus") return "explora-plus";
  if (n === "modoexplora" || n === "explora") return "modo-explora";
  return n;
}

/** Maximum number of refine details a traveler can pick (UI and server). */
export const MAX_REFINE_DETAILS = 3;

/**
 * Pseudo level id for XSED bookings. XSED is not a journey level, but its
 * booking flow shows the excuse step for every eligible traveler type.
 */
export const XSED_LEVEL_ID = "xsed";

/**
 * Whether the given traveler type and level show the excuse + refine-details step.
 * XSED bookings pass `XSED_LEVEL_ID` as the level: the step shows for any
 * traveler type whose rule is not 'none' (honeymoon never).
 */
export function hasExcuseStep(
  travelerType: string,
  levelId: string | null | undefined,
): boolean {
  if (!levelId) return false;
  const rule = EXCUSE_RULE_BY_TYPE[travelerType as TravelerTypeSlug];
  if (!rule || rule === "none") return false;
  const normalized = normalizeLevelId(levelId);
  if (normalized === XSED_LEVEL_ID) return true;
  if (normalized === "atelier-getaway" || normalized === "atelier")
    return false;
  if (rule === "all-levels")
    return LEVEL_IDS_WITH_EXCUSE.includes(normalized as LevelIdWithExcuse);
  if (rule === "explora-plus-and-bivouac") {
    return normalized === "explora-plus" || normalized === "bivouac";
  }
  return false;
}
