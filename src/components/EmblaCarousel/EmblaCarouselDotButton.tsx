import React, { ComponentPropsWithRef, useCallback } from "react";
import { EmblaCarouselType } from "embla-carousel";
import { useEmblaSnapshot } from "./useEmblaSnapshot";

const EMPTY_SNAPS: number[] = [];

type UseDotButtonType = {
  selectedIndex: number;
  scrollSnaps: number[];
  onDotButtonClick: (index: number) => void;
};

export const useDotButton = (
  emblaApi: EmblaCarouselType | undefined,
): UseDotButtonType => {
  const selectedIndex = useEmblaSnapshot(
    emblaApi,
    (api) => api.selectedScrollSnap(),
    0,
  );
  const scrollSnaps = useEmblaSnapshot(
    emblaApi,
    (api) => api.scrollSnapList(),
    EMPTY_SNAPS,
  );

  const onDotButtonClick = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
    },
    [emblaApi],
  );

  return {
    selectedIndex,
    scrollSnaps,
    onDotButtonClick,
  };
};

type PropType = ComponentPropsWithRef<"button"> & {
  index: number;
  selected: boolean;
};

export const DotButton = (props: PropType) => {
  const { children, index, selected, ...restProps } = props;

  return (
    <button
      aria-current={selected}
      aria-label={`Go to slide ${index + 1}`}
      type="button"
      {...restProps}
      data-component="DotButton"
    >
      {children}
    </button>
  );
};
