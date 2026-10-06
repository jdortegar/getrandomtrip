"use client";

import { type RefObject, useEffect, useState } from "react";

/** Start fetching slightly before the element scrolls into view. */
const ROOT_MARGIN = "200px";
const SLOW_CONNECTIONS = new Set(["slow-2g", "2g"]);

interface NetworkInformationLike {
  effectiveType?: string;
  saveData?: boolean;
}

function connectionAllowsVideo(): boolean {
  const connection = (
    navigator as Navigator & { connection?: NetworkInformationLike }
  ).connection;
  if (!connection) return true;
  if (connection.saveData === true) return false;
  return !SLOW_CONNECTIONS.has(connection.effectiveType ?? "");
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Gates a background video behind viewport proximity, connection quality and
 * reduced-motion preference. Both flags start `false` so the server render and
 * first client render match; `shouldLoad` stays true once granted (callers keep
 * the source attached) while `isInView` tracks the element so playback can
 * pause and resume.
 */
export function useShouldLoadVideo(ref: RefObject<Element | null>): {
  isInView: boolean;
  shouldLoad: boolean;
} {
  const [isInView, setIsInView] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || !connectionAllowsVideo() || prefersReducedMotion()) return;

    // Without IntersectionObserver there is nothing to defer on.
    if (typeof IntersectionObserver === "undefined") {
      let cancelled = false;
      queueMicrotask(() => {
        if (cancelled) return;
        setIsInView(true);
        setShouldLoad(true);
      });
      return () => {
        cancelled = true;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Batched entries arrive oldest first; only the last one is current.
        const entry = entries.at(-1);
        if (!entry) return;
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting) setShouldLoad(true);
      },
      { rootMargin: ROOT_MARGIN },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return { isInView, shouldLoad };
}
