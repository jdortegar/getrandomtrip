'use client';

/**
 * Carousel module – Embla-based carousel with consistent behavior across the app.
 * Follows Embla docs pattern: viewport + container + slides, with optional prev/next and dots.
 * SOLID: hooks own Embla state (prev/next, dots); root provides context; UI components consume only what they need.
 */

import * as React from 'react';
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from 'embla-carousel-react';
import WheelGestures from 'embla-carousel-wheel-gestures';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from './ui/Button';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type EdgeBleedSide = 'right' | 'both';

/** Props for the low-level root (viewport + context). */
type CarouselRootProps = {
  edgeBleed?: boolean;
  edgeBleedSide?: EdgeBleedSide;
  opts?: CarouselOptions;
  orientation?: 'horizontal' | 'vertical';
  plugins?: CarouselPlugin;
  setApi?: (api: CarouselApi) => void;
};

/** Everything provided by context to carousel UI (buttons, dots, content). */
type CarouselContextValue = {
  api: CarouselApi | undefined;
  canScrollNext: boolean;
  canScrollPrev: boolean;
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  opts: CarouselOptions | undefined;
  orientation: 'horizontal' | 'vertical';
  scrollNext: () => void;
  scrollPrev: () => void;
  scrollSnaps: number[];
  scrollTo: (index: number) => void;
  selectedIndex: number;
} & CarouselRootProps;

// -----------------------------------------------------------------------------
// Embla control hooks (DRY – same idea as Embla docs: usePrevNextButtons, useDotButton)
// -----------------------------------------------------------------------------

/** Syncs prev/next button state with Embla and returns scroll handlers. */
function usePrevNextButtons(api: CarouselApi | undefined) {
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const scrollPrev = React.useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = React.useCallback(() => api?.scrollNext(), [api]);

  const sync = React.useCallback(() => {
    if (!api) return;
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
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

  return { canScrollPrev, canScrollNext, scrollPrev, scrollNext };
}

/** Syncs dot state (selected index + snap list) with Embla and returns scroll-to handler. */
function useDotButton(api: CarouselApi | undefined) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);

  const scrollTo = React.useCallback(
    (index: number) => api?.scrollTo(index),
    [api],
  );

  const sync = React.useCallback(() => {
    if (!api) return;
    setScrollSnaps(api.scrollSnapList());
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

  return { selectedIndex, scrollSnaps, scrollTo };
}

// -----------------------------------------------------------------------------
// Context and public hook
// -----------------------------------------------------------------------------

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

/** Use inside CarouselRoot to get api, scroll state, and control handlers. */
function useCarousel(): CarouselContextValue {
  const ctx = React.useContext(CarouselContext);
  if (!ctx) {
    throw new Error('useCarousel must be used within a CarouselRoot');
  }
  return ctx;
}

// -----------------------------------------------------------------------------
// CarouselRoot – Embla viewport + context provider (single source of truth)
// -----------------------------------------------------------------------------

const CarouselRoot = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & CarouselRootProps
>(
  (
    {
      children,
      className,
      edgeBleed = false,
      edgeBleedSide = 'right',
      orientation = 'horizontal',
      opts,
      plugins,
      setApi,
      ...props
    },
    ref,
  ) => {
    const pluginsList = React.useMemo(() => {
      const wheel = WheelGestures();
      if (!plugins) return [wheel];
      return Array.isArray(plugins) ? [wheel, ...plugins] : [wheel, plugins];
    }, [plugins]);

    const [emblaRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === 'horizontal' ? 'x' : 'y',
      },
      pluginsList,
    );

    const prevNext = usePrevNextButtons(api);
    const dots = useDotButton(api);

    React.useEffect(() => {
      if (!api || !setApi) return;
      setApi(api);
    }, [api, setApi]);

    const orientationResolved: 'horizontal' | 'vertical' =
      orientation ?? (opts?.axis === 'y' ? 'vertical' : 'horizontal');

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          prevNext.scrollPrev();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          prevNext.scrollNext();
        }
      },
      [prevNext],
    );

    const value: CarouselContextValue = React.useMemo(
      () => ({
        api,
        canScrollNext: prevNext.canScrollNext,
        canScrollPrev: prevNext.canScrollPrev,
        carouselRef: emblaRef,
        edgeBleed,
        edgeBleedSide,
        opts,
        orientation: orientationResolved,
        scrollNext: prevNext.scrollNext,
        scrollPrev: prevNext.scrollPrev,
        scrollSnaps: dots.scrollSnaps,
        scrollTo: dots.scrollTo,
        selectedIndex: dots.selectedIndex,
        setApi,
      }),
      [
        api,
        emblaRef,
        edgeBleed,
        edgeBleedSide,
        opts,
        orientationResolved,
        prevNext.canScrollNext,
        prevNext.canScrollPrev,
        prevNext.scrollNext,
        prevNext.scrollPrev,
        dots.scrollSnaps,
        dots.scrollTo,
        dots.selectedIndex,
        setApi,
      ],
    );

    return (
      <CarouselContext.Provider value={value}>
        <div
          ref={ref}
          className={cn('relative', className)}
          data-slot="carousel"
          onKeyDownCapture={handleKeyDown}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  },
);
CarouselRoot.displayName = 'CarouselRoot';

// -----------------------------------------------------------------------------
// CarouselContent – viewport (overflow hidden) + flex container for slides
// -----------------------------------------------------------------------------

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    viewportClassName?: string;
    viewportStyle?: React.CSSProperties;
  }
>(({ className, viewportClassName, viewportStyle, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel();

  return (
    <div
      ref={carouselRef}
      className={cn(viewportClassName)}
      data-slot="carousel-viewport"
      style={viewportStyle}
    >
      <div
        ref={ref}
        className={cn(
          'flex',
          orientation === 'horizontal'
            ? 'gap-x-4 md:gap-x-6 lg:gap-x-8'
            : 'flex-col gap-y-6 md:gap-y-9 lg:gap-y-12',
          className,
        )}
        {...props}
      />
    </div>
  );
});
CarouselContent.displayName = 'CarouselContent';

// -----------------------------------------------------------------------------
// CarouselItem – single slide (flex child, no grow/shrink)
// -----------------------------------------------------------------------------

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      aria-roledescription="slide"
      className={cn('min-w-0 shrink-0 grow-0 basis-full', className)}
      data-slot="carousel-item"
      role="group"
      {...props}
    />
  );
});
CarouselItem.displayName = 'CarouselItem';

// -----------------------------------------------------------------------------
// CarouselPrevious / CarouselNext – prev/next buttons using context
// -----------------------------------------------------------------------------

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button> & { inHeader?: boolean }
>(
  (
    { className, inHeader = false, size = 'icon', variant = 'ghost', ...props },
    ref,
  ) => {
    const { scrollPrev, canScrollPrev } = useCarousel();

    return (
      <Button
      aria-label="Previous slide"
      className="h-8 w-8 rounded-full bg-light-blue text-white hover:bg-[#367A95] md:h-10 md:w-10"
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      size="icon"
      type="button"
      variant="ghost"
    >
      <ChevronLeft className="size-5 text-white" />
    </Button>
    );
  },
);
CarouselPrevious.displayName = 'CarouselPrevious';

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button> & { inHeader?: boolean }
>(
  (
    { className, inHeader = false, size = 'icon', variant = 'ghost', ...props },
    ref,
  ) => {
    const { canScrollNext, scrollNext } = useCarousel();

    return (
      <Button
        ref={ref}
        className="h-8 w-8 rounded-full bg-light-blue text-white hover:bg-[#367A95] md:h-10 md:w-10"
        data-slot="carousel-next"
        disabled={!canScrollNext}
        onClick={scrollNext}
        size={size}
        variant={variant}
        {...props}
      >
        <ChevronRight className="size-5 text-white" />
        <span className="sr-only">Next slide</span>
      </Button>
    );
  },
);
CarouselNext.displayName = 'CarouselNext';

// -----------------------------------------------------------------------------
// CarouselDots – dot indicators that call scrollTo(index)
// -----------------------------------------------------------------------------

const CarouselDots = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & { align?: 'left' | 'center' | 'right' }
>(({ align = 'center', className, ...props }, ref) => {
  const { scrollSnaps, scrollTo, selectedIndex } = useCarousel();

  const alignClass =
    align === 'left'
      ? 'justify-start'
      : align === 'right'
        ? 'justify-end'
        : 'justify-center';

  return (
    <div
      ref={ref}
      className={cn('flex items-center gap-2', alignClass, className)}
      data-slot="carousel-dots"
      {...props}
    >
      {scrollSnaps.map((_, index) => (
        <button
          key={index}
          aria-label={`Go to slide ${index + 1}`}
          className={cn(
            'h-2 w-2 rounded-full transition-all',
            selectedIndex === index
              ? 'w-8 bg-light-blue'
              : 'bg-light-blue/30 hover:bg-light-blue/50',
          )}
          onClick={() => scrollTo(index)}
          type="button"
        />
      ))}
    </div>
  );
});
CarouselDots.displayName = 'CarouselDots';

// -----------------------------------------------------------------------------
// High-level Carousel – preset layout (section + optional title + arrows + content + dots)
// Use this when you want one consistent layout; use CarouselRoot + parts for custom layouts (e.g. Blog).
// -----------------------------------------------------------------------------

type CarouselPresetProps = {
  children: React.ReactNode;
  classes?: {
    content?: string;
    heading?: string;
    item?: string;
    navigationButton?: string;
    navigationContainer?: string;
    navigationNext?: string;
    navigationPrevious?: string;
    root?: string;
    section?: string;
    title?: string;
    viewport?: string;
    wrapper?: string;
  };
  className?: string;
  dotsAlign?: 'left' | 'center' | 'right';
  edgeBleed?: boolean;
  edgeBleedSide?: EdgeBleedSide;
  fullViewportWidth?: boolean;
  itemClassName?: string;
  navigationClassName?: string;
  opts?: CarouselOptions;
  orientation?: 'horizontal' | 'vertical';
  plugins?: CarouselPlugin;
  setApi?: (api: CarouselApi) => void;
  showArrows?: boolean;
  showDots?: boolean;
  slidesToScroll?: number;
  title?: string;
  viewportPaddingClassName?: string;
};

function Carousel({
  children,
  classes,
  className,
  dotsAlign = 'center',
  edgeBleed = true,
  edgeBleedSide = 'right',
  fullViewportWidth = false,
  itemClassName,
  navigationClassName,
  opts = { align: 'start', loop: false },
  orientation = 'horizontal',
  plugins,
  setApi,
  showArrows = true,
  showDots = true,
  slidesToScroll = 1,
  title,
  viewportPaddingClassName,
}: CarouselPresetProps) {
  const sectionRef = React.useRef<HTMLDivElement | null>(null);
  const [viewportPadding, setViewportPadding] = React.useState<{
    left: number;
    right: number;
  } | null>(null);

  const defaultViewportPadding = 'pl-[5vw] pr-[5vw] lg:pl-[10vw] lg:pr-[10vw]';

  const shouldApplyEdgeBleed = edgeBleed && !fullViewportWidth;
  const wrapperClass = cn(
    shouldApplyEdgeBleed
      ? edgeBleedSide === 'both'
        ? 'mx-[calc(50%-(50vw-6px))] overflow-x-hidden'
        : 'mr-[calc(50%-(50vw-6px))] overflow-x-hidden'
      : undefined,
    classes?.wrapper,
  );

  const viewportClassName = cn(
    fullViewportWidth && 'relative left-1/2 w-screen -translate-x-1/2',
    fullViewportWidth && (viewportPaddingClassName ?? defaultViewportPadding),
    classes?.viewport,
  );

  const updateViewportPadding = React.useCallback(() => {
    if (!fullViewportWidth || typeof window === 'undefined') return;
    const section = sectionRef.current;
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const left = Math.max(rect.left, 0);
    const right = Math.max(window.innerWidth - rect.right, 0);
    setViewportPadding((prev) =>
      prev && prev.left === left && prev.right === right
        ? prev
        : { left, right },
    );
  }, [fullViewportWidth]);

  React.useEffect(() => {
    if (!fullViewportWidth) return;
    updateViewportPadding();
    window.addEventListener('resize', updateViewportPadding);
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && sectionRef.current) {
      observer = new ResizeObserver(updateViewportPadding);
      observer.observe(sectionRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateViewportPadding);
      observer?.disconnect();
    };
  }, [fullViewportWidth, updateViewportPadding]);

  const viewportInlineStyle =
    fullViewportWidth && viewportPadding
      ? {
          paddingLeft: `${viewportPadding.left}px`,
          paddingRight: `${viewportPadding.right}px`,
        }
      : undefined;

  return (
    <div ref={sectionRef} className={cn('w-full', classes?.section, className)}>
      <div className={cn(wrapperClass)}>
        <CarouselRoot
          edgeBleed={edgeBleed}
          edgeBleedSide={edgeBleedSide}
          opts={{ ...opts, slidesToScroll }}
          orientation={orientation}
          plugins={plugins}
          setApi={setApi}
          className={cn('w-full', classes?.root)}
        >
          {/* Header row: optional title + arrows (same layout every time) */}
          <div className="mb-6 flex items-center justify-between">
            {title && (
              <div
                className={cn(
                  'flex flex-1 flex-col items-center gap-3 text-center',
                  classes?.heading,
                )}
              >
                <h3
                  className={cn(
                    'mx-auto max-w-sm text-center text-[28px] font-light leading-[45px] text-neutral-900',
                    classes?.title,
                  )}
                >
                  {title}
                </h3>
              </div>
            )}
            {showArrows && (
              <div
                className={cn(
                  'flex flex-shrink-0 items-center gap-2',
                  !title && 'ml-auto',
                  classes?.navigationContainer,
                )}
              >
                <CarouselPrevious
                  className={cn(
                    navigationClassName,
                    classes?.navigationButton,
                    classes?.navigationPrevious,
                  )}
                  inHeader
                />
                <CarouselNext
                  className={cn(
                    navigationClassName,
                    classes?.navigationButton,
                    classes?.navigationNext,
                  )}
                  inHeader
                />
              </div>
            )}
          </div>

          {/* Viewport + slide container */}
          <CarouselContent
            className={cn(classes?.content)}
            viewportClassName={viewportClassName}
            viewportStyle={viewportInlineStyle}
          >
            {React.Children.map(children, (child, index) => (
              <CarouselItem
                key={index}
                className={cn(classes?.item, itemClassName)}
              >
                {child}
              </CarouselItem>
            ))}
          </CarouselContent>

          {showDots && (
            <div className="mt-8 flex w-full justify-center">
              <CarouselDots
                align={dotsAlign}
                className={cn(classes?.navigationContainer)}
              />
            </div>
          )}
        </CarouselRoot>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

export {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselRoot,
  useCarousel,
  type CarouselApi,
};
