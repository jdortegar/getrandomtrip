'use client';

/**
 * Simple Embla carousel: slides per view + optional peek of next slide.
 * Single component, no context. SOLID/DRY/KISS.
 *
 * @see https://www.embla-carousel.com/get-started/react/
 * @see https://www.embla-carousel.com/guides/slide-sizes/
 * @see https://www.embla-carousel.com/guides/slide-gaps/
 */

import * as React from 'react';
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

type CarouselApi = UseEmblaCarouselType[1];

export interface EmblaCarouselProps {
  /** Alignment when fewer slides than view: 'start' | 'center' | 'end'. */
  align?: 'center' | 'end' | 'start';
  /** Localized aria-label for dot "Go to slide N". Use {n} for slide number (1-based). */
  ariaLabelSlide?: string;
  /** Localized aria-label for next button. */
  ariaLabelNext?: string;
  /** Localized aria-label for previous button. */
  ariaLabelPrev?: string;
  /** Gap between slides in px. */
  gap?: number;
  /** Pixels of the next slide to show (peek). */
  peek?: number;
  /** Show prev/next arrows. */
  showArrows?: boolean;
  /** Show dot indicators. */
  showDots?: boolean;
  /** Number of slides visible at once. */
  slidesPerView?: number;
  /** How many slides to advance per scroll (default: 1). Use 'auto' to scroll by visible group. */
  slidesToScroll?: number | 'auto';
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  slideClassName?: string;
  viewportClassName?: string;
}

function usePrevNext(api: CarouselApi | undefined) {
  const [canPrev, setCanPrev] = React.useState(false);
  const [canNext, setCanNext] = React.useState(false);
  const sync = React.useCallback(() => {
    if (!api) return;
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
  }, [api]);
  React.useEffect(() => {
    if (!api) return;
    sync();
    api.on('reInit', sync);
    api.on('select', sync);
    return () => {
      api.off('select', sync);
      api.off('reInit', sync);
    };
  }, [api, sync]);
  return {
    canPrev,
    canNext,
    scrollPrev: React.useCallback(() => api?.scrollPrev(), [api]),
    scrollNext: React.useCallback(() => api?.scrollNext(), [api]),
  };
}

function useDots(api: CarouselApi | undefined) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [snaps, setSnaps] = React.useState<number[]>([]);
  const sync = React.useCallback(() => {
    if (!api) return;
    setSnaps(api.scrollSnapList());
    setSelectedIndex(api.selectedScrollSnap());
  }, [api]);
  React.useEffect(() => {
    if (!api) return;
    sync();
    api.on('reInit', sync);
    api.on('select', sync);
    return () => {
      api.off('select', sync);
      api.off('reInit', sync);
    };
  }, [api, sync]);
  return {
    selectedIndex,
    snaps,
    scrollTo: React.useCallback((i: number) => api?.scrollTo(i), [api]),
  };
}

export function EmblaCarousel({
  align = 'start',
  ariaLabelNext = 'Next slide',
  ariaLabelPrev = 'Previous slide',
  ariaLabelSlide = 'Go to slide {n}',
  children,
  className,
  contentClassName,
  gap = 16,
  peek = 0,
  showArrows = true,
  showDots = true,
  slideClassName,
  slidesPerView = 1,
  slidesToScroll = 1,
  viewportClassName,
}: EmblaCarouselProps) {
  const n = Math.max(1, slidesPerView);
  const gapPx = Math.max(0, gap);
  const peekPx = Math.max(0, peek);
  const totalGap = (n - 1) * gapPx;
  const slideBasis =
    n === 1 && peekPx > 0
      ? `calc(100% - ${peekPx}px)`
      : n === 1
        ? '100%'
        : peekPx > 0
          ? `calc((100% - ${totalGap}px - ${peekPx}px) / ${n})`
          : `calc((100% - ${totalGap}px) / ${n})`;

  const [viewportRef, api] = useEmblaCarousel({
    align,
    containScroll: 'trimSnaps',
    loop: false,
    slidesToScroll,
  });

  const prevNext = usePrevNext(api);
  const dots = useDots(api);

  return (
    <div
      aria-roledescription="carousel"
      className={cn('relative min-w-0 w-full', className)}
      data-slot="embla-carousel"
      role="region"
    >
      {showArrows && (
        <div className="mb-4 flex items-center justify-end gap-2">
          <Button
            aria-label={ariaLabelPrev}
            className="h-8 w-8 rounded-full bg-[#4F96B6] text-white hover:bg-[#367A95] md:h-10 md:w-10"
            disabled={!prevNext.canPrev}
            onClick={prevNext.scrollPrev}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ChevronLeft className="size-5 text-white" />
          </Button>
          <Button
            aria-label={ariaLabelNext}
            className="h-8 w-8 rounded-full bg-[#4F96B6] text-white hover:bg-[#367A95] md:h-10 md:w-10"
            disabled={!prevNext.canNext}
            onClick={prevNext.scrollNext}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ChevronRight className="size-5 text-white" />
          </Button>
        </div>
      )}

      <div
        ref={viewportRef}
        className={cn('overflow-visible', viewportClassName)}
        data-slot="embla-viewport"
      >
        <div
          className={cn('flex h-full touch-pan-y', contentClassName)}
          data-slot="embla-container"
          style={{
            gap: gapPx,
            touchAction: 'pan-y pinch-zoom',
          }}
        >
          {React.Children.map(children, (child, index) => (
            <div
              key={index}
              aria-roledescription="slide"
              className={cn('min-w-0 shrink-0 grow-0', slideClassName)}
              data-slot="embla-slide"
              role="group"
              style={{ flexBasis: slideBasis }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {showDots && dots.snaps.length > 1 && (
        <div className="mt-4 flex justify-center gap-2" data-slot="embla-dots">
          {dots.snaps.map((_, i) => (
            <button
              key={i}
              aria-label={ariaLabelSlide.replace('{n}', String(i + 1))}
              className={cn(
                'h-2 rounded-full transition-all',
                i === dots.selectedIndex ? 'w-8 bg-[#4F96B6]' : 'w-2 bg-[#4F96B6]/30 hover:bg-[#4F96B6]/50',
              )}
              onClick={() => dots.scrollTo(i)}
              type="button"
            />
          ))}
        </div>
      )}
    </div>
  );
}
