"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import SafeImage from "@/components/common/SafeImage";
import { useShouldLoadVideo } from "@/hooks/useShouldLoadVideo";
import { useVideoReveal } from "@/hooks/useVideoReveal";

export interface VideoBackgroundProps {
  fallbackImage?: string;
  overlayClassName?: string;
  videoSrc?: string;
  className?: string;
  /** Preload the still; turn off when the background sits below the fold. */
  priority?: boolean;
}

export default function VideoBackground({
  fallbackImage,
  overlayClassName,
  videoSrc,
  className,
  priority = true,
}: VideoBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isInView, shouldLoad } = useShouldLoadVideo(containerRef);

  const isRevealed = useVideoReveal(videoRef, {
    isInView,
    shouldLoad,
    src: videoSrc,
  });

  if (!videoSrc && !fallbackImage) return null;
  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 w-full h-full", className)}
      aria-hidden
      data-component="VideoBackground"
    >
      {fallbackImage && (
        <SafeImage
          alt=""
          className="absolute inset-0 z-0 w-full h-full object-cover object-center"
          fill
          priority={priority}
          sizes="100vw"
          src={fallbackImage}
        />
      )}

      {videoSrc && (
        <video
          ref={videoRef}
          autoPlay
          className={cn(
            "absolute inset-0 z-10 w-full h-full object-cover",
            isRevealed ? "opacity-100" : "opacity-0",
          )}
          loop
          muted
          playsInline
          preload="none"
        >
          {/* mp4 only: most hero videos ship without a .webm, and guessing one
              costs a 404 per video before the browser falls back. */}
          {shouldLoad && <source src={videoSrc} type="video/mp4" />}
        </video>
      )}

      <div
        className={cn("absolute inset-0 z-10 bg-black/40", overlayClassName)}
        aria-hidden
      />
    </div>
  );
}
