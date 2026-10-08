import { useEffect, useState, type RefObject } from "react";

// Mirrors the slide-width breakpoints in EmblaCarousel: `@lg` (32rem) and `@md`
// (28rem) are container queries, `sm` (640px) is a viewport query.
const CONTAINER_LG = 512;
const CONTAINER_MD = 448;
const VIEWPORT_SM = "(min-width: 640px)";

export function slidesThatFit(
  containerWidth: number,
  wideViewport: boolean,
  slidesPerView: 2 | 3 | 4,
): number {
  if (containerWidth >= CONTAINER_LG && slidesPerView === 4) return 4;
  if (containerWidth >= CONTAINER_MD) return Math.min(slidesPerView, 3);
  return wideViewport ? 2 : 1;
}

/**
 * How many slides are fully visible at once at the current width, or `null`
 * until the first measurement (SSR, no ResizeObserver) so callers can fall
 * back to a count-based guess.
 */
export function useCarouselCapacity(
  ref: RefObject<HTMLElement | null>,
  slidesPerView: 2 | 3 | 4,
): number | null {
  const [capacity, setCapacity] = useState<number | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === "undefined") return;

    const media =
      typeof window.matchMedia === "function"
        ? window.matchMedia(VIEWPORT_SM)
        : null;
    // Measure synchronously on mount so phones never render the static row
    // while waiting for the first observer callback (which needs a painted frame).
    let width: number | null = node.getBoundingClientRect().width || null;

    const update = () => {
      if (width === null) return;
      setCapacity(slidesThatFit(width, media?.matches ?? true, slidesPerView));
    };
    update();

    const observer = new ResizeObserver((entries) => {
      width = entries[entries.length - 1]?.contentRect.width ?? width;
      update();
    });
    observer.observe(node);
    media?.addEventListener("change", update);

    return () => {
      observer.disconnect();
      media?.removeEventListener("change", update);
    };
  }, [ref, slidesPerView]);

  return capacity;
}
