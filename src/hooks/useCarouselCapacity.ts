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

/** Mirrors the `gap-3` between slides in EmblaCarousel. */
const SLIDE_GAP = 12;

/** Whole fixed-width slides that fit in `viewportWidth` (never less than one). */
export function fixedSlidesThatFit(
  viewportWidth: number,
  slideWidth: number,
): number {
  return Math.max(
    1,
    Math.floor((viewportWidth + SLIDE_GAP) / (slideWidth + SLIDE_GAP)),
  );
}

/** Content width of the slide viewport (marked `data-carousel-viewport`), padding excluded. */
function viewportContentWidth(node: HTMLElement, fallback: number): number {
  const viewport = node.querySelector<HTMLElement>("[data-carousel-viewport]");
  if (!viewport) return fallback;
  const style = window.getComputedStyle(viewport);
  return (
    viewport.clientWidth -
    (parseFloat(style.paddingLeft) || 0) -
    (parseFloat(style.paddingRight) || 0)
  );
}

/**
 * How many slides are fully visible at once at the current width, or `null`
 * until the first measurement (SSR, no ResizeObserver) so callers can fall
 * back to a count-based guess. Pass `slideWidth` (px) when slides have a
 * fixed width instead of the percentage breakpoints.
 */
export function useCarouselCapacity(
  ref: RefObject<HTMLElement | null>,
  slidesPerView: 2 | 3 | 4,
  slideWidth?: number,
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
      setCapacity(
        slideWidth
          ? fixedSlidesThatFit(viewportContentWidth(node, width), slideWidth)
          : slidesThatFit(width, media?.matches ?? true, slidesPerView),
      );
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
  }, [ref, slidesPerView, slideWidth]);

  return capacity;
}
