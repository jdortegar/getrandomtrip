import React, {
  ComponentPropsWithRef,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { EmblaCarouselType } from 'embla-carousel';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type UsePrevNextButtonsType = {
  prevBtnDisabled: boolean;
  nextBtnDisabled: boolean;
  onPrevButtonClick: () => void;
  onNextButtonClick: () => void;
};

export const usePrevNextButtons = (
  emblaApi: EmblaCarouselType | undefined,
): UsePrevNextButtonsType => {
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const onPrevButtonClick = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
  }, [emblaApi]);

  const onNextButtonClick = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback((api: EmblaCarouselType) => {
    setPrevBtnDisabled(!api.canScrollPrev());
    setNextBtnDisabled(!api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect(emblaApi);
    emblaApi.on('reInit', onSelect).on('select', onSelect);
  }, [emblaApi, onSelect]);

  return {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  };
};

type PropType = ComponentPropsWithRef<'button'>;

const buttonBaseClass =
  'inline-flex h-9 w-9 touch-manipulation cursor-pointer items-center justify-center rounded-full border-2 border-neutral-400 bg-transparent p-0 text-neutral-700 [-webkit-tap-highlight-color:rgba(0,0,0,0.1)] [appearance:none] disabled:border-neutral-300 disabled:text-neutral-400';

export const PrevButton = (props: PropType) => {
  const { children, className, disabled, ...restProps } = props;

  return (
    <button
      className={cn(
        'h-8 w-8 rounded-full bg-light-blue text-white hover:bg-light-blue-600 md:h-10 md:w-10 flex items-center justify-center ',
        className,
      )}
      disabled={disabled}
      type="button"
      {...restProps}
    >
      <ChevronLeft className="size-5 text-white" />
    </button>
  );
};

export const NextButton = (props: PropType) => {
  const { children, className, disabled, ...restProps } = props;

  return (
    <button
      className={cn(
        'h-8 w-8 rounded-full bg-light-blue text-white hover:bg-light-blue-600 md:h-10 md:w-10 flex items-center justify-center ',
        className,
      )}
      disabled={disabled}
      type="button"
      {...restProps}
    >
      <ChevronRight className="size-5 text-white" />
    </button>
  );
};
