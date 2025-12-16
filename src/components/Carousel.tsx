'use client';

import * as React from 'react';
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from 'embla-carousel-react';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from './ui/Button';

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type EdgeBleedSide = 'right' | 'both';

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: 'horizontal' | 'vertical';
  setApi?: (api: CarouselApi) => void;
} & {
  edgeBleed?: boolean;
  edgeBleedSide?: EdgeBleedSide;
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error('useCarousel must be used within a <Carousel />');
  }

  return context;
}

// Low-level carousel components (renamed from original)
const CarouselRoot = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & CarouselProps
>(
  (
    {
      orientation = 'horizontal',
      opts,
      setApi,
      plugins,
      className,
      children,
      edgeBleed = false,
      edgeBleedSide = 'right',
      ...props
    },
    ref,
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === 'horizontal' ? 'x' : 'y',
      },
      plugins,
    );
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) return;
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    }, []);

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev();
    }, [api]);

    const scrollNext = React.useCallback(() => {
      api?.scrollNext();
    }, [api]);

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          scrollNext();
        }
      },
      [scrollPrev, scrollNext],
    );

    React.useEffect(() => {
      if (!api || !setApi) return;
      setApi(api);
    }, [api, setApi]);

    React.useEffect(() => {
      if (!api) return;
      onSelect(api);
      api.on('reInit', onSelect);
      api.on('select', onSelect);

      return () => {
        api?.off('select', onSelect);
      };
    }, [api, onSelect]);

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation:
            orientation || (opts?.axis === 'y' ? 'vertical' : 'horizontal'),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
          edgeBleed,
          edgeBleedSide,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn('relative', className)}
          role="region"
          aria-roledescription="carousel"
          data-slot="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  },
);
CarouselRoot.displayName = 'CarouselRoot';

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
      className={cn('overflow-hidden', viewportClassName)}
      style={viewportStyle}
      data-slot="carousel-content"
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

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel();

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn('min-w-0 shrink-0 grow-0 basis-full', className)}
      {...props}
    />
  );
});
CarouselItem.displayName = 'CarouselItem';

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button> & { inHeader?: boolean }
>(
  (
    { className, variant = 'ghost', size = 'icon', inHeader = false, ...props },
    ref,
  ) => {
    const { orientation, scrollPrev, canScrollPrev } = useCarousel();

    return (
      <Button
        ref={ref}
        data-slot="carousel-previous"
        variant={variant}
        size={size}
        className={cn(
          'md:w-12 md:h-12 w-8 h-8 rounded-full bg-[#4F96B6] hover:bg-[#367A95]',
          'text-white',
          className,
        )}
        disabled={!canScrollPrev}
        onClick={scrollPrev}
        {...props}
      >
        <ArrowLeft className="md:size-[25px] size-[20px] text-white" />
        <span className="sr-only">Previous slide</span>
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
    { className, variant = 'ghost', size = 'icon', inHeader = false, ...props },
    ref,
  ) => {
    const { orientation, scrollNext, canScrollNext } = useCarousel();

    return (
      <Button
        ref={ref}
        data-slot="carousel-next"
        variant={variant}
        size={size}
        className={cn(
          'md:w-12 md:h-12 w-8 h-8 rounded-full bg-[#4F96B6] hover:bg-[#367A95]',
          'text-white',
          className,
        )}
        disabled={!canScrollNext}
        onClick={scrollNext}
        {...props}
      >
        <ArrowRight className="md:size-[25px] size-[20px] text-white" />
        <span className="sr-only">Next slide</span>
      </Button>
    );
  },
);
CarouselNext.displayName = 'CarouselNext';

// High-level Carousel component that handles everything internally
type CarouselSimpleProps = {
  children: React.ReactNode;
  classes?: {
    section?: string;
    viewport?: string;
    wrapper?: string;
    root?: string;
    heading?: string;
    title?: string;
    navigationContainer?: string;
    navigationButton?: string;
    navigationPrevious?: string;
    navigationNext?: string;
    content?: string;
    item?: string;
  };
  title?: string;
  className?: string;
  itemClassName?: string;
  showNavigation?: boolean;
  navigationClassName?: string;
  slidesToScroll?: number;
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: 'horizontal' | 'vertical';
  setApi?: (api: CarouselApi) => void;
  edgeBleed?: boolean;
  edgeBleedSide?: EdgeBleedSide;
  fullViewportWidth?: boolean;
  viewportPaddingClassName?: string;
};

function Carousel({
  children,
  classes,
  title,
  className,
  itemClassName,
  showNavigation = true,
  navigationClassName,
  slidesToScroll = 2,
  opts = {
    align: 'start',
    loop: false,
  },
  plugins,
  orientation = 'horizontal',
  setApi,
  edgeBleed = true,
  edgeBleedSide = 'right',
  fullViewportWidth = false,
  viewportPaddingClassName,
}: CarouselSimpleProps) {
  const sectionRef = React.useRef<HTMLElement | null>(null);
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
    if (!fullViewportWidth) return;
    if (typeof window === 'undefined') return;

    const section = sectionRef.current;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const left = Math.max(rect.left, 0);
    const right = Math.max(window.innerWidth - rect.right, 0);

    setViewportPadding((prev) => {
      if (prev && prev.left === left && prev.right === right) {
        return prev;
      }

      return { left, right };
    });
  }, [fullViewportWidth]);

  React.useEffect(() => {
    if (!fullViewportWidth) return;

    updateViewportPadding();
    window.addEventListener('resize', updateViewportPadding);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && sectionRef.current) {
      observer = new ResizeObserver(() => updateViewportPadding());
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
    <section
      ref={sectionRef}
      className={cn('w-full', classes?.section, className)}
    >
      <div className={cn(wrapperClass)}>
        <CarouselRoot
          opts={{
            ...opts,
            slidesToScroll: slidesToScroll,
          }}
          plugins={plugins}
          orientation={orientation}
          setApi={setApi}
          className={cn('w-full', classes?.root)}
          edgeBleed={edgeBleed}
          edgeBleedSide={edgeBleedSide}
        >
          {/* Section Header - Now inside CarouselRoot */}
          {title && (
            <div
              className={cn(
                'flex flex-col items-center mb-6 gap-3 text-center',
                classes?.heading,
              )}
            >
              <h3
                className={cn(
                  'text-[28px] leading-[45px] font-light text-neutral-900 max-w-sm mx-auto text-center',
                  classes?.title,
                )}
              >
                {title}
              </h3>
            </div>
          )}

          {/* Carousel Content */}
          <CarouselContent
            viewportClassName={viewportClassName}
            viewportStyle={viewportInlineStyle}
            className={cn(classes?.content)}
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

          {/* Navigation buttons at bottom center */}
          {showNavigation && (
            <div
              className={cn(
                'flex justify-center items-center gap-2 mt-12',
                classes?.navigationContainer,
              )}
            >
              <CarouselPrevious
                inHeader
                className={cn(
                  navigationClassName,
                  classes?.navigationButton,
                  classes?.navigationPrevious,
                )}
              />
              <CarouselNext
                inHeader
                className={cn(
                  navigationClassName,
                  classes?.navigationButton,
                  classes?.navigationNext,
                )}
              />
            </div>
          )}
        </CarouselRoot>
      </div>
    </section>
  );
}

export {
  type CarouselApi,
  // High-level simple carousel
  Carousel,
  // Low-level compound components
  CarouselRoot,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};
