"use client";

import { useEffect, useState } from "react";
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
  const [overlay, setOverlay] = useState(variant !== "solid");

  useEffect(() => {
    if (variant !== "auto") {
      setOverlay(variant === "overlay");
    }
  }, [variant]);

  const lenis = useLenis((instance) => {
    if (variant !== "auto") return;
    setOverlay(instance.animatedScroll < threshold);
  });

  // Sets the correct initial value once Lenis is available — e.g. when the
  // page mounts already scrolled (restored position, anchor navigation)
  // instead of waiting for the next scroll tick to correct it.
  useEffect(() => {
    if (variant !== "auto" || !lenis) return;
    setOverlay(lenis.animatedScroll < threshold);
  }, [variant, lenis, threshold]);

  return overlay;
}
