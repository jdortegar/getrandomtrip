"use client";

import { Children, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEmblaSnapshot } from "@/components/EmblaCarousel/useEmblaSnapshot";
import { ButtonV2 } from "@/components/ui/ButtonV2";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import { cn } from "@/lib/utils";
import type { TripperPublicProfileDict } from "@/lib/types/dictionary";

interface TripperProfileCarouselProps {
  ariaLabel: string;
  children: ReactNode;
  copy: TripperPublicProfileDict["carousel"];
  /** Fires when the visible slides change — e.g. to stop a player that scrolled away. */
  onSlideChange?: () => void;
}

/** Three cards on desktop, two on tablet, one plus a peek on mobile; arrows, swipe and keyboard. */
export function TripperProfileCarousel({ ariaLabel, children, copy, onSlideChange }: TripperProfileCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const slides = Children.toArray(children);
  const inView = useEmblaSnapshot(api, (current) => current.slidesInView().join(","), "");
  const canPrev = useEmblaSnapshot(api, (current) => current.canScrollPrev(), false);
  const canNext = useEmblaSnapshot(api, (current) => current.canScrollNext(), false);

  useEffect(() => {
    if (!api || !onSlideChange) return;
    api.on("select", onSlideChange);
    return () => {
      api.off("select", onSlideChange);
    };
  }, [api, onSlideChange]);

  const visible = inView ? inView.split(",").map(Number) : [0];
  const from = Math.min(...visible) + 1;
  const to = Math.max(...visible) + 1;

  return (
    <Carousel aria-label={ariaLabel} data-component="TripperProfileCarousel" opts={{ align: "start", inViewThreshold: 0.6 }} setApi={setApi}>
      <CarouselContent className="-ml-[26px]">
        {slides.map((slide, index) => (
          <CarouselItem className={cn("basis-[85%] pl-[26px]", "sm:basis-1/2 lg:basis-1/3")} key={index}>
            {slide}
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="mt-6 flex items-center justify-between gap-4">
        <p aria-live="polite" className="text-xs tabular-nums text-neutral-500">
          {interpolateTemplate(copy.position, {
            from: String(from),
            to: String(Math.min(to, slides.length)),
            total: String(slides.length),
          })}
        </p>
        <div className="flex gap-2">
          <ButtonV2 aria-label={copy.previous} disabled={!canPrev} onClick={() => api?.scrollPrev()} size="icon" variant="outline">
            <ArrowLeft aria-hidden />
          </ButtonV2>
          <ButtonV2 aria-label={copy.next} disabled={!canNext} onClick={() => api?.scrollNext()} size="icon" variant="outline">
            <ArrowRight aria-hidden />
          </ButtonV2>
        </div>
      </div>
    </Carousel>
  );
}
