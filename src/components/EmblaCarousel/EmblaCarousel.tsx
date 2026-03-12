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

type PropType = {
  children: React.ReactNode;
  options?: EmblaOptionsType;
  /** Number of slides visible at once (plus peek of next). Default 3. */
  sliderPerView?: number;
};

const EMBLA_OPTIONS: EmblaOptionsType = {
  align: 'start',
  containScroll: false,
};

/** Builds slide class: mobile 1 per view (full-width), md 2 + peek, lg = sliderPerView full slides (no peek). */
export function getEmblaSlideClassName(sliderPerView: number = 3): string {
  const n = sliderPerView;
  return [
    'min-w-0 pl-4 md:pl-6 lg:pl-8',
    'flex-[0_0_90%]', // mobile: 1 slide
    'md:flex-[0_0_calc((100%-1.5rem)/2.2)]', // md: 2 + peek
    // lg: use literal class so Tailwind JIT generates it (dynamic template can be missed)
    ...(n === 3
      ? ['lg:flex-[0_0_calc((100%-4rem)/3)]']
      : [`lg:flex-[0_0_calc((100%-${(n - 1) * 2}rem)/${n})]`]),
  ].join(' ');
}

/** Slide class for default 3 per view + peek. Use on direct children or let EmblaCarousel wrap for you. */
export const emblaSlideClassName = getEmblaSlideClassName(3);

const EmblaCarousel = ({ children, options, sliderPerView = 3 }: PropType) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    ...EMBLA_OPTIONS,
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

  const slideClassName = getEmblaSlideClassName(sliderPerView);

  return (
    <div className="mx-auto w-full">
      <div className="flex self-end items-center justify-end gap-2.5 mb-6">
        <PrevButton disabled={prevBtnDisabled} onClick={onPrevButtonClick} />
        <NextButton disabled={nextBtnDisabled} onClick={onNextButtonClick} />
      </div>
      <div className="relative overflow-hidden" ref={emblaRef}>
        <div
          className={cn(
            'flex touch-[pan-y_pinch-zoom]',
            '-ml-4 md:-ml-6 lg:-ml-8',
          )}
        >
          {React.Children.map(children, (child, index) => (
            <div className={slideClassName} key={index}>
              {child}
            </div>
          ))}
        </div>
        <div className="absolute right-0 top-0 h-full w-10 bg-linear-to-r from-transparent to-white" />
      </div>

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
      </div>
    </div>
  );
};

export default EmblaCarousel;
