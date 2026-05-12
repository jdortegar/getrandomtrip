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

// 100%/n fractions — slides always fill available width. Gap = -ml-3/pl-3 (0.75rem).
const SLIDE_SIZE: Record<2 | 3 | 4, string> = {
  2: "@[640px]:flex-[0_0_50%]",
  3: "@[1024px]:flex-[0_0_33.3333%]",
  4: "@[1280px]:flex-[0_0_25%]",
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
    <div className="@container w-full">
      {arrows && <div className={cn("container mx-auto mb-6 px-4", overflow ? " md:px-20" : "", arrowsClassName)}>{arrows}</div>}

      <div style={maskStyle}>
        <div ref={emblaRef} className={cn("w-full",
          overflow === "left" ? "overflow-visible container mx-auto pl-4 md:pl-20" :
            overflow === "right" ? "overflow-visible container mx-auto pr-4 md:pr-20" :
              overflow === "both" ? "overflow-visible container mx-auto px-4 md:px-20" :
                "overflow-hidden", wrapperClassName)}>
          <div className="flex min-w-0 w-full touch-[pan-y_pinch-zoom] items-start -ml-3">
            {slides.map((child, index) => (
              <div
                key={index}
                className={cn(
                  "min-w-0 shrink-0 pl-3",
                  "flex-[0_0_80%]",
                  SLIDE_SIZE[slidesPerView],
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
