import React from 'react';
import { EmblaOptionsType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import {
  NextButton,
  PrevButton,
  usePrevNextButtons,
} from './EmblaCarouselArrowButtons';
import { DotButton, useDotButton } from './EmblaCarouselDotButton';
import { cn } from '@/lib/utils';

type EmblaCarouselProps = {
  children: React.ReactNode;
  options?: EmblaOptionsType;
  slideClassName?: string;
  slidesPerView?: number;
};

const EMBLA_OPTIONS: EmblaOptionsType = {
  align: 'start',
  containScroll: false,

};

const EmblaCarousel = ({
  children,
  options,
  slidesPerView = 3,
  slideClassName,
}: EmblaCarouselProps) => {
  const slides = React.Children.toArray(children) || [];
  const [emblaRef, emblaApi] = useEmblaCarousel({
    ...EMBLA_OPTIONS,
    align: slides.length < slidesPerView ? 'center' : 'start',
    ...options,
  });

  const { selectedIndex, scrollSnaps, onDotButtonClick } =
    useDotButton(emblaApi);

  const {
    nextBtnDisabled,
    onNextButtonClick,
    onPrevButtonClick,
    prevBtnDisabled,
  } = usePrevNextButtons(emblaApi);

  

  console.log(slides.length, slidesPerView);

  return (
    <div className="@container mx-auto w-full">
      {slides.length > 1 && (
      <div className="flex self-end items-center justify-end gap-2.5 mb-6">
        <PrevButton disabled={prevBtnDisabled} onClick={onPrevButtonClick} />
        <NextButton disabled={nextBtnDisabled} onClick={onNextButtonClick} />
      </div>)}
      <div className="relative w-full overflow-hidden p-1" ref={emblaRef}>
        <div
          className={cn(
            'flex min-w-0 w-full touch-[pan-y_pinch-zoom] items-start',
            '-ml-4 @[640px]:-ml-6 @[1280px]:-ml-8',
          )}
        >
          {slides.map((child, index) => (
            <div
              className={cn(
                'min-w-0 pl-4 @[640px]:pl-6 @[1280px]:pl-8',
                'flex-[0_0_90%]',
                '@[640px]:flex-[0_0_calc((100%-1.5rem)/2.2)]',
                slidesPerView === 3 &&
                  '@[1280px]:flex-[0_0_calc((100%-4rem)/3)]',
                slidesPerView === 4 &&
                  '@[1280px]:flex-[0_0_calc((100%-6rem)/4)]',
                slideClassName,
              )}
              key={index}
            >
              {child}
            </div>
          ))}
        </div>
        <div className="absolute right-0 top-0 h-full w-10 bg-linear-to-r from-transparent to-white" />
      </div>

{slides.length > 1 && (
      <div className="mt-7 flex items-center justify-center">
        <div className="mt-4 flex justify-center gap-2">
          {scrollSnaps.map((_, i) => (
            <DotButton
              key={i}
              className={cn(
                'h-2 rounded-full transition-all',
                i === selectedIndex
                  ? 'w-8 bg-[#4F96B6]'
                  : 'w-2 bg-[#4F96B6]/30 hover:bg-[#4F96B6]/50',
              )}
              onClick={() => onDotButtonClick(i)}
              type="button"
            />
          ))}
        </div>
      </div>)}
    </div>
  );
};

export default EmblaCarousel;
