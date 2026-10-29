"use client";

import { useHydrated } from "@/hooks/useHydrated";
import { detectSupportedTimezone, formatNextDropDay } from "@/lib/xsed/window";

/**
 * Upcoming XSED drop day in the viewer's timezone (e.g. "domingo 1 nov").
 * `null` on the server and first hydration render, so both render the same markup.
 */
export function useNextXsedDropDay(locale: string): string | null {
  const hydrated = useHydrated();
  return hydrated ? formatNextDropDay(detectSupportedTimezone(), locale) : null;
}
