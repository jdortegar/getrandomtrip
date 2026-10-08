import {
  allExcuses,
  getExcusesByTravelerType,
  getExcuseByKey as getCentralizedExcuseByKey,
  type ExcuseData,
} from "@/lib/data/shared/excuses";
import { hasExcuseStep } from "@/lib/constants/product-config";

// Re-export the centralized types and data
export type { ExcuseData } from "@/lib/data/shared/excuses";

/**
 * Toggle a refine detail: deselect when selected, add when below `max`,
 * otherwise return `current` unchanged (selection ignored at the cap).
 */
export function toggleRefineDetail(
  current: readonly string[],
  key: string,
  max: number,
): string[] {
  if (current.includes(key)) return current.filter((k) => k !== key);
  if (current.length >= max) return current as string[];
  return [...current, key];
}

/** Whether the given traveler type and level show the excuse + refine-details step. */
export function getHasExcuseStep(
  travelerType: string,
  levelId: string | null | undefined,
): boolean {
  return hasExcuseStep(travelerType, levelId);
}

// All available excuse keys from centralized data
export const EXCUSE_KEYS = allExcuses.map((excuse) => excuse.key);
export type ExcuseKey = (typeof EXCUSE_KEYS)[number];

// Excuse option keys from centralized data
export const EXCUSE_OPTION_KEYS = allExcuses.flatMap((excuse) =>
  excuse.details.options.map((option) => option.key),
);
export type ExcuseOptionKey = (typeof EXCUSE_OPTION_KEYS)[number];

/**
 * Get excuse data by key
 */
export function getExcuseByKey(key: string): ExcuseData | null {
  return getCentralizedExcuseByKey(key);
}

/**
 * Get excuse title by key
 */
export function getExcuseTitle(key: string): string {
  const excuse = getExcuseByKey(key);
  return (
    excuse?.title ||
    key.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

/**
 * Get excuse description by key
 */
export function getExcuseDescription(key: string): string {
  const excuse = getExcuseByKey(key);
  return excuse?.description || "";
}

/**
 * Get excuse image by key
 */
export function getExcuseImage(key: string): string {
  const excuse = getExcuseByKey(key);
  return (
    excuse?.img ||
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e"
  );
}

/**
 * Get all available excuse keys
 */
export function getAllExcuseKeys(): string[] {
  return allExcuses.map((excuse) => excuse.key);
}

/**
 * Check if an excuse key exists
 */
export function isValidExcuseKey(key: string): boolean {
  return allExcuses.some((excuse) => excuse.key === key);
}

/**
 * Get excuse options by excuse key
 */
export function getExcuseOptions(excuseKey: string): Array<{
  key: string;
  label: string;
  desc: string;
  img: string;
}> {
  const excuse = getExcuseByKey(excuseKey);
  return excuse?.details?.options || [];
}

/**
 * Get excuse option by key
 */
export function getExcuseOption(
  excuseKey: string,
  optionKey: string,
): {
  key: string;
  label: string;
  desc: string;
  img: string;
} | null {
  const options = getExcuseOptions(excuseKey);
  return options.find((option) => option.key === optionKey) || null;
}

/**
 * Get excuses by traveler type
 */
export function getExcusesByType(travelerType: string): ExcuseData[] {
  return getExcusesByTravelerType(travelerType);
}

/**
 * Get excuses by traveler type and level. Returns [] when this level does not
 * show the excuse step (e.g. atelier, or honeymoon). Uses levels.ts as source of truth.
 */
export function getExcusesByTypeAndLevel(
  travelerType: string,
  levelId: string | null | undefined,
): ExcuseData[] {
  if (!hasExcuseStep(travelerType, levelId)) return [];
  return getExcusesByTravelerType(travelerType);
}

export interface LocalizedExcuseTitle {
  key: string;
  title: string;
}

/** Localized refine options keyed by traveler type, then excuse key (journey.refineDetailOptions). */
export type LocalizedRefineOptions = Record<
  string,
  Record<string, Array<{ key: string; label: string; desc?: string }>>
>;

/**
 * Refine-detail options of an excuse with the localized label/description
 * applied over the catalog copy (catalog copy is the fallback).
 */
export function getLocalizedRefineOptions(
  travelerType: string,
  excuseKey: string | null | undefined,
  localizedRefineOptions?: LocalizedRefineOptions,
): ReturnType<typeof getExcuseOptions> {
  if (!excuseKey) return [];
  const localized = localizedRefineOptions?.[travelerType]?.[excuseKey];
  return getExcuseOptions(excuseKey).map((option) => {
    const over = localized?.find((o) => o.key === option.key);
    return over
      ? { ...option, label: over.label, desc: over.desc ?? option.desc }
      : option;
  });
}

export interface ResolvedExcuseSelection {
  title: string;
  refineDetails: Array<{ key: string; label: string }>;
}

/**
 * Resolve display labels for a stored excuse + refine details, preferring the
 * localized dictionary entries and falling back to the catalog copy.
 */
export function resolveExcuseSelectionLabels({
  travelerType,
  excuseKey,
  refineDetails,
  localizedExcuses,
  localizedRefineOptions,
}: {
  travelerType: string;
  excuseKey: string | null | undefined;
  refineDetails: readonly string[] | null | undefined;
  localizedExcuses?: readonly LocalizedExcuseTitle[];
  localizedRefineOptions?: LocalizedRefineOptions;
}): ResolvedExcuseSelection | null {
  if (!excuseKey) return null;
  const localizedOptions =
    localizedRefineOptions?.[travelerType]?.[excuseKey] ?? [];
  const catalogOptions = getExcuseOptions(excuseKey);
  return {
    title:
      localizedExcuses?.find((e) => e.key === excuseKey)?.title ??
      getExcuseTitle(excuseKey),
    refineDetails: (refineDetails ?? []).map((key) => ({
      key,
      label:
        localizedOptions.find((o) => o.key === key)?.label ??
        catalogOptions.find((o) => o.key === key)?.label ??
        key,
    })),
  };
}
