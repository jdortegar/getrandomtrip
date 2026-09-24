"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useLenis } from "lenis/react";

interface UseScrollDetectionOptions {
  variant: "auto" | "solid" | "overlay";
  threshold?: number;
}

/**
 * Lenis (root mode) drives the real scroll position via its own render
 * loop — native `window` scroll events don't fire reliably on every tick,
 * so "auto" mode has to read position from Lenis itself, not a
 * window.scroll listener (see BackToTopButton.tsx for the same fix).
 */
export function useScrollDetection({
  variant,
  threshold = 1,
}: UseScrollDetectionOptions) {
  const lenis = useLenis();
  const subscribe = useCallback(
    (notify: () => void) => {
      if (variant !== "auto" || !lenis) return () => {};
      return lenis.on("scroll", notify);
    },
    [lenis, variant],
  );

  return useSyncExternalStore(
    subscribe,
    () => {
      if (variant !== "auto") return variant === "overlay";
      return lenis ? lenis.animatedScroll < threshold : true;
    },
    () => variant !== "solid",
  );
}
