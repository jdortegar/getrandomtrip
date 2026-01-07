'use client';

import React, { ReactNode } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarouselProps {
  children: ReactNode;
  className?: string;
  onEmblaApi?: (api: any) => void;
  showArrows?: boolean;
  arrowClassName?: string;
  options?: any;
}

export function Carousel({
  children,
  className,
  onEmblaApi,
  showArrows = true,
  arrowClassName,
  options,
}: CarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(options);

  React.useEffect(() => {
    if (emblaApi && onEmblaApi) {
      onEmblaApi(emblaApi);
    }
  }, [emblaApi, onEmblaApi]);

  const scrollPrev = () => {
    if (emblaApi) emblaApi.scrollPrev();
  };

  const scrollNext = () => {
    if (emblaApi) emblaApi.scrollNext();
  };

  const canScrollPrev = emblaApi?.canScrollPrev() ?? false;
  const canScrollNext = emblaApi?.canScrollNext() ?? false;

  return (
    <div className={cn('relative w-full', className)}>
      {/* Left Arrow */}
      {showArrows && canScrollPrev && (
        <button
          onClick={scrollPrev}
          className={cn(
            'absolute left-4 top-1/2 transform -translate-y-1/2 z-20',
            'bg-white border border-gray-300 rounded-full p-3',
            'hover:border-gray-400 transition-colors shadow-lg',
            'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
            arrowClassName,
          )}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Right Arrow */}
      {showArrows && canScrollNext && (
        <button
          onClick={scrollNext}
          className={cn(
            'absolute right-4 top-1/2 transform -translate-y-1/2 z-20',
            'bg-white border border-gray-300 rounded-full p-3',
            'hover:border-gray-400 transition-colors shadow-lg',
            'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
            arrowClassName,
          )}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Carousel Container */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {React.Children.map(children, (child, index) => (
            <div key={index} className="flex-shrink-0 flex-grow-0 basis-auto">
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
