/**
 * Pure logic for `PriceOverrideGrid` — extracted so it can be unit tested
 * without mounting React or mocking `fetch`. Mirrors the separation-of-
 * concerns pattern in `userRoleModalHelpers.ts`.
 */
import type { PriceLevelId, TravelerTypeSlug } from "@/lib/data/traveler-types";
import type { TripperPriceOverrides } from "@/lib/pricing/tripper-price-overrides";

/** Controlled-input display state: every filled cell is a raw string (possibly invalid mid-edit). */
export type PriceGridState = Partial<
  Record<TravelerTypeSlug, Partial<Record<PriceLevelId, string>>>
>;

/** Converts stored overrides (numbers) into display strings for the grid inputs. */
export function gridStateFromOverrides(
  overrides: TripperPriceOverrides | null,
): PriceGridState {
  if (!overrides) return {};
  const result: PriceGridState = {};
  for (const [type, levels] of Object.entries(overrides) as [
    TravelerTypeSlug,
    Partial<Record<PriceLevelId, number>> | undefined,
  ][]) {
    const cells: Partial<Record<PriceLevelId, string>> = {};
    for (const [level, value] of Object.entries(levels ?? {}) as [
      PriceLevelId,
      number,
    ][]) {
      if (typeof value === "number" && Number.isFinite(value)) {
        cells[level] = String(value);
      }
    }
    if (Object.keys(cells).length > 0) result[type] = cells;
  }
  return result;
}

/**
 * Converts grid display strings into the PATCH payload shape. Empty cells
 * (inherit) and interim-invalid cells (not a finite number) are omitted —
 * the caller is responsible for surfacing invalid-but-non-empty input as a
 * validation error before allowing Save.
 */
export function overridesPayloadFromGridState(
  grid: PriceGridState,
): TripperPriceOverrides {
  const result: TripperPriceOverrides = {};
  for (const [type, levels] of Object.entries(grid) as [
    TravelerTypeSlug,
    Partial<Record<PriceLevelId, string>> | undefined,
  ][]) {
    const cells: Partial<Record<PriceLevelId, number>> = {};
    for (const [level, raw] of Object.entries(levels ?? {}) as [
      PriceLevelId,
      string,
    ][]) {
      const trimmed = (raw ?? "").trim();
      if (trimmed === "") continue;
      const n = Number(trimmed);
      if (Number.isFinite(n)) cells[level] = n;
    }
    if (Object.keys(cells).length > 0) result[type] = cells;
  }
  return result;
}

function normalizedGridEntries(grid: PriceGridState): string {
  const entries: string[] = [];
  for (const type of Object.keys(grid).sort()) {
    const levels = grid[type as TravelerTypeSlug] ?? {};
    for (const level of Object.keys(levels).sort()) {
      const raw = (levels[level as PriceLevelId] ?? "").trim();
      if (raw === "") continue;
      entries.push(`${type}:${level}:${raw}`);
    }
  }
  return entries.join("|");
}

/** True when the raw (trimmed) grid contents differ — including interim-invalid input. */
export function isGridStateDirty(
  initial: PriceGridState,
  current: PriceGridState,
): boolean {
  return normalizedGridEntries(initial) !== normalizedGridEntries(current);
}
