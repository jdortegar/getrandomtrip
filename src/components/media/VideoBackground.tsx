"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import SafeImage from "@/components/common/SafeImage";
import { useShouldLoadVideo } from "@/hooks/useShouldLoadVideo";

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

  // Sources are attached on the render that flips shouldLoad; load() makes the
  // element pick them up.
  useEffect(() => {
    if (shouldLoad) videoRef.current?.load();
  }, [shouldLoad]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad) return;
    if (isInView) video.play().catch(() => {});
    else video.pause();
  }, [isInView, shouldLoad]);

  if (!videoSrc && !fallbackImage) return null;
  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 w-full h-full", className)}
      aria-hidden data-component="VideoBackground"
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
          className="absolute inset-0 z-10 w-full h-full object-cover"
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
