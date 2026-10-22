"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface BrandPortraitFrameProps {
  children: React.ReactNode;
  className?: string;
}

/** Brand Book portrait used by type-on-image, payoffs, photos, and Trippers. */
export const BRAND_PORTRAIT_ARTBOARD = { height: 480, width: 360 } as const;

export function BrandPortraitFrame({
  children,
  className,
}: BrandPortraitFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const { height, width } = BRAND_PORTRAIT_ARTBOARD;

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const updateScale = () => {
      setScale(frame.getBoundingClientRect().width / width);
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div
      className={cn("aspect-3/4 overflow-hidden relative w-full", className)}
      data-portrait-frame
      ref={frameRef}
    >
      <div
        className="absolute left-0 origin-top-left top-0"
        style={{ height, transform: `scale(${scale})`, width }}
      >
        {children}
      </div>
    </div>
  );
}
