"use client";

import { useEffect } from "react";

interface UseJourneyAutoExcuseParams {
  /** Whether the excuse step applies (traveler type + level). */
  enabled: boolean;
  /** Excuse keys available for the traveler type. */
  excuseKeys: readonly string[];
  /** Currently selected excuse key, if any. */
  selectedExcuse: string | undefined;
  onSelect: (excuseKey: string) => void;
}

/** The excuse to auto-select: the only one available when none is selected. */
export function getAutoSelectedExcuse(
  enabled: boolean,
  excuseKeys: readonly string[],
  selectedExcuse: string | undefined,
): string | null {
  if (!enabled || selectedExcuse || excuseKeys.length !== 1) return null;
  return excuseKeys[0];
}

/**
 * Selects the excuse automatically when the traveler type has exactly one
 * (family, paws), so the user can go straight to the refine details.
 */
export function useJourneyAutoExcuse({
  enabled,
  excuseKeys,
  selectedExcuse,
  onSelect,
}: UseJourneyAutoExcuseParams): void {
  const autoKey = getAutoSelectedExcuse(enabled, excuseKeys, selectedExcuse);
  useEffect(() => {
    if (autoKey) onSelect(autoKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoKey]);
}
