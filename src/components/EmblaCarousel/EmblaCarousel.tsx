import React, { useMemo } from "react";
import { EmblaOptionsType } from "embla-carousel";
import WheelGestures from "embla-carousel-wheel-gestures";
import useEmblaCarousel from "embla-carousel-react";
import {
  NextButton,
  PrevButton,
  usePrevNextButtons,
} from "./EmblaCarouselArrowButtons";
import { DotButton, useDotButton } from "./EmblaCarouselDotButton";
import { cn } from "@/lib/utils";

type OverflowSide = "left" | "right" | "both";

type EmblaCarouselProps = {
  accentColor?: string;
  children: React.ReactNode;
  options?: EmblaOptionsType;
  overflow?: OverflowSide;
  slideClassName?: string;
  slidesPerView?: 2 | 3 | 4;
  arrowsClassName?: string;
  wrapperClassName?: string;
};

const EMBLA_OPTIONS: EmblaOptionsType = {
  align: "start",
  containScroll: false,
};

const EDGE_HOLD = 1;
const FADE_WIDTH = 4;
const MASKS: Record<OverflowSide, string> = {
  left: `linear-gradient(to right, transparent ${EDGE_HOLD}%, black ${EDGE_HOLD + FADE_WIDTH}%)`,
  right: `linear-gradient(to right, black ${100 - EDGE_HOLD - FADE_WIDTH}%, transparent ${100 - EDGE_HOLD}%)`,
  both: `linear-gradient(to right, transparent ${EDGE_HOLD}%, black ${EDGE_HOLD + FADE_WIDTH}%, black ${100 - EDGE_HOLD - FADE_WIDTH}%, transparent ${100 - EDGE_HOLD}%)`,
};

const EmblaCarousel = ({
  accentColor,
  children,
  options,
  overflow,
  slideClassName,
  slidesPerView = 3,
  arrowsClassName,
  wrapperClassName,
}: EmblaCarouselProps) => {
  const slides = React.Children.toArray(children);
  const wheelGestures = useMemo(() => WheelGestures(), []);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      ...EMBLA_OPTIONS,
      align: slides.length < slidesPerView ? "center" : "start",
      ...options,
    },
    [wheelGestures],
  );

  const { selectedIndex, scrollSnaps, onDotButtonClick } = useDotButton(emblaApi);
  const { nextBtnDisabled, onNextButtonClick, onPrevButtonClick, prevBtnDisabled } = usePrevNextButtons(emblaApi);

  const accentStyle = accentColor ? { backgroundColor: accentColor } : undefined;

  const arrows = slides.length > 1 && (
    <div className="flex items-center justify-end gap-2.5 mb-6">
      <PrevButton disabled={prevBtnDisabled} onClick={onPrevButtonClick} style={accentStyle} />
      <NextButton disabled={nextBtnDisabled} onClick={onNextButtonClick} style={accentStyle} />
    </div>
  );

  const dots = slides.length > 1 && (
    <div className="mt-7 flex items-center justify-center gap-2">
      {scrollSnaps.map((_, i) => (
        <DotButton
          key={i}
          className={cn(
            "h-2 rounded-full transition-all",
            i === selectedIndex
              ? cn("w-8", !accentColor && "bg-light-blue")
              : cn("w-2", !accentColor && "bg-light-blue/30 hover:bg-light-blue/50"),
          )}
          style={accentColor ? { backgroundColor: accentColor, opacity: i === selectedIndex ? 1 : 0.3 } : undefined}
          onClick={() => onDotButtonClick(i)}
          type="button"
        />
      ))}
    </div>
  );

  const mask = overflow ? MASKS[overflow] : undefined;
  const maskStyle = mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined;

  return (
    <div className="@container mx-auto w-full overflow-x-clip">
      {arrows && <div className={cn("rt-container mb-6", arrowsClassName)}>{arrows}</div>}

      <div style={maskStyle}>
        <div ref={emblaRef} className={cn("w-full",
        {
          "overflow-visible container mx-auto w-full pl-4 sm:pl-6 lg:pl-8" : overflow === "right",
          "overflow-visible container mx-auto w-full pr-4 sm:pr-6 lg:pr-8" : overflow === "left", 
          "overflow-visible rt-container" : overflow === "both",
          "overflow-hidden" : overflow === undefined}, 
        wrapperClassName)}>
          <div className="flex min-w-0 w-full touch-[pan-y_pinch-zoom] items-start gap-3">
            {slides.map((child, index) => (
              <div
                key={index}
                className={cn(
                  "min-w-0 shrink-0",
                  "flex-[0_0_80%]",{
                  "@md:flex-[0_0_33.3333%]": slidesPerView === 3, 
                  "@md:flex-[0_0_33.3333%] @lg:flex-[0_0_25%]": slidesPerView === 4
                  },
                  slideClassName,
                )}
              >
                {child}
              </div>
            ))}
          </div>
        </div>
      </div>

      {dots && <div className="container mx-auto px-4 md:px-20">{dots}</div>}
    </div>
  );


};

export default EmblaCarousel;
